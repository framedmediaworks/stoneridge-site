// Renders the photo grid from content/gallery.json (managed in the Site Manager).
(function () {
  const grid = document.getElementById('galGrid');
  if (!grid) return;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  fetch('content/gallery.json')
    .then(r => r.json())
    .then(data => {
      const photos = (data.gallery || []).filter(p => p && p.image);
      if (!photos.length) {
        grid.innerHTML = '';
        return;
      }
      grid.innerHTML = photos.map(p =>
        `<a href="${esc(p.image)}" target="_blank" rel="noopener" data-cat="${esc(slug(p.category))}">` +
        `<img src="${esc(p.image)}" alt="${esc(p.caption || 'StoneRidge')}" loading="lazy"></a>`
      ).join('');

      // re-apply whichever filter is currently selected
      const active = document.querySelector('.gal-filter button.active');
      if (active) active.click();
    })
    .catch(() => { grid.innerHTML = ''; });
})();
