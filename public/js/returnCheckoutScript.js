const returnStatusSelect = document.getElementById('returnStatus');
const customFineGroup = document.getElementById('customFineGroup');

// Toggle custom fine input when condition is 'damaged' or 'lost'
returnStatusSelect.addEventListener('change', () => {
  const value = returnStatusSelect.value;
  if (value === 'damaged' || value === 'lost') {
    customFineGroup.style.display = 'block';
  } else {
    customFineGroup.style.display = 'none';
  }
});

document.getElementById('returnForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = '';

  // Gather form data
  const checkoutId = document.getElementById('checkoutId').value.trim();
  const returnDate = document.getElementById('returnDate').value.trim();
  const returnStatus = document.getElementById('returnStatus').value;
  const customFineInput = document.getElementById('customFine').value.trim();
  
  if (!checkoutId) {
    messageDiv.innerHTML = '<div class="alert alert-danger">Checkout ID is required.</div>';
    return;
  }

  // If condition is lost or damaged, validate custom fine if provided
  let customFine;
  if (returnStatus === 'lost' || returnStatus === 'damaged') {
    if (customFineInput !== '') {
      customFine = parseFloat(customFineInput);
      if (isNaN(customFine) || customFine < 1 || customFine > 1000000) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Custom fine must be between $1 and $1,000,000.</div>';
        return;
      }
    }
  }

  // Build payload for the return process
  const payload = { checkoutId, returnStatus };
  if (returnDate) {
    payload.returnDate = returnDate;
  }
  if (customFine !== undefined) {
    payload.customFine = customFine;
  }
  
  try {
    const response = await fetch('/api/checkouts/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      const returnedDate = new Date(result.returnDate).toLocaleDateString();
      const messageText = `Return processed successfully! Status: ${result.status}. Fine: $${result.fine || '0.00'}. Returned on: ${returnedDate}.`;
      messageDiv.innerHTML = `<div class="alert alert-success">${messageText}</div>`;
    } else {
      const errorText = await response.text();
      messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${errorText}</div>`;
    }
  } catch (error) {
    console.error('Error processing return:', error);
    messageDiv.innerHTML = '<div class="alert alert-danger">An error occurred while processing the return.</div>';
  }
});