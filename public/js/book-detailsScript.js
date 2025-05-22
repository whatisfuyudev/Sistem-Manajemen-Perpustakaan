document.getElementById('reserveButton').addEventListener('click', async function() {
  // Retrieve the ISBN from the DOM
  const bookIsbn = document.getElementById('isbnValue').textContent.trim();

  const payload = {
      bookIsbn,
      // Optionally include notes if needed, e.g.:
      // notes: "Please reserve this book for me."
  };

  try {
      const response = await fetch('/api/reservations/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
      });
      
      if (response.ok) {
      const result = await response.json();
      await showModal({ message: "Reservation created successfully. Your queue position is: " + result.queuePosition, showCancel: false });

      } else {
      const errorText = await response.text();

      await showModal({ message: "Reservation failed: " + errorText, showCancel: false });
      }
  } catch (error) {
      console.error("Error creating reservation:", error);
      await showModal({ message: "An error occurred while creating the reservation.", showCancel: false });
  }
});

document.getElementsByClassName('back-button')[0]
  .addEventListener('click', async function() {
      history.back();
  })


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