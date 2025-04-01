let profilePictureUrl = '';

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
  const profilePicture = profilePictureUrl; // updated via upload
  
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


  // Remove the profilePicture field if it's an empty string
  if (typeof formData.profilePicture === 'string' && formData.profilePicture.trim() === '') {
    delete formData.profilePicture;
  }

  // Send the data using fetch()
  fetch('/api/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    messageDiv.textContent = 'Profile updated successfully!';
    messageDiv.className = 'message success';
  })
  .catch(error => {
    console.error('Error:', error);
    messageDiv.textContent = 'Error updating profile.';
    messageDiv.className = 'message error';
  });
  
  // Optionally update the header display
  document.getElementById('userNameDisplay').textContent = name;
  if (profilePicture) {
    document.getElementById('profilePicDisplay').src = profilePicture;
  }
});

// Upload profile picture
document.getElementById('submitBtnProfilePic').addEventListener('click', async function (e) {
  e.preventDefault();
  e.stopPropagation();

  const file = document.getElementById('uploadedImage').files[0];
  if (!file) {
    alert("No file selected");
    return;
  }

  const formData = new FormData();
  formData.append('_comesFrom', 'profilePicture');
  formData.append('uploadedImage', file);
  
  try {
    const response = await fetch('/api/users/upload/profile-picture', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      // Assume the JSON response has a property 'profilePicture'
      profilePictureUrl = result.profilePicture;
      alert('Profile picture uploaded successfully!');
    } else {
      const errorText = await response.text();
      alert("Upload failed: " + errorText);
    }
  } catch (error) {
    console.error("Error during file upload:", error);
  }
});

// Logout button functionality
document.getElementById('logoutButton').addEventListener('click', async function() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    if (response.ok) {
      window.location.href = '/auth/login';
    } else {
      console.error('Logout failed.');
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
});

// Back button functionality
document.getElementById('backButton').addEventListener('click', () => {
  history.back();
});
