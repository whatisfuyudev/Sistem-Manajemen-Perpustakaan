document.getElementById('editForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('reservationId').textContent;
  const payload = {
    userId:         parseInt(e.target.userId.value, 10),
    bookIsbn:       e.target.bookIsbn.value.trim(),
    requestDate:    e.target.requestDate.value,
    status:         e.target.status.value,
    expirationDate: e.target.expirationDate.value || null,
    notes:          e.target.notes.value || null
  };
  try {
    const res = await fetch(`/api/reservations/admin/edit/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    alert('Reservation updated successfully');
    window.location.href = `/admin/reservations/${id}`;
  } catch (err) {
    alert('Update failed: ' + err.message);
  }
});