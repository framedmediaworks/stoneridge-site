/* ============================================================
   StoneRidge Site Manager
   Talks directly to Netlify Identity (login) + Git Gateway
   (secure write access to the GitHub repo) — the same backend
   Decap CMS used, just with a fully custom front end.
   ============================================================ */

// EDIT ME: the live public site's URL — this admin panel is deployed
// separately from the main site, so "back to site" links need the
// full address rather than a relative link.
const MAIN_SITE_URL = "https://stoneridgeadmin.com/";

document.getElementById("backToSiteLogin").href = MAIN_SITE_URL;
document.getElementById("backToSiteHeader").href = MAIN_SITE_URL;

// Uploaded photos live in the main repo (correct — that's what the public site needs),
// but THIS admin panel is deployed to its own restricted folder and can't serve them
// from its own domain. So for anything we display here (previews, thumbnails), point
// root-relative paths back at the live site. Full URLs (existing hotlinked photos) pass through untouched.
function resolveImg(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return MAIN_SITE_URL.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path);
}

const GATEWAY = "/.netlify/git/github";
const BRANCH = "main";

let currentJwt = null;
let homes = [];       // array of home objects
let homesSha = null;  // needed to update content/homes.json
let plans = [];
let plansSha = null;

let editing = null; // {collection:'homes'|'plans', index: number|null}

/* ---------------- Field schemas ---------------- */
const HOME_FIELDS = [
  { key: "plan", label: "Plan / Home Name", type: "text", required: true },
  { key: "address", label: "Address", type: "text", required: true },
  { key: "status", label: "Status", type: "select", options: ["Active", "Pending", "Sold"] },
  { key: "price", label: "Price (leave blank to hide)", type: "text", hint: "e.g. From $709,000" },
  { key: "beds", label: "Beds", type: "text" },
  { key: "baths", label: "Baths", type: "text" },
  { key: "sqft", label: "Square Footage", type: "text" },
  { key: "lot", label: "Lot Size", type: "text" },
  { key: "garage", label: "Garage", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "mainPhoto", label: "Main Photo", type: "photo" },
  { key: "photos", label: "Additional Photos", type: "photo-list" },
  { key: "video", label: "Video Tour URL", type: "text", hint: "Optional — paste a Vimeo/YouTube link" }
];

const PLAN_FIELDS = [
  { key: "eyebrow", label: "Plan Number / Eyebrow", type: "text", hint: "e.g. The 2000 Plan" },
  { key: "name", label: "Plan Name", type: "text", hint: "e.g. The Outlaw" },
  { key: "sqft", label: "Square Footage", type: "text" },
  { key: "beds", label: "Beds", type: "text" },
  { key: "baths", label: "Baths", type: "text" },
  { key: "price", label: "Price", type: "text", hint: "e.g. From $709,000" },
  { key: "description", label: "Description", type: "textarea" }
];

/* ---------------- Utilities ---------------- */
function $(id) { return document.getElementById(id); }
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : str;
  return d.innerHTML;
}
function showStatus(msg, kind) {
  const el = $("statusBanner");
  el.textContent = msg;
  el.className = "status-banner " + (kind || "info");
  el.style.display = "block";
  if (kind === "ok") setTimeout(() => { el.style.display = "none"; }, 4000);
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode("0x" + p1)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str.replace(/\s/g, "")).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
}

