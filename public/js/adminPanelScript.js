// Global state variables for pagination, etc.
let currentPage = 1, totalPages = 1;

// Base API endpoints for each module (modify as necessary)
const API = {
  books: {
    list: '/api/books/',
    create: '/api/books/',
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
    single: '/api/users/single'
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
    history.pushState({ tab: module }, '', newUrl);  // :contentReference[oaicite:0]{index=0}
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
  switch(module) {
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
      window.location.href = '/books/admin/add';
    });
  }

  // Fetch books after the tab is loaded
  fetchBooks();
}

async function fetchBooks(e) {
  if(e)
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
    renderPaginationControls(0, currentPage,  fetchBooks, 'booksPagination');
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
        window.location.href = 'http://localhost:5000/books/admin/details/' + isbn;
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
      <button id="addCheckoutBtn" style="background: #007bff; color: #fff; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Add new checkout</button>
    </div>

    <div id="resultsContainer">
      <div id="checkoutsList"></div>
      <div id="checkoutsPagination" class="pagination"></div>
    </div>
  `;

  // Toggle advanced search
  document.getElementById('toggleAdvanced').addEventListener('click', () => {
    const adv = document.getElementById('advancedSearch');
    const btn  = document.getElementById('toggleAdvanced');
    const isVisible = adv.style.display === 'flex';
    adv.style.display = isVisible ? 'none' : 'flex';
    btn.textContent     = isVisible
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
  if(e)
    e.preventDefault();
  
  const filters = {
    checkoutId: document.getElementById('checkoutId').value.trim(),
    userId:     document.getElementById('userId')   .value.trim(),
    bookIsbn:   document.getElementById('bookIsbn') .value.trim(),
    reservationId: document.getElementById('reservationId').value.trim(),
    status:     document.getElementById('status')   .value,
    startDate:  document.getElementById('startDate').value,
    endDate:    document.getElementById('endDate')  .value,
    dateField:  document.getElementById('dateField').value,
    page:       currentPage,
    limit:      10
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
// old version
// async function loadReservationsModule() {
//   contentArea.innerHTML = `
//     <h2>Reservations Management</h2>
//     <div class="filter-form">
//       <input type="text" id="reservationFilter" placeholder="Filter by status, ISBN, or user ID..." />
//       <button id="reservationFilterBtn">Search</button>
//       <button id="newReservationBtn">Add New Reservation</button>
//     </div>
//     <div id="reservationsList"></div>
//     <div id="reservationsPagination" class="pagination"></div>
//   `;
//   document.getElementById('reservationFilterBtn').addEventListener('click', () => {
//     currentPage = 1;
//     fetchReservationsModule();
//   });
//   document.getElementById('newReservationBtn').addEventListener('click', async () => {
//     const bookIsbn = await showPromptModal({ message: 'Enter Book ISBN:' });
//     if (!bookIsbn) return;
//     const notes = await showPromptModal({ message: 'Enter any notes (optional):' });
//     const payload = { bookIsbn, notes };
//     try {
//       const res = await fetch(API.reservations.create, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       if (res.ok) {
//         await showModal({ message: 'Reservation created successfully.' });
//         fetchReservationsModule();
//       } else {
//         const err = await res.json();
//         await showModal({ message: 'Error: ' + err.message });
//       }
//     } catch (error) {
//       console.error(error);
//       await showModal({ message: 'An error occurred while creating reservation.' });
//     }
//   });
//   fetchReservationsModule();
// }

// async function fetchReservationsModule() {
//   const filter = document.getElementById('reservationFilter').value;
//   const params = new URLSearchParams({ page: currentPage, limit: 10 });
//   if (filter) {
//     params.append('status', filter);
//   }
//   try {
//     const res = await fetch(API.reservations.list + '?' + params.toString());
//     if (!res.ok) throw new Error('Failed to fetch reservations.');
//     const data = await res.json();
//     renderReservations(data.reservations, data.total, currentPage);
//   } catch (error) {
//     console.error(error);
//     contentArea.innerHTML += '<p>Error loading reservations.</p>';
//   }
// }

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
        <div class="advanced-search" id="advancedSearch">
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

    <div id="reservationsList"></div>
    <div id="reservationsPagination" class="pagination"></div>
  `;

  // wire up advanced toggle
  const toggleBtn = document.getElementById('toggleAdvanced');
  const advDiv    = document.getElementById('advancedSearch');
  toggleBtn.addEventListener('click', () => {
    const showing = advDiv.style.display === 'flex';
    advDiv.style.display = showing ? 'none' : 'flex';
    toggleBtn.textContent = showing
      ? 'Show Advanced Search Options'
      : 'Hide Advanced Search Options';
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
    id:       document.getElementById('reservationId').value.trim(),
    userId:   document.getElementById('userId').value.trim(),
    bookIsbn: document.getElementById('bookIsbn').value.trim(),
    status:   document.getElementById('status').value,
    page:     currentPage,
    limit:    10
  };

  // date range mapping
  const start = document.getElementById('startDate').value;
  const end   = document.getElementById('endDate').value;
  const df    = document.getElementById('dateField').value;
  if (start && end) {
    if (df === 'requestDate') {
      filters.reqDateFrom = start;
      filters.reqDateTo   = end;
    } else {
      filters.expDateFrom = start;
      filters.expDateTo   = end;
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
    <div class="filter-form">
      <input type="text" id="userFilter" placeholder="Search users by name or email..." />
      <button id="userFilterBtn">Search</button>
      <button id="newUserBtn">Add New User</button>
    </div>
    <div id="usersList"></div>
    <div id="usersPagination" class="pagination"></div>
  `;
  document.getElementById('userFilterBtn').addEventListener('click', () => {
    currentPage = 1;
    fetchUsersModule();
  });
  document.getElementById('newUserBtn').addEventListener('click', async () => {
    const name = await showPromptModal({ message: 'Enter user name:' });
    if (!name) return;
    const email = await showPromptModal({ message: 'Enter user email:' });
    if (!email) return;
    const password = await showPromptModal({ message: 'Enter user password:' });
    if (!password) return;
    const payload = { name, email, password };
    try {
      const res = await fetch(API.users.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await showModal({ message: 'User created successfully.' });
        fetchUsersModule();
      } else {
        const err = await res.json();
        await showModal({ message: 'Error: ' + err.message });
      }
    } catch (error) {
      console.error(error);
      await showModal({ message: 'An error occurred while creating user.' });
    }
  });
  fetchUsersModule();
}

