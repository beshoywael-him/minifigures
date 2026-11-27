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
    morpho: { file: "Morpho peleides 2.jpg", name: "Blue morpho butterfly" }
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

  // o: {size, seed, label, slotOnly}
  function render(look, o = {}) {
    const size = o.size || 140, W = size, H = Math.round(size * 1.45);
    const r = resolve(look);
    if (!NEEDED.every((s) => r[s])) {
      const a = ANIMALS[hash(o.seed) % ANIMALS.length];
      return `<span class="mf-animal" style="width:${Math.round(size * 0.82)}px;height:${Math.round(size * 0.82)}px" role="img" aria-label="${esc(o.label || PHOTOS[a].name)}"><img src="${photo(a, 300)}" alt="" loading="lazy"></span>`;
    }
    const imgs = SLOTS.filter((s) => r[s]).map((s, i) => {
      const f = Object.assign({}, FIT[s], r[s].fit || {});
      return `<img class="mf-p" alt="" src="${esc(r[s].url)}" style="width:${(f.w * W).toFixed(1)}px;left:${(W / 2 + f.x * W).toFixed(1)}px;top:${(f.y * H).toFixed(1)}px;z-index:${i + 1}" loading="lazy">`;
    }).join("");
    return `<span class="mf" style="width:${W}px;height:${H}px" role="img" aria-label="${esc(o.label || "Mini Figure")}">${imgs}</span>`;
  }
  // One part on its own (store shelf, studio list)
  function partImg(p, size = 90) { return `<span class="mf-part" style="width:${size}px;height:${size}px"><img src="${esc(p.url)}" alt="${esc(p.name)}" loading="lazy"></span>`; }

  G.FIG = { SLOTS, NEEDED, FIT, LABEL, PHOTOS, photo, photoPage, setParts, defaults, resolve, hasFigure, render, partImg, get parts() { return parts; } };
})(window);
