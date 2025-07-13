document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const messageDiv   = document.getElementById('registerMessage');

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    const data = {
      name:     registerForm.name.value.trim(),
      email:    registerForm.email.value.trim(),
      password: registerForm.password.value.trim()
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        messageDiv.textContent = 'Registration successful! Redirecting to login…';
        messageDiv.classList.add('success');
        registerForm.reset();
      
        window.location.href = '/auth/login';
      
      } else {
        const errorText = await response.text();
        messageDiv.textContent = 'Registration failed: ' + errorText;
        messageDiv.classList.add('error');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      messageDiv.textContent = 'An error occurred during registration.';
      messageDiv.classList.add('error');
    }
  });
});