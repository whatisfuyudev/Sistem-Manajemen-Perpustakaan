document.addEventListener('DOMContentLoaded', function () {
  let coverImageUrl = '';

  document.getElementById('submitBtnCoverImg').addEventListener('click', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const file = document.getElementById('coverImage').files[0];
    if (!file) {
      alert("No file selected");
      return;
    }

    // Create a FormData object and append the file
    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      const response = await fetch('/api/books/upload/cover', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const path = result.coverImage;
        coverImageUrl = path;
        alert('New cover image uploaded');
      } else {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
      }
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  });

  document.getElementById('updateButton').addEventListener('click', async function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Manually get input values
    const data = {
      isbn: document.getElementById('isbn').value.trim(),
      title: document.getElementById('title').value.trim(),
      authors: document.getElementById('authors').value.split(',').map(s => s.trim()),
      genres: document.getElementById('genres').value.split(',').map(s => s.trim()),
      publisher: document.getElementById('publisher').value.trim(),
      publicationYear: document.getElementById('publicationYear').value.trim(),
      description: document.getElementById('description').value.trim(),
      coverImage: coverImageUrl,
      totalCopies: parseInt(document.getElementById('totalCopies').value, 10),
      availableCopies: parseInt(document.getElementById('availableCopies').value, 10),
      formats: document.getElementById('formats').value.split(',').map(s => s.trim()),
    };

    Object.keys(data).forEach(key => {
      const value = data[key];
      // Check for empty string, empty array, or NaN (for numbers)
      if (
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0) ||
        (Array.isArray(value) && value.length === 1 && value[0] === "") ||
        (typeof value === 'number' && isNaN(value))
      ) {
        delete data[key];
      }
    });    

    try {
      const response = await fetch(`/api/books/update/${data.isbn}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('Book updated successfully!');
      } else {
        const errorText = await response.text();
        alert('Update failed: ' + errorText);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error updating book');
    }
  });
});
