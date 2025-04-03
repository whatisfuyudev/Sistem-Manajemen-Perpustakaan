// Handle form submission and include the new checkout duration fields
document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault(); // Prevent default form submission

  // Clear any previous messages
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';

  // Gather and validate form data
  const userId = document.getElementById('userId').value.trim();
  const bookIsbn = document.getElementById('bookIsbn').value.trim();
  const role = document.getElementById('role').value;
  const checkoutDuration = document.getElementById('checkoutDuration').value;
  const customDays = document.getElementById('customDays').value.trim();

  if (!userId || !bookIsbn) {
    messageDiv.innerHTML = `<div class="alert alert-danger">User ID and Book ISBN are required.</div>`;
    return;
  }

  // If custom duration is selected, ensure customDays is provided
  if (checkoutDuration === 'custom' && !customDays) {
    messageDiv.innerHTML = `<div class="alert alert-danger">Please enter the number of days for the custom checkout duration.</div>`;
    return;
  }

  // Build payload for the checkout process
  const payload = {
    userId,
    bookIsbn,
    role,
    checkoutDuration,
    // If custom is chosen, send the user-entered days; otherwise, send the default 14
    customDays: checkoutDuration === 'custom' ? customDays : '14'
  };

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

// Toggle the custom days input based on checkout duration selection
document.getElementById('checkoutDuration').addEventListener('change', function() {
  const customContainer = document.getElementById('customDaysContainer');
  if (this.value === 'custom') {
    customContainer.style.display = 'block';
  } else {
    customContainer.style.display = 'none';
  }
});