document.addEventListener('DOMContentLoaded', () => {
  const form   = document.getElementById('editForm');
  const saveBtn = document.getElementById('saveButton');

  form.addEventListener('submit', async event => {
    event.preventDefault();

    // read the checkout ID from the hidden input
    const checkoutId = document
      .getElementById('checkoutIdField')
      .value;

    const updates = {
      userId:               parseInt(form.userId.value, 10),
      bookIsbn:             form.bookIsbn.value.trim(),
      checkoutDate:         form.checkoutDate.value,
      dueDate:              form.dueDate.value,
      returnDate:           form.returnDate.value || null,
      status:               form.status.value,
      renewalCount:         parseInt(form.renewalCount.value, 10),
      fine:                 parseFloat(form.fine.value) || 0,
      renewalRequested:     form.renewalRequested.value === 'true',
      requestedRenewalDays: form.requestedRenewalDays.value
                            ? parseInt(form.requestedRenewalDays.value, 10)
                            : null
    };

    saveBtn.disabled = true;

    try {
      const response = await fetch(
        `/api/checkouts/admin/checkout/edit/${checkoutId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Update failed');
      }

      window.location.href = `/admin/checkout/detail/${checkoutId}`;
    } catch (err) {
      await showModal({ message: `Error: ${err.message}` });
      saveBtn.disabled = false;
    }
  });
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