/* ---------------- Git Gateway helpers ---------------- */
async function gwGet(path) {
  const res = await fetch(`${GATEWAY}/contents/${path}?ref=${BRANCH}`, {
    headers: { Authorization: `Bearer ${currentJwt}` }
  });
  if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status})`);
  const json = await res.json();
  return { data: JSON.parse(b64DecodeUnicode(json.content)), sha: json.sha };
}

async function gwPutJSON(path, dataObj, sha, message) {
  const body = {
    message: message || `Update ${path} via Site Manager`,
    content: b64EncodeUnicode(JSON.stringify(dataObj, null, 2)),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const res = await fetch(`${GATEWAY}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${currentJwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}). ${errText}`);
  }
  return res.json();
}

async function gwPutFile(path, base64Content, message) {
  const body = {
    message: message || `Upload ${path} via Site Manager`,
    content: base64Content,
    branch: BRANCH
  };
  const res = await fetch(`${GATEWAY}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${currentJwt}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Photo upload failed (${res.status}). ${errText}`);
  }
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(file, onProgress) {
  onProgress && onProgress("Uploading…");
  const base64 = await fileToBase64(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "-");
  const path = `images/uploads/${Date.now()}-${safeName}`;
  await gwPutFile(path, base64, `Upload photo: ${safeName}`);
  onProgress && onProgress("");
  return "/" + path;
}

/* ---------------- Auth ---------------- */
window.netlifyIdentity.on("init", user => {
  if (user) { onLogin(user); } else { showLogin(); }
});
window.netlifyIdentity.on("login", user => { onLogin(user); window.netlifyIdentity.close(); });
window.netlifyIdentity.on("logout", () => { showLogin(); });

$("loginBtn").addEventListener("click", () => window.netlifyIdentity.open("login"));
$("logoutBtn").addEventListener("click", () => window.netlifyIdentity.logout());

function showLogin() {
  $("loginScreen").style.display = "flex";
  $("dashboard").style.display = "none";
}

async function onLogin(user) {
  currentJwt = await user.jwt();
  $("loginScreen").style.display = "none";
  $("dashboard").style.display = "block";
  $("userEmail").textContent = user.email;
  loadAll();
}

/* ---------------- Load data ---------------- */
async function loadAll() {
  try {
    const h = await gwGet("content/homes.json");
    homes = h.data.homes || [];
    homesSha = h.sha;
    renderHomes();
  } catch (e) {
    $("homesList").innerHTML = `<p class="loading-msg">Couldn't load homes: ${esc(e.message)}</p>`;
  }
  try {
    const p = await gwGet("content/plans.json");
    plans = p.data.plans || [];
    plansSha = p.sha;
    renderPlans();
  } catch (e) {
    $("plansList").innerHTML = `<p class="loading-msg">Couldn't load plans: ${esc(e.message)}</p>`;
  }
}

/* ---------------- Tabs ---------------- */
document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const which = tab.dataset.tab;
    document.querySelectorAll(".admin-panel").forEach(p => {
      p.style.display = p.dataset.panel === which ? "block" : "none";
    });
  });
});

