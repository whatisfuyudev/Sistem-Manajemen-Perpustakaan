document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('renewForm');
  const messageDiv = document.getElementById('message');
  const renewalOption = document.getElementById('renewalOption');
  const customDaysDiv = document.getElementById('customDaysDiv');

  // Show or hide the custom days input based on the renewal option selected
  renewalOption.addEventListener('change', function() {
    if (this.value === 'custom') {
      customDaysDiv.classList.remove('hidden');
    } else {
      customDaysDiv.classList.add('hidden');
    }
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    messageDiv.textContent = '';

    const checkoutId = document.getElementById('checkoutId').value.trim();
    const renewalOptionValue = document.getElementById('renewalOption').value;
    const customDays = document.getElementById('customDays').value.trim();

    if (!checkoutId) {
      messageDiv.textContent = 'Please enter a valid Checkout ID.';
      messageDiv.className = 'message error';
      return;
    }

    // Prepare the payload for renewal
    const payload = {
      renewalOption: renewalOptionValue
    };

    if (renewalOptionValue === 'custom') {
      if (!customDays || isNaN(customDays) || Number(customDays) <= 0) {
        messageDiv.textContent = 'Please enter a valid number of custom renewal days.';
        messageDiv.className = 'message error';
        return;
      }
      payload.customDays = Number(customDays);
    }

    try {
      const response = await fetch(`/api/checkouts/renew/${checkoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        // Assuming result includes the updated dueDate and renewalCount
        const dueDate = new Date(result.dueDate).toLocaleDateString();
        messageDiv.textContent = `Checkout renewed successfully! New Due Date: ${dueDate}, Renewal Count: ${result.renewalCount}.`;
        messageDiv.className = 'message success';
      } else {
        const errorText = await response.text();
        messageDiv.textContent = `Renewal failed: ${errorText}`;
        messageDiv.className = 'message error';
      }
    } catch (error) {
      console.error('Error renewing checkout:', error);
      messageDiv.textContent = 'An error occurred during renewal.';
      messageDiv.className = 'message error';
    }
  });
});