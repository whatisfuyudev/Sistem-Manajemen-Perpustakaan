document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabs = document.querySelectorAll('.tabs button');
  const sections = document.querySelectorAll('.section');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      sections.forEach(section => {
        section.classList.toggle('active', section.id === targetId);
      });
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Send Notification
  document.getElementById('sendForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const sendMessageStatus = document.getElementById('sendMessageStatus');
    sendMessageStatus.textContent = '';
    const payload = {
      channel: document.getElementById('sendChannel').value,
      recipient: document.getElementById('sendRecipient').value.trim(),
      subject: document.getElementById('sendSubject').value.trim(),
      message: document.getElementById('sendMessage').value.trim()
    };
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        sendMessageStatus.textContent = 'Notification sent successfully!';
        sendMessageStatus.className = 'message success';
      } else {
        const errorText = await response.text();
        sendMessageStatus.textContent = `Failed to send: ${errorText}`;
        sendMessageStatus.className = 'message error';
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      sendMessageStatus.textContent = 'Error sending notification.';
      sendMessageStatus.className = 'message error';
    }
  });
  
  // Schedule Notification
  document.getElementById('scheduleForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const scheduleMessageStatus = document.getElementById('scheduleMessageStatus');
    scheduleMessageStatus.textContent = '';
    const payload = {
      channel: document.getElementById('scheduleChannel').value,
      recipient: document.getElementById('scheduleRecipient').value.trim(),
      subject: document.getElementById('scheduleSubject').value.trim(),
      message: document.getElementById('scheduleMessage').value.trim(),
      scheduledAt: document.getElementById('scheduledAt').value
    };
    try {
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        scheduleMessageStatus.textContent = 'Notification scheduled successfully!';
        scheduleMessageStatus.className = 'message success';
      } else {
        const errorText = await response.text();
        scheduleMessageStatus.textContent = `Scheduling failed: ${errorText}`;
        scheduleMessageStatus.className = 'message error';
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      scheduleMessageStatus.textContent = 'Error scheduling notification.';
      scheduleMessageStatus.className = 'message error';
    }
  });
  
  // Mark In-App Notification Read/Unread
  document.getElementById('inappForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const inappMessageStatus = document.getElementById('inappMessageStatus');
    inappMessageStatus.textContent = '';
    const notificationId = document.getElementById('inappId').value.trim();
    const readValue = document.getElementById('inappRead').value;
    const payload = { read: readValue === 'true' };
    try {
      const response = await fetch(`/api/notifications/inapp/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        inappMessageStatus.textContent = 'Notification status updated.';
        inappMessageStatus.className = 'message success';
      } else {
        const errorText = await response.text();
        inappMessageStatus.textContent = `Update failed: ${errorText}`;
        inappMessageStatus.className = 'message error';
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      inappMessageStatus.textContent = 'Error updating notification.';
      inappMessageStatus.className = 'message error';
    }
  });
  
  // Retrieve Notification History
  document.getElementById('historyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const historyResults = document.getElementById('historyResults');
    historyResults.textContent = '';
    const recipient = document.getElementById('historyRecipient').value.trim();
    const channel = document.getElementById('historyChannel').value;
    const status = document.getElementById('historyStatus').value;
    // Build query string
    let query = [];
    if (recipient) query.push(`recipient=${encodeURIComponent(recipient)}`);
    if (channel) query.push(`channel=${encodeURIComponent(channel)}`);
    if (status) query.push(`status=${encodeURIComponent(status)}`);
    const queryString = query.length ? `?${query.join('&')}` : '';
    
    try {
      const response = await fetch(`/api/notifications/history${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history.');
      }
      const notifications = await response.json();
      renderHistoryTable(notifications);
    } catch (error) {
      console.error('Error fetching history:', error);
      historyResults.textContent = 'Error loading history.';
      historyResults.className = 'message error';
    }
  });
  
  function renderHistoryTable(notifications) {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';
    if (notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="error">No notifications found.</td></tr>';
      return;
    }
    notifications.forEach(n => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${n.id}</td>
        <td>${n.channel}</td>
        <td>${n.recipient}</td>
        <td>${n.subject || '-'}</td>
        <td>${n.status}</td>
        <td>${new Date(n.createdAt).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  }
});