
document.addEventListener('DOMContentLoaded', function () {
  const renewBtn = document.getElementById('renew-button');
  const processBtn = document.getElementById('process-button');
  const editBtn    = document.getElementById('edit-button');
  const checkoutId = window.location.pathname.split('/').pop(); // assumes URL ends with checkout ID

  renewBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/api/checkouts/renew/${checkoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
          // Include Authorization token if needed
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Failed to renew');

      alert('Checkout successfully renewed!');
      location.reload();
    } catch (error) {
      alert(`Renewal failed: ${error.message}`);
    }
  });

  processBtn.addEventListener('click', () => {
    alert('Process Checkout clicked! You can wire this up later.');
    // You can implement this similarly once the processing logic is defined
  });

  editBtn.addEventListener('click', () => {
    alert('Edit clicked! You can wire this up later.');
    // e.g. open a modal or navigate to an edit page
    // window.location.href = `/admin/checkouts/edit/${checkoutId}`;
  });

  document.getElementById('back-button').addEventListener('click', () => {
    history.back();
  });
});
