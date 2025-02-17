document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const messageDiv = document.getElementById('registerMessage');

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    messageDiv.textContent = ''; // Clear previous messages

    // Gather form data
    const data = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value.trim(),
      role: document.getElementById('role').value,
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim(),
      profilePicture: document.getElementById('profilePicture').value.trim()
    };

    // Remove empty optional fields
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && data[key] === '') {
        delete data[key];
      }
    });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        messageDiv.textContent = 'Registration successful!';
        messageDiv.className = 'message success';
        registerForm.reset();
      } else {
        const errorText = await response.text();
        messageDiv.textContent = 'Registration failed: ' + errorText;
        messageDiv.className = 'message error';
      }
    } catch (error) {
      console.error('Error during registration:', error);
      messageDiv.textContent = 'An error occurred during registration.';
      messageDiv.className = 'message error';
    }
  });
});