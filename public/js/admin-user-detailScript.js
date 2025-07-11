document.addEventListener('DOMContentLoaded', function () {
  const editButton = document.getElementById('modifyBtn');
  if (editButton) {
    editButton.addEventListener('click', function () {
      const userId = editButton.getAttribute('data-user-id');
      if (userId) {
        window.location.href = '/admin/users/edit/' + userId;
      }
    });
  }
});
