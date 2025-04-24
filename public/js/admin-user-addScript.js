document.getElementById('cancelBtn').addEventListener('click', () => {
  window.location.href = '/admin/panel?tab=users';
});

document.getElementById('addUserForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget;
  const data = new FormData(form);

  try {
    
    console.log('\n\n\n', data, '\n\n\n');
    
    const res = await fetch('/api/users', {
      method: 'POST',
      body: data
    });

    const msgDiv = document.getElementById('message');
    if (res.ok) {
      msgDiv.textContent = 'User created successfully!';
      msgDiv.style.color = 'green';
      form.reset();
    } else {
      const err = await res.json();
      msgDiv.textContent = 'Error: ' + (err.message || res.statusText);
      msgDiv.style.color = 'red';
    }
  } catch (err) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = 'Network error.';
    msgDiv.style.color = 'red';
  }
});

// Once a file is selected, store its filename in the hidden input
document.getElementById('profilePic').addEventListener('change', function() {
  if (this.files[0]) {
    // We'll set the path after upload succeeds server-side;
    // this is just a placeholder until the server responds.
    document.getElementById('profilePictureInput').value = this.files[0].name;
  }
});