// Base API endpoints for each report type
const API_ENDPOINTS = {
  circulation: '/api/reports/circulation',
  reservations: '/api/reports/reservations',
  overdue: '/api/reports/overdue',
  inventory: '/api/reports/inventory',
  'user-engagement': '/api/reports/user-engagement',
  financial: '/api/reports/financial',
  custom: '/api/reports/custom'
};

const tabs = document.querySelectorAll('.tabs button');
const reportContent = document.getElementById('reportContent');

// Set up tab click events
tabs.forEach(tab => {
  tab.addEventListener('click', function() {
    tabs.forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    const reportType = this.getAttribute('data-report');
    loadReport(reportType);
  });
});

// Load a report by type
async function loadReport(type) {
  reportContent.innerHTML = ''; // Clear content
  // Depending on report type, show a filter form if needed
  let filterHtml = '';
  if (type === 'circulation') {
    filterHtml = `
      <div class="filter-form">
        <label for="period">Period</label>
        <select id="period">
          <option value="daily" selected>Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button id="loadReportBtn">Load Report</button>
      </div>
    `;
  } else if (type === 'custom') {
    filterHtml = `
      <div class="filter-form">
        <label for="startDate">Start Date</label>
        <input type="date" id="startDate">
        <label for="endDate">End Date</label>
        <input type="date" id="endDate">
        <label for="userId">User ID (optional)</label>
        <input type="number" id="userId" placeholder="User ID">
        <label for="bookIsbn">Book ISBN (optional)</label>
        <input type="text" id="bookIsbn" placeholder="Book ISBN">
        <label for="status">Status (optional)</label>
        <input type="text" id="status" placeholder="Status">
        <button id="loadReportBtn">Load Report</button>
      </div>
    `;
  } else {
    // For other report types, a simple "Load Report" button without filters
    filterHtml = `<div class="filter-form"><button id="loadReportBtn">Load Report</button></div>`;
  }
  
  // Insert filter form and an empty table for results
  reportContent.innerHTML = `
    <div id="filterContainer">
      ${filterHtml}
    </div>
    <div id="reportMessage"></div>
    <table id="reportTable">
      <thead id="tableHeader"></thead>
      <tbody id="tableBody"></tbody>
    </table>
  `;
  
  // Add event listener for the filter form button
  document.getElementById('loadReportBtn').addEventListener('click', async () => {
    await fetchAndRenderReport(type);
  });
  
  // Optionally, auto-load the report on tab change
  await fetchAndRenderReport(type);
}

// Fetch and render report data based on type and filters
async function fetchAndRenderReport(type) {
  const reportMessage = document.getElementById('reportMessage');
  const tableHeader = document.getElementById('tableHeader');
  const tableBody = document.getElementById('tableBody');
  reportMessage.innerHTML = '';
  tableHeader.innerHTML = '';
  tableBody.innerHTML = '';
  
  let url = API_ENDPOINTS[type];
  const params = new URLSearchParams();
  
  // Collect filter data if applicable
  if (type === 'circulation') {
    const period = document.getElementById('period').value;
    params.append('period', period);
  } else if (type === 'custom') {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const userId = document.getElementById('userId').value;
    const bookIsbn = document.getElementById('bookIsbn').value;
    const status = document.getElementById('status').value;
    if (startDate && endDate) {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    if (userId) params.append('userId', userId);
    if (bookIsbn) params.append('bookIsbn', bookIsbn);
    if (status) params.append('status', status);
  }
  
  if ([...params].length > 0) {
    url += '?' + params.toString();
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Add Authorization header if needed
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch report data.');
    }
    
    const data = await response.json();
    renderReportTable(type, data);
  } catch (error) {
    console.error('Error fetching report data:', error);
    reportMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// Render table header and rows based on report type and data
function renderReportTable(type, data) {
  const tableHeader = document.getElementById('tableHeader');
  const tableBody = document.getElementById('tableBody');
  
  // Define column headers for each report type
  let headers = [];
  switch (type) {
    case 'circulation':
      headers = ['Date', 'Total Checkouts'];
      break;
    case 'reservations':
      headers = ['ID', 'User ID', 'Book ISBN', 'Request Date', 'Status'];
      break;
    case 'overdue':
      headers = ['ID', 'User ID', 'Book ISBN', 'Due Date', 'Fine'];
      break;
    case 'inventory':
      headers = ['ISBN', 'Title', 'Available Copies', 'Total Copies'];
      break;
    case 'user-engagement':
      headers = ['User ID', 'Checkout Count'];
      break;
    case 'financial':
      headers = ['Total Fines'];
      break;
    case 'custom':
      // For custom report, we assume a generic checkout report similar to circulation
      headers = ['ID', 'User ID', 'Book ISBN', 'Checkout Date', 'Due Date', 'Return Date', 'Status', 'Renewals', 'Fine'];
      break;
    default:
      headers = [];
  }
  
  // Create table header row
  let headerRow = '<tr>';
  headers.forEach(header => {
    headerRow += `<th>${header}</th>`;
  });
  headerRow += '</tr>';
  tableHeader.innerHTML = headerRow;
  
  // Render table rows
  if (!data || (Array.isArray(data) && data.length === 0)) {
    tableBody.innerHTML = '<tr><td colspan="'+headers.length+'">No records found.</td></tr>';
    return;
  }
  
  // If the report returns an aggregated object (like circulation report), handle accordingly.
  if (data.checkouts) {
    // For circulation report (aggregated)
    data.checkouts.forEach(item => {
      const row = `<tr>
        <td>${item.date}</td>
        <td>${item.totalCheckouts}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (Array.isArray(data)) {
    // Generic checkout records or others
    data.forEach(item => {
      const row = `<tr>
        <td>${item.id || '-'}</td>
        <td>${item.userId || '-'}</td>
        <td>${item.bookIsbn || '-'}</td>
        <td>${item.reservationId || '-'}</td>
        <td>${item.checkoutDate ? new Date(item.checkoutDate).toLocaleDateString() : '-'}</td>
        <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}</td>
        <td>${item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}</td>
        <td>${item.status || '-'}</td>
        <td>${item.renewalCount !== undefined ? item.renewalCount : '-'}</td>
        <td>$${item.fine || '0.00'}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (data.totalFines !== undefined) {
    // For financial report
    const row = `<tr><td>$${data.totalFines}</td></tr>`;
    tableBody.innerHTML = row;
  }
}

// Load the default report on initial page load (Circulation)
loadReport('circulation');