/* ---------------- Render cards ---------------- */
function renderHomes() {
  const el = $("homesList");
  if (!homes.length) { el.innerHTML = "<p class=\"loading-msg\">No homes yet — click Add New Home.</p>"; return; }
  el.innerHTML = homes.map((h, i) => {
    const isSold = (h.status || "").toLowerCase() !== "active";
    return `
    <div class="admin-card">
      <div class="admin-card-photo">
        <span class="admin-card-status ${isSold ? "sold" : ""}">${esc(h.status || "Active")}</span>
        ${h.mainPhoto ? `<img src="${esc(resolveImg(h.mainPhoto))}" alt="">` : ""}
      </div>
      <div class="admin-card-body">
        <div class="admin-card-eyebrow">${esc(h.plan)}</div>
        <div class="admin-card-title">${esc(h.address)}</div>
        <div class="admin-card-meta">${esc(h.beds || "")} bd &middot; ${esc(h.baths || "")} ba &middot; ${esc(h.sqft || "")} sqft</div>
        <div class="admin-card-actions">
          <button class="btn btn-line" onclick="openEdit('homes', ${i})">Edit</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function renderPlans() {
  const el = $("plansList");
  if (!plans.length) { el.innerHTML = "<p class=\"loading-msg\">No plans yet — click Add New Plan.</p>"; return; }
  el.innerHTML = plans.map((p, i) => `
    <div class="admin-card">
      <div class="admin-card-body">
        <div class="admin-card-eyebrow">${esc(p.eyebrow)}</div>
        <div class="admin-card-title">${esc(p.name)}</div>
        <div class="admin-card-meta">${esc(p.sqft || "")} sqft &middot; ${esc(p.beds || "")} bd &middot; ${esc(p.baths || "")} ba<br>${esc(p.price || "")}</div>
        <div class="admin-card-actions">
          <button class="btn btn-line" onclick="openEdit('plans', ${i})">Edit</button>
        </div>
      </div>
    </div>`).join("");
}

$("addHomeBtn").addEventListener("click", () => openEdit("homes", null));
$("addPlanBtn").addEventListener("click", () => openEdit("plans", null));

/* ---------------- Modal / form ---------------- */
function openEdit(collection, index) {
  editing = { collection, index };
  const fields = collection === "homes" ? HOME_FIELDS : PLAN_FIELDS;
  const list = collection === "homes" ? homes : plans;
  const entry = index === null ? {} : Object.assign({}, list[index]);
  if (collection === "homes" && !entry.status) entry.status = "Active";
  if (collection === "homes" && !entry.photos) entry.photos = [];

  $("modalTitle").textContent = (index === null ? "Add " : "Edit ") + (collection === "homes" ? "Home" : "Floor Plan");
  $("deleteEntryBtn").style.display = index === null ? "none" : "inline-flex";
  $("modalForm").innerHTML = fields.map(f => renderField(f, entry[f.key])).join("");
  $("modalForm").dataset.collection = collection;

  wirePhotoFields(entry);
  updatePreview(collection, entry);
  document.querySelectorAll("#modalForm [data-key]").forEach(inp => {
    inp.addEventListener("input", () => updatePreview(collection, readForm(fields)));
  });

  $("editModal").style.display = "flex";
}

function renderField(f, value) {
  const val = value == null ? "" : value;
  if (f.type === "select") {
    return `<div class="f-row"><label>${esc(f.label)}</label>
      <select data-key="${f.key}">
        ${f.options.map(o => `<option value="${esc(o)}" ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}
      </select></div>`;
  }
  if (f.type === "textarea") {
    return `<div class="f-row"><label>${esc(f.label)}</label><textarea data-key="${f.key}">${esc(val)}</textarea></div>`;
  }
  if (f.type === "photo") {
    return `<div class="f-row">
      <label>${esc(f.label)}</label>
      <input type="text" data-key="${f.key}" value="${esc(val)}" placeholder="Paste an image URL, or upload below">
      <div class="upload-row">
        <input type="file" accept="image/*" data-upload-for="${f.key}">
        <span class="upload-progress" data-progress-for="${f.key}"></span>
      </div>
      <div class="f-hint">Photos live on your Netlify/GitHub site once uploaded — no separate host needed.</div>
    </div>`;
  }
  if (f.type === "photo-list") {
    return `<div class="f-row">
      <label>${esc(f.label)}</label>
      <div class="photo-thumbs" data-list-for="${f.key}"></div>
      <div class="upload-row">
        <input type="file" accept="image/*" data-upload-list-for="${f.key}">
        <span class="upload-progress" data-progress-for="${f.key}"></span>
      </div>
    </div>`;
  }
  return `<div class="f-row"><label>${esc(f.label)}${f.required ? " *" : ""}</label>
    <input type="text" data-key="${f.key}" value="${esc(val)}" ${f.hint ? `placeholder="${esc(f.hint)}"` : ""}>
    ${f.hint ? `<div class="f-hint">${esc(f.hint)}</div>` : ""}</div>`;
}

function wirePhotoFields(entry) {
  // single photo upload
  document.querySelectorAll("[data-upload-for]").forEach(input => {
    input.addEventListener("change", async () => {
      const key = input.dataset.uploadFor;
      const progressEl = document.querySelector(`[data-progress-for="${key}"]`);
      const file = input.files[0];
      if (!file) return;
      try {
        progressEl.textContent = "Uploading…";
        const url = await uploadPhoto(file);
        document.querySelector(`[data-key="${key}"]`).value = url;
        progressEl.textContent = "Done";
        setTimeout(() => (progressEl.textContent = ""), 2000);
        updatePreview(editing.collection, readForm(editing.collection === "homes" ? HOME_FIELDS : PLAN_FIELDS));
      } catch (e) {
        progressEl.textContent = "";
        showStatus(e.message + " — try pasting an image URL instead.", "err");
      }
    });
  });

  // photo list (Additional Photos)
  let currentPhotos = (entry.photos || []).slice();
  function renderThumbs(key) {
    const wrap = document.querySelector(`[data-list-for="${key}"]`);
    wrap.innerHTML = currentPhotos.map((p, i) =>
      `<div class="photo-thumb"><img src="${esc(resolveImg(p))}" alt=""><button type="button" data-remove-idx="${i}">&times;</button></div>`
    ).join("");
    wrap.querySelectorAll("[data-remove-idx]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentPhotos.splice(Number(btn.dataset.removeIdx), 1);
        renderThumbs(key);
        window.__currentPhotosList = currentPhotos;
        updatePreview(editing.collection, readForm(editing.collection === "homes" ? HOME_FIELDS : PLAN_FIELDS));
      });
    });
  }
  window.__currentPhotosList = currentPhotos;

  document.querySelectorAll("[data-upload-list-for]").forEach(input => {
    const key = input.dataset.uploadListFor;
    renderThumbs(key);
    input.addEventListener("change", async () => {
      const progressEl = document.querySelector(`[data-progress-for="${key}"]`);
      const file = input.files[0];
      if (!file) return;
      try {
        progressEl.textContent = "Uploading…";
        const url = await uploadPhoto(file);
        currentPhotos.push(url);
        window.__currentPhotosList = currentPhotos;
        renderThumbs(key);
        progressEl.textContent = "Done";
        setTimeout(() => (progressEl.textContent = ""), 2000);
        updatePreview(editing.collection, readForm(editing.collection === "homes" ? HOME_FIELDS : PLAN_FIELDS));
      } catch (e) {
        progressEl.textContent = "";
        showStatus(e.message + " — try again, or paste photos in one at a time.", "err");
      }
    });
  });
}

function readForm(fields) {
  const out = {};
  fields.forEach(f => {
    if (f.type === "photo-list") { out[f.key] = (window.__currentPhotosList || []).slice(); return; }
    const el = document.querySelector(`[data-key="${f.key}"]`);
    out[f.key] = el ? el.value : "";
  });
  return out;
}

