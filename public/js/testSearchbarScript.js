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

  const filters = {
    userId: document.getElementById('userId').value.trim(),
    bookIsbn: document.getElementById('bookIsbn').value.trim(),
    reservationId: document.getElementById('reservationId').value.trim(),
    status: document.getElementById('status').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    dateField: document.getElementById('dateField').value,
    page: 1,
    limit: 10
  };

  // Remove empty fields
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });
  
  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/checkouts/history?${queryString}`);
    if (!response.ok) throw new Error('Search request failed.');
    const result = await response.json();
    renderCheckoutResults(result);
  } catch (error) {
    console.error(error);
    document.getElementById('resultsContainer').innerHTML = '<p>Error occurred during search.</p>';
  }
});


// Function to render search results
function renderCheckoutResults(data) {
  console.log(data);
  const container = document.getElementById('resultsContainer');
  if (!data.checkouts || data.checkouts.length === 0) {
    container.innerHTML = '<p>No checkouts found.</p>';
    return;
  }

  let html = '<ul>';
  data.checkouts.forEach(item => {
    html += `<li>
      <strong>Book ISBN:</strong> ${item.bookIsbn} |
      <strong>User ID:</strong> ${item.userId} |
      <strong>Status:</strong> ${item.status} |
      <strong>Due:</strong> ${new Date(item.dueDate).toLocaleDateString()}
    </li>`;
  });
  html += '</ul>';
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

