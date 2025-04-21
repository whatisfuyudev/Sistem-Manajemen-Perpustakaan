document.getElementById('editForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('reservationId').textContent;
  const payload = {
    userId:         parseInt(e.target.userId.value, 10),
    bookIsbn:       e.target.bookIsbn.value.trim(),
    requestDate:    e.target.requestDate.value,
    status:         e.target.status.value,
    expirationDate: e.target.expirationDate.value || null,
    notes:          e.target.notes.value || null
  };
  try {
    const res = await fetch(`/api/reservations/admin/edit/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
      await showModal({ message: 'Reservation updated successfully' });
    window.location.href = `/admin/reservations/${id}`;
  } catch (err) {
    await showModal({ message: 'Update failed: ' + err.message });
  }
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