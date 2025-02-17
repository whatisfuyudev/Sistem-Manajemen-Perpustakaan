document.getElementById('deleteButton').addEventListener('click', async function(e) {
  e.preventDefault();
  const userId = document.getElementById('userId').value.trim();
  const messageDiv = document.getElementById('message');
  
  if (!userId) {
    messageDiv.textContent = 'Please enter a user ID.';
    return;
  }
  
  try {
    const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    
    if (response.status === 204) {
      messageDiv.textContent = 'User deleted successfully.';
    } else if (response.status === 404) {
      messageDiv.textContent = 'User not found or deletion not permitted.';
    } else {
      const errorText = await response.text();
      messageDiv.textContent = 'Error: ' + errorText;
    }
  } catch (error) {
    console.error('Error:', error);
    messageDiv.textContent = 'Error deleting user: ' + error.message;
  }
});