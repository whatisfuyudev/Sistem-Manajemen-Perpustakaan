document.addEventListener('DOMContentLoaded', function () {
  let profilePictureUrl = '';

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

    // _comesFrom is not attached to req.body  <--- problem

    console.log('form data = ',formData);
    
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
        console.error("Upload failed:", errorText);
      }
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  });

  // Update user data
  document.getElementById('updateButton').addEventListener('click', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Gather input values
    const data = {
      id: document.getElementById('id').value.trim(),
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value.trim(),
      role: document.getElementById('role').value,
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim(),
      accountStatus: document.getElementById('accountStatus').value,
      profilePicture: profilePictureUrl
    };

    // Remove empty fields
    Object.keys(data).forEach(key => {
      const value = data[key];
      if ((typeof value === 'string' && value.trim() === '') ||
          (typeof value === 'number' && isNaN(value))) {
        delete data[key];
      }
    });

    // Construct the endpoint URL using the user's id
    const userId = data.id;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        alert('User updated successfully!');
      } else {
        const errorText = await response.text();
        alert('Update failed: ' + errorText);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error updating user');
    }
  });
});