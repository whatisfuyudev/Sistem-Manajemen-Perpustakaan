const cardsContainer = document.getElementById('cardsContainer');
const searchTermInput = document.getElementById('searchTermInput');
const genresInput = document.getElementById('genresInput');
const authorInput = document.getElementById('authorInput');
const searchButton = document.getElementById('searchButton');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const pageIndicator = document.getElementById('pageIndicator');

let currentPage = 1;
const limit = 5;
let totalResults = 0;

// Function to create a book card element
function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'book-card';

  // Cover image
  const img = document.createElement('img');
  img.src = "/public/images/book-covers/" + (book.coverImage ? book.coverImage : 'default.jpeg');
  img.alt = book.title;
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

  // View Details link
  const detailsLink = document.createElement('a');
  detailsLink.href = `/books/details/${book.isbn}`;
  detailsLink.className = 'view-details';
  detailsLink.textContent = 'View Details';
  card.appendChild(detailsLink);

  return card;
}

// Function to render book cards
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

// Function to update pagination controls based on total results
function updatePagination() {
  const totalPages = Math.ceil(totalResults / limit);
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= totalPages;
}

// Function to fetch search results from API
async function fetchSearchResults(page = 1) {
  const searchTerm = searchTermInput.value.trim();
  const genres = genresInput.value.trim();
  const author = authorInput.value.trim();

  const params = new URLSearchParams(); 
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (genres) params.append('genres', genres);
  if (author) params.append('author', author);
  params.append('page', page);
  params.append('limit', limit);

  try {
    const response = await fetch(`/api/books/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Search request failed.');
    }
    const result = await response.json();
    totalResults = result.total;
    renderBooks(result.books);
    currentPage = result.page;
    updatePagination();
  } catch (error) {
    console.error(error);
    cardsContainer.innerHTML = '<p>Error loading search results.</p>';
  }
}

// Event listeners for search
searchButton.addEventListener('click', () => {
  currentPage = 1;
  fetchSearchResults(currentPage);
});
searchTermInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    currentPage = 1;
    fetchSearchResults(currentPage);
  }
});

// Pagination buttons events
prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchSearchResults(currentPage);
  }
});
nextButton.addEventListener('click', () => {
  const totalPages = Math.ceil(totalResults / limit);
  if (currentPage < totalPages) {
    currentPage++;
    fetchSearchResults(currentPage);
  }
});

// Optional: Initial search to load page one (or you could wait for user input)
fetchSearchResults(currentPage);