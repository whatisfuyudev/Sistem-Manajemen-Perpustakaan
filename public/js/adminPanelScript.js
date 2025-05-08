// Global state variables for pagination, etc.
let currentPage = 1, totalPages = 1;

// Base API endpoints for each module (modify as necessary)
const API = {
  books: {
    list: '/api/books',
    create: '/api/books',
    update: (isbn) => `/api/books/update/${isbn}`,
    delete: (isbn) => `/api/books/${isbn}`,
    search: '/api/books/search'
  },
  checkouts: {
    list: '/api/checkouts/history',
    checkout: '/api/checkouts/checkout',
    return: '/api/checkouts/return',
    requestRenewal: (id) => `/api/checkouts/request-renewal/${id}`,
    renew: (id) => `/api/checkouts/renew/${id}`
  },
  reservations: {
    list: '/api/reservations/history',
    my: '/api/reservations/my',
    create: '/api/reservations/reserve',
    cancel: (id) => `/api/reservations/cancel/${id}`,
    modify: (id) => `/api/reservations/modify/${id}`,
    promote: (bookIsbn) => `/api/reservations/promote/${bookIsbn}`
  },
  users: {
    list: '/api/users/',
    create: '/api/users/',
    update: (id) => `/api/users/${id}`,
    single: '/api/users/single',
    delete: (id) => `/api/users/${id}`
  },
  notifications: {
    list: '/api/notifications/history',
    send: '/api/notifications/send',
    schedule: '/api/notifications/schedule'
  },
  reports: {
    circulation: '/api/reports/circulation',
    reservations: '/api/reports/reservations',
    overdue: '/api/reports/overdue',
    inventory: '/api/reports/inventory',
    'user-engagement': '/api/reports/user-engagement',
    financial: '/api/reports/financial',
    custom: '/api/reports/custom'
  }
};

// Tab navigation event listeners
const tabs = document.querySelectorAll('.nav-tabs button');
const contentArea = document.getElementById('contentArea');

// Helper to activate a given module/tab
async function activateTab(module) {
  // Remove active class from all, add to the one we want
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === module));
  // Reset pagination, load content
  currentPage = 1;
  await loadModule(module);
}

// When you click a tab button
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const module = tab.dataset.tab;
    // Push new URL state
    const newUrl = `${window.location.pathname}?tab=${module}`;
    history.pushState({ tab: module }, '', newUrl);
    activateTab(module);
  });
});

// Handle Back/Forward navigation
window.addEventListener('popstate', (e) => {
  const module = (e.state && e.state.tab)
    || new URLSearchParams(window.location.search).get('tab')
    || 'books';
  activateTab(module);
});

// Load module content based on selected tab
async function loadModule(module) {
  contentArea.innerHTML = '';
  switch (module) {
    case 'books':
      await loadBooksModule();
      break;
    case 'checkouts':
      await loadCheckoutsModule();
      break;
    case 'reservations':
      await loadReservationsModule();
      break;
    case 'users':
      await loadUsersModule();
      break;
    case 'notifications':
      await loadNotificationsModule();
      break;
    case 'reports':
      await loadReportsModule();
      break;
    default:
      contentArea.innerHTML = '<p>Module not found.</p>';
  }
}

/* ------------------------ BOOKS MODULE ------------------------ */
async function loadBooksModule() {
  // Set up the module HTML with a search container and a new Delete Selected button
  contentArea.innerHTML = `
    <h2>Books Management</h2>
    <div class="search-container">
      <form id="searchForm">
        <!-- Basic search: Single search bar for title (default) -->
        <input type="text" id="basicSearch" placeholder="Search by title (or use advanced options below)" />
        <!-- Toggle for advanced search options -->
        <button type="button" class="advanced-toggle" id="toggleAdvanced">Show Advanced Search Options</button>
        <div class="advanced-search" id="advancedSearch">
          <input type="text" id="searchIsbn" placeholder="Search by ISBN" />
          <input type="text" id="searchAuthors" placeholder="Search by authors (comma-separated)" />
          <input type="text" id="searchGenres" placeholder="Search by genres (comma-separated)" />
        </div>
        <button type="submit">Search</button>
      </form>
    </div>
    <!-- Delete Selected Button, move inline css styling into header tag -->
    <div style="margin: 10px 0; display: flex; gap: 10px;">
      <button id="deleteSelectedBtn" style="background: #dc3545; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Delete Selected</button>
      <button id="addBookBtn" style="background: #007bff; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Add New Book</button>
    </div>
    <div id="booksList"></div>
    <div id="booksPagination" class="pagination"></div>
  `;

  // Attach event listener to the toggleAdvanced button
  const toggleBtn = document.getElementById('toggleAdvanced');
  const advancedSearchDiv = document.getElementById('advancedSearch');
  if (toggleBtn && advancedSearchDiv) {
    toggleBtn.addEventListener('click', () => {
      if (advancedSearchDiv.style.display === 'flex') {
        advancedSearchDiv.style.display = 'none';
        toggleBtn.textContent = 'Show Advanced Search Options';
      } else {
        advancedSearchDiv.style.display = 'flex';
        toggleBtn.textContent = 'Hide Advanced Search Options';
      }
    });
  }

  // Attach event listener to the search form submission
  document.getElementById('searchForm').addEventListener('submit', fetchBooks);

  // Attach event listener to the new Delete Selected button
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', async () => {
      // Get all checkboxes in the table body that are checked
      const selectedCheckboxes = document.querySelectorAll('.books-table tbody input[type="checkbox"]:checked');
      if (selectedCheckboxes.length === 0) {
        await showModal({ message: 'Please select at least one book to delete.' });
        return;
      }

      const confirmed = await showModal({ message: 'Are you sure you want to delete the selected book(s)?', showCancel: true });
      if (!confirmed) return;

      // Collect ISBNs from each selected checkbox's row
      const isbns = Array.from(selectedCheckboxes)
        .map(checkbox => {
          const row = checkbox.closest('tr');
          return row.getAttribute('data-isbn');
        })
        .filter(isbn => isbn); // remove null or undefined

      // Call deleteBook with the array of ISBNs
      try {
        await deleteBook(isbns);
      } catch (error) {
        console.error('Bulk deletion failed:', error);
      }
    });
  }

  // Attach event listener to the new "Add New Book" button.
  const addBookBtn = document.getElementById('addBookBtn');
  if (addBookBtn) {
    addBookBtn.addEventListener('click', () => {
      // Redirect to the add book page
      window.location.href = '/admin/books/add';
    });
  }

  // Fetch books after the tab is loaded
  fetchBooks();
}

async function fetchBooks(e) {
  if (e)
    e.preventDefault();
  // Get basic search term (assumed to search title)
  const basicSearch = document.getElementById('basicSearch').value.trim();
  const isbn = document.getElementById('searchIsbn').value.trim();
  const authors = document.getElementById('searchAuthors').value.trim();
  const genres = document.getElementById('searchGenres').value.trim();

  // Build search filters object. If basicSearch is provided, use it as title search.
  const filters = {};
  if (basicSearch) filters.searchTerm = basicSearch;
  if (isbn) filters.isbn = isbn;
  if (authors) filters.author = authors;  // your API expects a query parameter "author"
  if (genres) filters.genres = genres;     // your API expects a query parameter "genres"

  // Optionally, add pagination params here if needed:
  filters.page = currentPage;
  filters.limit = 10;

  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch('/api/books/search?' + queryString);
    if (!response.ok) throw new Error('Search request failed.');
    const result = await response.json();
    // call render books function
    renderBooks(result.books, result.total, currentPage);
  } catch (error) {
    console.error(error);
  }
}

