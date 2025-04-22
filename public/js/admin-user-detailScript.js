document.addEventListener('DOMContentLoaded', function () {
  const editButton = document.getElementById('modifyBtn');
  if (editButton) {
    editButton.addEventListener('click', function () {
      const isbn = editButton.getAttribute('data-user-id');
      if (isbn) {
        window.location.href = '/admin/users/edit/' + isbn;
      }
    });
  }
});