/* ---------------- Live preview (uses the real site's own CSS classes) ---------------- */
function updatePreview(collection, entry) {
  const stage = $("previewStage");
  if (collection === "homes") {
    const isSold = (entry.status || "Active").toLowerCase() !== "active";
    const specs = [entry.beds && entry.beds + " Beds", entry.baths && entry.baths + " Baths", entry.sqft && entry.sqft + " Sq Ft", entry.garage && entry.garage + " Garage"].filter(Boolean);
    stage.innerHTML = `
      <div class="avail-card ${isSold ? "sold" : "featured"}">
        ${!isSold ? `<div class="avail-photo"><span class="avail-status">${esc(entry.status || "Active")}</span>${entry.mainPhoto ? `<img src="${esc(resolveImg(entry.mainPhoto))}" alt="">` : ""}</div>` : ""}
        <div class="avail-body">
          ${isSold ? `<span class="avail-status" style="position:static; display:inline-block; margin-bottom:14px;">${esc(entry.status || "Sold")}</span>` : ""}
          <div class="plan-eyebrow">${esc(entry.plan)}</div>
          <h3>${esc(entry.address)}</h3>
          ${entry.lot ? `<p class="avail-addr">${esc(entry.lot)}</p>` : ""}
          <div class="avail-specs">${specs.map(s => `<span>${esc(s)}</span>`).join("")}</div>
          ${entry.price ? `<div class="plan-price" style="margin:0 0 16px;">${esc(entry.price)}</div>` : ""}
          <p class="desc">${esc(entry.description)}</p>
        </div>
      </div>`;
  } else {
    stage.innerHTML = `
      <div class="plan-card">
        <div class="plan-eyebrow">${esc(entry.eyebrow)}</div>
        <h3>${esc(entry.name)}</h3>
        <span class="plan-sqft">${esc(entry.sqft || "")} SQ FT &middot; ${esc(entry.beds || "")} Bed &middot; ${esc(entry.baths || "")} Bath</span>
        <p>${esc(entry.description)}</p>
        ${entry.price ? `<div class="plan-price">${esc(entry.price)}</div>` : ""}
      </div>`;
  }
}

/* ---------------- Save / Delete ---------------- */
$("modalClose").addEventListener("click", closeModal);
$("cancelEditBtn").addEventListener("click", closeModal);
function closeModal() { $("editModal").style.display = "none"; editing = null; }

$("saveEntryBtn").addEventListener("click", async () => {
  const fields = editing.collection === "homes" ? HOME_FIELDS : PLAN_FIELDS;
  const entry = readForm(fields);

  if (editing.collection === "homes") {
    const missing = HOME_FIELDS.filter(f => f.required && !entry[f.key]);
    if (missing.length) { showStatus(`Please fill in: ${missing.map(f => f.label).join(", ")}`, "err"); return; }
  }

  const list = editing.collection === "homes" ? homes : plans;
  if (editing.index === null) list.push(entry); else list[editing.index] = entry;

  $("saveEntryBtn").textContent = "Saving…";
  $("saveEntryBtn").disabled = true;
  try {
    if (editing.collection === "homes") {
      const result = await gwPutJSON("content/homes.json", { homes }, homesSha, "Update available homes via Site Manager");
      homesSha = result.content ? result.content.sha : homesSha;
      renderHomes();
    } else {
      const result = await gwPutJSON("content/plans.json", { plans }, plansSha, "Update floor plans via Site Manager");
      plansSha = result.content ? result.content.sha : plansSha;
      renderPlans();
    }
    showStatus("Published! Changes are live on the site now.", "ok");
    closeModal();
  } catch (e) {
    showStatus(e.message, "err");
  }
  $("saveEntryBtn").textContent = "Save & Publish";
  $("saveEntryBtn").disabled = false;
});

$("deleteEntryBtn").addEventListener("click", async () => {
  if (!confirm("Delete this entry? This can't be undone.")) return;
  const list = editing.collection === "homes" ? homes : plans;
  list.splice(editing.index, 1);
  try {
    if (editing.collection === "homes") {
      const result = await gwPutJSON("content/homes.json", { homes }, homesSha, "Delete home via Site Manager");
      homesSha = result.content ? result.content.sha : homesSha;
      renderHomes();
    } else {
      const result = await gwPutJSON("content/plans.json", { plans }, plansSha, "Delete plan via Site Manager");
      plansSha = result.content ? result.content.sha : plansSha;
      renderPlans();
    }
    showStatus("Deleted and published.", "ok");
    closeModal();
  } catch (e) {
    showStatus(e.message, "err");
  }
});