function renderBooks(books, total, page) {
  const booksList = document.getElementById('booksList');
  if (!books || !Array.isArray(books) || books.length === 0) {
    booksList.innerHTML = '<p>No books found.</p>';
    currentPage = 1;
    renderPaginationControls(0, currentPage, fetchBooks, 'booksPagination');
    return;
  }

  let html = `
    <table class="books-table">
      <thead>
        <tr>
          <th style="width: 40px;"><input type="checkbox" id="selectAllCheckbox" /></th>
          <th>Book ID (ISBN)</th>
          <th>Book Title</th>
          <th>Authors</th>
          <th>Genres</th>
          <th>Publication Year</th>
          <th>Total Copies</th>
        </tr>
      </thead>
      <tbody>
  `;

  html += books.map(book => {
    const authorsStr = Array.isArray(book.authors) ? book.authors.join(', ') : '';
    const genresStr = Array.isArray(book.genres) ? book.genres.join(', ') : '';
    return `
      <tr class="clickable" data-isbn="${book.isbn}">
        <td><input type="checkbox" /></td>
        <td class="truncated-text">${book.isbn || '-'}</td>
        <td class="truncated-text">${book.title || '-'}</td>
        <td class="truncated-text">${authorsStr || '-'}</td>
        <td class="truncated-text">${genresStr || '-'}</td>
        <td class="truncated-text">${book.publicationYear || '-'}</td>
        <td class="truncated-text">${book.totalCopies || 0}</td>
      </tr>
    `;
  }).join('');

  html += `
      </tbody>
    </table>
    <div class="table-footer">
      <p>Total Books: ${total}</p>
    </div>
  `;

  booksList.innerHTML = html;
  renderPaginationControls(total, page, fetchBooks, 'booksPagination');

  // Attach click listener to the header checkbox to select/deselect all checkboxes in the tbody
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.books-table tbody input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
      });
    });
  }

  // Attach click listeners to each clickable row (but ignore clicks on the checkbox cell)
  const clickableRows = document.querySelectorAll('.books-table tbody tr.clickable');
  clickableRows.forEach(row => {
    row.addEventListener('click', (e) => {
      // Check if the click happened in the first cell
      const cell = e.target.closest('td');
      if (cell && cell.cellIndex === 0) {
        // Click in the checkbox cell; do nothing (allow checkbox toggling only)
        return;
      }
      // Otherwise navigate to the book details page using the data-isbn attribute
      const isbn = row.getAttribute('data-isbn');
      if (isbn) {
        window.location.href = 'http://localhost:5000/admin/books/details/' + isbn;
      }
    });
  });
}

