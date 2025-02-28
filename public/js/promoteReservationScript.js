document.getElementById('promoteForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent default form submission
  
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';
  
  // Gather form data
  const bookIsbn = document.getElementById('bookIsbn').value.trim();
  
  if (!bookIsbn) {
    messageDiv.innerHTML = '<div class="alert alert-danger">Book ISBN is required.</div>';
    return;
  }
  
  try {
    // Send PUT request to promote the next pending reservation for the given book ISBN
    const response = await fetch(`/api/reservations/promote/${bookIsbn}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
        // If authentication is required, include an Authorization header here
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      // Format expiration date for display
      const expDate = new Date(result.expirationDate).toLocaleDateString();
      const messageText = `Reservation ${result.id} promoted to available status.<br>
                            New expiration: ${expDate}.`;
      messageDiv.innerHTML = `<div class="alert alert-success">${messageText}</div>`;
    } else {
      const errorText = await response.text();
      messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${errorText}</div>`;
    }
  } catch (error) {
    console.error('Error promoting reservation:', error);
    messageDiv.innerHTML = '<div class="alert alert-danger">An error occurred while promoting the reservation.</div>';
  }
});