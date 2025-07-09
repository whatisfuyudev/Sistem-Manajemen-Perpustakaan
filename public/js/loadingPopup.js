function showLoading(message = 'Loading…') {
  const overlay = document.getElementById('loading-overlay');
  const msg      = document.getElementById('loading-message');
  msg.textContent = message;
  overlay.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay')
          .classList.add('hidden');
}