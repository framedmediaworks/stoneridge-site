// ---------- Home page Spotlight ----------
// Fills section.spotlight from the post marked Spotlight = Yes in the Site Manager.
// Falls back to the topmost published post. If neither exists, the markup already in
// index.html is left alone, so the section can never render blank.
(async function () {
  const sec = document.querySelector('section.spotlight');
  if (!sec) return;

  let data;
  try {
    const res = await fetch('content/posts.json?v=' + Date.now());
    if (!res.ok) return;
    data = await res.json();
  } catch (err) { return; }

  const posts = Array.isArray(data.posts) ? data.posts : [];
  const published = posts.filter(p => String(p.status || '').toLowerCase() === 'published');
  if (!published.length) return;

  const pick = published.find(p => String(p.spotlight || '').toLowerCase() === 'yes') || published[0];

  const img = sec.querySelector('.spotlight-photo img');
  if (img && pick.image) {
    img.src = pick.image;
    if (pick.title) img.alt = pick.title;
  }

  const col = sec.querySelectorAll('.wrap > div')[1];
  if (!col) return;

  const h2 = col.querySelector('h2');
  if (h2 && pick.title) h2.textContent = pick.title;

  const paras = col.querySelectorAll('p');
  const bodyParas = String(pick.body || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const lead = (pick.excerpt || bodyParas[0] || '').trim();
  if (paras[0]) paras[0].textContent = lead;
  if (paras[1]) {
    const second = bodyParas.find(t => t !== lead);
    if (second) paras[1].textContent = second;
    else paras[1].remove();
  }
})();
