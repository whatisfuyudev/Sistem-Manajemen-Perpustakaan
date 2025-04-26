// Trigger file upload when cover image is clicked (you may add an image preview if desired)
document.getElementById('uploadedImage').addEventListener('change', async function() {
  const file = this.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('uploadedImage', file);

    try {
      const response = await fetch('/api/books/upload/cover', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        // Update the cover image preview and hidden input value
        // You can add an <img> tag for preview if desired.
        document.getElementById('coverImageInput').value = data.coverImage;
      } else {
        console.error('Error uploading cover image:', await response.text());
      }
    } catch (error) {
      console.error('Error during cover image upload:', error);
    }
  }
});

// Save button functionality: gather form data and send a POST request to create new book
document.getElementById('saveButton').addEventListener('click', async () => {
  const form = document.getElementById('addBookForm');
  // 1) Build FormData
  const formData = new FormData(form);
  // 2) Convert to plain object
  const dataObj = Object.fromEntries(formData.entries());
  // 3) Send JSON
  try {
    const res = await fetch('http://localhost:5000/api/books/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dataObj)
    });
    if (res.ok) {
      window.location.href = '/admin/panel';
    } else {
      const err = await res.text();
      showModal({ message: 'Error creating book: ' + err });
    }
  } catch (error) {
    console.error('Error creating book:', error);
    showModal({ message: 'An error occurred while creating the book.' });
  }
});

// Cancel button: navigate back to books list
document.getElementById('cancelButton').addEventListener('click', function() {
  window.location.href = '/admin/panel';
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