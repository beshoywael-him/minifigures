/* Mini Figures — figures built from REAL photos of LEGO parts (uploaded by admins in the Parts Studio).
   No drawn artwork: until parts exist, a kid shows a round photo sticker of a rainforest animal. */
(function (G) {
  const SLOTS = ["legs", "torso", "head", "hair", "hat", "acc"];           // back to front
  const NEEDED = ["legs", "torso", "head"];
  // Where each part sits on the figure, as fractions of the figure box (w = width, x = shift from centre, y = top).
  const FIT = { legs: { w: 0.62, x: 0, y: 0.6 }, torso: { w: 0.86, x: 0, y: 0.33 }, head: { w: 0.44, x: 0, y: 0.08 },
    hair: { w: 0.54, x: 0, y: 0.02 }, hat: { w: 0.58, x: 0, y: -0.03 }, acc: { w: 0.36, x: 0.34, y: 0.42 } };
  const LABEL = { head: "Faces", hair: "Hair", hat: "Hats", torso: "Torsos", legs: "Legs", acc: "Extras" };

  // Real rainforest photos from Wikimedia Commons (free licences, credited in the app).
  const PHOTOS = {
    fireflies: { file: "Fireflies (35082682316).jpg", name: "Fireflies at night" },
    firefly: { file: "Photinus pyralis Firefly 3.jpg", name: "Firefly" },
    mushroom: { file: "Mycena chlorophos.jpg", name: "Glowing mushroom" },
    mushroom2: { file: "Glowing Mushroom.jpg", name: "Glowing mushrooms" },
    frog: { file: "Red eyed tree frog edit2.jpg", name: "Red-eyed tree frog" },
    toucan: { file: "Ramphastos sulfuratus -Belize Zoo-6a-2c.jpg", name: "Keel-billed toucan" },
    morpho: { file: "Morpho peleides 2.jpg", name: "Blue morpho butterfly" },
    emergent: { file: "Primary Rainforest (10623380025).jpg", name: "Emergent layer: primary rainforest under open sky" },
    canopy: { file: "Rainforest Canopy El Yunque National Forest.jpg", name: "Canopy: El Yunque National Forest" },
    understory: { file: "Chiapas Rainforest.jpg", name: "Understory: Chiapas rainforest" },
    floor: { file: "Buttress Roots St Lucia 0312.jpg", name: "Forest floor: buttress roots, St Lucia" }
  };
  const photo = (k, w = 400) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(PHOTOS[k].file) + "?width=" + w;
  const photoPage = (k) => "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(PHOTOS[k].file.replace(/ /g, "_"));
  const ANIMALS = ["frog", "toucan", "morpho", "mushroom", "firefly"];

  let parts = [];           // active parts with url (from the store)
  const byId = {};
  function setParts(list) { parts = (list || []).filter((p) => p.url); parts.forEach((p) => (byId[p.id] = p)); }
  function defaults() { const d = {}; NEEDED.forEach((s) => { const f = parts.find((p) => p.slot === s && p.price === 0); if (f) d[s] = f.id; }); return d; }
  function resolve(look) {
    const d = defaults(), L = Object.assign({}, d, look || {});
    const out = {}; SLOTS.forEach((s) => { const p = L[s] && L[s] !== "none" ? byId[L[s]] : null; if (p) out[s] = p; });
    return out;
  }
  const hasFigure = (look) => { const r = resolve(look); return NEEDED.every((s) => r[s]); };
  const hash = (s) => { let h = 0; for (const c of String(s || "")) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Each Mini Figure is one of six minifig pictures (backgrounds removed), stored in look.fig.
  const FIGS = ["bunny", "butterfly", "croc", "lion", "monkey", "parrot"];
  const figOf = (look, seed) => (look && FIGS.includes(look.fig) ? look.fig : FIGS[hash(seed || "x") % FIGS.length]);
  function render(look, o = {}) {
    const size = o.size || 140, H = Math.round(size * 1.05);
    const f = figOf(look, o.seed);
    return `<span class="mfx" style="height:${H}px" role="img" aria-label="${esc(o.label || "Mini Figure")}"><img src="${G.HUB_BASE || ""}figs/${f}.png" alt="" loading="lazy"></span>`;
  }
  // One part on its own (store shelf, studio list)
  function partImg(p, size = 90) { return `<span class="mf-part" style="width:${size}px;height:${size}px"><img src="${esc(p.url)}" alt="${esc(p.name)}" loading="lazy"></span>`; }

  G.FIG = { FIGS, figOf, SLOTS, NEEDED, FIT, LABEL, PHOTOS, photo, photoPage, setParts, defaults, resolve, hasFigure, render, partImg, get parts() { return parts; } };
})(window);
