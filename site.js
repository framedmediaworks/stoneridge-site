// ---------- Analytics (Plausible) ----------
// Injected here so every page is covered automatically, including any pages
// added later. Do not also paste the Plausible snippet into individual pages.
(function () {
  if (document.querySelector('script[src*="plausible.io"]')) return;
  window.plausible = window.plausible || function () { (plausible.q = plausible.q || []).push(arguments); };
  plausible.init = plausible.init || function (i) { plausible.o = i || {}; };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://plausible.io/js/pa-FNpGBLTeZF-S1oFMj3T-4.js';
  document.head.appendChild(s);
  plausible.init();
})();

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
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const items = document.querySelectorAll('.gal-grid a');
      items.forEach(it => {
        it.style.display = (cat === 'all' || it.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
}

// ---------- Primary nav: add the News link and enforce one canonical order ----------
// Netlify serves pretty URLs, so a link can arrive as "/golf" OR "golf.html".
// navKey() normalizes both forms so ordering works either way.
const NAV_ORDER = ['index', 'homes', 'golf', 'amenities', 'blog', 'gallery', 'contact'];
function navKey(href) {
  const last = String(href || '').split('/').pop().split('?')[0].split('#')[0];
  const base = last.replace(/\.html$/, '');
  return base === '' ? 'index' : base;
}
const currentNavKey = navKey(window.location.pathname);
document.querySelectorAll('nav.primary').forEach(nav => {
  const links = () => [...nav.querySelectorAll('a')];
  if (!links().some(a => navKey(a.getAttribute('href')) === 'blog')) {
    const link = document.createElement('a');
    link.href = 'blog.html';
    link.textContent = 'News';
    if (currentNavKey === 'blog') link.classList.add('active');
    nav.appendChild(link);
  }
  // re-appending an existing node moves it, so this orders and de-duplicates
  NAV_ORDER.forEach(key => {
    const a = links().find(x => navKey(x.getAttribute('href')) === key);
    if (a) nav.appendChild(a);
  });
});

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


// ---------- Community Center calendar (amenities.html) ----------
// Self-contained and guarded: no-ops on every page without #ccGrid.
// TO UPDATE EACH MONTH edit the CALENDAR object only.
//   weekly - repeats on a weekday (0=Sun ... 6=Sat)
//   skip   - date -> names NOT held that week
//   dated  - date -> one-off events and meetings
(function () {
  "use strict";

  var CALENDAR = {
    year: 2026,
    month: 6,               // zero-indexed: 6 = July
    title: "July",

    weekly: {
      1: [ ["9:00 AM","Yoga"], ["12:30 PM","Bridge"], ["4:30 PM","Sing Along"] ],
      2: [ ["7:45 AM","AM Shape Up"], ["8:35 AM","Water Aerobics"], ["9:35 AM","Water Aerobics"],
           ["12:30 PM","Texas Hold 'Em"], ["2:00 PM","Hand & Foot"] ],
      4: [ ["7:45 AM","AM Shape Up"], ["8:35 AM","Water Aerobics"], ["9:00 AM","Beaders"],
           ["12:30 PM","Mahjong"], ["4:30 PM","Bible Study"] ],
      5: [ ["9:00 AM","Yoga"], ["10:30 AM","Tai Chi"], ["1:00 PM","Omaha Poker"] ],
      6: [ ["9:30 AM","Ballet"] ]
    },

    skip: { 2:["Beaders"], 3:["Yoga"], 4:["Ballet"] },

    dated: {
      1:  [ ["3:00 PM","BOD Study Session"] ],
      4:  [ [null,"Community Center closes at 2 PM"] ],
      8:  [ ["3:30 PM","CALC"] ],
      9:  [ ["9:00 AM","DRC"], ["5:00 PM","Free Radicals Concert","5:00 - 7:00 PM"] ],
      10: [ ["2:00 PM","Ladies Tea","2:00 - 4:00 PM"] ],
      15: [ ["12:00 PM","Ladies Luncheon"], ["4:30 PM","Study Session"], ["5:30 PM","Board Meeting"] ],
      18: [ ["12:00 PM","Kona Ice Backpack Drive","12:00 - 2:00 PM"] ],
      20: [ ["5:00 PM","Bunco"] ],
      23: [ ["9:00 AM","DRC"], ["1:00 PM","Finance Committee"] ],
      30: [ ["3:00 PM","Book Club"] ],
      31: [ ["3:00 PM","TGIF","3:00 - 4:00 PM"] ]
    }
  };

  var calRoot = document.getElementById('calendar');
  var calGrid = document.getElementById('ccGrid');
  if (!calRoot || !calGrid) return;

  var calCount  = document.getElementById('ccCount');
  var calToggle = document.getElementById('ccStanding');
  var calTitle  = document.getElementById('ccCalTitle');
  var CC_DOW    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function ccEsc(s){
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c];
    });
  }

  function ccMinutes(t){
    if (!t) return -1;                        // all-day notices sort first
    var m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    var h = Number(m[1]) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + Number(m[2]);
  }

  var ccFirst = new Date(CALENDAR.year, CALENDAR.month, 1);
  var ccTotal = new Date(CALENDAR.year, CALENDAR.month + 1, 0).getDate();
  var ccNow   = new Date();
  var ccLive  = ccNow.getFullYear() === CALENDAR.year && ccNow.getMonth() === CALENDAR.month;

  if (calTitle){
    calTitle.innerHTML = ccEsc(CALENDAR.title) + ' <span>' + CALENDAR.year + '</span>';
  }

  var ccSpecials = 0;
  var ccHtml = '';
  var ccI, ccD;

  for (ccI = 0; ccI < ccFirst.getDay(); ccI++){
    ccHtml += '<div class="cc-day cc-day--blank" aria-hidden="true"></div>';
  }

  for (ccD = 1; ccD <= ccTotal; ccD++){
    var ccDow  = new Date(CALENDAR.year, CALENDAR.month, ccD).getDay();
    var ccSkip = CALENDAR.skip[ccD] || [];
    var ccEvents = [];

    (CALENDAR.weekly[ccDow] || []).forEach(function (row) {
      if (ccSkip.indexOf(row[1]) === -1){
        ccEvents.push({ time: row[0], name: row[1], kind: 'standing' });
      }
    });

    (CALENDAR.dated[ccD] || []).forEach(function (row) {
      ccEvents.push({ time: row[0], name: row[1], label: row[2], kind: 'special' });
      ccSpecials++;
    });

    ccEvents.sort(function (a, b) { return ccMinutes(a.time) - ccMinutes(b.time); });

    var ccCls = 'cc-day';
    if (ccDow === 0 || ccDow === 6) ccCls += ' cc-day--weekend';
    if (ccLive && ccNow.getDate() === ccD) ccCls += ' cc-day--today';

    ccHtml += '<div class="' + ccCls + '">' +
                '<span class="cc-day__num">' +
                  '<span class="cc-day__dow">' + CC_DOW[ccDow] + '</span><b>' + ccD + '</b>' +
                '</span>';

    ccEvents.forEach(function (ev) {
      if (!ev.time){
        ccHtml += '<p class="cc-ev cc-ev--special cc-ev--notice">' +
                    '<span class="cc-ev__name">' + ccEsc(ev.name) + '</span></p>';
      } else {
        ccHtml += '<p class="cc-ev cc-ev--' + ev.kind + '">' +
                    '<span class="cc-ev__time">' + ccEsc(ev.label || ev.time) + '</span>' +
                    '<span class="cc-ev__name">' + ccEsc(ev.name) + '</span></p>';
      }
    });

    ccHtml += '</div>';
  }

  calGrid.innerHTML = ccHtml;

  function ccSetCount(){
    if (!calCount) return;
    calCount.textContent = (calToggle && !calToggle.checked)
      ? 'Weekly classes hidden'
      : ccSpecials + ' special events this month';
  }
  ccSetCount();

  if (calToggle){
    calToggle.addEventListener('change', function () {
      calRoot.classList.toggle('cc-cal--special', !calToggle.checked);
      ccSetCount();
    });
  }
})();
