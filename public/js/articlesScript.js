;(function(){
  const form       = document.getElementById('filterForm');
  const titleInput = document.getElementById('titleFilter');
  const orderSelect= document.getElementById('orderSelect');
  const listEl     = document.getElementById('articlesList');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const order = orderSelect.value;
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    params.set('order', order);

    try {
      const res = await fetch(`/api/articles/published?${params}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const articles = await res.json();

      // Re-render list with coverImage and authorName
      listEl.innerHTML = articles.map(a => `
        <li class="article-item">
          <div class="article-thumb">
            ${a.coverImage
              ? `<img src="${a.coverImage}" alt="Cover for ${a.title}">`
              : ``
            }
          </div>
          <div class="article-info">
            <h2>${a.title}</h2>
            <div class="article-meta">
              By ${a.authorName}
            </div>
          </div>
        </li>
      `).join('');
    } catch (err) {
      alert('Failed to load articles: ' + err.message);
    }
  });
})();