/* Shared UI helpers for the Mini Figures Hub (kids + coach). */
(function (G) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const ago = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + " min ago"; if (s < 86400) return Math.floor(s / 3600) + " h ago";
    const d = Math.floor(s / 86400); return d === 1 ? "yesterday" : d < 8 ? d + " days ago" : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  let toastT;
  function toast(msg, ms = 2600) {
    let t = $("#toast"); if (!t) { t = h('<div id="toast" class="toast" role="status" aria-live="polite"></div>'); document.body.append(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms);
  }
  // modal(title, bodyEl|html, buttons:[{t, cls, fn(close) => bool|Promise}], {wide})
  function modal(title, body, buttons = [], o = {}) {
    const m = h(`<div class="modal show" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="box ${o.wide ? "wide" : ""}"><h2>${esc(title)}</h2><div class="mb"></div><div class="err hidden"></div><div class="foot"></div></div></div>`);
    const mb = $(".mb", m); if (typeof body === "string") mb.innerHTML = body; else if (body) mb.append(body);
    const close = () => { m.remove(); document.removeEventListener("keydown", onKey); if (o.onClose) o.onClose(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    m.addEventListener("click", (e) => { if (e.target === m) close(); });
    const errBox = $(".err", m);
    buttons.forEach((b) => {
      const btn = h(`<button type="button" class="btn ${b.cls || ""}">${b.t}</button>`);
      btn.onclick = async () => {
        if (!b.fn) return close();
        btn.disabled = true; errBox.classList.add("hidden");
        try { const r = await b.fn(close, m); if (r !== false) close(); }
        catch (e) { errBox.textContent = e.message || String(e); errBox.classList.remove("hidden"); }
        finally { btn.disabled = false; }
      };
      $(".foot", m).append(btn);
    });
    document.body.append(m);
    const f = $("input,textarea,select", m); if (f && !o.noFocus) setTimeout(() => f.focus(), 50);
    return m;
  }
  const confirmBox = (title, html, okText, cls) => new Promise((res) => {
    modal(title, html, [{ t: "Cancel", cls: "w", fn: () => res(false) }, { t: okText || "Yes", cls: cls || "g", fn: () => res(true) }], { onClose: () => res(false) });
  });

  // ---------- labels ----------
  const LABEL_CLS = { "core values": "core", poster: "poster", model: "model", evaluation: "eval" };
  const labelChip = (l) => `<span class="lab ${LABEL_CLS[l] || "other"}">${esc(l)}</span>`;
  const teamTitle = (t) => (t && t.name ? t.name : "Team " + (t ? t.id : "?"));

  // ---------- rainforest layers, top to bottom ----------
  const LAYERS = {
    emergent: { name: "Emergent layer", h: "up to 70 m", fact: "The tallest trees poke out above everything. Eagles nest up here." },
    canopy: { name: "Canopy", h: "about 30 to 45 m", fact: "A roof of leaves. Most rainforest animals live here." },
    understory: { name: "Understory", h: "under 15 m", fact: "Shady and warm. Only a little sunlight gets this far down." },
    floor: { name: "Forest floor", h: "0 m", fact: "Dark and still. Fallen leaves become food for new plants." }
  };
  const LAYER_ORDER = ["emergent", "canopy", "understory", "floor"];
  const layerTag = (k, short) => `<div class="ltag"><b>${LAYERS[k].name}</b><span>${LAYERS[k].h}</span>${short ? "" : `<em>${LAYERS[k].fact}</em>`}</div>`;
  const layerBg = (k) => `style="--lp:url('${G.FIG.photo(k, 1600)}')"`;

  // ---------- figures ----------
  function parade(figs, meId, size = 120) {
    return figs.map((f) => `<div class="fig ${f.id === meId ? "me" : ""}">${G.FIG.render(f.look, { size, seed: f.username, label: f.display_name })}<span class="nm">${esc(String(f.display_name).split(" ")[0])}</span></div>`).join("");
  }

  // ---------- progress ----------
  function progressPct(team) { const p = (team && team.progress) || []; return p.length ? Math.round(100 * p.filter((x) => x.done).length / p.length) : 0; }
  function progressBricks(team) {
    const p = (team && team.progress) || []; const firstOpen = p.findIndex((x) => !x.done);
    return `<div class="pbar" aria-label="Progress ${progressPct(team)}%"><i style="width:${progressPct(team)}%"></i></div>
      <p class="muted" style="margin:8px 0 10px">${progressPct(team)}% of our build is done</p>
      <div class="bricks">${p.map((x, i) => `<div class="brickrow ${x.done ? "done" : i === firstOpen ? "next" : ""}"><span class="tick">${x.done ? "✓" : i === firstOpen ? "★" : ""}</span>${esc(x.k)}${i === firstOpen ? ' <span class="pill" style="margin-left:auto">Next</span>' : ""}</div>`).join("")}</div>`;
  }

  // ---------- task tower ----------
  // levels: open tasks grouped by priority. First level = NOW, the rest locked. Finished tasks listed at the end.
  function levels(tasks) {
    const open = tasks.filter((t) => t.status !== "done"), done = tasks.filter((t) => t.status === "done");
    const ps = [...new Set(open.map((t) => t.priority))].sort((a, b) => a - b);
    return { groups: ps.map((p) => ({ p, tasks: open.filter((t) => t.priority === p) })), done };
  }
  function nowNext(tasks) {
    const L = levels(tasks); const now = L.groups[0] ? L.groups[0].tasks : [];
    const doing = now.find((t) => t.status === "doing") || now[0] || null;
    const rest = [...now.filter((t) => t !== doing), ...(L.groups[1] ? L.groups[1].tasks : [])];
    return { now: doing, next: rest[0] || null };
  }
  // opts: {kid:true, meId, onStatus(task,status), onDelete(task), coach:true, onMove(task,delta), onEdit(task)}
  function tower(tasks, o) {
    const L = levels(tasks);
    const wrap = h('<div class="tower"></div>');
    if (!L.groups.length) wrap.append(h(`<div class="empty">All tasks are done. ${o.coach ? "Add the next one." : "Ask your coach what's next."}</div>`));
    L.groups.forEach((g, i) => {
      const now = i === 0;
      const lk = LAYER_ORDER[Math.min(i, 3)];
      const lv = h(`<section class="level lay ${now ? "now" : "locked"}" data-layer="${lk}" ${layerBg(lk)}><div class="lh"><span class="lname">${LAYERS[lk].name}</span><span class="badge">${now ? "DO NOW" : "Level " + (i + 1)}</span>
        <span class="muted">${now ? (g.tasks.length > 1 ? "Work on these together. Split them up." : "This is the most important task.") : "🔒 Opens when the level above is done"}</span></div><div class="tasks"></div></section>`);
      g.tasks.forEach((t) => $(".tasks", lv).append(taskCard(t, now, o)));
      wrap.append(lv);
    });
    if (L.done.length) {
      const lv = h(`<section class="level donel"><div class="lh"><span class="badge">DONE ✓</span><span class="muted">${L.done.length} finished</span></div><div class="tasks"></div></section>`);
      L.done.slice(0, o.coach ? 50 : 12).forEach((t) => $(".tasks", lv).append(taskCard(t, false, o)));
      wrap.append(lv);
    }
    return wrap;
  }
  function taskCard(t, unlocked, o) {
    const c = h(`<article class="task ${t.status}"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${labelChip(t.label)}${t.status === "doing" ? '<span class="pill" style="background:#FFE8CC">Working on it</span>' : ""}</div>
      <div class="tt">${esc(t.title)}</div>${t.details ? `<div class="td">${esc(t.details)}</div>` : ""}<div class="acts"></div></article>`);
    const acts = $(".acts", c);
    const B = (txt, cls, fn) => { const b = h(`<button type="button" class="btn sm ${cls}">${txt}</button>`); b.onclick = fn; acts.append(b); };
    if (o.kid) {
      if (t.status !== "done" && unlocked) {
        if (t.status === "todo") B("Start ▶", "o", () => o.onStatus(t, "doing"));
        B("Done ✓", "g", () => o.onStatus(t, "done"));
      } else if (t.status !== "done") acts.append(h('<span class="lock" aria-label="Locked">🔒</span>'));
      if (t.status === "done") B("Not done", "w", () => o.onStatus(t, "todo"));
      if (t.created_by === o.meId && t.status !== "done") B("🗑", "w", () => o.onDelete(t));
    }
    if (o.coach) {
      if (t.status !== "done") { B("▲", "w", () => o.onMove(t, -1)); B("▼", "w", () => o.onMove(t, 1)); }
      B("Edit", "w", () => o.onEdit(t));
      if (t.status !== "done") B("Done ✓", "g", () => o.onStatus(t, "done")); else B("Reopen", "w", () => o.onStatus(t, "todo"));
    }
    return c;
  }

  // ---------- library ----------
  const KIND_ICON = { photo: "📷", link: "🔗", text: "💡", video: "▶" };
  async function libraryGrid(items, onOpen) {
    const paths = items.filter((i) => i.storage_path).map((i) => i.storage_path);
    let urls = {}; try { urls = await G.API.photoUrls(paths); } catch (e) {}
    const grid = h('<div class="libgrid"></div>');
    items.forEach((it) => {
      let th = "";
      if (it.kind === "photo" && urls[it.storage_path]) th = `<div class="th" style="background-image:url('${esc(urls[it.storage_path])}')"></div>`;
      else if (it.kind === "video") { const id = G.API.ytId(it.url); th = `<div class="th" style="${id ? `background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')` : ""}"><span class="play">▶</span></div>`; }
      else if (it.kind === "text") th = `<div class="th">${esc((it.body || it.title).slice(0, 90))}</div>`;
      else th = `<div class="th">${KIND_ICON[it.kind] || "🔗"}</div>`;
      const host = it.url ? (() => { try { return new URL(it.url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } })() : "";
      const card = h(`<button type="button" class="lib ${it.kind}">${th}<div class="tx"><b>${esc(it.title || (it.kind === "photo" ? "Photo" : "Idea"))}</b><span>${KIND_ICON[it.kind]} ${esc(host || ago(it.created_at))}</span></div></button>`);
      card.onclick = () => onOpen(it, urls[it.storage_path]);
      grid.append(card);
    });
    if (!items.length) return h('<div class="empty">Nothing here yet. Add the first one.</div>');
    return grid;
  }
  function openItem(it, url, canDelete, onDelete) {
    let body = "";
    if (it.kind === "photo") body = url ? `<img src="${esc(url)}" alt="${esc(it.title || "Team photo")}">` : "<p>Photo not available.</p>";
    if (it.kind === "video") { const id = G.API.ytId(it.url); body = id ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(it.title || "Video")}" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>` : ""; }
    if (it.kind === "link") body = `<p><a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer" class="btn">Open the link ↗</a></p><p class="muted" style="overflow-wrap:anywhere">${esc(it.url)}</p>`;
    const text = it.body ? `<p style="font-weight:700;white-space:pre-wrap">${esc(it.body)}</p>` : "";
    const btns = [{ t: "Close", cls: "w" }];
    if (canDelete) btns.unshift({ t: "Delete", cls: "r", fn: async () => { if (await confirmBox("Delete this?", "It will be removed from the library.", "Delete", "r")) await onDelete(it); } });
    modal(it.title || (it.kind === "photo" ? "Team photo" : "Idea"), `<div class="viewer">${body}${text}<p class="muted">Added ${ago(it.created_at)}</p></div>`, btns, { wide: it.kind !== "text", noFocus: true });
  }
  // add form. sections: list of allowed {section, kinds}
  function addItemModal(teamId, section, onDone) {
    const kinds = section === "photo" ? ["photo"] : ["photo", "link", "text", "video"];
    const names = { photo: ["📷", "Photo"], link: ["🔗", "Rebrickable / link"], text: ["💡", "Write an idea"], video: ["▶", "YouTube video"] };
    let kind = kinds[0];
    const f = h(`<div>${kinds.length > 1 ? `<div class="kinds">${kinds.map((k) => `<button type="button" class="kind" data-k="${k}"><span class="e">${names[k][0]}</span>${names[k][1]}</button>`).join("")}</div>` : ""}
      <label class="field"><span>Title</span><input class="input" name="title" maxlength="120" placeholder="Give it a short name"></label>
      <label class="field k-photo"><span>Pick a photo</span><input class="input" type="file" name="file" accept="image/*"></label>
      <label class="field k-link"><span>Link (Rebrickable or any website)</span><input class="input" name="url_link" inputmode="url" placeholder="https://rebrickable.com/..."></label>
      <label class="field k-video"><span>YouTube link</span><input class="input" name="url_video" inputmode="url" placeholder="https://youtube.com/watch?v=..."></label>
      <label class="field k-body"><span>Notes</span><textarea class="input" name="body" maxlength="2000" placeholder="What do you like about it? How can we use it?"></textarea></label></div>`);
    const sync = () => {
      $$(".kind", f).forEach((b) => b.classList.toggle("on", b.dataset.k === kind));
      $(".k-photo", f).classList.toggle("hidden", kind !== "photo"); $(".k-link", f).classList.toggle("hidden", kind !== "link"); $(".k-video", f).classList.toggle("hidden", kind !== "video");
    };
    $$(".kind", f).forEach((b) => (b.onclick = () => { kind = b.dataset.k; sync(); }));
    sync();
    modal(section === "photo" ? "Add a team photo" : section === "coach_idea" ? "Add an idea for the team" : "Add a model idea", f, [{ t: "Cancel", cls: "w" }, { t: "Add it", cls: "g", fn: async () => {
      const title = $("[name=title]", f).value.trim(), body = $("[name=body]", f).value.trim();
      const item = { team_id: teamId, section, kind, title, body };
      let file = null;
      if (kind === "photo") { file = $("[name=file]", f).files[0]; if (!file) throw new Error("Pick a photo first"); if (!/^image\//.test(file.type)) throw new Error("That file is not a photo"); }
      if (kind === "link") { item.url = $("[name=url_link]", f).value.trim(); if (!/^https:\/\/\S+\.\S+/.test(item.url)) throw new Error("Paste a full link that starts with https://"); }
      if (kind === "video") { item.url = $("[name=url_video]", f).value.trim(); if (!G.API.ytId(item.url)) throw new Error("That doesn't look like a YouTube link"); }
      if (kind === "text" && !title && !body) throw new Error("Write your idea first");
      await G.API.addLibrary(item, file); toast("Added to the library"); onDone && onDone();
    } }]);
  }

  const coinHtml = '<span class="coin" aria-hidden="true">🪙</span>';
  const studHtml = '<span class="studi" aria-hidden="true"></span>';
  G.UI = { LAYERS, LAYER_ORDER, layerTag, layerBg, $, $$, esc, h, ago, toast, modal, confirmBox, labelChip, teamTitle, parade, progressPct, progressBricks, levels, nowNext, tower, libraryGrid, openItem, addItemModal, coinHtml, studHtml };
})(window);
