const cardsContainer = document.getElementById('cardsContainer');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// Function to create a book card element
function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';

  // Cover image
  const img = document.createElement('img');
  // If book.coverImage is present, use it; otherwise, use a default image.
  img.src = "/public/images/book-covers/" + (book.coverImage ? book.coverImage : 'default.jpeg');
  img.alt = book.title;
  // Set a consistent maximum height
  img.style.maxHeight = "200px";
  img.style.width = "auto";
  card.appendChild(img);

  // Book title
  const title = document.createElement('div');
  title.className = 'book-title';
  title.textContent = book.title;
  card.appendChild(title);

  // Book authors
  const authors = document.createElement('div');
  authors.className = 'book-authors';
  authors.textContent = Array.isArray(book.authors) ? book.authors.join(', ') : '';
  card.appendChild(authors);

  // View details link
  const detailsLink = document.createElement('a');
  detailsLink.href = `/books/details/${book.isbn}`;
  detailsLink.className = 'view-details';
  detailsLink.textContent = 'View Details';
  card.appendChild(detailsLink);

  return card;
}

// Function to render book cards based on an array of books
function renderBooks(books) {
  cardsContainer.innerHTML = '';
  if (books.length === 0) {
  cardsContainer.innerHTML = '<p>No books found.</p>';
  return;
  }
  books.forEach(book => {
  const card = createBookCard(book);
  cardsContainer.appendChild(card);
  });
}

// Search functionality: filter books by title (case-insensitive)
searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredBooks = sampleBooks.filter(book => book.title.toLowerCase().includes(searchTerm));
    renderBooks(filteredBooks);
});

// Optionally, add 'Enter' key functionality for search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
    searchButton.click();
    }
});