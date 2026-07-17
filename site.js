// ---------- Header scroll state ----------
const header = document.getElementById('siteHeader');
if(header){
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll);
  onScroll();
}

// ---------- Mobile menu ----------
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('nav.primary');
if(menuToggle && primaryNav){
  menuToggle.addEventListener('click', () => {
    const open = primaryNav.style.display === 'flex';
    primaryNav.style.display = open ? 'none' : 'flex';
    primaryNav.style.cssText += open ? '' : 'position:fixed; top:70px; left:0; right:0; background:var(--ivory); flex-direction:column; padding:24px 32px; gap:20px; box-shadow:0 10px 30px rgba(0,0,0,0.12); z-index:99;';
    primaryNav.querySelectorAll('a').forEach(a => a.style.color = 'var(--granite)');
  });
}

// ---------- Elevation ticker ----------
const tickerTrack = document.getElementById('tickerTrack');
if(tickerTrack){
  const stats = [
    "5,200' Elevation", "1,800+ Acres", "18-Hole Championship Course",
    "Par 72 &middot; 7,052 Yards", "350' Elevation Change", "Designed by Randy Heckenkemper",
    "400+ Miles of Trails", "Now Building at Lookout Ridge"
  ];
  let html = '';
  for(let r=0; r<2; r++){ stats.forEach(s => { html += `<div class="ticker-item"><b>&bull;</b> ${s}</div>`; }); }
  tickerTrack.innerHTML = html;
}

// ---------- Interactive course map ----------
const mapStage = document.getElementById('mapStage');
if(mapStage){
  const holeNumEl = document.getElementById('holeNum');
  const holeTitleEl = document.getElementById('holeTitle');
  const holeDescEl = document.getElementById('holeDesc');

  // Positions match the custom vector map's green markers exactly (same coordinate
  // system used to draw course-map.svg), so dots always line up with the art.
  // Par assigned per hole for a realistic 72 total (four 3s, four 5s, ten 4s).
  const holes = [
    {n:1,  x:30.86, y:27.84, par:4, label:"Opening tee shot",              desc:"A confident starting hole with room off the tee, just below the clubhouse."},
    {n:2,  x:46.67, y:38.02, par:4, label:"Dogleg through the wash",        desc:"The fairway bends around a natural wash guarding the inside corner."},
    {n:3,  x:54.67, y:52.73, par:3, label:"Tucked green",                  desc:"A tightly guarded green tucked against the boulders."},
    {n:4,  x:49.09, y:75.63, par:4, label:"Uphill approach",                desc:"A demanding uphill approach to a well-bunkered green."},
    {n:5,  x:35.95, y:85.23, par:5, label:"Downhill par 5",                desc:"350 feet of elevation change starts to show here &mdash; a three-shot test."},
    {n:6,  x:17.73, y:81.28, par:4, label:"Water in play",                 desc:"A pond guards the front of the green &mdash; club up."},
    {n:7,  x:9.41,  y:68.21, par:3, label:"Canyon carry",                  desc:"A forced carry over a rocky wash guards the green."},
    {n:8,  x:8.75,  y:46.98, par:4, label:"Signature elevation change",    desc:"A dramatic tee shot with the Bradshaw foothills as a backdrop."},
    {n:9,  x:17.74, y:32.59, par:5, label:"Turning for home",              desc:"A three-shot par 5 that closes the front nine within sight of the clubhouse."},
    {n:10, x:73.25, y:28.67, par:4, label:"Back nine opener",              desc:"A sweeping dogleg to start the back nine."},
    {n:11, x:87.86, y:37.68, par:4, label:"Elevated green",                desc:"A raised green demands an extra club on the approach."},
    {n:12, x:93.25, y:56.11, par:3, label:"Risk and reward",               desc:"A tightly bunkered par 3 that rewards a precise tee shot."},
    {n:13, x:89.07, y:71.33, par:4, label:"Boulder-lined fairway",         desc:"Granite outcroppings frame both sides of the fairway."},
    {n:14, x:75.54, y:84.28, par:5, label:"Long par 5",                    desc:"One of the course's longer tests, climbing gently uphill."},
    {n:15, x:58.44, y:79.49, par:4, label:"Ridge-top approach",            desc:"The green sits on a shelf cut into the ridge."},
    {n:16, x:47.78, y:68.72, par:3, label:"Pond guarded green",            desc:"Water short of the green punishes a mis-hit tee shot."},
    {n:17, x:45.67, y:49.88, par:4, label:"Wash crossing",                 desc:"Play threads between two natural washes off the tee."},
    {n:18, x:56.30, y:33.68, par:5, label:"You have to see it to believe it", desc:"The signature closing hole, a reachable par 5 finishing right at the clubhouse."}
  ];

  const holeNumEl2 = holeNumEl, holeTitleEl2 = holeTitleEl;
  let dots = [];
  holes.forEach(h => {
    const dot = document.createElement('button');
    dot.className = 'hole-dot';
    dot.style.left = h.x + '%';
    dot.style.top = h.y + '%';
    dot.textContent = h.n;
    dot.setAttribute('aria-label', 'Hole ' + h.n);
    dot.addEventListener('click', () => selectHole(h, dot));
    mapStage.appendChild(dot);
    dots.push(dot);
  });

  function selectHole(h, dot){
    dots.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    holeNumEl.textContent = h.n;
    holeTitleEl.innerHTML = 'Hole ' + h.n + ' &middot; Par ' + h.par + ' &mdash; ' + h.label;
    holeDescEl.textContent = h.desc + ' Drone flyover to be added here.';
  }
}

// ---------- Gallery filter ----------
const galFilter = document.querySelector('.gal-filter');
if(galFilter){
  const buttons = galFilter.querySelectorAll('button');
  const items = document.querySelectorAll('.gal-grid a');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      items.forEach(it => {
        it.style.display = (cat === 'all' || it.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
}

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll('.reveal');
if(revealEls.length){
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold: 0.12});
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }
}

// ---------- Contact form (no backend yet, friendly no-op) ----------
const contactForm = document.getElementById('contactForm');
if(contactForm){
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Message Sent';
    btn.style.background = 'var(--canyon)';
    btn.style.borderColor = 'var(--canyon)';
  });
}
