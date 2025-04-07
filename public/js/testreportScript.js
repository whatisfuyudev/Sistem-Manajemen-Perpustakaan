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

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentPage = 1; // reset pagination
    loadModule(tab.getAttribute('data-tab'));
  });
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
  // Create header with "Add New Book" button and filter form
  contentArea.innerHTML = `
    <h2>Books Management</h2>

    <div class="search-container">
    <form id="searchForm">
       <!-- Basic search: Single search bar for title (default) -->
      <input type="text" id="basicSearch" placeholder="Search by title (or use advanced options below)" />
       <!--Toggle for advanced search options -->
      <button type="button" class="advanced-toggle" id="toggleAdvanced">Show Advanced Search Options</button>
      <div class="advanced-search" id="advancedSearch">
        <input type="text" id="searchIsbn" placeholder="Search by ISBN" />
        <input type="text" id="searchAuthors" placeholder="Search by authors (comma-separated)" />
        <input type="text" id="searchGenres" placeholder="Search by genres (comma-separated)" />
      </div>
      <button type="submit">Search</button>
    </form>
  </div>

  <div id="booksList"></div>
  <div id="booksPagination" class="pagination"></div>
  `;
  // Now that the content is loaded, get the element and add the listener.
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

  // Handle the search form submission
  document.getElementById('searchForm').addEventListener('submit', fetchBooks);

  // add new book functioanlity
  // document.getElementById('addBookBtn').addEventListener('click', async () => {
  //   // Show a prompt modal for new book details (you can customize the prompt UI)
  //   const title = await showPromptModal({ message: 'Enter book title:' });
  //   if (!title) return;
  //   // Similarly prompt for ISBN and other fields
  //   const isbn = await showPromptModal({ message: 'Enter ISBN:' });
  //   if (!isbn) return;
  //   // You could build a form modal for multiple inputs; for brevity, we prompt sequentially.
  //   const authors = await showPromptModal({ message: 'Enter authors (comma-separated):' });
  //   const genres = await showPromptModal({ message: 'Enter genres (comma-separated):' });
  //   const totalCopies = await showPromptModal({ message: 'Enter total copies:' });
  //   // Create payload
  //   const payload = { title, isbn, authors, genres, totalCopies };
  //   try {
  //     const res = await fetch(API.books.create, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(payload)
  //     });
  //     if (res.ok) {
  //       await showModal({ message: 'Book added successfully.' });
  //       fetchBooks();
  //     } else {
  //       const err = await res.json();
  //       await showModal({ message: 'Error: ' + err.message, showCancel: false });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     await showModal({ message: 'An error occurred while adding the book.' });
  //   }
  // });

  // fetch books after the tab is loaded
  fetchBooks();
}


// async function fetchBooks() {
//   const searchTerm = document.getElementById('booksSearchTerm').value;
//   const params = new URLSearchParams({ page: currentPage, limit: 10 });
//   if (searchTerm) {
//     params.append('searchTerm', searchTerm);
//   }
//   try {
//     const res = await fetch(API.books.search + '?' + params.toString());
//     if (!res.ok) throw new Error('Failed to fetch books.');
//     const data = await res.json();
//     renderBooks(data.books, data.total, currentPage);
//   } catch (error) {
//     console.error(error);
//     contentArea.innerHTML += '<p>Error loading books.</p>';
//   }
// }

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
  filters.page = 1;
  filters.limit = 10;
  
  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch('/api/books/search?' + queryString);
    if (!response.ok) throw new Error('Search request failed.');
    const result = await response.json();
    console.log(result);
    // call render books function
    renderBooks(result.books, result.total, currentPage);
  } catch (error) {
    console.error(error);
  }
}

// old version
// function renderBooks(books, total, page) {
//   const booksList = document.getElementById('booksList');
//   if (!books || books.length === 0) {
//     booksList.innerHTML = '<p>No books found.</p>';
//     return;
//   }
//   booksList.innerHTML = '<div class="card-grid">' + books.map(book => `
//     <div class="card">
//       <img src="/public/images/book-covers/${book.coverImage || 'default.jpeg'}" alt="${book.title}" />
//       <h3>${book.title}</h3>
//       <p>ISBN: ${book.isbn}</p>
//       <p>Authors: ${Array.isArray(book.authors) ? book.authors.join(', ') : ''}</p>
//       <div class="actions">
//         <button class="edit" onclick="editBook('${book.isbn}')">Edit</button>
//         <button class="delete" onclick="deleteBook('${book.isbn}')">Delete</button>
//       </div>
//     </div>
//   `).join('') + '</div>';
//   renderPaginationControls(total, page, fetchBooks, 'booksPagination');
// }

