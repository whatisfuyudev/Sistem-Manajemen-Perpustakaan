// Handle file selection & upload
document.getElementById('uploadedImage').addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;

  // Preview locally
  const preview = document.getElementById('newsPic');
  preview.src = URL.createObjectURL(file);

  // Upload to server
  const formData = new FormData();
  formData.append('_comesFrom', 'newsPicture');
  formData.append('uploadedImage', file);

  try {
    const res = await fetch('/api/news/upload/news-picture', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const { newsPicture } = await res.json();
    document.getElementById('newsPicInput').value = newsPicture;
  } catch (err) {
    console.error('Upload failed:', err);
    showModal({ message: 'Failed to upload news image.' });
  }
});

// Save handler
document.getElementById('saveButton').addEventListener('click', async () => {
  const id = document.getElementById('id').value;
  const payload = {
    title:     document.getElementById('title').value.trim(),
    body:      document.getElementById('body').value.trim(),
    published: document.getElementById('published').value === 'true',
    imageUrl:  document.getElementById('newsPicInput').value || undefined
  };
  
  // Remove empty fields
  Object.keys(payload).forEach(k => {
    if (payload[k] == null || payload[k] === '') delete payload[k];
  });

  try {
    const res = await fetch(`/api/news/edit/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      window.location.href = `/admin/news/${id}`;
    } else {
      const err = await res.json();
      showModal({ message: 'Update failed: ' + (err.message || res.statusText) });
    }
  } catch (err) {
    console.error('Error updating news:', err);
    showModal({ message: 'Error updating news.' });
  }
});

// Cancel handler
document.getElementById('cancelButton').addEventListener('click', () => {
  window.history.back();
});

// Modal utility
function showModal({ message, showCancel = false }) {
  return new Promise(resolve => {
    const overlay   = document.getElementById('modal-overlay');
    const msgEl     = document.getElementById('modal-message');
    const okBtn     = document.getElementById('modal-ok');
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