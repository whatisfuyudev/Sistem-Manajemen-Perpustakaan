document.getElementById('cancelBtn').addEventListener('click', () => {
  window.location.href = '/admin/panel?tab=users';
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const form = document.getElementById('addUserForm');;
  const formData = new FormData(form);
  const dataObj = Object.fromEntries(formData.entries());

  try {
    
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dataObj)
    });

    const msgDiv = document.getElementById('message');
    if (res.ok) {
      msgDiv.textContent = 'User created successfully!';
      msgDiv.style.color = 'green';
      form.reset();
    } else {
      const err = await res.json();
      msgDiv.textContent = 'Error: ' + (err.message || res.statusText);
      msgDiv.style.color = 'red';
    }
  } catch (err) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = 'Network error.';
    msgDiv.style.color = 'red';
  }
});

// Once a file is selected, store its filename in the hidden input
document.getElementById('uploadedImage').addEventListener('change', async function() {
  const file = this.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('_comesFrom', 'profilePicture');
    formData.append('uploadedImage', file);

    try {
      const response = await fetch('/api/users/upload/profile-picture', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        // Update the cover image preview and hidden input value
        // You can add an <img> tag for preview if desired.
        document.getElementById('profilePictureInput').value = data.profilePicture;
      } else {
        console.error('Error uploading cover image:', await response.text());
      }
    } catch (error) {
      console.error('Error during cover image upload:', error);
    }
  }
});