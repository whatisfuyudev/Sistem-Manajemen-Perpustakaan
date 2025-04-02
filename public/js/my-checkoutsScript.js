// Global Variables
let userId = null;
let checkoutsData = [];
let currentPage = 1;
const limit = 8;
let totalResults = 0;
let currentFilter = 'all';

const checkoutsGrid = document.getElementById('checkoutsGrid');
const filterButtons = document.querySelectorAll('.filters button');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageIndicator = document.getElementById('pageIndicator');

// Maximum number of renewals allowed
const MAX_RENEWALS = 2;

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

// Function to render checkout cards including book details, checkout info, and a "Renew" button
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
    
    // Add "Request Renewal" button if checkout is active, no pending request, and below max renewals
    if (checkout.status === 'active' && checkout.renewalCount < MAX_RENEWALS && !checkout.renewalRequested) {
      const renewButton = document.createElement('button');
      renewButton.textContent = 'Request Renewal';
      renewButton.className = 'renew-button';
      renewButton.onclick = () => requestRenewal(checkout.id, card);
      card.appendChild(renewButton);
    }

    checkoutsGrid.appendChild(card);
  }
}

async function requestRenewal(checkoutId, card) {
  // Optionally, prompt the user for a custom renewal period using your custom pop-up.
  // Using our custom modal popup instead of alert.
  const renewalOption = 'standard'; // or 'custom'
  let customDays = 14;
  
  try {
    const response = await fetch(`/api/checkouts/request-renewal/${checkoutId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renewalOption, customDays })
    });
    
    if (response.ok) {
      const result = await response.json();
      card.querySelector('.checkout-details').textContent = 'Status: renewal requested';
      await showModal({ message: 'Renewal request submitted successfully.' });
      fetchCheckouts(currentPage, currentFilter); // Refresh the data
    } else {
      const error = await response.json();
      await showModal({ message: 'Error: ' + error.message });
    }
  } catch (error) {
    console.error('Error requesting renewal:', error);
    await showModal({ message: 'An error occurred while requesting renewal.' });
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

/* Custom Modal Popup Functions */

// Show a generic modal popup; returns a Promise that resolves with true (OK) or false (Cancel)
function showModal({ message, showCancel = false }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');

    // Set the message text
    modalMessage.textContent = message;
    
    // Show or hide the cancel button based on the flag
    if (showCancel) {
      cancelButton.classList.remove('hidden');
    } else {
      cancelButton.classList.add('hidden');
    }
    
    // Hide any input field if present
    const inputField = document.getElementById('modal-input');
    if (inputField) {
      inputField.classList.add('hidden');
    }
    
    // Display the modal
    overlay.classList.remove('hidden');

    // Clean up previous event listeners if any
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

