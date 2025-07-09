// Handle file selection & upload
document.getElementById('uploadedImage').addEventListener('change', async function(e) {
  const file = this.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('_comesFrom', 'profilePicture');
  formData.append('uploadedImage', file);

  showLoading('Updating user picture…');

  try {
    const res = await fetch('/api/users/upload/profile-picture', {
      method: 'POST', body: formData
    });
    if (res.ok) {
      const { profilePicture } = await res.json();
      document.getElementById('profilePic').src = profilePicture;
      document.getElementById('profilePicInput').value = profilePicture;
    } else {
      console.error('Upload failed', await res.text());
      showModal({ message: 'Failed to upload profile picture.' });
    }
    hideLoading();
  } catch (err) {
    hideLoading();
    console.error(err);
    showModal({ message: 'Error uploading profile picture.' });
  }
});

// Save handler
document.getElementById('saveButton').addEventListener('click', async () => {
  const id = document.getElementById('id').value;
  const payload = {
    name:          document.getElementById('name').value.trim(),
    email:         document.getElementById('email').value.trim(),
    password:      document.getElementById('password').value || undefined,
    role:          document.getElementById('role').value,
    phone:         document.getElementById('phone').value.trim(),
    address:       document.getElementById('address').value.trim(),
    accountStatus: document.getElementById('accountStatus').value,
    profilePicture:document.getElementById('profilePicInput').value || undefined
  };

  // Remove undefined fields (password/profilePicture when blank)
  Object.keys(payload).forEach(k => {
    if (payload[k] === undefined) delete payload[k];
  });
  
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      window.location.href = `/admin/users/${id}`;
    } else {
      const err = await res.json();
      showModal({ message: 'Update failed: ' + err.message });
    }
  } catch (err) {
    console.error(err);
    showModal({ message: 'Error updating user.' });
  }
});

// Cancel handler
document.getElementById('cancelButton').addEventListener('click', () => {
  history.back();
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