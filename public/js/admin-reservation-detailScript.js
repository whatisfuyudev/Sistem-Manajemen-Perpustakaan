
const cancelBtn = document.getElementById('cancelBtn');
const modifyBtn = document.getElementById('modifyBtn');

if (cancelBtn) {
  cancelBtn.addEventListener('click', async (e) => {
    // Read the reservation ID from the data attribute
    const reservationId = e.currentTarget.dataset.reservationId;
  
    // Ask for confirmation
    const confirmed = await showModal({
      message: 'Are you sure you want to cancel this reservation?',
      showCancel: true
    });
  
    // If they clicked Cancel, do nothing
    if (!confirmed) return;
  
    try {
      // Call the cancel endpoint
      const response = await fetch(`/api/reservations/cancel/${encodeURIComponent(reservationId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
  
      // Handle non‐OK responses
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Error ${response.status}`);
      }
  
      // Parse the result (the canceled reservation)
      const canceled = await response.json();
  
      // Notify the admin/librarian of success
      await showModal({
        message: `Reservation #${canceled.id} was successfully canceled.`,
        showCancel: false
      });
  
      // (Optional) refresh the page or update the UI:
      window.location.reload();
    } catch (err) {
      console.error('Cancel failed:', err);
      await showModal({
        message: `Failed to cancel: ${err.message}`,
        showCancel: false
      });
    }
  });
}
modifyBtn.addEventListener('click', async (e) => {
  // Read the reservation ID from the data attribute
  const reservationId = e.currentTarget.dataset.reservationId;

  window.location.href = `/admin/reservations/edit/${reservationId}`;
});

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