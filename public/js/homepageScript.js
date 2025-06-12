document.addEventListener('DOMContentLoaded', async () => {
  //
  // ─── PART 1: “Featured Books” SECTION ───────────────────────────────────────
  //
  try {
    const response = await fetch('/api/books/');
    if (!response.ok) throw new Error('Failed to fetch books.');
    const books = await response.json();
    if (!Array.isArray(books)) throw new Error('Invalid books data format.');

    // Randomly pick up to 5 books
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

    const bookGrid = document.getElementById('bookGrid');
    randomBooks.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';

      const img = document.createElement('img');
      img.src = book.coverImage
        ? book.coverImage
        : '/public/images/book-covers/default-cover.jpg';
      img.alt = book.title;
      img.style.maxHeight = '200px';
      img.style.width = 'auto';
      img.style.objectFit = 'cover';
      card.appendChild(img);

      const title = document.createElement('div');
      title.className = 'book-title';
      title.textContent = book.title;
      card.appendChild(title);

      const authors = document.createElement('div');
      authors.className = 'book-authors';
      authors.textContent = Array.isArray(book.authors)
        ? book.authors.join(', ')
        : '';
      card.appendChild(authors);

      const detailsLink = document.createElement('a');
      detailsLink.href = `/books/details/${book.isbn}`;
      detailsLink.className = 'view-details';
      detailsLink.textContent = 'View Details';
      card.appendChild(detailsLink);

      bookGrid.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading featured books:', error);
  }

  // ─── PART 2: “Search” BAR HOOKUP ────────────────────────────────────────────
  function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    window.location.href = '/books/search?title=' + encodeURIComponent(query);
  }

  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }
  if (searchButton) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      performSearch();
    });
  }

  //
  // ─── PART 3: “NEWS SLIDER” SECTION ───────────────────────────────────────────
  //
  try {
    // 3.1 Fetch all published news from your Express endpoint
    const newsResponse = await fetch('/api/news/published');
    if (!newsResponse.ok) {
      throw new Error(`Failed to fetch published news: HTTP ${newsResponse.status}`);
    }
    const newsArray = await newsResponse.json();
    if (!Array.isArray(newsArray)) {
      throw new Error('Expected an array of news items');
    }

    // 1) If there are ZERO items:
    if (newsArray.length === 0) {
      // Hide the slider‐wrapper and dots, show “No news available.”
      document.querySelector('.slider‐wrapper').style.display = 'none';
      document.getElementById('sliderDots').style.display = 'none';
      document.getElementById('noNewsMessage').style.display = 'block';
      // Then bail out; we don’t need to build cards or attach any handlers.
      return;
    }

    // 2) If there is EXACTLY ONE item:
    if (newsArray.length === 1) {
      // We still want to render the single card, but center it and hide arrows/dots.
      // a) Hide arrows and dots entirely
      document.querySelector('.slider‐wrapper .prev').style.display = 'none';
      document.querySelector('.slider‐wrapper .next').style.display = 'none';
      document.getElementById('sliderDots').style.display = 'none';

      // b) Build exactly one <article> and then center it inside `.slides`
      const slidesContainer = document.querySelector('.news-slider .slides');
      const singleItem = newsArray[0];
      const article = document.createElement('article');
      article.className = 'card';
      article.style.cursor = 'pointer'; 
      article.addEventListener('click', () => {
        window.location.href = `/news/${singleItem.id}`;
      });

      const img = document.createElement('img');
      img.src = singleItem.imageUrl || '/public/images/news-pictures/default.png';
      img.alt = singleItem.title || 'News cover';
      article.appendChild(img);

      const textDiv = document.createElement('div');
      textDiv.className = 'card-text';
      textDiv.textContent = singleItem.title || 'Untitled News';
      article.appendChild(textDiv);

      // To center a single card, we override .slides’s default layout. 
      // One simple approach is to make .slides a flex container and center its contents:
      slidesContainer.style.display = 'flex';
      slidesContainer.style.justifyContent = 'center';
      slidesContainer.appendChild(article);

      // Now we’re done: no further slider logic needed.
      return;
    }

    // --------------- FALLBACK: 2 OR MORE ITEMS ---------------

    // If we get here, newsArray.length >= 2, so we proceed with “normal” slider logic:

    // 3.2 Build all <article class="card"> … </article> into .slides
    const slidesContainer = document.querySelector('.news-slider .slides');
    newsArray.forEach(item => {
      const article = document.createElement('article');
      article.className = 'card';
      article.style.cursor = 'pointer';

      // 3.2.a: When clicked, navigate to /news/{id}
      article.addEventListener('click', () => {
        window.location.href = `/news/${item.id}`;
      });

      const img = document.createElement('img');
      img.src = item.imageUrl || '/public/images/news-pictures/default.png';
      img.alt = item.title || 'News cover';
      article.appendChild(img);

      const textDiv = document.createElement('div');
      textDiv.className = 'card-text';
      textDiv.textContent = item.title || 'Untitled News';
      article.appendChild(textDiv);

      slidesContainer.appendChild(article);
    });

    // 3.3 Cache all card elements & the dots container
    const slider = slidesContainer; // alias
    const cards = Array.from(slider.querySelectorAll('.card'));
    const dotsContainer = document.getElementById('sliderDots');
    let currentPage = 0;

    // 3.4 Helper: how many cards per “page” based on viewport width
    function getItemsPerPage() {
      return window.innerWidth <= 600 ? 1 : 2;
    }

    // 3.5 Build dot elements based on number of pages
    function buildDots() {
      dotsContainer.innerHTML = '';
      const ipp = getItemsPerPage();
      const pageCount = Math.ceil(cards.length / ipp);

      for (let i = 0; i < pageCount; i++) {
        const dot = document.createElement('span');
        dot.className = i === 0 ? 'dot active' : 'dot';
        dot.dataset.page = i.toString();
        dot.addEventListener('click', () => goToPage(i));
        dotsContainer.appendChild(dot);
      }
    }

    // 3.6 Show only the cards for the given page (hiding others) and update dots
    function goToPage(page) {
      const ipp = getItemsPerPage();
      // We need the width of one card plus the gap between them
      const style = getComputedStyle(slider);
      const gap = parseInt(style.gap || style.columnGap || '0', 10);
      const cardWidth = cards[0].offsetWidth + gap;

      slider.scrollTo({
        left: page * cardWidth * ipp,
        behavior: 'smooth'
      });
      updateActiveDot(page);
    }

    function updateActiveDot(page) {
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((d, idx) => d.classList.toggle('active', idx === page));
      currentPage = page;
    }

    // 3.7 Prev / Next button handlers
    const prevBtn = document.querySelector('.news-slider .prev');
    const nextBtn = document.querySelector('.news-slider .next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 0) goToPage(currentPage - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(cards.length / getItemsPerPage()) - 1;
        if (currentPage < maxPage) goToPage(currentPage + 1);
      });
    }

    // 3.8 Sync dots when user scrolls manually (throttled via requestAnimationFrame)
    let isScrolling = false;
    slider.addEventListener('scroll', () => {
      if (isScrolling) return;
      window.requestAnimationFrame(() => {
        const ipp = getItemsPerPage();
        const style = getComputedStyle(slider);
        const gap = parseInt(style.gap || style.columnGap || '0', 10);
        const cardWidth = cards[0].offsetWidth + gap;
        const approximatePage = Math.round(slider.scrollLeft / (cardWidth * ipp));
        if (approximatePage !== currentPage) {
          updateActiveDot(approximatePage);
        }
        isScrolling = false;
      });
      isScrolling = true;
    });

    // 3.9 On resize, rebuild dots and reset to page 0
    window.addEventListener('resize', () => {
      buildDots();
      goToPage(0);
    });

    // 3.10 INITIALIZE: build dots and show page 0
    buildDots();
    goToPage(0);

  } catch (error) {
    console.error('Error initializing news slider:', error);
    // (Optional) show a “No news available” message if needed
  }

  (async function() {
    const slidesEl = document.getElementById('articlesSlides');
    const noMsg    = document.getElementById('noArticlesMessage');

    // Fetch published articles
    let articles = [];
    try {
      const res = await fetch('/api/articles/published?order=desc');
      if (!res.ok) throw new Error(res.status);
      articles = await res.json();
    } catch (e) {
      console.error('Failed to fetch articles:', e);
      noMsg.textContent = 'Gagal memuat artikel.';
      noMsg.style.display = '';
      return;
    }

    if (articles.length === 0) {
      noMsg.style.display = '';
      return;
    }

    // Render cards
    slidesEl.innerHTML = articles.map(a => `
      <a href="/articles/${a.id}" class="card" >
        <img src="${a.coverImage || '/public/images/articles-pictures/default.png'}" alt="${a.title}">
        <div class="card-text">${a.title}</div>
      </a>
    `).join('');
  })();
  
  // grab the container
  const slider = document.querySelector('.articles-slider .slides');
  let isDown = false;
  let startX;
  let scrollStart;

  // on mouse down, begin drag
  slider.addEventListener('mousedown', e => {
    isDown = true;
    slider.classList.add('active');      // optional: for styling
    startX = e.pageX - slider.offsetLeft;
    scrollStart = slider.scrollLeft;
  });

  // on mouse leave or up, end drag
  ['mouseleave','mouseup'].forEach(evt =>
    slider.addEventListener(evt, () => {
      isDown = false;
      slider.classList.remove('active');
    })
  );

  // on mouse move, if dragging, scroll
  slider.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1;        // multiplier for speed
    slider.scrollLeft = scrollStart - walk;
  });
}); // end DOMContentLoaded