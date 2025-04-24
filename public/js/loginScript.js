document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = '';

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
        messageDiv.className = 'message error';
        return;
      }

      const { token } = await res.json();

      // Decode to inspect the role claim
      const { role } = jwtDecode(token);                        

      messageDiv.textContent = 'Login successful! Redirecting…';
      messageDiv.className = 'message success';

      // Delay just for UX; remove if you want immediate redirect
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
      messageDiv.className = 'message error';
    }
  });
});

function jwtDecode(token) {
  const [, payload] = token.split('.');
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decodeURIComponent(
    Array.from(json).map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  ));
}
