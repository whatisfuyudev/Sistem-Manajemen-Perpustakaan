// Submit update via PUT
document.getElementById('editForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = e.target.id.value;
  const payload = {
    channel:     e.target.channel.value,
    recipient:   e.target.recipient.value.trim(),
    subject:     e.target.subject.value.trim() || undefined,
    message:     e.target.message.value.trim(),
    status:      e.target.status.value,
    read:        e.target.read.value === 'true',
    scheduledAt: e.target.scheduledAt.value || undefined
  };

  try {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    showModal({ message: 'Notification updated successfully.' })
      .then(() => window.location.href = `/admin/notifications/${id}`);
  } catch (err) {
    showModal({ message: 'Update failed: ' + err.message });
  }
});

// Modal utility
function showModal({ message, showCancel=false }) {
  return new Promise(resolve => {
    const ov = document.getElementById('modal-overlay');
    const msgEl = document.getElementById('modal-message');
    const ok   = document.getElementById('modal-ok');
    const cancel = document.getElementById('modal-cancel');
    msgEl.textContent = message;
    cancel.classList.toggle('hidden', !showCancel);
    ov.classList.remove('hidden');

    ok.onclick = () => { ov.classList.add('hidden'); resolve(true); };
    cancel.onclick = () => { ov.classList.add('hidden'); resolve(false); };
  });
}