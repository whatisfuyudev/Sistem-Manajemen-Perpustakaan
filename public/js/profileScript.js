let profilePictureUrl = '';

// Tab toggle logic
const tabView = document.getElementById('tab-view');
const tabEdit = document.getElementById('tab-edit');
const viewSection = document.getElementById('view-section');
const editSection = document.getElementById('edit-section');

tabView.addEventListener('click', () => {
  tabView.classList.add('active-tab');
  tabEdit.classList.remove('active-tab');
  tabView.style.fontWeight = 'bold';
  tabEdit.style.fontWeight = 'normal';
  tabEdit.style.color = '#555';

  viewSection.style.display = '';
  editSection.style.display = 'none';
});

tabEdit.addEventListener('click', () => {
  tabEdit.classList.add('active-tab');
  tabView.classList.remove('active-tab');
  tabEdit.style.fontWeight = 'bold';
  tabView.style.fontWeight = 'normal';
  tabView.style.color = '#555';

  viewSection.style.display = 'none';
  editSection.style.display = '';
});

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
    showModal({ message: 'Please enter a valid email address.' });
    return false;
  }
  
  // Name should not be empty and allow letters and spaces
  if (!name.match(/^[A-Za-z\s]+$/)) {
    showModal({ message: 'Name can only contain letters and spaces.' });
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

  setTimeout(() => window.location.reload(), 1500);
});

document.getElementById('uploadedImage')
  .addEventListener('change', async function (e) {
  e.preventDefault();
  e.stopPropagation();

  const file = this.files[0];
  if (!file) {
    showModal({ message: 'No file selected.' });
    return;
  }

  // 1) upload picture immediately
  const formData = new FormData();
  formData.append('_comesFrom', 'profilePicture');
  formData.append('uploadedImage', file);

  try {
    const response = await fetch('/api/users/upload/profile-picture', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      showModal({ message: 'Upload failed: ' + err });
      return;
    }

    const { profilePicture: profilePictureUrl } = await response.json();

    // 2) show loading while we commit the new URL
    showLoading('Updating profile picture…');

    const updateRes = await fetch('/api/users/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profilePicture: profilePictureUrl })
    });

    hideLoading();

    if (!updateRes.ok) {
      const err = await updateRes.text();
      showModal({ message: 'Error updating profile picture: ' + err });
    } else {
      showModal({ message: 'Profile picture updated successfully!' });
    }
  } catch (error) {
    hideLoading();
    console.error(error);
    showModal({ message: 'An unexpected error occurred.' });
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


// Modal utility
function showModal({ message, showCancel = false }) {
  return new Promise(resolve => {
    const overlay = document.getElementById('modal-overlay');
    const msgEl   = document.getElementById('modal-message');
    const okBtn   = document.getElementById('modal-ok');
    const cancelBtn = document.getElementById('modal-cancel');

    msgEl.textContent = message;
    cancelBtn.classList.toggle('hidden', !showCancel);
    overlay.classList.remove('hidden');

    const clean = () => {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };

    const onOk = () => { clean(); resolve(true); };
    const onCancel = () => { clean(); resolve(false); };

    okBtn.addEventListener('click', onOk);
    if (showCancel) cancelBtn.addEventListener('click', onCancel);
  });
}

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