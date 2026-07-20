// Renders News & Updates from content/posts.json (managed in the Site Manager).
(function () {
  const wrap = document.getElementById('newsList');
  if (!wrap) return;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  fetch('content/posts.json')
    .then(r => r.json())
    .then(data => {
      const posts = (data.posts || []).filter(p => (p.status || 'Published').toLowerCase() !== 'draft');
      if (!posts.length) {
        wrap.innerHTML = '<p class="news-empty">New updates are on the way &mdash; check back soon.</p>';
        return;
      }
      wrap.innerHTML = posts.map((p, i) => {
        const paras = (p.body || '')
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map(t => `<p>${esc(t)}</p>`)
          .join('');
        return `
        <article class="news-item${i === 0 ? ' featured' : ''}">
          ${p.image ? `<div class="news-photo"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>` : ''}
          <div class="news-body">
            ${p.date ? `<div class="news-date">${esc(p.date)}</div>` : ''}
            <h2>${esc(p.title)}</h2>
            ${p.excerpt ? `<p class="news-excerpt">${esc(p.excerpt)}</p>` : ''}
            ${paras}
          </div>
        </article>`;
      }).join('');
    })
    .catch(() => {
      wrap.innerHTML = '<p class="news-empty">Updates are loading &mdash; please refresh in a moment.</p>';
    });
})();
