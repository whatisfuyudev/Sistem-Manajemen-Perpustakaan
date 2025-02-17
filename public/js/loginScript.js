document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    messageDiv.textContent = ''; // Clear previous messages

    // Gather login credentials
    const data = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value.trim()
    };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        messageDiv.textContent = 'Login successful! Token: ' + result.token;
        messageDiv.className = 'message success';
        loginForm.reset();
      } else {
        const errorText = await response.text();
        messageDiv.textContent = 'Login failed: ' + errorText;
        messageDiv.className = 'message error';
      }
    } catch (error) {
      console.error('Error during login:', error);
      messageDiv.textContent = 'An error occurred during login.';
      messageDiv.className = 'message error';
    }
  });
});