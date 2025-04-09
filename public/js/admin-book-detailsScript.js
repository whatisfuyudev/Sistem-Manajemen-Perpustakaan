document.addEventListener('DOMContentLoaded', function () {
  const editButton = document.getElementById('editButton');
  if (editButton) {
    editButton.addEventListener('click', function () {
      const isbn = editButton.getAttribute('data-isbn');
      if (isbn) {
        window.location.href = '/books/admin/edit/' + isbn;
      }
    });
  }


});