async function deleteBook(isbnOrArray) {
  // If an array of ISBNs is passed, process them one by one
  if (Array.isArray(isbnOrArray)) {
    for (const isbn of isbnOrArray) {
      try {
        // Send DELETE request for each book; no modal confirmation here
        const res = await fetch(API.books.delete(isbn), { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          console.error('Failed to delete book with ISBN ' + isbn + ': ' + err.message);
        }
      } catch (error) {
        console.error('Error deleting book with ISBN ' + isbn, error);
      }
    }
    // After processing all deletion requests, show a confirmation and refresh
    await showModal({ message: 'Selected book(s) deleted successfully.' });
    fetchBooks();
    return;
  }

  // Single ISBN deletion flow: Ask for confirmation before deletion.
  const confirmed = await showModal({ message: 'Are you sure you want to delete this book?', showCancel: true });
  if (!confirmed) return;

  try {
    const res = await fetch(API.books.delete(isbnOrArray), { method: 'DELETE' });
    if (res.ok) {
      await showModal({ message: 'Book deleted successfully.' });
      fetchBooks();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while deleting the book.' });
  }
}


/* ------------------------ CHECKOUTS MODULE ------------------------ */
async function loadCheckoutsModule() {
  contentArea.innerHTML = `
    <h2>Checkouts Management</h2>

    <div class="search-container">
      <form id="searchForm">
        <input type="text" id="checkoutId" placeholder="Checkout ID" />
        <button type="button" class="advanced-toggle" id="toggleAdvanced">
          Show Advanced Search Options
        </button>
        <div class="advanced-search" id="advancedSearch">
          <input type="text" id="userId" placeholder="User ID" />
          <input type="text" id="bookIsbn" placeholder="Book ISBN" />
          <input type="text" id="reservationId" placeholder="Reservation ID" />
          <select id="status">
            <option value="">-- Status --</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
            <option value="lost">Lost</option>
            <option value="damaged">Damaged</option>
            <option value="others">Others</option>
          </select>
          <input type="date" id="startDate" placeholder="Start Date" />
          <input type="date" id="endDate" placeholder="End Date" />
          <select id="dateField">
            <option value="checkoutDate">Checkout Date</option>
            <option value="dueDate">Due Date</option>
            <option value="returnDate">Return Date</option>
          </select>
        </div>
        <button type="submit">Search</button>
      </form>
    </div>

    <!-- Add New Checkout Button, move inline styling into head -->
    <div style="margin: 10px 0; display: flex; gap: 10px;">
      <button id="addCheckoutBtn" style="background: #007bff; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Add New Checkout</button>
    </div>

    <div id="resultsContainer">
      <div id="checkoutsList"></div>
      <div id="checkoutsPagination" class="pagination"></div>
    </div>
  `;

  // Toggle advanced search
  document.getElementById('toggleAdvanced').addEventListener('click', () => {
    const adv = document.getElementById('advancedSearch');
    const btn = document.getElementById('toggleAdvanced');
    const isVisible = adv.style.display === 'flex';
    adv.style.display = isVisible ? 'none' : 'flex';
    btn.textContent = isVisible
      ? 'Show Advanced Search Options'
      : 'Hide Advanced Search Options';
  });

  // Wire up Search
  document.getElementById('searchForm').addEventListener('submit', fetchCheckoutsModule);

  // Wire up “Add New Checkout” to navigate to your add page
  document.getElementById('addCheckoutBtn').addEventListener('click', () => {
    window.location.href = '/admin/checkout/add';
  });

  // Initial load
  fetchCheckoutsModule();
}


async function fetchCheckoutsModule(e) {
  if (e)
    e.preventDefault();

  const filters = {
    checkoutId: document.getElementById('checkoutId').value.trim(),
    userId: document.getElementById('userId').value.trim(),
    bookIsbn: document.getElementById('bookIsbn').value.trim(),
    reservationId: document.getElementById('reservationId').value.trim(),
    status: document.getElementById('status').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    dateField: document.getElementById('dateField').value,
    page: currentPage,
    limit: 10
  };

  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/checkouts/history?${queryString}`);
    if (!response.ok) throw new Error('Search request failed.');
    const result = await response.json();
    renderCheckoutsModule(result.checkouts, result.total, currentPage);
  } catch (error) {
    console.error(error);
    document.getElementById('resultsContainer').innerHTML = '<p>Error occurred during search.</p>';
  }
}

function renderCheckoutsModule(checkouts, total, page) {
  const list = document.getElementById('checkoutsList');
  if (!checkouts || !Array.isArray(checkouts) || checkouts.length === 0) {
    currentPage = 1;
    list.innerHTML = '<p>No checkouts found.</p>';
    renderPaginationControls(0, currentPage, fetchCheckoutsModule, 'checkoutsPagination');
    return;
  }

  let html = `
    <table class="checkouts-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Book ISBN</th>
          <th>Checkout Date</th>
          <th>Due Date</th>
          <th>Return Date</th>
          <th>Status</th>
          <th>Reservation Id</th>
        </tr>
      </thead>
      <tbody>
  `;

  html += checkouts.map(co => {
    return `
      <tr class="clickable" data-id="${co.id}">
        <td><div class="truncated-text">${co.id}</div></td>
        <td><div class="truncated-text">${co.userId}</div></td>
        <td><div class="truncated-text">${co.bookIsbn}</div></td>
        <td><div class="truncated-text">${new Date(co.checkoutDate).toLocaleDateString()}</div></td>
        <td><div class="truncated-text">${new Date(co.dueDate).toLocaleDateString()}</div></td>
        <td><div class="truncated-text">${co.returnDate ? new Date(co.returnDate).toLocaleDateString() : '-'}</div></td>
        <td><div class="truncated-text">${co.status}</div></td>
        <td><div class="truncated-text">${co.reservationId || '-'}</div></td>
      </tr>
    `;
  }).join('');

  html += `
      </tbody>
    </table>
    <div class="table-footer">
      <p>Total Checkouts: ${total}</p>
    </div>
  `;

  list.innerHTML = html;

  // Attach click handlers
  document.querySelectorAll('.checkouts-table tbody tr.clickable')
    .forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        window.location.href = `/admin/checkout/detail/${id}`;
      });
    });

  renderPaginationControls(total, page, fetchCheckoutsModule, 'checkoutsPagination');
}


/* ------------------------ RESERVATIONS MODULE ------------------------ */
async function loadReservationsModule() {
  contentArea.innerHTML = `
    <h2>Reservations Management</h2>

    <div class="search-container">
      <form id="searchForm">
        <!-- Basic filter -->
        <input type="number" id="reservationId" placeholder="Reservation ID" />

        <!-- Toggle for advanced search options -->
        <button type="button" class="advanced-toggle" id="toggleAdvanced">
          Show Advanced Search Options
        </button>

        <!-- Advanced Filters -->
        <div class="advanced-search" id="advancedSearch" style="display: none;">
          <input type="number" id="userId"     placeholder="User ID" />
          <input type="text"   id="bookIsbn"   placeholder="Book ISBN" />
          <select id="status">
            <option value="">-- Status --</option>
            <option value="pending">Pending</option>
            <option value="available">Available</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
          <input type="date" id="startDate" placeholder="Start Date" />
          <input type="date" id="endDate"   placeholder="End Date" />
          <select id="dateField">
            <option value="requestDate">Request Date</option>
            <option value="expirationDate">Expiration Date</option>
          </select>
        </div>

        <button type="submit">Search</button>
      </form>
    </div>

    <!-- New action buttons -->
    <div style="margin: 10px 0; display: flex; gap: 10px;">
      <button
        id="addReservationBtn"
        style="background: #007bff; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;"
      >
        Add New Reservation
      </button>
      <button
        id="promoteReservationsBtn"
        style="background: #007bff; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;"
      >
        Promote Reservations
      </button>
    </div>

    <div id="reservationsList"></div>
    <div id="reservationsPagination" class="pagination"></div>
  `;

  // wire up advanced toggle
  const toggleBtn = document.getElementById('toggleAdvanced');
  const advDiv = document.getElementById('advancedSearch');
  toggleBtn.addEventListener('click', () => {
    const showing = advDiv.style.display === 'flex';
    advDiv.style.display = showing ? 'none' : 'flex';
    toggleBtn.textContent = showing
      ? 'Show Advanced Search Options'
      : 'Hide Advanced Search Options';
  });

  // wire up "Add New Reservation" button
  const addBtn = document.getElementById('addReservationBtn');
  addBtn.addEventListener('click', () => {
    window.location.href = '/admin/reservations/add';
  });

  // wire up "Promote Reservations" button
  const promoteBtn = document.getElementById('promoteReservationsBtn');
  promoteBtn.addEventListener('click', async () => {
    window.location.href = '/admin/reservations/promote';
  });

  // handle search submission
  document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    currentPage = 1;
    fetchReservationsModule();
  });

  // initial load
  fetchReservationsModule();
}


async function fetchReservationsModule() {
  // collect base params
  const filters = {
    id: document.getElementById('reservationId').value.trim(),
    userId: document.getElementById('userId').value.trim(),
    bookIsbn: document.getElementById('bookIsbn').value.trim(),
    status: document.getElementById('status').value,
    page: currentPage,
    limit: 10
  };

  // date range mapping
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const df = document.getElementById('dateField').value;
  if (start && end) {
    if (df === 'requestDate') {
      filters.reqDateFrom = start;
      filters.reqDateTo = end;
    } else {
      filters.expDateFrom = start;
      filters.expDateTo = end;
    }
  }

  // prune empty
  Object.keys(filters).forEach(k => {
    if (!filters[k]) delete filters[k];
  });

  try {
    const qs = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/reservations/history?${qs}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    renderReservations(data.reservations, data.total, currentPage);
  } catch (err) {
    console.error(err);
    document.getElementById('reservationsList').innerHTML =
      `<p style="color:red;">Error loading reservations: ${err.message}</p>`;
  }
}

function renderReservations(reservations, total, page) {
  const list = document.getElementById('reservationsList');
  if (!reservations || reservations.length === 0) {
    list.innerHTML = '<p>No reservations found.</p>';
    currentPage = 1;
    renderPaginationControls(0,
      currentPage,
      fetchReservationsModule,
      'reservationsPagination'
    );
    return;
  }

  // Build the table header and rows
  const header = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Book ISBN</th>
          <th>Status</th>
          <th>Request Date</th>
          <th>Expiration Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  const rows = reservations.map(r => `
    <tr class="clickable" data-id="${r.id}">
      <td class="truncated-text" >${r.id}</td>
      <td class="truncated-text" >${r.userId}</td>
      <td class="truncated-text" >${r.bookIsbn}</td>
      <td class="truncated-text" >${r.status}</td>
      <td class="truncated-text" >${new Date(r.requestDate).toLocaleDateString()}</td>
      <td class="truncated-text" >
        ${r.expirationDate
      ? new Date(r.expirationDate).toLocaleDateString()
      : '—'}
      </td>
    </tr>
  `).join('');

  const footer = `
      </tbody>
    </table>
    <div class="table-footer">
      <p>Total Reservations: ${total}</p>
    </div>
  `;

  list.innerHTML = header + rows + footer;

  // Select all clickable rows
  document
    .querySelectorAll('#reservationsList table tbody tr.clickable')
    .forEach(row => {
      // on click, navigate to detail page
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        // redirect
        window.location.href = `/admin/reservations/${id}`;
      });
    });


  // Re‑use your existing pagination renderer
  renderPaginationControls(
    total,
    page,
    fetchReservationsModule,
    'reservationsPagination'
  );
}


async function cancelReservation(reservationId) {
  const confirmed = await showModal({ message: 'Are you sure you want to cancel this reservation?', showCancel: true });
  if (!confirmed) return;
  try {
    const res = await fetch(API.reservations.cancel(reservationId), {
      method: 'PUT'
    });
    if (res.ok) {
      await showModal({ message: 'Reservation canceled successfully.' });
      fetchReservationsModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while canceling reservation.' });
  }
}

async function modifyReservation(reservationId) {
  const newNotes = await showPromptModal({ message: 'Enter new notes for the reservation:' });
  if (newNotes === null) return;
  try {
    const res = await fetch(API.reservations.modify(reservationId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: newNotes })
    });
    if (res.ok) {
      await showModal({ message: 'Reservation modified successfully.' });
      fetchReservationsModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while modifying reservation.' });
  }
}

async function promoteReservation(bookIsbn) {
  try {
    const res = await fetch(API.reservations.promote(bookIsbn), {
      method: 'PUT'
    });
    if (res.ok) {
      await showModal({ message: 'Reservation promoted successfully.' });
      fetchReservationsModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while promoting reservation.' });
  }
}

/* ------------------------ USERS MODULE ------------------------ */
async function loadUsersModule() {
  contentArea.innerHTML = `
    <h2>Users Management</h2>
    <div class="search-container">
      <form id="searchForm">
        <!-- Basic filter -->
        <input type="number" id="userId" placeholder="User ID" />

        <!-- Advanced toggle -->
        <button type="button" class="advanced-toggle" id="toggleAdvanced">
          Show Advanced Search Options
        </button>

        <!-- Advanced filters -->
        <div class="advanced-search" id="advancedSearch">
          <input type="text" id="name"            placeholder="Name" />
          <input type="email" id="email"          placeholder="Email" />
          <select id="role">
            <option value="">-- Role --</option>
            <option value="Admin">Admin</option>
            <option value="Librarian">Librarian</option>
            <option value="Patron">Patron</option>
          </select>
          <input type="text"   id="address"       placeholder="Address" />
          <select id="accountStatus">
            <option value="">-- Account Status --</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <button type="submit">Search</button>
      </form>
    </div>

    <div style="margin: 10px 0; display: flex; gap: 10px;">
      <button id="deleteSelectedBtn" style="background: #dc3545; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Delete Selected</button>
      <button id="newUserBtn" style="background:#007bff;color:#fff;border:none;
             padding:10px 15px;border-radius:4px;cursor:pointer;">
        Add New User
      </button>
    </div>

    <div id="usersList"></div>
    <div id="usersPagination" class="pagination"></div>
  `;

  // Toggle advanced section
  const toggleBtn = document.getElementById('toggleAdvanced');
  const advDiv = document.getElementById('advancedSearch');
  toggleBtn.addEventListener('click', () => {
    const showing = advDiv.style.display === 'flex';
    advDiv.style.display = showing ? 'none' : 'flex';
    toggleBtn.textContent = showing
      ? 'Show Advanced Search Options'
      : 'Hide Advanced Search Options';
  });

  // Search form submit
  const form = document.getElementById('searchForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    currentPage = 1;
    fetchUsersModule();
  });

  // Attach event listener to the new Delete Selected button
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', async () => {
      // Get all checkboxes in the table body that are checked
      const selectedCheckboxes = document.querySelectorAll('.users-table tbody input[type="checkbox"]:checked');
      if (selectedCheckboxes.length === 0) {
        await showModal({ message: 'Please select at least one user to delete.' });
        return;
      }

      const confirmed = await showModal({ message: 'Are you sure you want to delete the selected user(s)?', showCancel: true });
      if (!confirmed) return;

      // Collect userIds from each selected checkbox's row
      const userIds = Array.from(selectedCheckboxes)
        .map(checkbox => {
          const row = checkbox.closest('tr');
          return row.getAttribute('data-userid');
        })
        .filter(userid => userid); // remove null or undefined

      // Call deleteUser with the array of user ids
      try {
        await deleteUser(userIds);
      } catch (error) {
        console.error('Bulk deletion failed:', error);
      }
    });
  }

  // New User button
  document.getElementById('newUserBtn').addEventListener('click', async () => {
    window.location.href = `/admin/panel/users/add`;
  });

  // Initial load
  fetchUsersModule();
}


async function fetchUsersModule() {
  // Grab the search form element
  const form = document.getElementById('searchForm');

  // Build filter object from inputs
  const filters = {
    id: form.userId.value.trim(),
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    role: form.role.value,
    address: form.address.value.trim(),
    accountStatus: form.accountStatus.value,
    page: currentPage,
    limit: 10
  };

  // Remove any empty fields
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  // Build query string
  const qs = new URLSearchParams(filters).toString();

  try {
    // Fetch user list with filters & pagination
    const res = await fetch(`${API.users.list}?${qs}`);
    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    const data = await res.json();

    // Render rows and pagination
    renderUsers(data.users, data.total, currentPage);
    renderPaginationControls(
      data.total, currentPage, fetchUsersModule, 'usersPagination'
    );
  } catch (err) {
    console.error(err);
    contentArea.innerHTML += '<p style="color:red;">Error loading users.</p>';
  }
}


function renderUsers(users, total, page) {
  const list = document.getElementById('usersList');
  if (!users || users.length === 0) {
    list.innerHTML = '<p>No users found.</p>';
    renderPaginationControls(0, page, fetchUsersModule, 'usersPagination');
    return;
  }

  // Build the table with the requested columns
  let html = `
    <table class="users-table">
      <thead>
        <tr>
          <th style="width:40px;"><input type="checkbox" id="selectAllUsers" /></th>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Address</th>
          <th>Account Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  html += users.map(user => `
    <tr class="clickable" data-userid="${user.id}">
      <td><input type="checkbox" /></td>
      <td class="truncated-text">${user.id}</td>
      <td class="truncated-text">${user.name}</td>
      <td class="truncated-text">${user.email}</td>
      <td class="truncated-text">${user.role}</td>
      <td class="truncated-text">${user.address || '—'}</td>
      <td class="truncated-text">${user.accountStatus}</td>
    </tr>
  `).join('');

  html += `
      </tbody>
    </table>
    <div class="table-footer">
      <p>Total Users: ${total}</p>
    </div>
  `;

  list.innerHTML = html;
  renderPaginationControls(total, page, fetchUsersModule, 'usersPagination');

  // "Select All" behavior
  const selectAll = document.getElementById('selectAllUsers');
  if (selectAll) {
    selectAll.addEventListener('click', () => {
      document
        .querySelectorAll('.users-table tbody input[type="checkbox"]')
        .forEach(cb => cb.checked = selectAll.checked);
    });
  }

  // Row-click navigation (ignoring clicks on the checkbox cell)
  document
    .querySelectorAll('.users-table tbody tr.clickable')
    .forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', e => {
        // If they clicked the first cell (checkbox), do nothing
        const cell = e.target.closest('td');
        if (cell && cell.cellIndex === 0) return;
        const userId = row.getAttribute('data-userid');
        if (userId) {
          window.location.href = `/admin/users/${userId}`;
        }
      });
    });
}