function renderBooks(books, total, page) {
  const booksList = document.getElementById('booksList');
  if (!books || books.length === 0) {
    booksList.innerHTML = '<p>No books found.</p>';
    return;
  }

  // Create a table layout similar to the provided design
  let html = `
    <table class="books-table">
      <thead>
        <tr>
          <th style="width: 40px;">
            <input type="checkbox" />
          </th>
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
    // Join authors array and genres array into comma-separated strings
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : '';
    const genres = Array.isArray(book.genres) ? book.genres.join(', ') : '';

    return `
      <tr>

        <td><input type="checkbox" /></td>

        <td class="truncated-text">${book.isbn || '-'}</td>

        <td class="truncated-text">${book.title || '-'}</td>

        <td class="truncated-text">${authors || '-'}</td>

        <td class="truncated-text">${genres || '-'}</td>

        <td class="truncated-text">${book.publicationYear || '-'}</td>

        <td class="truncated-text">${book.totalCopies || 0}</td>

      </tr>
    `;
  }).join('');

  html += `
      </tbody>
    </table>
    <!-- Optionally display total books at the bottom or any other info -->
    <div class="table-footer">
      <p>Total Books: ${total}</p>
    </div>
  `;

  booksList.innerHTML = html;

  // Render pagination controls
  renderPaginationControls(total, page, fetchBooks, 'booksPagination');
}


async function editBook(isbn) {
  // Fetch existing book data, then prompt for new data
  try {
    const res = await fetch(API.books.get + isbn);
    if (!res.ok) throw new Error('Failed to fetch book data.');
    const book = await res.json();
    const newTitle = await showPromptModal({ message: 'Edit book title:', defaultValue: book.title });
    if (newTitle === null) return;
    const payload = { title: newTitle };
    const updateRes = await fetch(API.books.update(isbn), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (updateRes.ok) {
      await showModal({ message: 'Book updated successfully.' });
      fetchBooks();
    } else {
      const err = await updateRes.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while editing the book.' });
  }
}

async function deleteBook(isbn) {
  const confirmed = await showModal({ message: 'Are you sure you want to delete this book?', showCancel: true });
  if (!confirmed) return;
  try {
    const res = await fetch(API.books.delete(isbn), {
      method: 'DELETE'
    });
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
    <div class="filter-form">
      <button id="newCheckoutBtn">New Checkout</button>
      <input type="text" id="checkoutFilter" placeholder="Filter by status or ISBN..." />
      <button id="checkoutFilterBtn">Search</button>
    </div>
    <div id="checkoutsList"></div>
    <div id="checkoutsPagination" class="pagination"></div>
  `;
  document.getElementById('newCheckoutBtn').addEventListener('click', async () => {
    // Prompt for checkout details (simplified for example)
    const userId = await showPromptModal({ message: 'Enter user ID:' });
    if (!userId) return;
    const bookIsbn = await showPromptModal({ message: 'Enter Book ISBN:' });
    if (!bookIsbn) return;
    const payload = { userId, bookIsbn };
    try {
      const res = await fetch(API.checkouts.checkout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await showModal({ message: 'Checkout created successfully.' });
        fetchCheckoutsModule();
      } else {
        const err = await res.json();
        await showModal({ message: 'Error: ' + err.message });
      }
    } catch (error) {
      console.error(error);
      await showModal({ message: 'An error occurred while creating checkout.' });
    }
  });
  document.getElementById('checkoutFilterBtn').addEventListener('click', () => {
    currentPage = 1;
    fetchCheckoutsModule();
  });
  fetchCheckoutsModule();
}

async function fetchCheckoutsModule() {
  const filter = document.getElementById('checkoutFilter').value;
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  if (filter) params.append('status', filter);
  try {
    const res = await fetch(API.checkouts.list + '?' + params.toString());
    if (!res.ok) throw new Error('Failed to fetch checkouts.');
    const data = await res.json();
    renderCheckoutsModule(data.checkouts, data.total, currentPage);
  } catch (error) {
    console.error(error);
    contentArea.innerHTML += '<p>Error loading checkouts.</p>';
  }
}

function renderCheckoutsModule(checkouts, total, page) {
  const list = document.getElementById('checkoutsList');
  if (!checkouts || checkouts.length === 0) {
    list.innerHTML = '<p>No checkouts found.</p>';
    return;
  }
  list.innerHTML = '<table><thead><tr><th>ID</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead><tbody>' +
  checkouts.map(co => `
    <tr>
      <td>${co.id}</td>
      <td>${co.status}</td>
      <td>${new Date(co.dueDate).toLocaleDateString()}</td>
      <td>
        <button onclick="processReturn(${co.id})">Process Return</button>
        <button onclick="requestRenewal(${co.id})">Request Renewal</button>
      </td>
    </tr>
  `).join('') +
  '</tbody></table>';
  renderPaginationControls(total, page, fetchCheckoutsModule, 'checkoutsPagination');
}

