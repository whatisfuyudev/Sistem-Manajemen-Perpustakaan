document.getElementById('cancelForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent default form submission
  
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';
  
  // Gather and validate form data
  const reservationId = document.getElementById('reservationId').value.trim();
  
  if (!reservationId) {
    messageDiv.innerHTML = '<div class="alert alert-danger">Reservation ID is required.</div>';
    return;
  }
  
  try {
    // Make a PUT request to the cancellation endpoint (adjust the URL as needed)
    const response = await fetch(`/api/reservations/cancel/${reservationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Additional data can be added here if needed
    });
    
    if (response.ok) {
      const result = await response.json();
      messageDiv.innerHTML = `<div class="alert alert-success">Reservation ${result.id} canceled successfully. New status: ${result.status}.</div>`;
    } else {
      const errorText = await response.text();
      messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${errorText}</div>`;
    }
  } catch (error) {
    console.error('Error canceling reservation:', error);
    messageDiv.innerHTML = '<div class="alert alert-danger">An error occurred while canceling the reservation.</div>';
  }
});