document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    const data = {
      email:    form.email.value.trim(),
      password: form.password.value.trim()
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errText = await res.text();
        messageDiv.textContent = 'Login failed: ' + errText;
        messageDiv.classList.add('error');
        return;
      }

      const { token } = await res.json();
      const { role }  = jwtDecode(token);

      messageDiv.textContent = 'Login successful! Redirecting…';
      messageDiv.classList.add('success');

      setTimeout(() => {
        if (role === 'Admin' || role === 'Librarian') {
          window.location.href = '/admin/panel/';
        } else {
          window.location.href = '/';
        }
      }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      messageDiv.textContent = 'An error occurred.';
      messageDiv.classList.add('error');
    }
  });
});

// Simple JWT decode (no validation)
function jwtDecode(token) {
  const [, payload] = token.split('.');
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decodeURIComponent(
    Array.from(json).map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  ));
}