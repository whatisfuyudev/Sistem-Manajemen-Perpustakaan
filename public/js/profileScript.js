// Function to fetch user data on page load
async function fetchUserData() {
  try {
    const response = await fetch(`/api/users/single`);
    if (response.ok) {
      const userData = await response.json();
      // Pre-fill form fields with the fetched user data
      document.getElementById('name').value = userData.name || '';
      document.getElementById('email').value = userData.email || '';
      // Password field is left empty for security reasons
      document.getElementById('phone').value = userData.phone || '';
      document.getElementById('address').value = userData.address || '';
      document.getElementById('profilePicture').value = userData.profilePicture || '';
      
      // Update header display
      document.getElementById('userNameDisplay').textContent = userData.name || 'User Name';
      if (userData.profilePicture) {
        document.getElementById('profilePicDisplay').src = userData.profilePicture;
      }
    } else {
      console.error('Failed to fetch user data.');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

// Basic client-side validations and form submission handling
document.getElementById('profileForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const messageDiv = document.getElementById('profileMessage');
  messageDiv.textContent = '';
  
  // Gather field values
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const profilePicture = document.getElementById('profilePicture').value.trim();
  
  // Simple regex for email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('Please enter a valid email address.');
    return false;
  }
  
  // Name should not be empty and allow letters and spaces
  if (!name.match(/^[A-Za-z\s]+$/)) {
    alert('Name can only contain letters and spaces.');
    return false;
  }
  
  // Create an object to send (simulate form submission)
  const formData = {
    name,
    email,
    // Only include password if entered (if blank, we assume no change)
    ...(password && { password }),
    phone,
    address,
    profilePicture
  };
  
  // For demonstration, we'll log the data and display a success message
  console.log('Form data to submit:', formData);
  
  // Here you can send the data using fetch() if needed:

  fetch('/api/users/update', {
    method: 'PUT', // or PUT depending on your API
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    // refresh page and modify every field to match new data


    messageDiv.textContent = 'Profile updated successfully!';
    messageDiv.className = 'message success';
  })
  .catch(error => {
    console.error('Error:', error);
    messageDiv.textContent = 'Error updating profile.';
    messageDiv.className = 'message error';
  });
  
  
  // For now, show a success message directly:
  messageDiv.textContent = 'Profile updated successfully!';
  messageDiv.className = 'message success';
  
  // Optionally update the header display
  document.getElementById('userNameDisplay').textContent = name;
  if (profilePicture) {
    document.getElementById('profilePicDisplay').src = profilePicture;
  }
});

document.addEventListener('DOMContentLoaded', fetchUserData);