/**
 * Delete one or more users.
 * @param {number|number[]} userIds  A single user ID or an array of IDs.
 */
async function deleteUser(userIds) {
  // 1. Bulk‐delete branch
  if (Array.isArray(userIds)) {                                   // Array.isArray checks if the value is an Array 
    // You might skip per‐item confirmation for bulk actions
    for (const id of userIds) {                                   // for…of to iterate over arrays 
      try {
        const res = await fetch(API.users.delete(id), {           // fetch() returns a Promise 
          method: 'DELETE'
        });
        if (!res.ok) {
          const err = await res.json();
          console.error(`Failed to delete user ${id}: ${err.message}`);
        }
      } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
      }
    }
    // 2. Show overall success & refresh
    await showModal({ message: 'Selected user(s) deleted successfully.' });
    fetchUsersModule();                                           // your existing refresh call
    return;
  }

  // 3. Single‐delete branch with user confirmation
  const confirmed = await showModal({                             // showModal returns a Promise 
    message: 'Are you sure you want to delete this user?',
    showCancel: true
  });
  if (!confirmed) return;

  try {
    const res = await fetch(API.users.delete(userIds), {          // delete single user
      method: 'DELETE'
    });
    if (res.ok) {
      await showModal({ message: 'User deleted successfully.' });
      fetchUsersModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while deleting user.' });
  }
}


