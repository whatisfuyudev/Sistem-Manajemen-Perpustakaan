// Global Variables
let userId = null;
let checkoutsData = [];
let currentPage = 1;
const limit = 4;
let totalResults = 0;
let currentFilter = 'all'; // Default filter

const checkoutsGrid = document.getElementById('checkoutsGrid');
const filterButtons = document.querySelectorAll('.filters button');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageIndicator = document.getElementById('pageIndicator');

// Back button functionality
document.getElementById('backButton').addEventListener('click', () => {
  history.back();
});

// Fetch user data from API (using jwt_token from cookie)
async function fetchUserData() {
  try {
    const response = await fetch('/api/users/single');
    if (!response.ok) {
      throw new Error('Failed to fetch user data.');
    }
    const user = await response.json();
    userId = user.id;
    fetchCheckouts(currentPage, currentFilter);
  } catch (error) {
    console.error(error);
    checkoutsGrid.innerHTML = '<p>Error loading checkouts.</p>';
  }
}

// Function to fetch checkouts for the user with pagination and filter
async function fetchCheckouts(page = 1, filter = 'all') {
  if (!userId) return;
  try {
    const params = new URLSearchParams({ userId, page, limit });
    if (filter !== 'all') {
      params.append('status', filter);
    }
    const response = await fetch(`/api/checkouts/history?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch checkouts.');
    }
    const result = await response.json();
    totalResults = result.total;
    currentPage = result.page;
    // Assuming the API returns checkouts in result.checkouts
    checkoutsData = result.checkouts || [];
    renderCheckouts(checkoutsData);
    updatePagination();
  } catch (error) {
    console.error(error);
    checkoutsGrid.innerHTML = '<p>Error loading checkouts.</p>';
  }
}

// Function to render checkout cards including book details and checkout info
async function renderCheckouts(data) {
  checkoutsGrid.innerHTML = '';
  if (data.length === 0) {
    checkoutsGrid.innerHTML = '<p>No checkouts found.</p>';
    return;
  }
  for (const checkout of data) {
    const card = document.createElement('div');
    card.className = 'checkout-card';

    // Display checkout info
    const idDiv = document.createElement('div');
    idDiv.textContent = 'Checkout ID: ' + checkout.id;
    card.appendChild(idDiv);

    const statusDiv = document.createElement('div');
    statusDiv.className = 'checkout-details';
    statusDiv.textContent = 'Status: ' + checkout.status;
    card.appendChild(statusDiv);

    const checkoutDateDiv = document.createElement('div');
    const checkoutDate = new Date(checkout.checkoutDate);
    checkoutDateDiv.textContent = 'Checked out: ' + checkoutDate.toLocaleDateString();
    card.appendChild(checkoutDateDiv);

    const dueDateDiv = document.createElement('div');
    const dueDate = new Date(checkout.dueDate);
    dueDateDiv.textContent = 'Due: ' + dueDate.toLocaleDateString();
    card.appendChild(dueDateDiv);

    if (checkout.returnDate) {
      const returnDateDiv = document.createElement('div');
      const returnDate = new Date(checkout.returnDate);
      returnDateDiv.textContent = 'Returned: ' + returnDate.toLocaleDateString();
      card.appendChild(returnDateDiv);
    }

    const renewalDiv = document.createElement('div');
    renewalDiv.textContent = 'Renewals: ' + checkout.renewalCount;
    card.appendChild(renewalDiv);

    if (checkout.fine > 0) {
      const fineDiv = document.createElement('div');
      fineDiv.textContent = 'Fine: $' + checkout.fine;
      card.appendChild(fineDiv);
    }

    // Fetch associated book details
    try {
      const res = await fetch(`/api/books/${checkout.bookIsbn}`);
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
  
    checkoutsGrid.appendChild(card);
  }
}

// Pagination: update controls based on current page and total results
function updatePagination() {
  const totalPages = Math.ceil(totalResults / limit);
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= totalPages;
}

// Event listeners for pagination buttons
prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchCheckouts(currentPage, currentFilter);
  }
});
nextButton.addEventListener('click', () => {
  const totalPages = Math.ceil(totalResults / limit);
  if (currentPage < totalPages) {
    currentPage++;
    fetchCheckouts(currentPage, currentFilter);
  }
});

// Setup filter button events to change the filter and reload checkouts
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.getAttribute('data-filter');
    currentPage = 1;
    fetchCheckouts(currentPage, currentFilter);
  });
});

// Initial call to fetch user data (which then fetches checkouts)
document.addEventListener('DOMContentLoaded', fetchUserData);
