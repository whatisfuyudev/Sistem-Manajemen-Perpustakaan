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
    checkoutsGrid.innerHTML = '<p style="text-align: center;">No checkouts found.</p>';
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
        img.src = "" + (book.coverImage ? book.coverImage : 'https://res.cloudinary.com/dxfrr8lsd/image/upload/v1752218741/book-covers/d8358cf2-ef7b-47a2-abec-27e5aaadd827_1752218741435_default-cover.png');
        img.alt = book.title;
        img.style.maxHeight = "200px";
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
  // Show the renewal prompt modal
  const result = await showPromptModal({ message: 'Choose your renewal option (days):' });
  
  if (!result) {
    // User canceled the prompt
    return;
  }
  
  const { renewalOption, customDays } = result;

  try {
    const response = await fetch(`/api/checkouts/request-renewal/${checkoutId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renewalOption, customDays })
    });
    
    if (response.ok) {
      const resultData = await response.json();
      card.querySelector('.checkout-details').textContent = 'Status: Renewal requested';
      // Optionally show a modal confirming success
      await showModal({ message: 'Renewal request submitted successfully.' });
      fetchCheckouts(currentPage, currentFilter); // Refresh data
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

  // If there are no results at all, hide all pagination controls
  if (totalResults === 0) {
    prevButton.style.display      = 'none';
    nextButton.style.display      = 'none';
    pageIndicator.style.display   = 'none';
    return;
  }

  // Otherwise ensure they’re visible again (in case you navigated back from a non-empty page)
  prevButton.style.display      = '';
  nextButton.style.display      = '';
  pageIndicator.style.display   = '';

  // Update their enabled/disabled state and text
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevButton.disabled       = currentPage === 1;
  nextButton.disabled       = currentPage >= totalPages;
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
// Utility to reset the modal to its default state.
function resetModal() {
  // Remove any custom input field if present.
  const inputField = document.getElementById('modalInput');
  if (inputField) {
    inputField.remove();
  }
  // Reset the select element to its default value (if it exists)
  const checkoutDuration = document.getElementById('checkoutDuration');
  if (checkoutDuration) {
    checkoutDuration.selectedIndex = 0;
    checkoutDuration.classList.add('hidden'); // Hide select in generic modal mode.
  }
}

// Generic modal: returns a Promise that resolves with true (OK) or false (Cancel)
function showModal({ message, showCancel = false }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');
    const checkoutDuration = document.getElementById('checkoutDuration');

    // Set the message text
    modalMessage.textContent = message;

    // Hide the select element if present
    if (checkoutDuration) {
      checkoutDuration.classList.add('hidden');
    }

    // Show or hide the cancel button based on the flag
    if (showCancel) {
      cancelButton.classList.remove('hidden');
    } else {
      cancelButton.classList.add('hidden');
    }

    // Hide any input field if present
    const inputField = document.getElementById('modalInput');
    if (inputField) {
      inputField.classList.add('hidden');
    }

    // Display the modal
    overlay.classList.remove('hidden');

    const cleanUp = () => {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      overlay.classList.add('hidden');
      resetModal();
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

// Prompt modal: uses a select element to choose between 'standard' and 'custom'.
// If 'custom' is selected, spawns an input field for custom value.
// Returns a Promise that resolves with an object { renewalOption, customDays } or null if canceled.
function showPromptModal({ message, defaultValue = '14', showCancel = true }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');
    const checkoutDuration = document.getElementById('checkoutDuration');

    // Set the message text
    modalMessage.textContent = message;

    // Show the select element for the prompt and ensure it's visible.
    checkoutDuration.classList.remove('hidden');

    // Remove any previous custom input if it exists.
    let inputField = document.getElementById('modalInput');
    if (inputField) {
      inputField.remove();
    }

    // Display the modal
    overlay.classList.remove('hidden');

    // Show or hide the cancel button based on the flag
    if (showCancel) {
      cancelButton.classList.remove('hidden');
    } else {
      cancelButton.classList.add('hidden');
    }

    const onSelectChange = () => {
      if (checkoutDuration.value === 'custom') {
        // Create the input field if not already present.
        if (!document.getElementById('modalInput')) {
          inputField = document.createElement('input');
          inputField.type = 'text';
          inputField.id = 'modalInput';
          inputField.placeholder = 'Enter custom value';
          inputField.value = defaultValue;
          // Insert the input field after the select element.
          checkoutDuration.insertAdjacentElement('afterend', inputField);
        } else {
          inputField.classList.remove('hidden');
        }
      } else {
        if (inputField) {
          inputField.classList.add('hidden');
        }
      }
    };

    checkoutDuration.addEventListener('change', onSelectChange);

    const cleanUp = () => {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      checkoutDuration.removeEventListener('change', onSelectChange);
      overlay.classList.add('hidden');
      resetModal();
    };

    const onOk = () => {
      const renewalOption = checkoutDuration.value;
      let customDays = null;
      if (renewalOption === 'custom') {
        const inputElem = document.getElementById('modalInput');
        customDays = inputElem ? inputElem.value.trim() : '';
      }
      cleanUp();
      resolve({ renewalOption, customDays });
    };

    const onCancel = () => {
      cleanUp();
      resolve(null);
    };

    okButton.addEventListener('click', onOk);
    cancelButton.addEventListener('click', onCancel);
  });
}

