document.getElementById('reserveButton').addEventListener('click', async function() {
  // Retrieve the ISBN from the DOM
  const bookIsbn = document.getElementById('isbnValue').textContent.trim();
  

  const payload = {
      bookIsbn,
      // Optionally include notes if needed, e.g.:
      // notes: "Please reserve this book for me."
  };

  try {
      const response = await fetch('/api/reservations/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
      });
      
      if (response.ok) {
      const result = await response.json();
      alert("Reservation created successfully. Your queue position is: " + result.queuePosition);
      } else {
      const errorText = await response.text();
      alert("Reservation failed: " + errorText);
      }
  } catch (error) {
      console.error("Error creating reservation:", error);
      alert("An error occurred while creating the reservation.");
  }
});