/* ------------------------ NOTIFICATIONS MODULE ------------------------ */
async function loadNotificationsModule() {
  contentArea.innerHTML = `
    <h2>Notifications Management</h2>
    <div class="search-container">
      <form id="searchForm">
        <!-- Basic search: recipient -->
        <input
          type="text"
          id="basicSearch"
          name="recipient"
          placeholder="Search by recipient (email or phone)"
        />
        <!-- Toggle for advanced options -->
        <button type="button" class="advanced-toggle" id="toggleAdvanced">
          Show Advanced Search Options
        </button>
        <!-- Advanced filters -->
        <div class="advanced-search" id="advancedSearch" style="display:none; flex-direction:column; gap:10px;">
          <input type="text" id="searchSubject" name="subject" placeholder="Subject" />
          <input type="text" id="searchMessage" name="message" placeholder="Message" />

          <select id="searchChannel" name="channel">
            <option value="">-- Channel --</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="inapp">In-App</option>
          </select>
          <select id="searchStatus" name="status">
            <option value="">-- Status --</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <select id="searchRead" name="read">
            <option value="">-- Read? --</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>

          <div style="display:flex; gap:8px; align-items:center;">
            <input type="date" id="startDate" name="startDate" />
            <input type="date" id="endDate"   name="endDate" />
            <select id="dateField" name="dateField">
              <option value="createdAt">Created At</option>
              <option value="scheduledAt">Scheduled At</option>
              <option value="deliveredAt">Delivered At</option>
            </select>
          </div>
        </div>

        <button type="submit">Search</button>
      </form>
    </div>

    <!-- Send New Notification Button, move inline styling into head -->
    <div style="margin: 10px 0; display: flex; gap: 10px;">
      <button id="sendNotificationBtn" style="background: #007bff; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Send Notification</button>
    </div>

    <div id="notificationsList"></div>
    <div id="notificationsPagination" class="pagination"></div>
  `;  // innerHTML assignment

  // After injecting, wire up the form handlers
  const form = document.getElementById('searchForm');
  const toggleBtn = document.getElementById('toggleAdvanced');
  const advDiv = document.getElementById('advancedSearch');

  // wire up send new notification button
  document.getElementById('sendNotificationBtn').addEventListener('click', () => {
    window.location.href = '/admin/notifications/send';
  });

  // Toggle advanced search options
  toggleBtn.addEventListener('click', () => {
    const isOpen = advDiv.style.display === 'flex';              // reading style property
    advDiv.style.display = isOpen ? 'none' : 'flex';
    toggleBtn.textContent = isOpen
      ? 'Show Advanced Search Options'
      : 'Hide Advanced Search Options';
  });

  // Intercept form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();                                          // prevent default reload
    await fetchNotificationsModule();                            // call our fetch func
  });

  // initial load
  await fetchNotificationsModule();
}

async function fetchNotificationsModule() {
  const form = document.getElementById('searchForm');

  // Gather filters
  const filters = {
    recipient: form.recipient.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim(),
    channel: form.channel.value,
    status: form.status.value,
    read: form.read.value,
    startDate: form.startDate.value,
    endDate: form.endDate.value,
    dateField: form.dateField.value,  // e.g. "createdAt", "scheduledAt", or "deliveredAt"
    page: currentPage,
    limit: 10
  };

  // Remove empty
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  try {
    const qs = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/notifications/history?${qs}`);
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const data = await res.json();
    
    renderNotifications(data.notifications, data.total, currentPage);
  } catch (err) {
    console.error(err);
    contentArea.innerHTML += '<p style="color:red;">Error loading notifications.</p>';
  }
}

function renderNotifications(data, total, page) {
  const list = document.getElementById('notificationsList');
  // Empty or no data
  if (!data || data.length === 0) {
    list.innerHTML = '<p>No notifications found.</p>';
    renderPaginationControls(0, page, fetchNotificationsModule, 'notificationsPagination');
    return;
  }

  // Build table
  let html = `
    <table class="notifications-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Recipient</th>
          <th>Subject</th>
          <th>Status</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
  `;

  html += data.map(notif => `
    <tr class="clickable" data-notificationid="${notif.id}">
      <td class="truncated-text">${notif.id}</td>
      <td class="truncated-text">${notif.recipient}</td>
      <td class="truncated-text">${notif.subject || '-'}</td>
      <td class="truncated-text">${notif.status}</td>
      <td class="truncated-text">${new Date(notif.createdAt).toLocaleString()}</td
    </tr>
  `).join('') + `
      </tbody>
    </table>
  `;

  html += `
    <div class="table-footer">
      <p>Total notifications: ${total}</p>
    </div>
    `

  list.innerHTML = html;

  // Render footer and pagination controls
  renderPaginationControls(total, page, fetchNotificationsModule, 'notificationsPagination');

  // Row-click navigation (ignoring clicks on the checkbox cell)
  document
    .querySelectorAll('.notifications-table tbody tr.clickable')
    .forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', e => {
        // If they clicked the first cell (checkbox), do nothing
        const cell = e.target.closest('td');
        if (cell && cell.cellIndex === 0) return;
        const notificationId = row.getAttribute('data-notificationid');
        if (notificationId) {
          window.location.href = `/admin/notifications/${notificationId}`;
        }
      });
    });
}


async function markNotificationRead(notificationId, read) {
  try {
    const res = await fetch(API.notifications.send + `/inapp/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read })
    });
    if (res.ok) {
      await showModal({ message: 'Notification updated successfully.' });
      fetchNotificationsModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while updating notification.' });
  }
}

