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
      headers = ['Status', 'Total Fines'];
      break;
    case 'custom':
      headers = ['ID', 'User ID', 'Book ISBN', 'Reservation ID', 'Checkout Date', 'Due Date', 'Return Date', 'Status', 'Renewals', 'Fine'];
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
  
  // Normalize data based on report type
  let rows = [];
  if (type === 'circulation' && data.checkouts) {
    rows = data.checkouts;
  } else if (type === 'reservations' && data.reservations) {
    rows = data.reservations;
  } else if (type === 'overdue' && data.overdueCheckouts) {
    rows = data.overdueCheckouts;
  } else if (type === 'user-engagement' && data.userActivity) {
    rows = data.userActivity;
  } else if (type === 'financial' && Array.isArray(data)) {
    rows = data;
  } else if (Array.isArray(data)) {
    rows = data;
  }
  
  // Check if there are rows to display
  if (!rows || rows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${headers.length}">No records found.</td></tr>`;
    return;
  }
  
  // Render table rows
  if (type === 'financial') {
    let overallTotal = 0;
    rows.forEach(item => {
      // Sum the total fines; ensure the value is parsed as a float.
      const fineAmount = parseFloat(item.totalFines) || 0;
      overallTotal += fineAmount;
      const row = `<tr>
        <td>${item.status || 'Unknown'}</td>
        <td>$${fineAmount.toFixed(2)}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
    // Append an extra row that sums all fines
    const totalRow = `<tr style="font-weight:bold; background:#e9ecef;">
      <td>Total Fines</td>
      <td>$${overallTotal.toFixed(2)}</td>
    </tr>`;
    tableBody.innerHTML += totalRow;
  } else if (type === 'circulation') {
    rows.forEach(item => {
      const row = `<tr>
        <td>${item.date}</td>
        <td>${item.totalCheckouts}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (type === 'reservations') {
    rows.forEach(item => {
      const row = `<tr>
        <td>${item.id || '-'}</td>
        <td>${item.userId || '-'}</td>
        <td>${item.bookIsbn || '-'}</td>
        <td>${item.requestDate ? new Date(item.requestDate).toLocaleDateString() : '-'}</td>
        <td>${item.status || '-'}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (type === 'overdue') {
    rows.forEach(item => {
      const row = `<tr>
        <td>${item.id || '-'}</td>
        <td>${item.userId || '-'}</td>
        <td>${item.bookIsbn || '-'}</td>
        <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}</td>
        <td>$${item.fine || '0.00'}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (type === 'inventory') {
    rows.forEach(item => {
      const row = `<tr>
        <td>${item.isbn || '-'}</td>
        <td>${item.title || '-'}</td>
        <td>${item.availableCopies || '-'}</td>
        <td>${item.totalCopies || '-'}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (type === 'user-engagement') {
    rows.forEach(item => {
      const row = `<tr>
        <td>${item.userId || '-'}</td>
        <td>${item.checkoutCount || '-'}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } else if (type === 'custom') {
    rows.forEach(item => {
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
  }
  
  // If Financial tab, also render an explanation section.
  if (type === 'financial') {
    renderFinesExplanation();
  }
}

// Render additional explanation section for the Financial Report
function renderFinesExplanation() {
  let explanationDiv = document.getElementById('finesExplanation');
  if (!explanationDiv) {
    explanationDiv = document.createElement('div');
    explanationDiv.id = 'finesExplanation';
    explanationDiv.style.marginTop = '20px';
    explanationDiv.style.padding = '15px';
    explanationDiv.style.background = '#f1f1f1';
    explanationDiv.style.borderRadius = '8px';
    explanationDiv.style.fontSize = '14px';
    explanationDiv.style.lineHeight = '1.6';
    document.getElementById('reportContent').appendChild(explanationDiv);
  }
  
  explanationDiv.innerHTML = `
    <h2>Understanding Financial Fines</h2>
    <p>The <strong>Financial Report</strong> breaks down the fines collected from checkouts based on the item's status. In our system, fines typically arise when items are:</p>
    <ul>
      <li style="list-style-type: none;" ><strong>Overdue:</strong> Items returned after their due date incur a fine calculated per day.</li>
      <li style="list-style-type: none;" ><strong>Lost:</strong> Items that are not returned are reported as lost, with a fine often equivalent to the replacement cost.</li>
      <li style="list-style-type: none;" ><strong>Damaged:</strong> Items returned in a damaged condition may be subject to additional charges to cover repair or replacement.</li>
    </ul>
    <p>The table above lists each status along with the sum of fines associated with that category. The final row labeled <strong>Total Fines</strong> represents the aggregate sum across all categories, giving you a complete picture of the fines collected.</p>
  `;
}

// Load the default report on initial page load (Circulation)
loadReport('circulation');
