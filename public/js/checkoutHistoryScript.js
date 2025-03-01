document.addEventListener('DOMContentLoaded', function() {
  const tableBody = document.querySelector('#checkoutTable tbody');
  const filterButtons = document.querySelectorAll('.filter-buttons button');
  const messageDiv = document.getElementById('message');
  let checkoutData = [];
  
  // Fetch checkout history from the API
  async function fetchCheckoutHistory() {
    try {
      const response = await fetch('/api/checkouts/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Add Authorization header if needed
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch checkout history.');
      }
      checkoutData = await response.json();
      renderTable(checkoutData);
    } catch (error) {
      console.error('Error fetching data:', error);
      tableBody.innerHTML = '<tr><td colspan="10" class="error">Error loading data.</td></tr>';
    }
  }
  
  // Render table rows based on provided data
  function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10">No checkout records found.</td></tr>';
      return;
    }
    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.userId}</td>
        <td>${item.bookIsbn}</td>
        <td>${item.reservationId || '-'}</td>
        <td>${new Date(item.checkoutDate).toLocaleDateString()}</td>
        <td>${new Date(item.dueDate).toLocaleDateString()}</td>
        <td>${item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}</td>
        <td>${item.status}</td>
        <td>${item.renewalCount}</td>
        <td>$${item.fine ? item.fine : '0.00'}</td>
      `;
      tableBody.appendChild(tr);
    });
  }
  
  // Filter data based on selected status
  function applyFilter(filter) {
    let filteredData;
    if (filter === 'all') {
      filteredData = checkoutData;
    } else {
      filteredData = checkoutData.filter(item => item.status.toLowerCase() === filter);
    }
    renderTable(filteredData);
  }
  
  // Event listeners for filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      applyFilter(filter);
    });
  });
  
  // Initial data fetch
  fetchCheckoutHistory();
});