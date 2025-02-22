document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent default form submission

  // Clear any previous messages
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';

  // Gather and validate form data
  const userId = document.getElementById('userId').value.trim();
  const bookIsbn = document.getElementById('bookIsbn').value.trim();
  const role = document.getElementById('role').value;
  
  if (!userId || !bookIsbn) {
    messageDiv.innerHTML = '<div class="alert alert-danger">User ID and Book ISBN are required.</div>';
    return;
  }

  // Build payload for the checkout process
  const payload = { userId, bookIsbn, role };

  try {
    const response = await fetch('/api/checkouts/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const checkout = await response.json();
      const dueDate = new Date(checkout.dueDate).toLocaleDateString();
      messageDiv.innerHTML = `<div class="alert alert-success">Checkout successful! Book due on ${dueDate}.</div>`;
    } else {
      const errorText = await response.text();
      messageDiv.innerHTML = `<div class="alert alert-danger">Checkout failed: ${errorText}</div>`;
    }
  } catch (error) {
    console.error('Error during checkout:', error);
    messageDiv.innerHTML = `<div class="alert alert-danger">Error processing checkout.</div>`;
  }
});