/* ------------------------ REPORTS MODULE ------------------------ */
async function loadReportsModule() {
  contentArea.innerHTML = `
    <h2>Reports</h2>
    <div class="filter-form" id="reportsFilterForm">
      <select id="reportType">
        <option value="circulation" selected>Circulation</option>
        <option value="overdue">Overdue</option>
        <option value="inventory">Inventory</option>
        <option value="user-engagement">User Engagement</option>
        <option value="financial">Financial</option>
      </select>
      <button id="loadReportBtn">Load Report</button>
    </div>

    <!-- Wrap the period selector so we can show/hide it -->
    <div id="circulationPeriodContainer" class="period-container">
      <div id="dailyWeeklyOptions" class="period-options">
        <label for="circulationPeriod" class="period-label">Period</label>
        <select id="circulationPeriod" class="period-select">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>   <!-- ← Added -->
        </select>

        <div id="monthOptions"> 
          <label for="monthPicker" class="period-label">Month/Year</label>
          <input type="month" id="monthPicker" name="month"
                class="period-input" value="">
        </div>
      </div>

      <div id="monthlyOptions" class="period-options hidden">
        <label for="yearPicker" class="period-label">Year</label>
        <input
          type="number"
          id="yearPicker"
          name="year"
          class="period-input"
          min="2000"
          max="2100"
          step="1"
          placeholder="YYYY"
        >
      </div>
    </div>

    <canvas id="reportsChart" style="max-height:480px;"></canvas>

    <div id="reportsContainer"></div>

    <div id="reportsPagination" class="pagination"></div>

    <canvas id="secondReportsChart" style="max-height:480px; margin-top:24px;"></canvas>
    <canvas id="thirdReportsChart" style="max-height:480px; margin-top:24px;"></canvas>
  `;
  document.getElementById('loadReportBtn')
    .addEventListener('click', () => {
      currentPage = 1;
      fetchReport();
    });


  document.getElementById('reportType').addEventListener('change', e => {
    const type = e.target.value;
    const dailyWeekly = document.getElementById('dailyWeeklyOptions');
    const monthlyOpts = document.getElementById('monthlyOptions');
    const secondReportsChart = document.getElementById('secondReportsChart');
    const thirdReportsChart = document.getElementById('thirdReportsChart');
  
    if (type === 'circulation') {
      dailyWeekly.classList.remove('hidden');
      secondReportsChart.classList.remove('hidden');
      thirdReportsChart.classList.remove('hidden');
      monthlyOpts.classList.add('hidden');
      periodSel.value = 'daily';
    } else {
      dailyWeekly.classList.add('hidden');
      secondReportsChart.classList.add('hidden');
      thirdReportsChart.classList.add('hidden');
      monthlyOpts.classList.add('hidden');
    }
  });
    
  
  // Additionally, when “Monthly” period is selected inside circulation:
  document.getElementById('circulationPeriod').addEventListener('change', e => {
    const period     = e.target.value;
    const monthPicker= document.getElementById('monthOptions');
    const yearGroup  = document.getElementById('monthlyOptions');
  
    if (period === 'daily' || period === 'weekly') {
      // show month picker, hide year picker
      monthPicker.classList.remove('hidden');
      yearGroup .classList.add   ('hidden');
    } else if (period === 'monthly') {
      // hide the month input, show the year input
      monthPicker.classList.add   ('hidden');
      yearGroup .classList.remove('hidden');
    }
  });

  (function setDefaultMonth() {
    // 1) Get current date as ISO string: "YYYY-MM-DDTHH:mm:ss.sssZ"
    const now = new Date();
  
    // 2) Extract "YYYY-MM" for the month input
    const monthYear = now.toISOString().substring(0, 7);
  
    // 3) Assign to the input's value
    document.getElementById('monthPicker').value = monthYear;
  })();
  
  // initial load
  fetchReport();
}

function buildCirculationQuery() {
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  const period = document.getElementById('circulationPeriod').value;
  params.append('period', period);

  if (period === 'daily' || period === 'weekly') {
    const month = document.getElementById('monthPicker').value;
    if (month) params.append('month', month);
    else {
      const monthYear = new Date().toISOString().substring(0, 7); // "2025-05"
      params.append('month', monthYear);  
    }
  } else if (period === 'monthly') {
    const year = document.getElementById('yearPicker').value;
    if (year) params.append('year', year);
    else params.append('year', new Date().getFullYear() );
  }

  return { query: params.toString(), period };
}

async function fetchCirculationReports() {
  const { query, period } = buildCirculationQuery();

  // Compose full URLs
  const baseUrl = API.reports.circulation + '?' + query;
  const booksUrl = API.reports.circulation.replace('circulation', 'popular/books') + '?' + query;
  const genresUrl = API.reports.circulation.replace('circulation', 'popular/genres') + '?' + query;

  try {
    // 3 parallel fetches
    const [mainRes, booksRes, genresRes] = await Promise.all([
      fetch(baseUrl),
      fetch(booksUrl),
      fetch(genresUrl)
    ]);

    // Check all OK
    if (!mainRes.ok || !booksRes.ok || !genresRes.ok) {
      throw new Error('One or more report fetches failed.');
    }

    // Parse JSON in parallel
    const [mainData, booksData, genresData] = await Promise.all([
      mainRes.json(),
      booksRes.json(),
      genresRes.json()
    ]);

    // Render into the UI
    renderReport('circulation', mainData, currentPage);
    renderCirculationPopularBooks(booksData.popularBooks, period);
    renderCirculationPopularGenres(genresData.popularGenres, period);

  } catch (err) {
    console.error(err);
    document.getElementById('reportsContainer').innerHTML =
      '<p>Error loading reports.</p>';
  }
}


async function fetchReport() {
  const reportType = document.getElementById('reportType').value;
  const params     = new URLSearchParams({ page: currentPage, limit: 10 });

  // Only circulation has period/month/year filters
  if (reportType === 'circulation') {
    return fetchCirculationReports();
  }

  try {
    const url = API.reports[reportType] + '?' + params.toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch report data.');
    const data = await res.json();
    renderReport(reportType, data, currentPage);
  } catch (error) {
    console.error(error);
    document.getElementById('reportsContainer')
      .innerHTML = '<p>Error loading report.</p>';
  }
}

