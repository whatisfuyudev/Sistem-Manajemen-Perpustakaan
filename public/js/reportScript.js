// Global pagination state and debouncing
let currentPage = 1;
const limit = 10; // Number of records per page
let totalPages = 1;
let debounceTimer;

function debounce(fn, delay) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn.apply(this, args), delay);
  }
}

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
    currentPage = 1; // Reset pagination when switching tabs
    loadReport(this.getAttribute('data-report'));
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
  
  // Insert filter form, an empty table, and pagination container for results
  reportContent.innerHTML = `
    <div id="filterContainer">
      ${filterHtml}
    </div>
    <div id="reportMessage"></div>
    <table id="reportTable">
      <thead id="tableHeader"></thead>
      <tbody id="tableBody"></tbody>
    </table>
    <div id="paginationContainer" class="pagination"></div>
  `;
  
  // Debounce the fetch call to limit rapid requests
  document.getElementById('loadReportBtn').addEventListener('click', debounce(async () => {
    await fetchAndRenderReport(type);
  }, 300));
  
  // Optionally, auto-load the report on tab change
  await fetchAndRenderReport(type);
}

// Fetch and render report data based on type, filters, and pagination
async function fetchAndRenderReport(type) {
  const reportMessage = document.getElementById('reportMessage');
  const tableHeader = document.getElementById('tableHeader');
  const tableBody = document.getElementById('tableBody');
  reportMessage.innerHTML = '';
  tableHeader.innerHTML = '';
  tableBody.innerHTML = '';
  
  let url = API_ENDPOINTS[type];
  const params = new URLSearchParams();
  
  // Add pagination parameters for paginated endpoints
  if (['circulation','reservations','overdue','inventory','user-engagement','custom'].includes(type)) {
    params.append('page', currentPage);
    params.append('limit', limit);
  }
  
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
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
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
    
    // Normalize the response based on report type
    let rows = [];
    if (data.data) {
      rows = data.data;
      currentPage = data.page;
      totalPages = Math.ceil(data.totalCount / data.limit);
    } else {
      switch(type) {
        case 'circulation':
          rows = data.checkouts || [];
          break;
        case 'reservations':
          rows = data.reservations || [];
          currentPage = data.page || 1;
          totalPages = data.totalCount ? Math.ceil(data.totalCount / data.limit) : 1;
          break;
        case 'overdue':
          rows = data.overdueCheckouts || [];
          currentPage = data.page || 1;
          totalPages = data.totalCount ? Math.ceil(data.totalCount / data.limit) : 1;
          break;
        case 'inventory':
          rows = data.books || [];
          currentPage = data.page || 1;
          totalPages = data.totalCount ? Math.ceil(data.totalCount / data.limit) : 1;
          break;
        case 'user-engagement':
          rows = data.userActivity || [];
          currentPage = data.page || 1;
          totalPages = data.totalCount ? Math.ceil(data.totalCount / data.limit) : 1;
          break;
        case 'custom':
          rows = data.records || [];
          currentPage = data.page || 1;
          totalPages = data.totalCount ? Math.ceil(data.totalCount / data.limit) : 1;
          break;
        case 'financial':
          // Financial report returns an array
          rows = data;
          break;
        default:
          rows = [];
      }
    }
    
    renderReportTable(type, rows);
    renderPagination(currentPage, totalPages, type);
  } catch (error) {
    console.error('Error fetching report data:', error);
    reportMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  }
}

// Render table header and rows based on report type and data (without pagination metadata)
function renderReportTable(type, rows) {
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
  
  if (!rows || rows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${headers.length}">No records found.</td></tr>`;
    return;
  }
  
  // Render table rows
  if (type === 'financial') {
    let overallTotal = 0;
    rows.forEach(item => {
      const fineAmount = parseFloat(item.totalFines) || 0;
      overallTotal += fineAmount;
      const row = `<tr>
        <td>${item.status || 'Unknown'}</td>
        <td>$${fineAmount.toFixed(2)}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
    // Append extra row for aggregate fines
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

// Render pagination controls based on currentPage and totalPages
function renderPagination(page, totalPages, type) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = '';
  
  // Only show pagination for report types that return a paginated list
  if (['circulation','reservations','overdue','inventory','user-engagement','custom'].includes(type)) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = (page <= 1);
    prevBtn.addEventListener('click', async () => {
      if (page > 1) {
        currentPage = page - 1;
        await fetchAndRenderReport(type);
      }
    });
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = (page >= totalPages);
    nextBtn.addEventListener('click', async () => {
      if (page < totalPages) {
        currentPage = page + 1;
        await fetchAndRenderReport(type);
      }
    });
    
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${page} of ${totalPages}`;
    
    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextBtn);
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
    <p>The <strong>Financial Report</strong> breaks down the fines collected from checkouts by their status. Fines typically arise when items are:</p>
    <ul>
      <li><strong>Overdue:</strong> Items returned after their due date incur a fine calculated per day.</li>
      <li><strong>Lost:</strong> Items that are not returned are reported as lost, with a fine often equivalent to the replacement cost.</li>
      <li><strong>Damaged:</strong> Items returned in a damaged condition may incur additional charges to cover repair or replacement.</li>
    </ul>
    <p>The table above displays the total fines grouped by status. The final row shows the overall total of fines collected, giving a complete picture of the library's financial impact from overdue, lost, and damaged items.</p>
  `;
}

// Load the default report on initial page load (Circulation)
loadReport('circulation');