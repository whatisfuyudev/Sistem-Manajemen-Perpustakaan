document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch all books from the API
    const response = await fetch('/api/books/');
    if (!response.ok) {
      throw new Error('Failed to fetch books.');
    }
    const books = await response.json();
    if (!Array.isArray(books)) {
      throw new Error('Invalid books data format.');
    }

    // Randomly select 5 books to display as featured
    const randomBooks = [];
    const usedIndices = new Set();
    const totalBooks = books.length;
    const numBooksToDisplay = Math.min(5, totalBooks);
    while (randomBooks.length < numBooksToDisplay) {
      const randomIndex = Math.floor(Math.random() * totalBooks);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        randomBooks.push(books[randomIndex]);
      }
    }

    // Render book cards
    const bookGrid = document.getElementById('bookGrid');
    randomBooks.forEach(book => {
      // Create a book card
      const card = document.createElement('div');
      card.className = 'book-card';

      // Cover image element
      const img = document.createElement('img');
      img.src = "" + (book.coverImage ? book.coverImage : '/public/images/book-covers/default-cover.jpg');
      img.alt = book.title;
      img.style.maxHeight = "200px";
      img.style.width= "auto";  
      img.style.objectFit= "cover";  
      card.appendChild(img);

      // Book title element
      const title = document.createElement('div');
      title.className = 'book-title';
      title.textContent = book.title;
      card.appendChild(title);

      // Book authors element
      const authors = document.createElement('div');
      authors.className = 'book-authors';
      authors.textContent = Array.isArray(book.authors) ? book.authors.join(', ') : '';
      card.appendChild(authors);

      // View Details link
      const detailsLink = document.createElement('a');
      detailsLink.href = `/books/details/${book.isbn}`;
      detailsLink.className = 'view-details';
      detailsLink.textContent = 'View Details';
      card.appendChild(detailsLink);

      // Append the card to the grid
      bookGrid.appendChild(card);
    });
  } catch (error) {
    console.error(error);
  }

});

// Search functionality: on Enter key or button click, navigate to /books/search with query param
function performSearch() {
  const query = document.getElementById('searchInput').value.trim() + "";
  
  // Navigate to the search page with the search term as a URL parameter
  window.location.href = '/books/search?title=' + encodeURIComponent(query);
  
}

// Event listener for the Enter key
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    performSearch();
  }
});

// Event listener for the Search button
document.getElementById('searchButton').addEventListener('click', (e) => {
  e.preventDefault();
  performSearch();
});

const slider = document.querySelector('.news-slider .slides');
document.querySelector('.news-slider .next')
  .addEventListener('click', () => {
    slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });
  });
document.querySelector('.news-slider .prev')
  .addEventListener('click', () => {
    slider.scrollBy({ left: -slider.clientWidth, behavior: 'smooth' });
  });

const cards    = Array.from(slider.querySelectorAll('.card'));
const dotsCont = document.getElementById('sliderDots');
let currentPage = 0;

function getItemsPerPage() {
  return window.innerWidth <= 600 ? 1 : 2;
}

function buildDots() {
  dotsCont.innerHTML = '';
  const ipp = getItemsPerPage();
  const pageCount = Math.ceil(cards.length / ipp);

  for (let i = 0; i < pageCount; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.dataset.page = i;
    dot.addEventListener('click', () => goToPage(i));
    dotsCont.appendChild(dot);
  }
}

function goToPage(page) {
  const ipp = getItemsPerPage();
  const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(slider).gap);
  slider.scrollTo({
    left: page * cardWidth * ipp,
    behavior: 'smooth'
  });
  updateActiveDot(page);
}

function updateActiveDot(page) {
  dotsCont.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === page);
  });
  currentPage = page;
}

// Prev/Next
document.querySelector('.news-slider .prev')
  .addEventListener('click', () => {
    if (currentPage > 0) goToPage(currentPage - 1);
  });
document.querySelector('.news-slider .next')
  .addEventListener('click', () => {
    const maxPage = Math.ceil(cards.length / getItemsPerPage()) - 1;
    if (currentPage < maxPage) goToPage(currentPage + 1);
  });

// Sync on manual scroll (throttled)
let scrolling = false;
slider.addEventListener('scroll', () => {
  if (scrolling) return;
  window.requestAnimationFrame(() => {
    const ipp = getItemsPerPage();
    const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(slider).gap);
    const page = Math.round(slider.scrollLeft / (cardWidth * ipp));
    if (page !== currentPage) updateActiveDot(page);
    scrolling = false;
  });
  scrolling = true;
});

// Rebuild dots / reset page on resize
window.addEventListener('resize', () => {
  buildDots();
  goToPage(0);
});

// Initialize
buildDots();
