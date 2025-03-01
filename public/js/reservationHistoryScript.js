    // Base endpoint URL
    const API_URL = '/api/reservations/history';
    
    // Get references to DOM elements
    const filters = document.querySelectorAll('.filters button');
    const messageDiv = document.getElementById('message');
    const tableBody = document.querySelector('#reservationsTable tbody');
    
    // Function to fetch and display reservation history with an optional status filter
    async function fetchReservations(status = '') {
      messageDiv.innerHTML = '';
      tableBody.innerHTML = '';
      
      let url = API_URL;
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
            // Add Authorization header if needed, e.g.:
            // 'Authorization': 'Bearer YOUR_TOKEN'
          }
        });
        if (response.ok) {
          const reservations = await response.json();
          if (reservations.length === 0) {
            messageDiv.innerHTML = '<div class="alert alert-danger">No reservations found for this filter.</div>';
          } else {
            reservations.forEach(reservation => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td>${reservation.id}</td>
                <td>${reservation.userId}</td>
                <td>${reservation.bookIsbn}</td>
                <td>${new Date(reservation.requestDate).toLocaleDateString()}</td>
                <td>${reservation.status}</td>
                <td>${reservation.expirationDate ? new Date(reservation.expirationDate).toLocaleDateString() : ''}</td>
                <td>${reservation.queuePosition}</td>
                <td>${reservation.notes || ''}</td>
              `;
              tableBody.appendChild(row);
            });
          }
        } else {
          const errorText = await response.text();
          messageDiv.innerHTML = `<div class="alert alert-danger">Error: ${errorText}</div>`;
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
        messageDiv.innerHTML = '<div class="alert alert-danger">An error occurred while fetching reservations.</div>';
      }
    }
    
    // Add event listeners to filter buttons
    filters.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filters.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        // Fetch reservations using the selected filter (empty string for "All")
        const status = button.getAttribute('data-status');
        fetchReservations(status);
      });
    });
    
    // Initial fetch for "All" reservations
    fetchReservations();