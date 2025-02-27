document.getElementById('reservationForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const messageDiv = document.getElementById('message');
  messageDiv.textContent = '';

  // Gather and sanitize form data
  const userId = document.getElementById('userId').value.trim();
  const bookIsbn = document.getElementById('bookIsbn').value.trim();
  const notes = document.getElementById('notes').value.trim();

  if (!userId || !bookIsbn) {
    messageDiv.textContent = 'User ID and Book ISBN are required.';
    return;
  }

  // Build the payload object
  const payload = { userId, bookIsbn, notes };

  try {
    const response = await fetch('/api/reservations/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const reservation = await response.json();
      messageDiv.textContent = 'Reservation created successfully! Your position in the queue is ' + reservation.queuePosition;
      messageDiv.style.color = 'green';
    } else {
      const errorText = await response.text();
      messageDiv.textContent = 'Reservation failed: ' + errorText;
      messageDiv.style.color = 'red';
    }
  } catch (error) {
    console.error('Error:', error);
    messageDiv.textContent = 'Error processing reservation.';
    messageDiv.style.color = 'red';
  }
});