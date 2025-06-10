// Handle form submission
document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const msg = document.getElementById('message');
  msg.innerHTML = '';

  const userId   = document.getElementById('userId').value.trim();
  const bookIsbn = document.getElementById('bookIsbn').value.trim();
  const duration = document.getElementById('checkoutDuration').value;
  const custom   = document.getElementById('customDays').value.trim();

  if (!userId || !bookIsbn) {
    msg.innerHTML = `<div class="alert alert-danger">User ID and Book ISBN are required.</div>`;
    return;
  }
  if (duration === 'custom' && !custom) {
    msg.innerHTML = `<div class="alert alert-danger">Please enter custom days.</div>`;
    return;
  }

  const payload = {
    userId,
    bookIsbn,
    customDays: duration === 'custom' ? custom : ''
  };

  try {
    const res = await fetch('/api/checkouts/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      const due  = new Date(data.dueDate).toLocaleDateString();
      msg.innerHTML = `<div class="alert alert-success">Checkout successful! Due on ${due}.</div>`;

      // reset the form
      document.getElementById('checkoutForm').reset();

    } else {
      const err = await res.text();
      msg.innerHTML = `<div class="alert alert-danger">Failed: ${err}</div>`;
    }
  } catch (err) {
    console.error(err);
    msg.innerHTML = `<div class="alert alert-danger">Error processing checkout.</div>`;
  }
});

// Toggle custom days input
document.getElementById('checkoutDuration').addEventListener('change', function() {
  document.getElementById('customDaysContainer')
    .style.display = this.value === 'custom' ? 'block' : 'none';
});