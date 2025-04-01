let userId = null; // Will be set after fetching user data
let currentPage = 1;
const limit = 4;
let totalResults = 0;
let currentFilter = 'all'; // Default filter

const reservationsGrid = document.getElementById('reservationsGrid');
const filterButtons = document.querySelectorAll('.filters button');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageIndicator = document.getElementById('pageIndicator');

// Back button functionality
document.getElementById('backButton').addEventListener('click', () => {
  history.back();
});

// Fetch full user data from the API (using jwt_token in cookie)
async function fetchUserData() {
  try {
    const response = await fetch('/api/users/single');
    if (!response.ok) {
      throw new Error('Failed to fetch user data.');
    }
    const user = await response.json();
    userId = user.id;
    fetchReservations(currentPage, currentFilter);
  } catch (error) {
    console.error(error);
    reservationsGrid.innerHTML = '<p>Error loading reservations.</p>';
  }
}

// Function to fetch reservations with pagination and filter for this user
async function fetchReservations(page = 1, filter = 'all') {
  if (!userId) return;
  try {
    const params = new URLSearchParams({ userId, page, limit });
    if (filter !== 'all') {
      params.append('status', filter);
    }
    const response = await fetch(`/api/reservations/my?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch reservations.');
    }
    const result = await response.json();
    totalResults = result.total;
    currentPage = result.page;
    renderReservations(result.reservations || result.books || []);
    updatePagination();
  } catch (error) {
    console.error(error);
    reservationsGrid.innerHTML = '<p>Error loading reservations.</p>';
  }
}

// Function to render reservation cards including book details and extra reservation info
async function renderReservations(data) {
  reservationsGrid.innerHTML = '';
  if (data.length === 0) {
    reservationsGrid.innerHTML = '<p>No reservations found.</p>';
    return;
  }
  for (const reservation of data) {
    const card = document.createElement('div');
    card.className = 'reservation-card';

    // Reservation basic details
    const resId = document.createElement('div');
    resId.textContent = 'Reservation ID: ' + reservation.id;
    card.appendChild(resId);

    const statusDiv = document.createElement('div');
    statusDiv.className = 'reservation-status';
    statusDiv.textContent = 'Status: ' + reservation.status;
    card.appendChild(statusDiv);

    const requestDateDiv = document.createElement('div');
    const requestDate = new Date(reservation.requestDate);
    requestDateDiv.textContent = 'Requested on: ' + requestDate.toLocaleDateString();
    card.appendChild(requestDateDiv);

    const queueDiv = document.createElement('div');
    queueDiv.textContent = 'Queue Position: ' + reservation.queuePosition;
    card.appendChild(queueDiv);

    if (reservation.expirationDate) {
      const expirationDiv = document.createElement('div');
      const expirationDate = new Date(reservation.expirationDate);
      expirationDiv.textContent = 'Expires on: ' + expirationDate.toLocaleDateString();
      card.appendChild(expirationDiv);
    }

    if (reservation.notes) {
      const notesDiv = document.createElement('div');
      notesDiv.textContent = 'Notes: ' + reservation.notes;
      card.appendChild(notesDiv);
    }

    // Fetch associated book details
    try {
      const res = await fetch(`/api/books/${reservation.bookIsbn}`);
      if (res.ok) {
        const book = await res.json();

        // Book cover image
        const img = document.createElement('img');
        img.src = "/public/images/book-covers/" + (book.coverImage ? book.coverImage : 'default.jpeg');
        img.alt = book.title;
        img.style.maxHeight = "200px";
        img.style.width = "auto";
        card.appendChild(img);

        // Book title
        const title = document.createElement('div');
        title.className = 'book-title';
        title.textContent = book.title;
        card.appendChild(title);

        // Book authors
        const authors = document.createElement('div');
        authors.className = 'book-authors';
        authors.textContent = Array.isArray(book.authors) ? book.authors.join(', ') : '';
        card.appendChild(authors);
      } else {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Book details unavailable.';
        card.appendChild(errorDiv);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    }

    reservationsGrid.appendChild(card);
  }
}

// Pagination: update controls based on current page and total results
function updatePagination() {
  const totalPages = Math.ceil(totalResults / limit);
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= totalPages;
}

// Setup event listeners for pagination buttons
prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchReservations(currentPage, currentFilter);
  }
});
nextButton.addEventListener('click', () => {
  const totalPages = Math.ceil(totalResults / limit);
  if (currentPage < totalPages) {
    currentPage++;
    fetchReservations(currentPage, currentFilter);
  }
});

// Setup filter button events to change the filter and reload reservations
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.getAttribute('data-filter');
    // Reset to page 1 when filter changes
    currentPage = 1;
    fetchReservations(currentPage, currentFilter);
  });
});

// Fetch reservations when page loads
document.addEventListener('DOMContentLoaded', fetchUserData);
