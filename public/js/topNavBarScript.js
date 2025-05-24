// Grab elements
const menuBtn = document.getElementById('menuBtn');
const dropdown = document.getElementById('dropdownContent');

// Toggle dropdown on button click
menuBtn.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.classList.toggle('show');
});

// Click outside to close
document.addEventListener('click', () => {
  dropdown.classList.remove('show');
});

// Prevent clicks inside dropdown from bubbling up
dropdown.addEventListener('click', e => {
  e.stopPropagation();
});