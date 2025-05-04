(function(){
  const form          = document.getElementById('notifyForm');
  const toggle        = document.getElementById('scheduleToggle');
  const scheduleField = document.getElementById('scheduleField');
  const cancelBtn     = document.getElementById('cancelBtn');
  const sendBtn       = document.getElementById('sendBtn');
  const msgDiv        = document.getElementById('formMessage');

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

    // build payload
    const data = {
      channel:     form.channel.value,
      recipient:   form.recipient.value.trim(),
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

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      msgDiv.textContent = toggle.checked
        ? 'Notification scheduled successfully!'
        : 'Notification sent!'
      ;
      msgDiv.classList.add('success');
      form.reset();
      scheduleField.style.display = 'none';
    } catch (err) {
      msgDiv.textContent = 'Error: ' + err.message;
      msgDiv.classList.add('error');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = toggle.checked ? 'Schedule' : 'Send';
    }
  });
})();