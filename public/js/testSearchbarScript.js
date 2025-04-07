// Toggle advanced search options
const toggleBtn = document.getElementById('toggleAdvanced');
const advancedSearchDiv = document.getElementById('advancedSearch');
toggleBtn.addEventListener('click', () => {
  if (advancedSearchDiv.style.display === 'flex') {
    advancedSearchDiv.style.display = 'none';
    toggleBtn.textContent = 'Show Advanced Search Options';
  } else {
    advancedSearchDiv.style.display = 'flex';
    toggleBtn.textContent = 'Hide Advanced Search Options';
  }
});

// Handle the search form submission
document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  // Get basic search term (assumed to search title)
  const basicSearch = document.getElementById('basicSearch').value.trim();
  const isbn = document.getElementById('searchIsbn').value.trim();
  const authors = document.getElementById('searchAuthors').value.trim();
  const genres = document.getElementById('searchGenres').value.trim();
  
  // Build search filters object. If basicSearch is provided, use it as title search.
  const filters = {};
  if (basicSearch) filters.searchTerm = basicSearch;
  if (isbn) filters.isbn = isbn;
  if (authors) filters.author = authors;  // your API expects a query parameter "author"
  if (genres) filters.genres = genres;     // your API expects a query parameter "genres"
  
  // Optionally, add pagination params here if needed:
  filters.page = 1;
  filters.limit = 10;
  
  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch('/api/books/search?' + queryString);
    if (!response.ok) throw new Error('Search request failed.');
    const result = await response.json();
    renderResults(result);
  } catch (error) {
    console.error(error);
    document.getElementById('resultsContainer').innerHTML = '<p>Error occurred during search.</p>';
  }
});

// Function to render search results
function renderResults(data) {
  const container = document.getElementById('resultsContainer');
  if (!data.books || data.books.length === 0) {
    container.innerHTML = '<p>No books found.</p>';
    return;
  }
  
  let html = '<div class="card-grid">';
  data.books.forEach(book => {
    html += `
      <div class="card">
        <img src="/public/images/book-covers/${book.coverImage || 'default.jpeg'}" alt="${book.title}" />
        <h3>${book.title}</h3>
        <p>ISBN: ${book.isbn}</p>
        <p>Authors: ${Array.isArray(book.authors) ? book.authors.join(', ') : ''}</p>
        <p>Genres: ${Array.isArray(book.genres) ? book.genres.join(', ') : ''}</p>
      </div>
    `;
  });
  html += '</div>';
  // Optionally add pagination details here if your API returns total counts.
  container.innerHTML = html;
}


// <!-- line --------------------------------------------------------------------------------- -->


// document.getElementById('searchBtn').addEventListener('click', async () => {
//   const criteria = document.getElementById('searchCriteria').value;
//   const query = document.getElementById('searchQuery').value.trim();
  
//   // Build search parameters based on selected criteria
//   const filters = {};
//   if (criteria === 'title') {
//     filters.searchTerm = query;
//   } else if (criteria === 'isbn') {
//     filters.isbn = query;
//   } else if (criteria === 'authors') {
//     filters.author = query;
//   } else if (criteria === 'genres') {
//     filters.genres = query;
//   }
//   // Optional: add pagination parameters if needed
//   filters.page = 1;
//   filters.limit = 10;
  
//   // Build query string
//   const qs = new URLSearchParams(filters).toString();
  
//   // Replace with your API endpoint URL (for example, '/api/books/search')
//   const apiUrl = '/api/books/search?' + qs;
  
//   try {
//     const response = await fetch(apiUrl);
//     if (!response.ok) throw new Error('Search request failed.');
//     const data = await response.json();
//     console.log(data);
//   } catch (error) {
//     console.error(error);
//     document.getElementById('resultsContainer').innerHTML = '<p>Error occurred during search.</p>';
//   }
// });

// // Add event listener to update placeholder based on selected criteria
// document.getElementById('searchCriteria').addEventListener('change', function() {
//   let placeholderText = "";
//   switch (this.value) {
//     case "title":
//       placeholderText = "Search by title";
//       break;
//     case "isbn":
//       placeholderText = "Search by ISBN";
//       break;
//     case "authors":
//       placeholderText = "Search by authors (comma-separated)";
//       break;
//     case "genres":
//       placeholderText = "Search by genres (comma-separated)";
//       break;
//     default:
//       placeholderText = "Enter your search term...";
//   }
//   document.getElementById('searchQuery').placeholder = placeholderText;
// });

