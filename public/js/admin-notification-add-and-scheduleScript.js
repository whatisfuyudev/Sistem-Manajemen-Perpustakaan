(function(){
  const form          = document.getElementById('notifyForm');
  const toggle        = document.getElementById('scheduleToggle');
  const scheduleField = document.getElementById('scheduleField');
  const cancelBtn     = document.getElementById('cancelBtn');
  const sendBtn       = document.getElementById('sendBtn');
  const msgDiv        = document.getElementById('formMessage');

  const container = document.getElementById('recipient-container');
  const input     = document.getElementById('recipient-input');

  // helper to render all tags
  function renderTags() {
    container.querySelectorAll('.tag').forEach(t => t.remove());
    emails.forEach((email, idx) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = email;

      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-tag';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        emails.splice(idx, 1);
        renderTags();
      });

      tag.appendChild(removeBtn);
      container.insertBefore(tag, input);
    });
  }

  // on comma or enter → try to add a tag
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/,$/, '');
      if (val && validateEmail(val) && !emails.includes(val)) {
        emails.push(val);
      }
      input.value = '';
      renderTags();
    }
  });

  // allow click on empty space to focus input
  container.addEventListener('click', () => input.focus());

  // simple email regex
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // keep an array of valid email strings
  let emails = [];

  // Show/hide schedule field
  toggle.addEventListener('change', () => {
    scheduleField.style.display = toggle.checked ? 'block' : 'none';
    if (!toggle.checked) {
      document.getElementById('scheduledAt').value = '';
    }
  });

  // Cancel → back to admin panel
  cancelBtn.addEventListener('click', () => {
    window.location.href = '/admin/panel?tab=notifications';
  });

  // Form submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msgDiv.textContent = '';
    msgDiv.className = 'message';

    // validate that we have at least one recipient
    if (emails.length === 0) {
      msgDiv.textContent = 'Please add at least one recipient email.';
      msgDiv.classList.add('error');
      return;
    }

    // build payload
    const data = {
      channel:     form.channel.value,
      // recipient:   form.recipient.value.trim(),
      recipients: emails,       // now an array
      subject:     form.subject.value.trim() || undefined,
      message:     form.message.value.trim(),
    };
    if (toggle.checked) {
      data.scheduledAt = form.scheduledAt.value;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = toggle.checked ? 'Scheduling...' : 'Sending...';

    try {
      const url = toggle.checked
        ? '/api/notifications/schedule'
        : '/api/notifications/send';

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res.json();
      })
      .then(data => {
        if (toggle.checked) {
        // ─── SCHEDULING BRANCH ────────────────────────────────
        // We know schedule always succeeds per-recipient, so just count how many got scheduled:
        const scheduled = data.scheduledNotifications.length;
        msgDiv.textContent = `Scheduled ${scheduled} notification${scheduled === 1 ? '' : 's'} successfully.`;
        msgDiv.classList.add('success');

        // clear UI & form
        form.reset();
        scheduleField.style.display = 'none';
        emails = [];
        renderTags();

        } else {
        // ─── SENDING BRANCH ────────────────────────────────────
        // data.results is an array of { to, success, error? }
        const results   = data.results || [];
        const total     = results.length;
        const succeeded = results.filter(r => r.success).length;
        const failed    = total - succeeded;
        
        if (failed === 0) {
          msgDiv.textContent = `${succeeded}/${total} delivered successfully!`;
          msgDiv.classList.add('success');
        } else if (succeeded === 0) {
          msgDiv.textContent = `All ${total} deliveries failed.`;
          msgDiv.classList.add('error');
        } else {
          msgDiv.textContent = `${succeeded}/${total} succeeded, ${failed} failed.`;
          msgDiv.classList.add('error');
        }

        // clear only on actual sends
        if (succeeded > 0) {
          form.reset();
          scheduleField.style.display = 'none';
          emails = [];
          renderTags();
          }
        }
     });
    } catch (err) {
      msgDiv.textContent = 'Error: ' + err.message;
      msgDiv.classList.add('error');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = toggle.checked ? 'Schedule' : 'Send';
    }
  });
})();