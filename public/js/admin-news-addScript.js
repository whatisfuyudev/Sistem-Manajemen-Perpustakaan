// public/js/admin-news-addScript.js

// Redirect on Cancel
document.getElementById('cancelBtn')
  .addEventListener('click', () => {
    window.location.href = '/admin/panel?tab=news';
  });

// When an image is selected: preview + upload
document.getElementById('uploadedImage')
  .addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

    // Preview locally
    const preview = document.getElementById('previewImage');
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';

    // Upload to cdn
    const formData = new FormData();
    formData.append('_comesFrom', 'newsPicture');
    formData.append('uploadedImage', file);

    showLoading('Uploading news picture…');

    try {
      const res = await fetch('/api/news/upload/news-picture', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // store returned URL in hidden field
      document.getElementById('imageUrlInput').value = data.newsPicture;
      hideLoading();
    } catch (err) {
      hideLoading();
      console.error('Error uploading news picture:', err);
      const msg = document.getElementById('message');
      msg.textContent = 'Image upload failed.';
      msg.style.color = 'red';
    }
  });

// On Save: send the new news data
document.getElementById('saveBtn')
  .addEventListener('click', async () => {
    const form = document.getElementById('addNewsForm');
    const formData = new FormData(form);
    // convert FormData to simple object
    const data = Object.fromEntries(formData.entries());

    // body comes as string, but published needs boolean
    data.published = data.published === 'true';

    const msgDiv = document.getElementById('message');
    msgDiv.textContent = 'Saving…';
    msgDiv.style.color = 'black';

    try {
      const res = await fetch('/api/news/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        msgDiv.textContent = 'News created successfully!';
        msgDiv.style.color = 'green';
        form.reset();
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('uploadedImage').value = '';
      } else {
        const err = await res.json();
        msgDiv.textContent = 'Error: ' + (err.message || res.statusText);
        msgDiv.style.color = 'red';
      }
    } catch (err) {
      console.error('Network error:', err);
      msgDiv.textContent = 'Network error.';
      msgDiv.style.color = 'red';
    }
  });
