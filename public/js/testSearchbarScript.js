


   // Toggle advanced search options
   const toggleBtn = document.getElementById('toggleAdvanced');
   const advancedSearchDiv = document.getElementById('advancedSearch');
   toggleBtn.addEventListener('click', () => {
     const isVisible = advancedSearchDiv.style.display === 'flex';
     advancedSearchDiv.style.display = isVisible ? 'none' : 'flex';
     toggleBtn.textContent = isVisible
       ? 'Show Advanced Search Options'
       : 'Hide Advanced Search Options';
   });

   // Handle the search form submission
   document.getElementById('searchForm').addEventListener('submit', async e => {
     e.preventDefault();  // Prevent full‑page reload

     // Gather filters
     const filters = {
       userId:   document.getElementById('userId').value.trim(),
       bookIsbn: document.getElementById('bookIsbn').value.trim(),
       id:       document.getElementById('reservationId').value.trim(),
       status:   document.getElementById('status').value,
       page:     1,
       limit:    10
     };

     // Map date filters based on selected field
     const start = document.getElementById('startDate').value;
     const end   = document.getElementById('endDate').value;
     const df    = document.getElementById('dateField').value;
     if (start && end) {
       if (df === 'requestDate') {
         filters.reqDateFrom = start;
         filters.reqDateTo   = end;
       } else if (df === 'expirationDate') {
         filters.expDateFrom = start;
         filters.expDateTo   = end;
       }
     }

     // Remove empty entries
     Object.keys(filters).forEach(key => {
       if (!filters[key]) delete filters[key];
     });

     try {
       // Build query string
       const qs = new URLSearchParams(filters).toString();

       // Fetch reservation history
       const res = await fetch(`/api/reservations/history?${qs}`);
       if (!res.ok) throw new Error(`Server responded ${res.status}`);

       const data = await res.json();
       renderReservationResults(data);
     } catch (err) {
       console.error(err);
       document.getElementById('resultsContainer')
         .innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
     }
   });

   // Render reservation results
   function renderReservationResults(data) {
     const container = document.getElementById('resultsContainer');
     const list = data.reservations || [];
     if (list.length === 0) {
       container.innerHTML = '<p>No reservations found.</p>';
       return;
     }
     let html = '<ul>';
     list.forEach(r => {
       html += `<li>
         <strong>Reservation ID:</strong> ${r.id} |
         <strong>Book ISBN:</strong> ${r.bookIsbn} |
         <strong>User ID:</strong> ${r.userId} |
         <strong>Status:</strong> ${r.status} |
         <strong>Queue Pos.:</strong> ${r.queuePosition} |
         <strong>Requested:</strong> ${new Date(r.requestDate).toLocaleDateString()} |
         <strong>Expires:</strong> ${r.expirationDate
            ? new Date(r.expirationDate).toLocaleDateString()
            : '–'} |
         <strong>Notes:</strong> ${r.notes || '–'}
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

