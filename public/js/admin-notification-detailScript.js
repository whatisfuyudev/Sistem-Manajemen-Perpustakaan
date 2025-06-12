// Select the “Edit” button
const editBtn = document.getElementById('modifyBtn');
// Select the “Mark as Read/Unread” button
const toggleReadBtn = document.getElementById('toggleReadBtn');


// Listen for clicks
editBtn.addEventListener('click', function () {
  // Read the data-notification-id attribute (via dataset) :contentReference[oaicite:0]{index=0}
  const notificationId = this.dataset.notificationId;

  // Navigate to the edit page by updating window.location.href :contentReference[oaicite:1]{index=1}
  window.location.href = `/admin/notifications/edit/${notificationId}`;
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