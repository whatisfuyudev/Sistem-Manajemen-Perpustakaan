document.getElementById('modifyForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent the default form submission
  
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';
  
  // Gather form data
  const reservationId = document.getElementById('reservationId').value.trim();
  const notes = document.getElementById('notes').value.trim();
  
  if (!reservationId) {
    messageDiv.innerHTML = '<div class="alert alert-danger">Reservation ID is required.</div>';
    return;
  }
  
  // Build payload for modification
  const payload = { notes };
  
  try {
    const response = await fetch(`/api/reservations/modify/${reservationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      messageDiv.innerHTML = `<div class="alert alert-success">Reservation updated successfully. New Notes: ${result.notes || 'None'}</div>`;
    } else {
      const errorText = await response.text();
      messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${errorText}</div>`;
    }
  } catch (error) {
    console.error('Error modifying reservation:', error);
    messageDiv.innerHTML = '<div class="alert alert-danger">An error occurred while modifying the reservation.</div>';
  }
});