async function processReturn(checkoutId) {
  // Use prompt modal to ask for return date and condition (for simplicity, only condition here)
  const condition = await showPromptModal({ message: 'Enter return condition (returned, lost, damaged):', defaultValue: 'returned' });
  if (!condition) return;
  let customFine;
  if (condition === 'lost' || condition === 'damaged') {
    const fineInput = await showPromptModal({ message: 'Enter custom fine amount (between $1 and $1,000,000):' });
    if (fineInput) {
      customFine = parseFloat(fineInput);
      if (isNaN(customFine) || customFine < 1 || customFine > 1000000) {
        await showModal({ message: 'Invalid fine amount. Please try again.' });
        return;
      }
    }
  }
  const payload = { checkoutId, returnStatus: condition };
  if (customFine !== undefined) {
    payload.customFine = customFine;
  }
  try {
    const res = await fetch(API.checkouts.return, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await showModal({ message: 'Return processed successfully.' });
      fetchCheckoutsModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while processing return.' });
  }
}

async function requestRenewal(checkoutId) {
  // Prompt admin for renewal option (custom or standard) and custom days if custom selected
  const option = await showPromptModal({ message: 'Enter renewal option ("standard" or "custom"):', defaultValue: 'standard' });
  if (!option) return;
  let customDays;
  if (option === 'custom') {
    const days = await showPromptModal({ message: 'Enter number of renewal days:' });
    if (!days || isNaN(Number(days)) || Number(days) <= 0) {
      await showModal({ message: 'Invalid renewal days.' });
      return;
    }
    customDays = Number(days);
  }
  const payload = { renewalOption: option };
  if (customDays) {
    payload.customDays = customDays;
  }
  try {
    const res = await fetch(API.checkouts.requestRenewal(checkoutId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await showModal({ message: 'Renewal request submitted successfully.' });
      fetchCheckoutsModule();
    } else {
      const err = await res.json();
      await showModal({ message: 'Error: ' + err.message });
    }
  } catch (error) {
    console.error(error);
    await showModal({ message: 'An error occurred while requesting renewal.' });
  }
}

/* ------------------------ RESERVATIONS MODULE ------------------------ */
async function loadReservationsModule() {
  contentArea.innerHTML = `
    <h2>Reservations Management</h2>
    <div class="filter-form">
      <input type="text" id="reservationFilter" placeholder="Filter by status, ISBN, or user ID..." />
      <button id="reservationFilterBtn">Search</button>
      <button id="newReservationBtn">Add New Reservation</button>
    </div>
    <div id="reservationsList"></div>
    <div id="reservationsPagination" class="pagination"></div>
  `;
  document.getElementById('reservationFilterBtn').addEventListener('click', () => {
    currentPage = 1;
    fetchReservationsModule();
  });
  document.getElementById('newReservationBtn').addEventListener('click', async () => {
    const bookIsbn = await showPromptModal({ message: 'Enter Book ISBN:' });
    if (!bookIsbn) return;
    const notes = await showPromptModal({ message: 'Enter any notes (optional):' });
    const payload = { bookIsbn, notes };
    try {
      const res = await fetch(API.reservations.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await showModal({ message: 'Reservation created successfully.' });
        fetchReservationsModule();
      } else {
        const err = await res.json();
        await showModal({ message: 'Error: ' + err.message });
      }
    } catch (error) {
      console.error(error);
      await showModal({ message: 'An error occurred while creating reservation.' });
    }
  });
  fetchReservationsModule();
}

async function fetchReservationsModule() {
  const filter = document.getElementById('reservationFilter').value;
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  if (filter) {
    params.append('status', filter);
  }
  try {
    const res = await fetch(API.reservations.list + '?' + params.toString());
    if (!res.ok) throw new Error('Failed to fetch reservations.');
    const data = await res.json();
    renderReservations(data.reservations, data.total, currentPage);
  } catch (error) {
    console.error(error);
    contentArea.innerHTML += '<p>Error loading reservations.</p>';
  }
}

function renderReservations(reservations, total, page) {
  const list = document.getElementById('reservationsList');
  if (!reservations || reservations.length === 0) {
    list.innerHTML = '<p>No reservations found.</p>';
    return;
  }
  list.innerHTML = '<table><thead><tr><th>ID</th><th>User ID</th><th>Book ISBN</th><th>Status</th><th>Queue Position</th><th>Actions</th></tr></thead><tbody>' +
  reservations.map(resv => `
    <tr>
      <td>${resv.id}</td>
      <td>${resv.userId}</td>
      <td>${resv.bookIsbn}</td>
      <td>${resv.status}</td>
      <td>${resv.queuePosition}</td>
      <td>
        <button onclick="cancelReservation(${resv.id})">Cancel</button>
        <button onclick="modifyReservation(${resv.id})">Modify</button>
        <button onclick="promoteReservation('${resv.bookIsbn}')">Promote</button>
      </td>
    </tr>
  `).join('') +
  '</tbody></table>';
  renderPaginationControls(total, page, fetchReservationsModule, 'reservationsPagination');
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
  // Load the default module (Books)
  loadModule('books');
});