function renderReport(type, data, page) {
  const container = document.getElementById('reportsContainer'); // maybe delete
  const period = document.getElementById('circulationPeriod').value;
  let html = '';

  if (type === 'financial') {
    let overallTotal = 0;
    html += '<table><thead><tr><th>Status</th><th>Total Fines</th></tr></thead><tbody>';
    data.forEach(item => {
      const fineAmount = parseFloat(item.totalFines) || 0;
      overallTotal += fineAmount;
      html += `
        <tr>
          <td>${item.status || 'Unknown'}</td>
          <td>$${fineAmount.toFixed(2)}</td>
        </tr>`;
    });
    html += `
      <tr style="font-weight:bold; background:#e9ecef;">
        <td>Total Fines</td>
        <td>$${overallTotal.toFixed(2)}</td>
      </tr>
    </tbody></table>
    <div>
      <h3>Understanding Financial Fines</h3>
      <p>The Financial Report breaks down the fines collected by checkout status:</p>
      <ul>
        <li><strong>Overdue:</strong> Late returns, fined per day.</li>
        <li><strong>Lost:</strong> Replacement cost fines.</li>
        <li><strong>Damaged:</strong> Repair/replacement charges.</li>
      </ul>
      <p>The table above shows totals per status, with the final row as the grand total.</p>
    </div>`;
  } else {
    // Generic table for other reports
    html += '<table><thead><tr>';
    if (type === 'circulation') {
      renderCirculation(data.checkouts, period);
    } else if (type === 'overdue') {
      renderOverdue(data);
    } else if (type === 'inventory') {
      html += '<th>ISBN</th><th>Title</th><th>Available Copies</th>';
    } else if (type === 'user-engagement') {
      html += '<th>User ID</th><th>Checkouts</th><th>Reservations</th>';
    }
    html += '</tr></thead><tbody>';

    // old version
    // if (Array.isArray(data.checkouts || data)) {
    //   const rows = data.checkouts || data;
    //   rows.forEach(item => {
    //     html += '<tr>';
    //     if (type === 'circulation') {
    //       html += `<td>${item.date}</td><td>${item.totalCheckouts}</td>`;
    //     } else if (type === 'overdue') {
    //       html += `
    //         <td>${item.userId}</td>
    //         <td>${item.bookIsbn}</td>
    //         <td>${item.daysOverdue}</td>`;
    //     } else if (type === 'inventory') {
    //       html += `
    //         <td>${item.isbn}</td>
    //         <td>${item.title}</td>
    //         <td>${item.availableCopies}</td>`;
    //     } else if (type === 'user-engagement') {
    //       html += `
    //         <td>${item.userId}</td>
    //         <td>${item.checkoutsCount}</td>
    //         <td>${item.reservationsCount}</td>`;
    //     }
    //     html += '</tr>';
    //   });
    // }

    // html += '</tbody></table>';
  }

  // container.innerHTML = html;

  renderPaginationControls(
    data.total || data.totalCount || 0,
    page,
    fetchReport,
    'reportsPagination'
  );
}

// keep these at top level so we can destroy existing charts
let firstChartInstance = null;
let secondChartInstance = null;
let thirdChartInstance = null;

function renderCirculation(rows, period) {
  // Reverse them so oldest → newest left-to-right
  const labels = rows.map(r => r.date).reverse();
  const values = rows.map(r => r.totalCheckouts).reverse();

  // --- Render Chart.js line chart ---
  const ctx = document.getElementById('reportsChart').getContext('2d');
  if (firstChartInstance) {
    firstChartInstance.destroy();
  }
  firstChartInstance = new Chart(ctx, {
    type: 'line',         
    data: {
      labels,
      datasets: [{
        label: `Checkouts (${period})`,
        data: values,
        fill: false,                         // no fill under the line
        borderColor: '#007bff',              // line color
        backgroundColor: '#007bff',          // point color
        tension: 0.3,                        // curve tension (0 = straight lines)
        pointRadius: 5,                      // size of points
        pointHoverRadius: 7                  // size on hover
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Date' },
          // you can still control spacing via:
          // grid: { drawOnChartArea: false }
        },
        y: {
          title: { display: true, text: 'Total Checkouts' },
          beginAtZero: true
        }
      },
      elements: {
        line: {
          borderWidth: 2
        },
        point: {
          hitRadius: 10
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });

  // --- Render HTML table ---
  const tableEl = document.getElementById('reportsContainer');
  let html = '<table><thead><tr><th>Date</th><th>Total Checkouts</th></tr></thead><tbody>';
  rows.forEach(r => {
    html += `<tr><td>${r.date}</td><td>${r.totalCheckouts}</td></tr>`;
  });
  html += '</tbody></table>';
  tableEl.innerHTML = html;
}

/**
 * Renders the "Most Popular Books" bar chart into #secondReportsChart
 * @param {Array<{ book: { title: string }, checkoutCount: number }>} rows
 * @param {string} period
 */
function renderCirculationPopularBooks(rows, period) {
  // Extract and reverse so oldest → newest left-to-right
  const labels = rows.map(r => r.book.title).reverse();
  const values = rows.map(r => r.checkoutCount).reverse();

  if (period === 'daily' || period === 'weekly') {
    period = 'this month';
  } else {
    period = 'this year';
  }

  const ctx = document
    .getElementById('secondReportsChart')
    .getContext('2d');
  if (secondChartInstance) {
    secondChartInstance.destroy();
  }

  secondChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: `${period}`,
        data: values,
        backgroundColor: '#007bff',
        maxBarThickness: 30
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Book Title' },
          ticks: { autoSkip: false }
        },
        y: {
          title: { display: true, text: 'Total Checkouts' },
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Most Popular Books',
          position: 'top',    // default
          align: 'center',    // center it
          font: {
            size: 16,         // adjust as needed
            weight: 'bold'
          }
        },
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });
}

/**
 * Renders the "Most Popular Genres" bar chart into #thirdReportsChart
 * @param {Array<{ genre: string, count: number }>} rows
 * @param {string} period
 */
function renderCirculationPopularGenres(rows, period) {
  // Extract and reverse so oldest → newest left-to-right
  const labels = rows.map(r => r.genre).reverse();
  const values = rows.map(r => r.count).reverse();

  if (period === 'daily' || period === 'weekly') {
    period = 'monthly';
  } else {
    period = 'yearly';
  }

  const ctx = document
    .getElementById('thirdReportsChart')
    .getContext('2d');
  if (thirdChartInstance) {
    thirdChartInstance.destroy();
  }

  thirdChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: `Popular Genre (${period})`,
        data: values,
        backgroundColor: '#007bff',
        maxBarThickness: 30
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Genre' },
          ticks: { autoSkip: false }
        },
        y: {
          title: { display: true, text: 'Total Checkouts' },
          beginAtZero: true
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Most Popular Genres',
          position: 'top',    // default
          align: 'center',    // center it
          font: {
            size: 16,         // adjust as needed
            weight: 'bold'
          }
        },
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });
}

async function fetchOverdueWithFilters() {
  const idInput = document.getElementById('overdueCheckoutIdSearch');
  const fineSelect = document.getElementById('overdueCheckoutMostLeastFilter');
  const params = new URLSearchParams({
    page: currentPage,       // preserve pagination
    limit: 10
  });

  // add ID filter if non-empty
  const id = idInput.value.trim();
  if (id) params.set('id', id);

  // map select value to query flags
  const f = fineSelect.value;
  if (f === 'most') {
    params.set('mostFine', 'true');
    params.delete('leastFine');
  } else if (f === 'least') {
    params.set('leastFine', 'true');
    params.delete('mostFine');
  } else {
    params.delete('mostFine');
    params.delete('leastFine');
  }

  // call endpoint
  const res = await fetch(`/api/reports/overdue?${params.toString()}`);
  if (!res.ok) {
    console.error('Failed to fetch overdue report', res.status);
    return;
  }
  const data = await res.json();
  renderOverdueDetails(data);
}

