document.addEventListener('DOMContentLoaded', function() {
  const tableBody = document.querySelector('#checkoutTable tbody');
  const filterButtons = document.querySelectorAll('.filter-buttons button');
  let checkoutData = [];

  // Fetch checkout history from the API
  async function fetchCheckoutHistory() {
    try {
      const response = await fetch('/api/checkouts/history');
      if (!response.ok) {
        throw new Error('Failed to fetch checkout history.');
      }
      checkoutData = await response.json();
      renderTable(checkoutData);
    } catch (error) {
      console.error('Error fetching data:', error);
      tableBody.innerHTML = '<tr><td colspan="9" class="error">Error loading data.</td></tr>';
    }
  }

  // Render table rows based on the provided data
  function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9">No checkout records found.</td></tr>';
      return;
    }
    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.userId}</td>
        <td>${item.bookIsbn}</td>
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

  // Set up event listeners for filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active state from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Set active state on the clicked button
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      applyFilter(filter);
    });
  });

  // Initial data fetch
  fetchCheckoutHistory();
});