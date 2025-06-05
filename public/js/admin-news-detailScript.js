document.addEventListener('DOMContentLoaded', function () {
  const editButton = document.getElementById('modifyBtn');
  if (editButton) {
    editButton.addEventListener('click', function () {
      const id = editButton.getAttribute('data-news-id');
      if (id) {
        window.location.href = '/admin/news/edit/' + id;
      }
    });
  }
});
