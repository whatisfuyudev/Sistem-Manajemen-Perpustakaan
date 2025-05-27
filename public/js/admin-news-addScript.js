// public/js/admin-news-addScript.js

// Redirect on Cancel
document.getElementById('cancelBtn')
  .addEventListener('click', () => {
    window.location.href = '/admin/panel?tab=news';
  });

// Helper to read the JWT cookie
function getAuthToken() {
  return document.cookie
    .split('; ')
    .find(r => r.startsWith('jwt_token='))
    ?.split('=')[1] || '';
}

// When an image is selected: preview + upload
document.getElementById('uploadedImage')
  .addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

    // Preview locally
    const preview = document.getElementById('previewImage');
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';

    // Upload to server
    const formData = new FormData();
    formData.append('_comesFrom', 'newsPicture');
    formData.append('uploadedImage', file);

    try {
      const res = await fetch('/api/news/upload/news-picture', {
        method: 'POST',
        headers: {
          // send your JWT in cookie header
          'Cookie': `jwt_token=${getAuthToken()}`
        },
        body: formData
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // store returned URL in hidden field
      console.log(data);
      document.getElementById('imageUrlInput').value = data.newsPicture;
    } catch (err) {
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
          'Accept': 'application/json',
          'Cookie': `jwt_token=${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        msgDiv.textContent = 'News created successfully!';
        msgDiv.style.color = 'green';
        form.reset();
        document.getElementById('previewImage').style.display = 'none';
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
