const form       = document.getElementById('searchForm');
const toggleBtn  = document.getElementById('toggleAdvanced');
const advDiv     = document.getElementById('advancedSearch');
const resultsDiv = document.getElementById('resultsContainer');

// Toggle advanced options
toggleBtn.addEventListener('click', () => {
  const open = advDiv.style.display === 'flex';
  advDiv.style.display = open ? 'none' : 'flex';
  toggleBtn.textContent = open
    ? 'Show Advanced Search Options'
    : 'Hide Advanced Search Options';
});

// Handle search submission
form.addEventListener('submit', async event => {
  event.preventDefault();

  // Gather filters
  const filters = {
    recipient:     form.recipient.value.trim(),
    subject:       form.subject.value.trim(),
    message:       form.message.value.trim(),
    channel:       form.channel.value,
    status:        form.status.value,
    read:          form.read.value,
    startDate: form.startDate.value,
    endDate:   form.endDate.value,
    dateField: form.dateField.value,  // e.g. "createdAt", "scheduledAt", or "deliveredAt"
    page:          1,
    limit:         10
  };

  // Remove empty
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  try {
    const qs  = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/notifications/history?${qs}`);
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const data = await res.json();

    renderNotificationResults(data);
  } catch (err) {
    resultsContainer.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
});

// Render notifications into a table
function renderNotificationResults(items) {
  if (!items || items.length === 0) {
    resultsContainer.innerHTML = '<p>No notifications found.</p>';
    return;
  }
  let html = '<table><thead><tr>' +
    '<th>ID</th><th>Channel</th><th>Recipient</th>' +
    '<th>Subject</th><th>Status</th><th>Read</th>' +
    '<th>Scheduled At</th><th>Delivered At</th><th>Created At</th>' +
    '</tr></thead><tbody>';
  items.forEach(n => {
    html += `<tr>
      <td>${n.id}</td>
      <td>${n.channel}</td>
      <td>${n.recipient}</td>
      <td>${n.subject || '–'}</td>
      <td>${n.status}</td>
      <td>${n.read ? 'Yes' : 'No'}</td>
      <td>${n.scheduledAt ? new Date(n.scheduledAt).toLocaleDateString() : '–'}</td>
      <td>${n.deliveredAt ? new Date(n.deliveredAt).toLocaleDateString() : '–'}</td>
      <td>${new Date(n.createdAt).toLocaleDateString()}</td>
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

