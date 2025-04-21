const searchBtn    = document.getElementById('searchBtn');
  const isbnInput    = document.getElementById('isbnInput');
  const resultsDiv   = document.getElementById('resultsContainer');
  const promoteBtn   = document.getElementById('promoteBtn');
  const msgContainer = document.getElementById('msgContainer');
  const pagDiv       = document.getElementById('paginationControls');

  let currentIsbn = '';
  let pendingList = [];
  let currentPage = 1;
  let totalPages  = 1;
  const PAGE_LIMIT = 5; // items per page

  // Show a transient message
  function showMessage(text, type = 'success') {
    msgContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => msgContainer.innerHTML = '', 4000);
  }

  // Render list of reservations
  function renderReservations(list) {
    if (list.length === 0) {
      resultsDiv.innerHTML = '<p>No reservations found for this ISBN.</p>';
      promoteBtn.disabled = true;
      pendingList = [];
    } else {
      list.sort((a, b) => a.queuePosition - b.queuePosition);
      let html = '<table><thead><tr>'
        + '<th>Queue Pos.</th><th>ID</th><th>User ID</th>'
        + '<th>Status</th><th>Req Date</th><th>Exp Date</th>'
        + '</tr></thead><tbody>';
      list.forEach(r => {
        html += `<tr>
          <td>${r.queuePosition}</td>
          <td>${r.id}</td>
          <td>${r.userId}</td>
          <td>${r.status}</td>
          <td>${new Date(r.requestDate).toLocaleDateString()}</td>
          <td>${r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : '-'}</td>
        </tr>`; // using Date and toLocaleDateString :contentReference[oaicite:1]{index=1}
      });
      html += '</tbody></table>';
      resultsDiv.innerHTML = html;

      pendingList = list.filter(r => r.status === 'pending');
      promoteBtn.disabled = pendingList.length === 0;
    }
    renderPaginationControls();
  }

  // Render Prev/Next page buttons
  function renderPaginationControls() {
    let html = '';
    
    if (currentPage > 1) {
      html += `<button id="prevPage">‹ Prev</button>`;
    }
    html += `<span>Page ${currentPage} of ${totalPages}</span>`;
    if (currentPage < totalPages) {
      html += `<button id="nextPage">Next ›</button>`;
    }
    pagDiv.innerHTML = html;

    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', () => { currentPage--; reload(); });
    if (next) next.addEventListener('click', () => { currentPage++; reload(); });
  }

  // Fetch a page of pending reservations by ISBN
  async function fetchByIsbn(isbn, page = 1) {
    try {
      const qs = new URLSearchParams({
        bookIsbn:     isbn,
        status:       'pending',
        limit:        PAGE_LIMIT,
        page
      });
      const res = await fetch(`/api/reservations/history?${qs}`); // fetch with query 
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();   

      // parse JSON 
      totalPages = payload.total > 0 ? Math.ceil(payload.total / PAGE_LIMIT) : 1;                      // API must return total
      return payload.reservations;
    } catch (err) {
      showMessage(`Search failed: ${err.message}`, 'error');
      return [];
    }
  }

  // Common reload logic
  async function reload() {
    const list = await fetchByIsbn(currentIsbn, currentPage);
    renderReservations(list);
  }

  // Search button click
  searchBtn.addEventListener('click', async () => {
    const isbn = isbnInput.value.trim();
    if (!isbn) {
      showMessage('Please enter a valid ISBN.', 'error');
      return;
    }
    currentIsbn = isbn;
    currentPage = 1;
    const list = await fetchByIsbn(isbn, currentPage);
    renderReservations(list);
  });

  // Promote button click
  promoteBtn.addEventListener('click', async () => {
    if (!currentIsbn || pendingList.length === 0) return;
    if (! await showModal({ message: `Promote reservation #${pendingList[0].id}?`, showCancel: true })) return;

    try {
      const res = await fetch(
        `/api/reservations/promote/${encodeURIComponent(currentIsbn)}`,
        { method: 'PUT' }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      showMessage(
        `Promoted #${updated.id}; available until ${new Date(updated.expirationDate).toLocaleString()}`,
        'success'
      );
      await reload();
    } catch (err) {
      showMessage(`Promotion failed: ${err.message}`, 'error');
    }
  });

// Initialize empty page state
pagDiv.innerHTML = '';

/* ------------------------ MODAL POPUP FUNCTIONS ------------------------ */
// Show a generic modal popup; returns a Promise that resolves with true (OK) or false (Cancel)
function showModal({ message, showCancel = false }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const okButton = document.getElementById('modal-ok');
    const cancelButton = document.getElementById('modal-cancel');

    modalMessage.textContent = message;
    if (showCancel) {
      cancelButton.classList.remove('hidden');
    } else {
      cancelButton.classList.add('hidden');
    }

    const inputField = document.getElementById('modal-input');
    if (inputField) inputField.classList.add('hidden');

    overlay.classList.remove('hidden');

    const cleanUp = () => {
      okButton.removeEventListener('click', onOk);
      cancelButton.removeEventListener('click', onCancel);
      overlay.classList.add('hidden');
    };

    const onOk = () => {
      cleanUp();
      resolve(true);
    };

    const onCancel = () => {
      cleanUp();
      resolve(false);
    };

    okButton.addEventListener('click', onOk);
    if (showCancel) {
      cancelButton.addEventListener('click', onCancel);
    }
  });
}