// 1) Initialize the main editor
const quill = new Quill('#editor', {
  modules: { toolbar: '#toolbar' },
  placeholder: 'Compose your article here…',
  theme: 'snow'
});

// 2) Initialize a read-only Quill for preview
const previewQuill = new Quill('#preview', {
  modules: { toolbar: false },
  theme: 'snow',
  readOnly: true
});

// 3) Save button handler
document.getElementById('saveBtn').addEventListener('click', () => {
  // Get the Delta from the editor
  const delta = quill.getContents();
  console.log('Saved Delta:', delta);

  // Render it into the preview
  previewQuill.setContents(delta);
});