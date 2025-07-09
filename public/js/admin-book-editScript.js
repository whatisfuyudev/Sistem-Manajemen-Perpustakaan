// Trigger file upload when cover image is clicked
document.getElementById('bookCoverImage').addEventListener('click', function() {
  document.getElementById('uploadedImage').click();
});

// When a new cover image is selected, upload it to the server
document.getElementById('uploadedImage').addEventListener('change', async function() {
  const file = this.files[0];
  if (file) {
    // Prepare the FormData for cover image upload
    const formData = new FormData();
    formData.append('uploadedImage', file);

    showLoading('Updating book cover…');

    try {
      const response = await fetch('/api/books/upload/cover', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        // Update image preview and hidden input value with the new cover image URL returned from the server
        document.getElementById('bookCoverImage').src = ""+data.coverImage;
        document.getElementById('coverImageInput').value = data.coverImage;
      } else {
        console.error('Error uploading cover image:', await response.text());
      }
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Error during cover image upload:', error);
    }
  }
});

// Save button functionality: gather all form data and send PUT request via fetch
document.getElementById('saveButton').addEventListener('click', async function() {
  // Construct the update payload from form elements
  const payload = {
    // ISBN is read-only and may not need to be updated
    title: document.getElementById('title').value.trim(),
    authors: document.getElementById('authors').value.split(',').map(s => s.trim()),
    genres: document.getElementById('genres').value.split(',').map(s => s.trim()),
    publisher: document.getElementById('publisher').value.trim(),
    publicationYear: document.getElementById('publicationYear').value.trim(),
    description: document.getElementById('description').value.trim(),
    totalCopies: document.getElementById('totalCopies').value.trim(),
    availableCopies: document.getElementById('availableCopies').value.trim(),
    formats: document.getElementById('formats').value.split(',').map(s => s.trim()),
    pages: document.getElementById('pages').value.trim(),
    // Include the updated coverImage from the hidden input
    coverImage: document.getElementById('coverImageInput').value
  };

  // Remove the coverImage field if it's empty
  if (!payload.coverImage) {
    delete payload.coverImage;
  }

  const isbn = document.getElementById('isbn').value.trim();
  
  try {
    const response = await fetch(`/api/books/update/${isbn}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      // Optionally, redirect to the updated book details page
      window.location.href = `/admin/books/details/${isbn}`;
    } else {
      const errorMsg = await response.text();
      showModal({ message: 'message: Failed to update book: ' + errorMsg });
    }
  } catch (error) {
    console.error('Error updating book:', error);
    showModal({ message: 'An error occurred while updating the book.' });
  }
});

// Cancel button: redirect back to the book details page
document.getElementById('cancelButton').addEventListener('click', function() {
  history.back();
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