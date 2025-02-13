document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("deleteButton").addEventListener("click", async function() {
    const isbn = document.getElementById("isbn").value.trim();
    const messageDiv = document.getElementById("message");
    
    if (!isbn) {
      messageDiv.textContent = "Please enter a valid ISBN.";
      return;
    }
    
    try {
      const response = await fetch(`/api/books/${isbn}`, { method: "DELETE" });
      
      if (response.status === 204) {
        messageDiv.textContent = "Book deleted successfully.";
      } else if (response.status === 404) {
        messageDiv.textContent = "Book not found or deletion not permitted.";
      } else {
        const errorText = await response.text();
        messageDiv.textContent = "Error: " + errorText;
      }
    } catch (error) {
      console.error("Error:", error);
      messageDiv.textContent = "Error updating book: " + error.message;
    }
  });
});