
document.addEventListener('DOMContentLoaded', function () {
  const renewBtn = document.getElementById('renew-button');
  const processBtn = document.getElementById('process-button');
  const editBtn    = document.getElementById('edit-button');
  const checkoutId = window.location.pathname.split('/').pop(); // assumes URL ends with checkout ID

  if (renewBtn) {
    renewBtn.addEventListener('click', async () => {
      // 1. Ask for confirmation
      const ok = await showModal({
        message: 'Are you sure you want to renew this checkout?',
        showCancel: true
      });
    
      // 2. If cancelled, do nothing
      if (!ok) return;
    
      // 3. Otherwise, send the PUT request
      try {
        const response = await fetch(`/api/checkouts/renew/${checkoutId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
    
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to renew');
        }
    
        // 6. Notify success
        await showModal({ message: 'Checkout successfully renewed!' });
      } catch (error) {
        // 7. Notify failure
        await showModal({ message: `Renewal failed: ${error.message}` });
      }
    });
  }

  if(processBtn) {
    processBtn.addEventListener('click', async () => {
      // grab the ID from the page
      const existingId = getPageCheckoutId();
  
      // 1) Show the modal and wait for user input (or cancel)
      const result = await showReturnModal({
        message: 'Please enter the return details',
        defaultValues: {
          checkoutId: existingId,    // could pre-fill if you have a value
          returnDate: '',    // e.g. '2025-04-18'
          returnStatus: 'returned',
          customFine: ''
        }
      });
  
      // 2) If the user cancelled, do nothing
      if (!result) {
        return;
      }
  
      // 3) Build payload from modal result
      const payload = {
        checkoutId: result.checkoutId,
        returnStatus: result.returnStatus
      };
      if (result.returnDate)  payload.returnDate  = result.returnDate;
      if (result.customFine != null) payload.customFine = result.customFine;
  
      try {
        // 4) Send to your /api/checkouts/return endpoint
        const response = await fetch('/api/checkouts/return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
          const err = await response.text();
          await showModal({ message: `Error processing return: ${err}` }); 
          return;
        }
  
        const data = await response.json();
        await showModal({ message: 
          `Return successful!\n` +
          `Status: ${data.status}\n` +
          `Fine: $${(data.fine || 0).toFixed(2)}\n` +
          `Returned on: ${new Date(data.returnDate).toLocaleDateString()}`
        });
        
        window.location.reload();
      } catch (e) {
        console.error('Fetch error:', e);
        await showModal({ message: `An error occurred while processing the return.` }); 
      }
    });
  }
  
  editBtn.addEventListener('click', () => {    
    window.location.href = `/admin/checkout/edit/${checkoutId}`;
  });


});


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

    const onOk = (e) => {
      e.preventDefault();
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

function initReturnModal() {
  // 1) Find or create the overlay container
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.classList.add('modal-overlay', 'hidden');
    document.body.appendChild(overlay);
  }
  
  // 2) Clear any previously injected content
  overlay.innerHTML = '';

  // 3) Build the modal wrapper
  const modal = document.createElement('div');
  modal.classList.add('modal');

  // 4) Message element
  const messageP = document.createElement('p');
  messageP.id = 'modal-message';
  modal.appendChild(messageP);

  // 5) Build the form
  const form = document.createElement('form');
  form.id = 'modal-return-form';

  // Helper to create labeled groups
  function makeGroup(labelText, inputEl) {
    const grp = document.createElement('div');
    grp.classList.add('form-group');
    const label = document.createElement('label');
    label.textContent = labelText;
    grp.appendChild(label);
    grp.appendChild(inputEl);
    return grp;
  }

  // Checkout ID
  const idInput = document.createElement('input');
  idInput.type = 'number';
  idInput.id = 'modal-checkoutId';
  idInput.name = 'checkoutId';
  idInput.required = true;
  idInput.readOnly = true;
  idInput.setAttribute('aria-readonly', 'true');
  form.appendChild(makeGroup('Checkout ID', idInput));

  // Return Date
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'modal-returnDate';
  dateInput.name = 'returnDate';
  form.appendChild(makeGroup('Return Date (optional)', dateInput));

  // Return Status
  const statusSelect = document.createElement('select');
  statusSelect.id = 'modal-returnStatus';
  statusSelect.name = 'returnStatus';
  ['returned', 'damaged', 'lost'].forEach((val) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = 
      val === 'returned'
        ? 'Returned (Good Condition)'
        : val.charAt(0).toUpperCase() + val.slice(1);
    statusSelect.appendChild(opt);
  });
  const statusGroup = makeGroup('Return Condition', statusSelect);
  const note = document.createElement('div');
  note.classList.add('note');
  note.textContent =
    'Note: If the book is marked as Damaged or Lost, you can specify a custom fine below. ' +
    'Default fine: $10 for Damaged, $20 for Lost.';
  statusGroup.appendChild(note);
  form.appendChild(statusGroup);

  // Custom Fine — append both label and input together
  const fineInput = document.createElement('input');
  fineInput.type = 'number';
  fineInput.id = 'modal-customFine';
  fineInput.name = 'customFine';
  fineInput.placeholder = 'Enter custom fine amount';
  fineInput.step = '0.01';
  fineInput.min = '0';

  // Build the full group (label  input)
  const fineGroup = makeGroup('Custom Fine Amount', fineInput);
  fineGroup.id = 'modal-customFineGroup';
  fineGroup.classList.add('custom-fine-group', 'hidden');
  form.appendChild(fineGroup);

  // Buttons
  const btnContainer = document.createElement('div');
  btnContainer.classList.add('modal-buttons');
  const okBtn = document.createElement('button');
  okBtn.type = 'submit';
  okBtn.id = 'modal-ok';
  okBtn.textContent = 'OK';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.id = 'modal-cancel';
  cancelBtn.textContent = 'Cancel';
  btnContainer.appendChild(okBtn);
  btnContainer.appendChild(cancelBtn);
  form.appendChild(btnContainer);

  // 6) Assemble modal
  modal.appendChild(form);
  overlay.appendChild(modal);
}

// 2) Show the modal and return a Promise with the form data
function showReturnModal({ message = 'Process Book Return', defaultValues = {} } = {}) {
  initReturnModal();

  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const form = document.getElementById('modal-return-form');
    const cancelBtn = document.getElementById('modal-cancel');
    const statusSelect = document.getElementById('modal-returnStatus');
    const fineGroup = document.getElementById('modal-customFineGroup');

    // Set up initial state
    modalMessage.textContent = message;
    Object.entries(defaultValues).forEach(([key, val]) => {
      const el = document.getElementById(`modal-${key}`);
      if (el && val != null) el.value = val;
    });
    overlay.classList.remove('hidden');

    // Toggle custom fine
    function toggleFine() {
      fineGroup.classList.toggle(
        'hidden',
        !['damaged', 'lost'].includes(statusSelect.value)
      );
    }
    statusSelect.addEventListener('change', toggleFine);
    toggleFine();

    // Cleanup
    function cleanUp() {
      form.removeEventListener('submit', onSubmit);
      cancelBtn.removeEventListener('click', onCancel);
      statusSelect.removeEventListener('change', toggleFine);
      overlay.classList.add('hidden');
      document
      .querySelectorAll('.form-group') // static NodeList of matching elements :contentReference[oaicite:0]{index=0}
      .forEach(el => el.remove()); // removes each element from the DOM :contentReference[oaicite:1]{index=1}
    }

    // OK handler
    function onSubmit(e) {
      e.preventDefault();
      const checkoutId = parseInt(document.getElementById('modal-checkoutId').value, 10);
      const returnDate = document.getElementById('modal-returnDate').value || null;
      const returnStatus = statusSelect.value;
      let customFine = null;
      const fineVal = document.getElementById('modal-customFine').value.trim();
      if ((returnStatus === 'damaged' || returnStatus === 'lost') && fineVal !== '') {
        const f = parseFloat(fineVal);

        customFine = f;
      }
      cleanUp();
      resolve({ checkoutId, returnDate, returnStatus, customFine });
    }

    // Cancel handler
    function onCancel() {
      cleanUp();
      resolve(null);
    }

    form.addEventListener('submit', onSubmit);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// 1) Utility to read the Checkout ID from your page
function getPageCheckoutId() {
  // find all “info-label” nodes
  const labels = document.querySelectorAll('.info-label');
  for (const lbl of labels) {
    if (lbl.textContent.trim().startsWith('Checkout ID')) {
      const valEl = lbl.nextElementSibling;
      if (valEl && valEl.classList.contains('info-value')) {
        // trim to remove whitespace/newlines
        return valEl.textContent.trim();
      }
    }
  }
  // fallback if not found
  return '';
}