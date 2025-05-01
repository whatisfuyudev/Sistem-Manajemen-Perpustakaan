// Select the “Edit” button
const editBtn = document.getElementById('modifyBtn');

// Listen for clicks
editBtn.addEventListener('click', function () {
  // Read the data-notification-id attribute (via dataset) :contentReference[oaicite:0]{index=0}
  const notificationId = this.dataset.notificationId;

  // Navigate to the edit page by updating window.location.href :contentReference[oaicite:1]{index=1}
  window.location.href = `/admin/notifications/edit/${notificationId}`;
});