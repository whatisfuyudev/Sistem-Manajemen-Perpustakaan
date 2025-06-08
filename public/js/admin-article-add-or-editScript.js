/* ===== admin-article-add-or-editScript.js ===== */

// initialize Quill
const quill = new Quill('#editor', {
  modules: { toolbar: '#toolbar' },
  placeholder: 'Compose your article here…',
  theme: 'snow'
});

// If there's an existing value in #bodyInput, load it:
const bodyInput = document.getElementById('bodyInput');
if (bodyInput && bodyInput.value) {
  try {
    // parse the stored JSON delta
    const delta = JSON.parse(JSON.parse(bodyInput.value));
    quill.setContents(delta);
  } catch (err) {
    console.error('Failed to parse saved Delta:', err);
  }
}

// determine whether we're on "edit" vs "add" by inspecting the path
const path        = window.location.pathname; 
const editMatch   = path.match(/^\/admin\/articles\/edit\/(\d+)$/);
const cancelHref  = editMatch
  ? `/admin/articles/${editMatch[1]}`
  : '/admin/panel?tab=articles';

// Redirect on Cancel
document.getElementById('cancelBtn').addEventListener('click', () => {
  window.location.href = cancelHref;
});

// Cover upload & preview
document.getElementById('uploadedImage').addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;

  // Preview locally
  const preview = document.getElementById('previewCover');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';

  // Upload to server
  const formData = new FormData();
  formData.append('_comesFrom', 'articleCovers');
  formData.append('uploadedImage', file);

  try {
    const res = await fetch('/api/articles/upload/articles-picture', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    const { articlesPicture } = await res.json();
    document.getElementById('coverImageInput').value = articlesPicture;
  } catch (err) {
    console.error(err);
    const msg = document.getElementById('message');
    msg.textContent = 'Cover upload failed.';
    msg.style.color = 'red';
  }
});

// On Save (create or update)
document.getElementById('saveBtn').addEventListener('click', async () => {
  // 1) Grab Quill Delta and stringify it
  const delta = quill.getContents();
  document.getElementById('bodyInput').value = JSON.stringify(delta);

  // 2) Grab readingTime from its input
  const rtVal = document.getElementById('readingTime').value;
  if (rtVal) {
    document.getElementById('readingTimeInput').value = parseInt(rtVal, 10);
  }

  // 3) Collect form data
  const form = document.getElementById('addArticleForm');
  const data = Object.fromEntries(new FormData(form).entries());

  // 4) Convert types
  data.published   = data.published === 'true';
  if (!data.readingTime) delete data.readingTime;

  const msg = document.getElementById('message');
  msg.textContent = 'Saving…';
  msg.style.color = 'black';

  // 5) Choose endpoint
  let isEdit = false;
  let apiUrl;
  let httpMethod;

  if (editMatch) {
    // We’re on the “edit” page
    const articleId = editMatch[1];
    isEdit    = true;
    apiUrl     = `/api/articles/edit/${articleId}`;
    httpMethod = 'PUT';
  } else {
    // We’re on the “add” page
    apiUrl     = '/api/articles/create';
    httpMethod = 'POST';
  }

  // 6) Send JSON
  try {
    const res = await fetch(apiUrl, {
      method: httpMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || res.statusText);
    }
    

    msg.textContent = isEdit
      ? 'Article updated successfully!'
      : 'Article created successfully!';
    msg.style.color = 'green';
    if (!isEdit) {
      form.reset();
      quill.setContents([]);   // clear editor
      document.getElementById('previewCover').style.display = 'none';
      document.getElementById('uploadedImage').value = '';
    } else {
      const articleId = editMatch[1];
      window.location.href = `/admin/articles/${articleId}`;
    }
  } catch (err) {
    console.error(err);
    msg.textContent = 'Error: ' + err.message;
    msg.style.color = 'red';
  }
});