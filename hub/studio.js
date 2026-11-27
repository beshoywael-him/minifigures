/* Parts Studio (admins): photograph a real LEGO piece on white paper → cut out the background → place it → price it. */
(function (G) {
  const { $, $$, esc, h, toast, modal, confirmBox } = G.UI;
  const API = G.API, FIG = G.FIG;

  // Remove a plain background by flood-filling from the photo's edges, then trim to the piece.
  function cutout(img, tol) {
    const max = 900, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), hgt = Math.round(img.naturalHeight * k);
    const c = document.createElement("canvas"); c.width = w; c.height = hgt;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, w, hgt);
    const im = x.getImageData(0, 0, w, hgt), d = im.data;
    // background colour = median of the border pixels
    const R = [], Gc = [], B = [];
    for (let i = 0; i < w; i += 3) [0, hgt - 1].forEach((yy) => { const p = (yy * w + i) * 4; R.push(d[p]); Gc.push(d[p + 1]); B.push(d[p + 2]); });
    for (let j = 0; j < hgt; j += 3) [0, w - 1].forEach((xx) => { const p = (j * w + xx) * 4; R.push(d[p]); Gc.push(d[p + 1]); B.push(d[p + 2]); });
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
    const bg = [med(R), med(Gc), med(B)];
    const dist = (p) => Math.hypot(d[p] - bg[0], d[p + 1] - bg[1], d[p + 2] - bg[2]);
    const seen = new Uint8Array(w * hgt), q = new Int32Array(w * hgt); let qh = 0, qt = 0;
    const push = (i) => { if (!seen[i] && dist(i * 4) < tol) { seen[i] = 1; q[qt++] = i; } };
    for (let i = 0; i < w; i++) { push(i); push((hgt - 1) * w + i); }
    for (let j = 0; j < hgt; j++) { push(j * w); push(j * w + w - 1); }
    while (qh < qt) { const i = q[qh++], px = i % w, py = (i / w) | 0; d[i * 4 + 3] = 0;
      if (px > 0) push(i - 1); if (px < w - 1) push(i + 1); if (py > 0) push(i - w); if (py < hgt - 1) push(i + w); }
    // soften the edge: pixels touching the removed area that are close to the background get partly see-through
    for (let i = 0; i < w * hgt; i++) {
      if (seen[i]) continue; const px = i % w, py = (i / w) | 0;
      const nb = (px > 0 && seen[i - 1]) || (px < w - 1 && seen[i + 1]) || (py > 0 && seen[i - w]) || (py < hgt - 1 && seen[i + w]);
      if (nb) { const t = Math.min(1, Math.max(0, (dist(i * 4) - tol) / tol)); d[i * 4 + 3] = Math.round(255 * (0.35 + 0.65 * t)); }
    }
    x.putImageData(im, 0, 0);
    let x0 = w, y0 = hgt, x1 = -1, y1 = -1;
    for (let j = 0; j < hgt; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 < 0) return null;
    const pad = 4; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(hgt - 1, y1 + pad);
    const out = document.createElement("canvas"); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  let ALL = [];
  async function open(view, back) {
    view.innerHTML = '<div class="spinner"></div>';
    ALL = await API.partsAll();
    const active = ALL.filter((p) => p.active);
    FIG.setParts(active);
    const missing = FIG.NEEDED.filter((s) => !active.some((p) => p.slot === s && p.price === 0));
    view.innerHTML = `<button class="btn sm w back" id="bk">◀ All teams</button>
      <div class="card" style="margin-bottom:16px"><h3><span class="ic"><img src="${FIG.photo("morpho", 120)}" alt=""></span>Parts Studio</h3>
      <p style="font-weight:700;margin-top:0">Photograph real LEGO pieces and they become the Mini Figures' figures and store items.</p>
      <ol class="tips"><li>Put <b>one piece</b> on plain <b>white paper</b>, in daylight, no shadows.</li><li>Shoot straight from the front. Heads: face to the camera. Torsos: with arms and hands. Legs: both legs together.</li>
      <li>Upload, check the cut-out, slide it into place on the figure, set a price (0 = free for everyone), save.</li></ol>
      ${missing.length ? `<div class="err">To show real figures, add at least one <b>free</b> ${missing.map((s) => FIG.LABEL[s].toLowerCase().replace(/s$/, "")).join(", ")}. Until then kids see animal stickers.</div>` : '<div class="ok">Figures are live! Every kid has a free head, torso and legs.</div>'}
      <button class="btn g" id="newP">📷 Add a piece</button></div>
      <div id="plist"></div>`;
    $("#bk").onclick = back;
    $("#newP").onclick = () => editor(null, () => open(view, back));
    const pl = $("#plist");
    FIG.SLOTS.slice().reverse().forEach((s) => {
      const list = ALL.filter((p) => p.slot === s);
      const sec = h(`<div class="card" style="margin-bottom:14px"><h3>${FIG.LABEL[s]} <span class="pill">${list.length}</span></h3><div class="items"></div></div>`);
      if (!list.length) $(".items", sec).replaceWith(h('<p class="muted">None yet.</p>'));
      list.forEach((p) => {
        const b = h(`<button class="item ${p.active ? "" : "off"}">${FIG.partImg(p, 86)}<div class="nm">${esc(p.name)}</div>${p.price ? `<span class="price">${G.UI.coinHtml}${p.price}</span>` : '<span class="free">FREE</span>'}${p.active ? "" : '<span class="muted">hidden</span>'}</button>`);
        b.onclick = () => editor(p, () => open(view, back));
        $(".items", sec).append(b);
      });
      pl.append(sec);
    });
  }

  function editor(part, done) {
    let blob = null, img = null, dataUrl = part ? part.url : null;
    const fit = Object.assign({}, FIG.FIT[part ? part.slot : "head"], part ? part.fit : {});
    const f = h(`<div class="studio">
      <div class="col">${part ? "" : `<label class="btn w" style="cursor:pointer;width:100%">📷 Choose / take photo<input type="file" id="sf" accept="image/*" capture="environment" hidden></label>
        <label class="field" style="margin-top:10px"><span>Background cut strength</span><input type="range" id="tol" min="10" max="90" value="38"></label>`}
        <div class="checker" id="cut">${part ? `<img src="${esc(part.url)}" alt="">` : '<span class="muted">Your cut-out shows here</span>'}</div></div>
      <div class="col"><div class="stage night" id="pv"></div>
        <label class="field"><span>Size</span><input type="range" id="fw" min="0.15" max="1.3" step="0.01" value="${fit.w}"></label>
        <label class="field"><span>Left / right</span><input type="range" id="fx" min="-0.6" max="0.6" step="0.01" value="${fit.x}"></label>
        <label class="field"><span>Up / down</span><input type="range" id="fy" min="-0.3" max="1" step="0.01" value="${fit.y}"></label></div>
      <div class="col" style="grid-column:1/-1"><div class="grid g2" style="gap:10px">
        <label class="field"><span>Name</span><input class="input" id="nm" maxlength="40" value="${esc(part ? part.name : "")}" placeholder="e.g. Big smile, Explorer vest"></label>
        <label class="field"><span>Type</span><select class="input" id="sl" ${part ? "disabled" : ""}>${FIG.SLOTS.slice().reverse().map((s) => `<option value="${s}" ${part && part.slot === s ? "selected" : ""}>${FIG.LABEL[s]}</option>`).join("")}</select></label>
        <label class="field"><span>Price in gold coins (0 = free for all)</span><input class="input" id="pr" type="number" min="0" max="50" value="${part ? part.price : 0}"></label>
        ${part ? `<label class="chk"><input type="checkbox" id="ac" ${part.active ? "checked" : ""}> Show in the store</label>` : ""}</div></div></div>`);
    const slot = () => (part ? part.slot : $("#sl", f).value);
    const preview = () => {
      if (!dataUrl) { $("#pv", f).innerHTML = '<span class="muted" style="padding:20px;display:block">Preview</span>'; return; }
      const temp = { id: "__temp", slot: slot(), url: dataUrl, price: 0, fit: { w: +$("#fw", f).value, x: +$("#fx", f).value, y: +$("#fy", f).value } };
      const base = ALL.filter((p) => p.active && p.id !== (part && part.id));
      FIG.setParts(base.concat([temp]));
      const look = Object.assign({}, FIG.defaults(), { [temp.slot]: "__temp" });
      const full = FIG.hasFigure(look);
      $("#pv", f).innerHTML = full ? FIG.render(look, { size: 170 }) : `<div style="position:relative;width:170px;height:246px;margin:auto"><img src="${esc(dataUrl)}" alt="" style="position:absolute;width:${temp.fit.w * 170}px;left:${85 + temp.fit.x * 170}px;top:${temp.fit.y * 246}px;transform:translateX(-50%)"></div>`;
      FIG.setParts(base);
    };
    const runCut = () => {
      if (!img) return; const c = cutout(img, +$("#tol", f).value);
      if (!c) { $("#cut", f).innerHTML = '<span class="err">Nothing left after cutting. Lower the strength.</span>'; return; }
      dataUrl = c.toDataURL("image/png"); c.toBlob((b) => (blob = b), "image/png");
      $("#cut", f).innerHTML = `<img src="${dataUrl}" alt="Cut-out">`; preview();
    };
    if (!part) {
      $("#sf", f).onchange = (e) => { const file = e.target.files[0]; if (!file) return; const im = new Image(); im.onload = () => { img = im; runCut(); }; im.src = URL.createObjectURL(file); };
      $("#tol", f).oninput = () => { clearTimeout(f._t); f._t = setTimeout(runCut, 120); };
      $("#sl", f).onchange = () => { const d = FIG.FIT[slot()]; $("#fw", f).value = d.w; $("#fx", f).value = d.x; $("#fy", f).value = d.y; preview(); };
    }
    ["#fw", "#fx", "#fy"].forEach((s) => ($(s, f).oninput = preview));
    const btns = [{ t: "Cancel", cls: "w" }];
    btns.push({ t: part ? "Save" : "Save piece", cls: "g", fn: async () => {
      const name = $("#nm", f).value.trim(); if (!name) throw new Error("Give the piece a name");
      const price = Math.max(0, Math.min(50, parseInt($("#pr", f).value, 10) || 0));
      const fitv = { w: +$("#fw", f).value, x: +$("#fx", f).value, y: +$("#fy", f).value };
      if (part) await API.updatePart(part.id, { name, price, fit: fitv, active: $("#ac", f).checked });
      else { if (!blob) throw new Error("Choose a photo first"); await API.addPart({ slot: slot(), name, price, fit: fitv }, blob); }
      toast("Saved 🧱"); done();
    } });
    modal(part ? "Edit piece" : "Add a piece", f, btns, { wide: true, noFocus: true });
    setTimeout(preview, 30);
  }

  G.STUDIO = { open, cutout };
})(window);
