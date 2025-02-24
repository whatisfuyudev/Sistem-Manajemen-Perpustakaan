document.getElementById('returnForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent default form submission
  
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';
  
  // Gather and validate form data
  const checkoutId = document.getElementById('checkoutId').value.trim();
  const returnDate = document.getElementById('returnDate').value.trim();
  
  if (!checkoutId) {
    messageDiv.innerHTML = '<div class="alert alert-danger">Checkout ID is required.</div>';
    return;
  }
  
  // Build payload for the return process
  const payload = { checkoutId };
  if (returnDate) {
    payload.returnDate = returnDate;
  }
  
  try {
    const response = await fetch('/api/checkouts/return', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      const returnedDate = new Date(result.returnDate).toLocaleDateString();
      messageDiv.innerHTML = `<div class="alert alert-success">Return processed successfully! Fine: $${result.fine || '0.00'}. Returned on: ${returnedDate}.</div>`;
    } else {
      const errorText = await response.text();
      messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${errorText}</div>`;
    }
  } catch (error) {
    console.error('Error processing return:', error);
    messageDiv.innerHTML = '<div class="alert alert-danger">An error occurred while processing the return.</div>';
  }
});