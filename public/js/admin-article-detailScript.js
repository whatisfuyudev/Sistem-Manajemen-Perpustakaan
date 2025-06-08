// Ensure this file is referenced *only* via <script src="…"></script>
// and contains no inline HTML

document.addEventListener('DOMContentLoaded', () => {
  // 1) Initialize Quill in read‑only mode
  const quill = new Quill('#editor', {
    theme: 'snow',
    readOnly: true,
    modules: { toolbar: false }
  });

  // 2) Grab the JSON delta from the data attribute
  const editorEl = document.getElementById('editor');
  const raw      = editorEl.getAttribute('data-body') || '[]';
  let delta;
  try {
    delta = JSON.parse(JSON.parse(raw));
  } catch (e) {
    console.error('Failed to parse article.body delta:', e);
    delta = [];
  }

  // 3) Render it
  quill.setContents(delta);

  const editButton = document.getElementById('modifyBtn');
  if (editButton) {
    editButton.addEventListener('click', function () {
      const id = editButton.getAttribute('data-article-id');
      if (id) {
        window.location.href = '/admin/articles/edit/' + id;
      }
    });
  }
});
