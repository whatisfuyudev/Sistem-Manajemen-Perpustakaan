const form             = document.getElementById('searchForm');
const toggleBtn        = document.getElementById('toggleAdvanced');
const advancedSearchDiv= document.getElementById('advancedSearch');
const resultsContainer = document.getElementById('resultsContainer');

// Toggle advanced search
toggleBtn.addEventListener('click', () => {
  const isVisible = advancedSearchDiv.style.display === 'flex';                     
  advancedSearchDiv.style.display = isVisible ? 'none' : 'flex';
  toggleBtn.textContent = isVisible
    ? 'Show Advanced Search Options'
    : 'Hide Advanced Search Options';
});

// Handle search submission
form.addEventListener('submit', async event => {
  event.preventDefault();                                                           

  // Gather filters
  const filters = {
    id:            form.userId.value.trim(),
    name:          form.name.value.trim(),
    email:         form.email.value.trim(),
    role:          form.role.value,
    address:       form.address.value.trim(),
    accountStatus: form.accountStatus.value,
    page:          1,
    limit:         10
  };

  // Remove empty
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  try {
    // Build query
    const qs = new URLSearchParams(filters).toString();                            
    const res= await fetch(`/api/users?${qs}`);                                    
    if (!res.ok) throw new Error(`Server responded ${res.status}`);                

    const data = await res.json();                                                 
    renderUserResults(data.users);
  } catch (err) {
    resultsContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
});

// Render users into a table
function renderUserResults(users) {
  if (!users || users.length === 0) {
    resultsContainer.innerHTML = '<p>No users found.</p>';
    return;
  }
  let html = '<table><thead><tr>'
    + '<th>ID</th><th>Name</th><th>Email</th>'
    + '<th>Role</th><th>Address</th><th>Account Status</th>'
    + '</tr></thead><tbody>';
  users.forEach(u => {
    html += `<tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.address || '—'}</td>
      <td>${u.accountStatus}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  resultsContainer.innerHTML = html;
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

