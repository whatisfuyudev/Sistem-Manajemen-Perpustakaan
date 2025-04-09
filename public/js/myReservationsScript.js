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

// Function to render reservation cards including book and reservation details
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
      notesDiv.className = 'notes';
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
        img.src = "" + (book.coverImage ? book.coverImage : '/public/images/book-covers/default.jpeg');
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

    // Cancel Button (Only for pending & available reservations)
    if (['pending', 'available'].includes(reservation.status)) {
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.className = 'cancel-button';
      cancelButton.onclick = () => cancelReservation(reservation.id, card);
      card.appendChild(cancelButton);
    }

    // Modify Button (Only add if reservation is pending)
    if (reservation.status === 'pending') {
      const modifyButton = document.createElement('button');
      modifyButton.textContent = 'Modify';
      modifyButton.className = 'modify-button';
      modifyButton.onclick = () => modifyReservation(reservation.id, reservation.notes, card);
      card.appendChild(modifyButton);
    }

    reservationsGrid.appendChild(card);
  }
}

// Cancel Reservation Function
async function cancelReservation(reservationId, card) {
  if (!confirm('Are you sure you want to cancel this reservation?')) return;

  try {
    const response = await fetch(`/api/reservations/cancel/${reservationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      card.querySelector('.reservation-status').textContent = 'Status: canceled';
      alert('Reservation canceled successfully.');
    } else {
      const error = await response.json();
      alert('Error: ' + error.message);
    }
  } catch (error) {
    console.error('Error canceling reservation:', error);
    alert('An error occurred while canceling the reservation.');
  }
}

// Modify Reservation Function (Edit Notes)
async function modifyReservation(reservationId, currentNotes, card) {
  const newNotes = prompt('Edit your notes:', currentNotes || '');
  if (newNotes === null) return; // Cancel if user clicks "Cancel" in prompt

  try {
    const response = await fetch(`/api/reservations/modify/${reservationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: newNotes })
    });

    if (response.ok) {
      card.querySelector('.notes')?.remove();
      const notesDiv = document.createElement('div');
      notesDiv.className = 'notes';
      notesDiv.textContent = 'Notes: ' + newNotes;
      card.appendChild(notesDiv);
      alert('Notes updated successfully.');
    } else {
      const error = await response.json();
      alert('Error: ' + error.message);
    }
  } catch (error) {
    console.error('Error updating notes:', error);
    alert('An error occurred while updating the notes.');
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

// Show a modal popup that includes an input field for text; returns a Promise that resolves with the input text, or null if canceled.
function showPromptModal({ message, defaultValue = '' }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');

    // Create or select the input field inside the modal.
    let inputField = document.getElementById('modal-input');
    if (!inputField) {
      inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.id = 'modal-input';
      inputField.style.width = '100%';
      inputField.style.marginTop = '10px';
      inputField.style.padding = '8px';
      inputField.style.fontSize = '16px';
      // Insert the input field above the buttons if not already present
      const modal = document.querySelector('.modal');
      modal.insertBefore(inputField, document.querySelector('.modal-buttons'));
    }
    inputField.value = defaultValue;
    inputField.classList.remove('hidden');

    // Set the message text
    modalMessage.textContent = message;
    
    // Ensure cancel button is visible for prompt functionality
    cancelButton.classList.remove('hidden');
    
    // Display the modal
    overlay.classList.remove('hidden');

    const cleanUp = () => {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      overlay.classList.add('hidden');
      inputField.classList.add('hidden'); // hide the input field after use
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

// Cancel Reservation Function using custom modal for confirmation
async function cancelReservation(reservationId, card) {
  const confirmed = await showModal({ message: 'Are you sure you want to cancel this reservation?', showCancel: true });
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/reservations/cancel/${reservationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      // Update UI: update status text
      card.querySelector('.reservation-status').textContent = 'Status: canceled';
      await showModal({ message: 'Reservation canceled successfully!', showCancel: false });
    } else {
      const error = await response.json();
      await showModal({ message: 'Error: ' + error.message, showCancel: false });
    }
  } catch (error) {
    console.error('Error canceling reservation:', error);
    await showModal({ message: 'An error occurred while canceling the reservation.', showCancel: false });
  }
}

// Modify Reservation Function (Edit Notes) using custom prompt modal
async function modifyReservation(reservationId, currentNotes, card) {
  const newNotes = await showPromptModal({ message: 'Edit your notes:', defaultValue: currentNotes || '' });
  if (newNotes === null) return; // User canceled

  try {
    const response = await fetch(`/api/reservations/modify/${reservationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: newNotes })
    });

    if (response.ok) {
      // Update UI: if there is a notes element, update it; otherwise, add one
      let notesDiv = card.querySelector('.notes');
      if (!notesDiv) {
        notesDiv = document.createElement('div');
        notesDiv.className = 'notes';
        card.appendChild(notesDiv);
      }
      notesDiv.textContent = 'Notes: ' + newNotes;
      await showModal({ message: 'Notes updated successfully!', showCancel: false });
    } else {
      const error = await response.json();
      await showModal({ message: 'Error: ' + error.message, showCancel: false });
    }
  } catch (error) {
    console.error('Error updating notes:', error);
    await showModal({ message: 'An error occurred while updating the notes.', showCancel: false });
  }
}

// For testing purposes, you might call these functions on certain events.
// For instance, attach confirmAction() to a delete button click event.

// Fetch reservations when page loads
document.addEventListener('DOMContentLoaded', fetchUserData);