async function fetchUsersModule() {
  const filter = document.getElementById('userFilter').value;
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  if (filter) {
    params.append('searchTerm', filter);
  }
  try {
    const res = await fetch(API.users.list + '?' + params.toString());
    if (!res.ok) throw new Error('Failed to fetch users.');
    const data = await res.json();
    renderUsers(data.users, data.total, currentPage);
  } catch (error) {
    console.error(error);
    contentArea.innerHTML += '<p>Error loading users.</p>';
  }
}

function renderUsers(users, total, page) {
  const list = document.getElementById('usersList');
  if (!users || users.length === 0) {
    list.innerHTML = '<p>No users found.</p>';
    return;
  }
  list.innerHTML = '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>' +
  users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>
        <button onclick="editUser(${user.id})">Edit</button>
        <button onclick="deleteUser(${user.id})">Delete</button>
      </td>
    </tr>
  `).join('') +
  '</tbody></table>';
  renderPaginationControls(total, page, fetchUsersModule, 'usersPagination');
}

async function editUser(userId) {
  try {
    const res = await fetch(API.users.single);
    if (!res.ok) throw new Error('Failed to fetch user data.');
    const user = await res.json();
    const newName = await showPromptModal({ message: 'Edit user name:', defaultValue: user.name });
    if (newName === null) return;
    const payload = { name: newName };
    const updateRes = await fetch(API.users.update(userId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (updateRes.ok) {
      await showModal({ message: 'User updated successfully.' });
      fetchUsersModule();
    } else {
      const err = await updateRes.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while editing user.' });
  }
}

async function deleteUser(userId) {
  const confirmed = await showModal({ message: 'Are you sure you want to delete this user?', showCancel: true });
  if (!confirmed) return;
  try {
    const res = await fetch(API.users.delete(userId), { method: 'DELETE' });
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
    <div class="filter-form">
      <input type="text" id="notificationFilter" placeholder="Filter by recipient or channel..." />
      <button id="notificationFilterBtn">Search</button>
      <button id="sendNotificationBtn">Send Notification</button>
      <button id="scheduleNotificationBtn">Schedule Notification</button>
    </div>
    <div id="notificationsList"></div>
    <div id="notificationsPagination" class="pagination"></div>
  `;
  document.getElementById('notificationFilterBtn').addEventListener('click', () => {
    currentPage = 1;
    fetchNotificationsModule();
  });
  document.getElementById('sendNotificationBtn').addEventListener('click', async () => {
    const channel = await showPromptModal({ message: 'Enter channel (email, sms, inapp):', defaultValue: 'email' });
    if (!channel) return;
    const recipient = await showPromptModal({ message: 'Enter recipient:' });
    if (!recipient) return;
    const subject = await showPromptModal({ message: 'Enter subject:' });
    const messageText = await showPromptModal({ message: 'Enter message:' });
    const payload = { channel, recipient, subject, message: messageText };
    try {
      const res = await fetch(API.notifications.send, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await showModal({ message: 'Notification sent successfully.' });
        fetchNotificationsModule();
      } else {
        const err = await res.json();
        await showModal({ message: 'Error: ' + err.message });
      }
    } catch (error) {
      console.error(error);
      await showModal({ message: 'An error occurred while sending notification.' });
    }
  });
  document.getElementById('scheduleNotificationBtn').addEventListener('click', async () => {
    const channel = await showPromptModal({ message: 'Enter channel (email, sms, inapp):', defaultValue: 'email' });
    if (!channel) return;
    const recipient = await showPromptModal({ message: 'Enter recipient:' });
    if (!recipient) return;
    const subject = await showPromptModal({ message: 'Enter subject:' });
    const messageText = await showPromptModal({ message: 'Enter message:' });
    const scheduledAt = await showPromptModal({ message: 'Enter scheduled time (YYYY-MM-DD HH:MM):' });
    const payload = { channel, recipient, subject, message: messageText, scheduledAt };
    try {
      const res = await fetch(API.notifications.schedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await showModal({ message: 'Notification scheduled successfully.' });
        fetchNotificationsModule();
      } else {
        const err = await res.json();
        await showModal({ message: 'Error: ' + err.message });
      }
    } catch (error) {
      console.error(error);
      await showModal({ message: 'An error occurred while scheduling notification.' });
    }
  });
  fetchNotificationsModule();
}

