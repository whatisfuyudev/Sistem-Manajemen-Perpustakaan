const searchBtn    = document.getElementById('searchBtn');
const isbnInput    = document.getElementById('isbnInput');
const resultsDiv   = document.getElementById('resultsContainer');
const promoteBtn   = document.getElementById('promoteBtn');
const msgContainer = document.getElementById('msgContainer');

let currentIsbn = '';
let pendingList = [];

// Utility to show messages
function showMessage(text, type = 'success') {
  msgContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
  setTimeout(() => msgContainer.innerHTML = '', 4000);
}

// Render table of reservations
function renderReservations(list) {
  if (list.length === 0) {
    resultsDiv.innerHTML = '<p>No reservations found for this ISBN.</p>';
    promoteBtn.disabled = true;
    pendingList = [];
    return;
  }
  // Sort by queuePosition ascending
  list.sort((a, b) => a.queuePosition - b.queuePosition);

  // Build table
  let html = '<table><thead><tr>'
    + '<th>Queue Pos.</th><th>Reservation ID</th>'
    + '<th>User ID</th><th>Status</th><th>Req Date</th><th>Exp Date</th>'
    + '</tr></thead><tbody>';
  list.forEach(r => {
    html += `<tr>
      <td>${r.queuePosition}</td>
      <td>${r.id}</td>
      <td>${r.userId}</td>
      <td>${r.status}</td>
      <td>${new Date(r.requestDate).toLocaleDateString()}</td>
      <td>${r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : '-'}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  resultsDiv.innerHTML = html;

  // Extract only pending reservations
  pendingList = list.filter(r => r.status === 'pending');
  promoteBtn.disabled = pendingList.length === 0;
}

// Fetch reservations by ISBN
async function fetchByIsbn(isbn) {
  try {
    const qs = new URLSearchParams({ bookIsbn: isbn, limit: 50, page: 1 });
    const res = await fetch(`/api/reservations/history?${qs}`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const { reservations } = await res.json();
    return reservations;
  } catch (err) {
    showMessage(`Search failed: ${err.message}`, 'error');
    return [];
  }
}

// Search button handler
searchBtn.addEventListener('click', async () => {
  const isbn = isbnInput.value.trim();
  if (!isbn) {
    showMessage('Please enter a valid ISBN.', 'error');
    return;
  }
  currentIsbn = isbn;
  const list = await fetchByIsbn(isbn);
  renderReservations(list);
});

// Promote button handler
promoteBtn.addEventListener('click', async () => {
  if (!currentIsbn || pendingList.length === 0) return;

  // Confirm with user
  if (!confirm(`Promote reservation #${pendingList[0].id}?`)) return;

  try {
    const res = await fetch(
      `/api/reservations/promote/${encodeURIComponent(currentIsbn)}`,
      { method: 'PUT' }
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Error ${res.status}`);
    }
    const updated = await res.json();
    showMessage(`Promoted #${updated.id}; now available until ${new Date(updated.expirationDate).toLocaleString()}`, 'success');
    // Refresh list
    const list = await fetchByIsbn(currentIsbn);
    renderReservations(list);
  } catch (err) {
    showMessage(`Promotion failed: ${err.message}`, 'error');
  }
});