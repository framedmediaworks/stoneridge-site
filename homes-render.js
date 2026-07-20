// Renders Available Homes and Floor Plans from the JSON files that Krista's team
// edits through the /admin CMS. Edit the content there — this file just displays it.

function escapeHTML(str){
  if(!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function specTag(value, label){
  if(!value) return '';
  return `<span>${escapeHTML(value)}${label ? ' ' + label : ''}</span>`;
}

// ---------- Available Homes ----------
const availGrid = document.getElementById('availGrid');
if(availGrid){
  fetch('content/homes.json')
    .then(r => r.json())
    .then(data => {
      const homes = data.homes || [];
      if(!homes.length){
        availGrid.innerHTML = '<p>No homes posted yet — check back soon.</p>';
        return;
      }
      availGrid.innerHTML = homes.map(h => {
        const isSold = (h.status || '').toLowerCase() !== 'active';
        const specs = [
          specTag(h.beds, 'Beds'),
          specTag(h.baths, 'Baths'),
          h.sqft ? specTag(h.sqft + ' Sq Ft') : '',
          specTag(h.garage, 'Garage')
        ].filter(Boolean).join('');

        if(!isSold){
          // Featured / active home card, full photo + gallery treatment
          const thumbs = (h.photos || []).slice(0,4).map(p => {
            const url = typeof p === 'string' ? p : (p && p.photo) || '';
            return url ? `<img src="${escapeHTML(url)}" alt="" loading="lazy">` : '';
          }).join('');
          const videoBtn = h.video
            ? `<a href="${escapeHTML(h.video)}" target="_blank" rel="noopener" class="btn btn-line">Watch Video Tour</a>`
            : '';
          return `
          <div class="avail-card featured">
            <div class="avail-photo">
              <span class="avail-status">${escapeHTML(h.status || 'Active')}</span>
              ${h.mainPhoto ? `<img src="${escapeHTML(h.mainPhoto)}" alt="${escapeHTML(h.plan)}" loading="lazy">` : ''}
            </div>
            <div class="avail-body">
              <div class="plan-eyebrow">${escapeHTML(h.plan)}</div>
              <h3>${escapeHTML(h.address)}</h3>
              ${(h.lot) ? `<p class="avail-addr">${escapeHTML(h.lot)}</p>` : ''}
              <div class="avail-specs">${specs}</div>
              ${h.price ? `<div class="plan-price" style="margin:0 0 16px;">${escapeHTML(h.price)}</div>` : ''}
              <p class="desc">${escapeHTML(h.description)}</p>
              ${thumbs ? `<div class="thumb-row">${thumbs}</div>` : ''}
              <div style="margin-top:22px; display:flex; gap:12px; flex-wrap:wrap;">
                <a href="contact.html" class="btn btn-solid">Schedule a Showing</a>
                ${videoBtn}
              </div>
            </div>
          </div>`;
        } else {
          // Sold / pending — compact card
          return `
          <div class="avail-card sold">
            <div class="avail-body">
              <span class="avail-status">${escapeHTML(h.status || 'Sold')}</span>
              <div class="plan-eyebrow">${escapeHTML(h.plan)}</div>
              <h3>${escapeHTML(h.address)}</h3>
              <div class="avail-specs">${specs}</div>
              <p class="desc">${escapeHTML(h.description)}</p>
              <a href="contact.html" class="btn btn-line">Join Interest List</a>
            </div>
          </div>`;
        }
      }).join('');
    })
    .catch(() => {
      availGrid.innerHTML = '<p>Available homes are updating — please check back shortly.</p>';
    });
}

// ---------- Floor Plans ----------
const planRow = document.getElementById('planRow');
if(planRow){
  fetch('content/plans.json')
    .then(r => r.json())
    .then(data => {
      const plans = data.plans || [];
      if(!plans.length){
        planRow.innerHTML = '<p>Floor plans are updating &mdash; check back soon.</p>';
        return;
      }
      planRow.innerHTML = plans.map(p => `
        <div class="plan-card">
          <div class="plan-eyebrow">${escapeHTML(p.eyebrow)}</div>
          <h3>${escapeHTML(p.name)}</h3>
          <span class="plan-sqft">${escapeHTML(p.sqft)} SQ FT &middot; ${escapeHTML(p.beds)} Bed &middot; ${escapeHTML(p.baths)} Bath</span>
          <p>${escapeHTML(p.description)}</p>
          ${p.price ? `<div class="plan-price">${escapeHTML(p.price)}</div>` : ''}
        </div>
      `).join('');
    })
    .catch(() => {
      planRow.innerHTML = '<p>Floor plans are updating &mdash; please check back shortly.</p>';
    });
}