async function fetchNotificationsModule() {
  const filter = document.getElementById('notificationFilter').value;
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  if (filter) params.append('recipient', filter);
  try {
    const res = await fetch(API.notifications.list + '?' + params.toString());
    if (!res.ok) throw new Error('Failed to fetch notifications.');
    const data = await res.json();
    renderNotifications(data, currentPage);
  } catch (error) {
    console.error(error);
    contentArea.innerHTML += '<p>Error loading notifications.</p>';
  }
}

function renderNotifications(data, page) {
  const list = document.getElementById('notificationsList');
  if (!data || data.length === 0) {
    list.innerHTML = '<p>No notifications found.</p>';
    return;
  }
  list.innerHTML = '<table><thead><tr><th>ID</th><th>Channel</th><th>Recipient</th><th>Subject</th><th>Status</th><th>Created At</th><th>Actions</th></tr></thead><tbody>' +
  data.map(notif => `
    <tr>
      <td>${notif.id}</td>
      <td>${notif.channel}</td>
      <td>${notif.recipient}</td>
      <td>${notif.subject || '-'}</td>
      <td>${notif.status}</td>
      <td>${new Date(notif.createdAt).toLocaleString()}</td>
      <td>
        ${notif.channel === 'inapp' ? `<button onclick="markNotificationRead(${notif.id}, true)">Mark as Read</button>
        <button onclick="markNotificationRead(${notif.id}, false)">Mark as Unread</button>` : ''}
      </td>
    </tr>
  `).join('') +
  '</tbody></table>';
  // Pagination not fully implemented for notifications in this snippet.
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
        <option value="reservations">Reservations</option>
        <option value="overdue">Overdue</option>
        <option value="inventory">Inventory</option>
        <option value="user-engagement">User Engagement</option>
        <option value="financial">Financial</option>
        <option value="custom">Custom</option>
      </select>
      <button id="loadReportBtn">Load Report</button>
    </div>
    <div id="reportsContainer"></div>
    <div id="reportsPagination" class="pagination"></div>
  `;
  document.getElementById('loadReportBtn').addEventListener('click', () => {
    currentPage = 1;
    fetchReport();
  });
  fetchReport();
}

async function fetchReport() {
  const reportType = document.getElementById('reportType').value;
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  // Add additional report filters here if needed.
  try {
    const res = await fetch(API.reports[reportType] + '?' + params.toString());
    if (!res.ok) throw new Error('Failed to fetch report data.');
    const data = await res.json();
    renderReport(reportType, data, currentPage);
  } catch (error) {
    console.error(error);
    document.getElementById('reportsContainer').innerHTML = '<p>Error loading report.</p>';
  }
}

function renderReport(type, data, page) {
  const container = document.getElementById('reportsContainer');
  container.innerHTML = '';
  let html = '';
  if (type === 'financial') {
    let overallTotal = 0;
    html += '<table><thead><tr><th>Status</th><th>Total Fines</th></tr></thead><tbody>';
    data.forEach(item => {
      const fineAmount = parseFloat(item.totalFines) || 0;
      overallTotal += fineAmount;
      html += `<tr>
        <td>${item.status || 'Unknown'}</td>
        <td>$${fineAmount.toFixed(2)}</td>
      </tr>`;
    });
    html += `<tr style="font-weight:bold; background:#e9ecef;">
      <td>Total Fines</td>
      <td>$${overallTotal.toFixed(2)}</td>
    </tr>`;
    html += '</tbody></table>';
    html += `<div><h3>Understanding Financial Fines</h3>
      <p>The Financial Report breaks down the fines collected from checkouts by their status. Fines typically arise when items are:</p>
      <ul>
        <li><strong>Overdue:</strong> Items returned after their due date incur a fine calculated per day.</li>
        <li><strong>Lost:</strong> Items that are not returned are reported as lost, with a fine often equivalent to the replacement cost.</li>
        <li><strong>Damaged:</strong> Items returned in a damaged condition may incur additional charges to cover repair or replacement.</li>
      </ul>
      <p>The table above displays the total fines grouped by status. The final row shows the overall total of fines collected.</p></div>`;
  } else {
    // For other report types, display as a simple table (you may expand as needed)
    html += '<table><thead><tr>';
    // Example: for circulation report
    if (type === 'circulation') {
      html += '<th>Date</th><th>Total Checkouts</th>';
    }
    // Add additional report type headers here...
    html += '</tr></thead><tbody>';
    data.checkouts && data.checkouts.forEach(item => {
      html += `<tr><td>${item.date}</td><td>${item.totalCheckouts}</td></tr>`;
    });
    html += '</tbody></table>';
  }
  container.innerHTML = html;
  renderPaginationControls(data.total || data.totalCount || 0, page, fetchReport, 'reportsPagination');
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