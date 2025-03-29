document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch all books from the API
    const response = await fetch('/api/books/');
    if (!response.ok) {
      throw new Error('Failed to fetch books.');
    }
    const books = await response.json();
    if (!Array.isArray(books)) {
      throw new Error('Invalid books data format.');
    }

    // Randomly select 5 books to display as featured
    const randomBooks = [];
    const usedIndices = new Set();
    const totalBooks = books.length;
    const numBooksToDisplay = Math.min(5, totalBooks);
    while (randomBooks.length < numBooksToDisplay) {
      const randomIndex = Math.floor(Math.random() * totalBooks);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        randomBooks.push(books[randomIndex]);
      }
    }

    // Render book cards
    const bookGrid = document.getElementById('bookGrid');
    randomBooks.forEach(book => {
      // Create a book card
      const card = document.createElement('div');
      card.className = 'book-card';

      // Cover image element
      const img = document.createElement('img');
      img.src = "/public/images/book-covers/" + (book.coverImage ? book.coverImage : 'default.jpeg');
      img.alt = book.title;
      img.style.maxHeight = "200px";
      img.style.width = "auto";
      card.appendChild(img);

      // Book title element
      const title = document.createElement('div');
      title.className = 'book-title';
      title.textContent = book.title;
      card.appendChild(title);

      // Book authors element
      const authors = document.createElement('div');
      authors.className = 'book-authors';
      authors.textContent = Array.isArray(book.authors) ? book.authors.join(', ') : '';
      card.appendChild(authors);

      // View Details link
      const detailsLink = document.createElement('a');
      detailsLink.href = `/books/details/${book.isbn}`;
      detailsLink.className = 'view-details';
      detailsLink.textContent = 'View Details';
      card.appendChild(detailsLink);

      // Append the card to the grid
      bookGrid.appendChild(card);
    });
  } catch (error) {
    console.error(error);
  }
});

// Search functionality: on Enter key or button click, navigate to /books/search with query param
function performSearch() {
  const query = document.getElementById('searchInput').value.trim() + "";
  
  // Navigate to the search page with the search term as a URL parameter
  window.location.href = '/books/search?title=' + encodeURIComponent(query);
  
}

// Event listener for the Enter key
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    performSearch();
  }
});

// Event listener for the Search button
document.getElementById('searchButton').addEventListener('click', (e) => {
  e.preventDefault();
  performSearch();
});