/**
 * Renders the Overdue Report:
 *  - Line chart of days overdue over time
 *  - Table of each overdue checkout record
 *
 * @param {Object} data
 * @param {Array}  data.overdueCheckouts   — array of { id, bookIsbn, userId, checkoutDate, overdueDays, overdueFine }
 * @param {number} data.page
 * @param {number} data.limit
 * @param {number} data.totalCount
 */
function renderOverdue(data) {
  const {
    overdueCheckouts,
    page, limit, totalCount,
    totalUncollectedFine
  } = data;

  // 1) Bucket counts by checkoutDate (YYYY-MM-DD)
  const countsByDate = overdueCheckouts.reduce((acc, r) => {
    const date = r.dueDate.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // 2) Sort dates ascending
  const labels = Object.keys(countsByDate).sort();
  const values = labels.map(date => countsByDate[date]);

  // 3) Render line chart of counts over time
  const ctx = document.getElementById('reportsChart').getContext('2d');
  if (firstChartInstance) firstChartInstance.destroy();

  firstChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Overdue Checkouts',
        data: values,
        fill: false,
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Overdue Checkouts Over Time',
          align: 'center',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Due Date' }
        },
        y: {
          title: { display: true, text: 'Number of Overdues' },
          beginAtZero: true,
          precision: 0
        }
      }
    }
  });

  // 4) render table and other things
  renderOverdueDetails({
    overdueCheckouts,
    page,
    totalCount,
    totalUncollectedFine
  });
}

/**
 * Renders just the overdue details (table, pagination, summary)
 */
function renderOverdueDetails({ overdueCheckouts, page, totalCount, totalUncollectedFine }) {
  // 1) Render table
  const tableEl = document.getElementById('reportsContainer');
  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th><th>User ID</th><th>Book ISBN</th>
          <th>Due Date</th><th>Days Overdue</th><th>Overdue Fine</th>
        </tr>
      </thead>
      <tbody>
  `;
  overdueCheckouts.forEach(r => {
    const date = r.dueDate.slice(0,10);
    html += `
      <tr>
        <td>${r.id}</td>
        <td>${r.userId}</td>
        <td>${r.bookIsbn}</td>
        <td>${date}</td>
        <td>${r.overdueDays}</td>
        <td>$${r.overdueFine.toFixed(2)}</td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  tableEl.innerHTML = html;

  // 2) Render pagination
  renderPaginationControls(totalCount, page, fetchReport, 'reportsPagination');

  // 3) Render summary
  const paginationEl = document.getElementById('reportsPagination');
  let summaryEl = document.getElementById('overdueSummary');
  if (summaryEl) summaryEl.remove();
  const summaryHtml = `
    <div id="overdueSummary" style="
         margin-top:16px;
         padding:12px;
         background:#f8d7da;
         border:1px solid #f5c6cb;
         border-radius:4px;
    ">
      <strong>Total Uncollected Fine:</strong>
      $${totalUncollectedFine.toFixed(2)}
    </div>
  `;

  // 5) inject filters once 
  if (!document.getElementById('overdueFilterContainer')) {
    const wrapper = document.createElement('div');
    wrapper.id = 'overdueFilterContainer';
    wrapper.style.margin = '16px 0';
    wrapper.innerHTML = `
      <input
        type="text"
        id="overdueCheckoutIdSearch"
        placeholder="Search by Checkout ID"
        style="margin-right:12px; padding:4px;"
      />
      <select
        id="overdueCheckoutMostLeastFilter"
        style="padding:4px;"
      >
        <option value="">-- Fine Amount --</option>
        <option value="most">Most</option>
        <option value="least">Least</option>
      </select>
    `;
    tableEl.insertBefore(wrapper, tableEl.firstChild);

    // wire listeners
    document
      .getElementById('overdueCheckoutIdSearch')
      .addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          currentPage = 1;
          fetchOverdueWithFilters();
        }
      });
    document
      .getElementById('overdueCheckoutMostLeastFilter')
      .addEventListener('change', () => {
        currentPage = 1;
        fetchOverdueWithFilters();
      });
  }

  paginationEl.insertAdjacentHTML('afterend', summaryHtml);
}

/* ------------------------ PAGINATION CONTROLS UTILITY ------------------------ */
function renderPaginationControls(total, page, fetchFunc, containerId) {
  const totalPages = total > 0 ? Math.ceil(total / 10) : 1;
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = page <= 1;
  prevBtn.addEventListener('click', async () => {
    if (page > 1) {
      currentPage = page - 1;
      await fetchFunc();
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = page >= totalPages;
  nextBtn.addEventListener('click', async () => {
    if (page < totalPages) {
      currentPage = page + 1;
      await fetchFunc();
    }
  });

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${page} of ${totalPages}`;

  container.appendChild(prevBtn);
  container.appendChild(pageInfo);
  container.appendChild(nextBtn);
}

/* ------------------------ MODAL POPUP FUNCTIONS ------------------------ */
// Show a generic modal popup; returns a Promise that resolves with true (OK) or false (Cancel)
function showModal({ message, showCancel = false }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');

    modalMessage.textContent = message;
    if (showCancel) {
      cancelButton.classList.remove('hidden');
    } else {
      cancelButton.classList.add('hidden');
    }

    const inputField = document.getElementById('modal-input');
    if (inputField) inputField.classList.add('hidden');

    overlay.classList.remove('hidden');

    const cleanUp = () => {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      overlay.classList.add('hidden');
    };

    const onOk = () => {
      cleanUp();
      resolve(true);
    };

    const onCancel = () => {
      cleanUp();
      resolve(false);
    };

    okButton.addEventListener('click', onOk);
    if (showCancel) {
      cancelButton.addEventListener('click', onCancel);
    }
  });
}

// Show a modal popup that includes an input field; returns a Promise that resolves with the input text, or null if canceled.
function showPromptModal({ message, defaultValue = '' }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');

    let inputField = document.getElementById('modal-input');
    if (!inputField) {
      inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.id = 'modal-input';
      inputField.style.width = '100%';
      inputField.style.marginTop = '10px';
      inputField.style.padding = '8px';
      inputField.style.fontSize = '16px';
      const modal = document.querySelector('.modal');
      modal.insertBefore(inputField, document.querySelector('.modal-buttons'));
    }
    inputField.value = defaultValue;
    inputField.classList.remove('hidden');

    modalMessage.textContent = message;
    cancelButton.classList.remove('hidden');

    overlay.classList.remove('hidden');

    const cleanUp = () => {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      overlay.classList.add('hidden');
      inputField.classList.add('hidden');
    };

    const onOk = () => {
      cleanUp();
      resolve(inputField.value);
    };

    const onCancel = () => {
      cleanUp();
      resolve(null);
    };

    okButton.addEventListener('click', onOk);
    cancelButton.addEventListener('click', onCancel);
  });
}

/* ------------------------ INITIAL LOAD ------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get('tab') || 'books';
  activateTab(initial);
});