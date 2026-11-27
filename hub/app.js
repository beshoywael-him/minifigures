/* Mini Figures Hub — kids' app, plus the shared login / password screens for the coach and admin pages. */
(function (G) {
  const { $, $$, esc, h, ago, toast, modal, confirmBox, teamTitle, parade, progressBricks, tower, libraryGrid, openItem, addItemModal, coinHtml } = G.UI;
  const API = G.API, FIG = G.FIG, EGGS = G.EGGS;
  const MODE = G.HUB_MODE || "kid";          // kid | coach | admin
  const root = $("#app");
  const S = { tab: "home", libTab: "idea", storeTab: "head" };
  const TITLE = { kid: "Mini Figures<br>Hub", coach: "Coach Room", admin: "Admin Room" };

  function demoBanner() {
    if (!API.demo) return "";
    const who = MODE === "kid" ? "zeyad / tiger-123a" : MODE === "coach" ? "tarif / coach1" : "marwa / admin2";
    return `<div class="demo-banner">DEMO MODE — sample data only. Try <b>${who}</b> <button type="button" id="demoReset">reset</button></div>`;
  }
  function wireDemo() { const b = $("#demoReset"); if (b) b.onclick = () => { API.reset(); location.reload(); }; }
  async function loadParts() { try { FIG.setParts(await API.parts()); } catch (e) {} try { G.UI.setArt(await API.art()); } catch (e) {} }

  // ================= LOGIN =================
  async function showLogin() {
    root.innerHTML = `${demoBanner()}<div class="login"><div class="hero lay" data-layer="emergent" ${G.UI.layerBg("emergent")}><div class="wrap enter">
      <img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix"><h1>${TITLE[MODE].replace("<br>", " ")}</h1><p class="tag">BIOGLOW season · Bottactix Academy</p>
      <div class="parade" id="lp"></div>${EGGS.sticker("toucan", "corner-l", 46)}</div><span class="heroart" id="ha"></span></div>
      <form class="card" id="lf" autocomplete="on" novalidate><h2 style="margin-bottom:14px">${MODE === "kid" ? "Sign in, Mini Figure" : MODE === "coach" ? "Coach sign in" : "Admin sign in"}</h2>
      <div class="err hidden" id="le"></div>
      <label class="field"><span>Username</span><input class="input" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      <label class="field"><span>Password</span><input class="input" name="p" type="password" autocomplete="current-password" required></label>
      <button class="btn" style="width:100%" type="submit">Sign in</button>
      <p class="muted" style="text-align:center;margin:14px 0 0">Forgot your password? Ask your ${MODE === "kid" ? "coach" : "admin"} for a new one.</p></form>
      <div class="floorband lay" data-layer="floor" ${G.UI.layerBg("floor")}><p class="foot"><a href="#" data-credits>Photos: Wikimedia Commons contributors</a></p></div></div>`;
    wireDemo();
    try {
      await loadParts();
      $("#ha").innerHTML = G.UI.mascot("hero") || G.UI.mascot("emergent");
      const looks = (await API.parade()).filter((l) => FIG.hasFigure(l)); const n = innerWidth < 600 ? 3 : innerWidth < 1000 ? 5 : 7;
      const list = looks.sort(() => Math.random() - 0.5).slice(0, n);
      $("#lp").innerHTML = list.map((l, i) => FIG.render(l, { size: innerWidth < 600 ? 84 : 110, seed: "p" + i + Math.random() })).join("");
    } catch (e) {}
    $("#lf").onsubmit = async (e) => {
      e.preventDefault(); const f = e.target, err = $("#le"); err.classList.add("hidden");
      const b = $("button[type=submit]", f); b.disabled = true;
      try { await API.signIn(f.u.value, f.p.value); boot(); }
      catch (x) { err.textContent = x.message; err.classList.remove("hidden"); }
      finally { b.disabled = false; }
    };
  }

  async function showChangePw(me) {
    root.innerHTML = `${demoBanner()}<div class="login"><div class="hero lay" data-layer="emergent" ${G.UI.layerBg("emergent")} style="min-height:230px"><div class="wrap enter"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix">
      <div class="parade">${FIG.render(me.look, { size: 110, seed: me.username })}</div></div></div>
      <form class="card" id="pf" novalidate><h2>Welcome, ${esc(me.display_name.split(" ")[0])}</h2>
      <p style="font-weight:700">First, make your <b>own secret password</b>. Don't share it with anyone${MODE === "kid" ? ", not even your teammates" : ""}.</p>
      <div class="err hidden" id="pe"></div>
      <label class="field"><span>New password (6 or more letters/numbers)</span><input class="input" name="a" type="password" autocomplete="new-password" minlength="6" required></label>
      <label class="field"><span>Type it again</span><input class="input" name="b" type="password" autocomplete="new-password" required></label>
      <button class="btn g" style="width:100%" type="submit">Save my password</button>
      <button class="link" type="button" id="so" style="display:block;margin:10px auto 0">Sign out</button></form></div>`;
    wireDemo();
    $("#so").onclick = async () => { await API.signOut(); boot(); };
    $("#pf").onsubmit = async (e) => {
      e.preventDefault(); const f = e.target, err = $("#pe"); err.classList.add("hidden");
      try {
        if (f.a.value !== f.b.value) throw new Error("The two passwords are not the same");
        await API.changePassword(f.a.value); toast("Password saved"); boot();
      } catch (x) { err.textContent = x.message; err.classList.remove("hidden"); }
    };
  }

  function wrongPlace() {
    const msg = { kid: "This page is for Mini Figures. Coaches and admins have their own links.", coach: "This page is only for coaches. Admins have their own page.", admin: "This page is only for admins." }[MODE];
    root.innerHTML = `<div class="login"><div class="hero lay" data-layer="emergent" ${G.UI.layerBg("emergent")} style="min-height:200px"><div class="wrap enter"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix"><h1>Wrong page</h1></div></div>
      <div class="card" style="width:min(440px,calc(100% - 28px));margin:20px auto"><p style="font-weight:800">${msg}</p><button class="btn" id="so">Sign out</button></div></div>`;
    $("#so").onclick = async () => { await API.signOut(); boot(); };
  }

  // ================= KID APP =================
  const TABS = [["home", "🏠", "Home"], ["tasks", "🧱", "Tasks"], ["library", "📚", "Library"], ["store", "🛍️", "Store"], ["ask", "💬", "Ask"]];
  let D = {};

  async function loadAll() {
    const me = await API.me(true);
    const t = me.team_id;
    const [team, figs, coaches, kids, tasks, ann] = await Promise.all([API.team(t), API.figs(t), API.myCoaches(), API.kids(t), API.tasks(t), API.announcements(t), loadParts()]);
    D = Object.assign(D, { me, team, figs, coaches, kids, tasks, ann });
  }

  function shell() {
    const me = D.me;
    const nav = () => TABS.map(([k, i, t]) => `<button class="navbtn" data-t="${k}"><span class="ni" aria-hidden="true">${i}</span>${t}</button>`).join("");
    root.innerHTML = `${demoBanner()}<aside class="side"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix">${nav()}
      <div class="grow"></div><a href="#" class="muted credit" data-credits>Photos: Wikimedia Commons</a><button class="navbtn" id="so2"><span class="ni" aria-hidden="true">🚪</span>Sign out</button></aside>
      <div class="shell"><header class="topbar"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix"><span class="uname" style="font-weight:900">${esc(me.display_name)}</span><span class="grow"></span>
        <div class="wallet"><span class="chip" title="Gold coins (for the store)">${coinHtml}<span id="wc">${me.coins}</span></span></div>
        <button class="btn sm w" id="so" aria-label="Sign out" title="Sign out">🚪</button></header>
        <nav class="topnav">${nav()}</nav>
        <section class="teamhero lay" id="hero" data-layer="emergent" ${G.UI.layerBg("emergent")}></section><main class="main" id="view"></main></div>
      <nav class="bottomnav">${nav()}</nav>`;
    wireDemo();
    $$("[data-t]").forEach((b) => (b.onclick = () => go(b.dataset.t)));
    $("#so").onclick = $("#so2").onclick = async () => { await API.signOut(); D = {}; boot(); };
  }
  function hero() {
    const t = D.team;
    $("#hero").innerHTML = `<div class="wrap enter"><div class="row">${t && t.logo_url ? `<img class="tlogo" src="${esc(t.logo_url)}" alt="">` : ""}<span class="tname">${esc(teamTitle(t))}</span>${t ? `<span class="slot">📅 ${esc(t.slot)}</span>` : ""}</div>${G.UI.layerTag("emergent", true)}
      <div class="parade">${parade(D.figs, D.me.id, innerWidth < 600 ? 96 : 120)}</div>${EGGS.sticker("firefly", "corner-r", 44)}</div>${G.UI.mascot("emergent")}`;
  }
  function wallet() { $("#wc").textContent = D.me.coins; }

  function go(tab) {
    S.tab = tab;
    $$("[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
    const v = $("#view"); v.innerHTML = '<div class="spinner"></div>';
    const lk = { library: "canopy", store: "understory", ask: "floor" }[tab];
    v.className = "main" + (tab === "home" ? " home" : lk ? " lay solo" : "");
    if (lk) v.dataset.layer = lk; else delete v.dataset.layer;
    ({ home, tasks: tasksView, library, store, ask })[tab]().then(() => { if (lk) v.insertAdjacentHTML("afterbegin", G.UI.mascot(lk, "solo-m")); }).catch((e) => { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; });
    scrollTo({ top: 0, behavior: "smooth" });
  }
  const head = (ic, title, extra = "") => `<h3><span style="flex:1">${title}</span>${extra}</h3>`;

  // ---------- HOME: walk down the rainforest ----------
  async function home() {
    const me = D.me, t = D.team, U = G.UI;
    const { now, next } = UI.nowNext(D.tasks);
    const v = $("#view");
    const band = (k, inner) => `<section class="layer lay" id="L-${k}" data-layer="${k}">${U.mascot(k)}${U.layerTag(k)}${inner}</section>`;
    v.innerHTML = band("canopy", `<div class="grid g2">
      <div class="card">${head("", "Me")}<div class="mecard"><div class="big">${FIG.render(me.look, { size: 120, seed: me.username, label: me.display_name })}</div>
        <div class="stats"><div class="who">${esc(me.display_name)}</div>
        <div class="stat">${coinHtml}<div><b>${me.coins}</b><div class="lbl">gold coins<br>for the store</div></div></div>
        <button class="btn sm" data-go="store">Dress up in the store</button></div></div></div>
      <div class="card">${head("", "My team")}
        <p style="margin:0 0 6px"><b>${esc(teamTitle(t))}</b> · ${esc(t ? t.slot : "")}</p>
        <p class="muted" style="margin:0 0 10px">Coach: <b>${esc(D.coaches.join(", ") || "—")}</b></p>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${D.kids.map((k) => `<span class="pill">${esc(k.name.split(" ").slice(0, 2).join(" "))}</span>`).join("")}</div></div></div>
      ${EGGS.sticker("toucan", "perch", 56)}`)
    + band("understory", `<div class="grid g2">
      <div class="card">${head("", "Do now")}
        ${now ? `<div class="task ${now.status}" style="margin-bottom:10px">${UI.labelChip(now.label)}<div class="tt">${esc(now.title)}</div></div>` : '<p class="muted">No tasks right now.</p>'}
        ${next ? `<p class="muted" style="margin:6px 0 10px">Next: <b>${esc(next.title)}</b></p>` : ""}<button class="btn sm w" data-go="tasks">Open the task tower</button></div>
      <div class="card">${head("", "Our build")}${progressBricks(t)}</div></div>
      ${EGGS.sticker("frog", "perch", 52)}`)
    + band("floor", `<div class="card">${head("", "Announcements")}
        ${D.ann.length ? D.ann.slice(0, 6).map((a) => `<div class="ann ${a.team_id == null ? "all" : ""}"><div class="meta">${a.team_id == null ? "For all Mini Figures" : "From your coach"} · ${ago(a.created_at)}</div>${esc(a.body)}</div>`).join("") : '<p class="muted">Nothing new.</p>'}</div>
      ${EGGS.sticker("mushroom", "perch", 50)}<p class="foot"><a href="#" data-credits>Photos: Wikimedia Commons contributors</a></p>`)
    + `<nav class="depth" aria-label="Rainforest layers">${["emergent", "canopy", "understory", "floor"].map((k) => `<a href="#${k === "emergent" ? "hero" : "L-" + k}" data-d="${k}">${U.LAYERS[k].name}</a>`).join("")}</nav>`;
    $$("[data-go]", v).forEach((b) => (b.onclick = () => go(b.dataset.go)));
    // depth gauge: highlight the layer you are in
    const links = $$(".depth a", v);
    links.forEach((a) => (a.onclick = (e) => { e.preventDefault(); const el = document.querySelector(a.getAttribute("href")); if (el) el.scrollIntoView({ behavior: "smooth" }); }));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.dataset.d === (x.target.dataset.layer || "emergent"))); }), { rootMargin: "-45% 0px -50% 0px" });
      [$("#hero"), ...$$(".layer", v)].forEach((el) => el && io.observe(el));
    }
  }

  // ---------- TASKS ----------
  async function tasksView() {
    D.tasks = await API.tasks(D.me.team_id);
    const v = $("#view");
    v.innerHTML = `<div class="pagehead"><h2 style="flex:1">Task tower</h2><button class="btn g" id="addT">+ Add a task</button></div>
      <p class="muted" style="margin:-6px 0 14px">Start at the top. A level opens only when the level above it is all done.</p>`;
    v.append(tower(D.tasks, {
      kid: true, meId: D.me.id,
      onStatus: async (t, s) => {
        try { await API.setTaskStatus(t.id, s); if (s === "done") { toast("Task done. Nice work."); EGGS.toucanFly(); } tasksView(); }
        catch (e) { toast(e.message, 3500); }
      },
      onDelete: async (t) => { if (await confirmBox("Delete this task?", esc(t.title), "Delete", "r")) { await API.deleteTask(t.id); tasksView(); } }
    }));
    $("#addT").onclick = () => {
      const f = h(`<div><label class="field"><span>What needs to be done?</span><input class="input" name="t" maxlength="140" placeholder="e.g. Build the bridge for the monkeys"></label>
        <label class="field"><span>Type</span><select class="input" name="l">${API.LABELS.map((l) => `<option>${l}</option>`).join("")}<option value="other">other</option></select></label>
        <label class="field"><span>Details (optional)</span><textarea class="input" name="d" maxlength="1000"></textarea></label><p class="muted">Your task goes to the bottom level. Your coach can move it up.</p></div>`);
      modal("New task", f, [{ t: "Cancel", cls: "w" }, { t: "Add task", cls: "g", fn: async () => {
        const title = $("[name=t]", f).value.trim(); if (!title) throw new Error("Write the task first");
        await API.addTask({ team_id: D.me.team_id, title, details: $("[name=d]", f).value.trim(), label: $("[name=l]", f).value, priority: 1 });
        toast("Task added"); tasksView();
      } }]);
    };
  }

  // ---------- LIBRARY ----------
  async function library() {
    const items = await API.library(D.me.team_id);
    const v = $("#view");
    const tabs = [["idea", "💡 Model ideas"], ["photo", "📷 Team photos"], ["coach_idea", "🎓 From coach"]];
    const list = items.filter((i) => i.section === S.libTab);
    v.innerHTML = `<div class="pagehead"><h2 style="flex:1">Team library</h2>${EGGS.sticker("morpho", "", 46)}
      ${S.libTab !== "coach_idea" ? `<button class="btn g" id="addL">+ Add ${S.libTab === "photo" ? "a photo" : "an idea"}</button>` : ""}</div>
      <div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button class="tab ${S.libTab === k ? "on" : ""}" role="tab" aria-selected="${S.libTab === k}" data-l="${k}">${t} (${items.filter((i) => i.section === k).length})</button>`).join("")}</div>`;
    $$("[data-l]", v).forEach((b) => (b.onclick = () => { S.libTab = b.dataset.l; library(); }));
    v.append(await libraryGrid(list, (it, url) => openItem(it, url, it.added_by === D.me.id, async (x) => { await API.deleteLibrary(x); toast("Deleted"); library(); })));
    const add = $("#addL"); if (add) add.onclick = () => addItemModal(D.me.team_id, S.libTab, library);
  }

  // ---------- STORE ----------
  const SHELF = [["head", "😀 Faces"], ["hair", "💇 Hair"], ["hat", "🧢 Hats"], ["torso", "👕 Torsos"], ["legs", "👖 Legs"], ["acc", "🎒 Extras"]];
  const LOOK_KEYS = ["head", "hair", "hat", "torso", "legs", "acc"];
  let draft = null;
  const pick = (o) => { const r = {}; LOOK_KEYS.forEach((k) => { if (o && o[k]) r[k] = o[k]; }); return r; };
  async function store() {
    await loadParts();
    const me = D.me; if (!draft) draft = Object.assign(FIG.defaults(), pick(me.look));
    const v = $("#view");
    const dirty = JSON.stringify(pick(draft)) !== JSON.stringify(pick(Object.assign(FIG.defaults(), pick(me.look))));
    const any = FIG.parts.length > 0;
    v.innerHTML = `<div class="pagehead"><h2 style="flex:1">Minifig store</h2>${EGGS.sticker("mushroom", "", 46)}</div>
      <div class="storewrap"><div class="mirror"><div class="card"><div class="stage night">${FIG.render(draft, { size: 170, seed: me.username })}<div class="floor"></div></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px"><span class="chip">${coinHtml}${me.coins} coins</span></div>
      <button class="btn g" id="saveL" style="width:100%" ${dirty ? "" : "disabled"}>${dirty ? "Save my look" : "Looking good"}</button>
      ${dirty ? '<button class="link" id="undoL">Undo changes</button>' : ""}</div></div>
      <div><div class="tabs">${SHELF.map(([k, t]) => `<button class="tab ${S.storeTab === k ? "on" : ""}" data-s="${k}">${t}</button>`).join("")}</div><div id="shelf"></div></div></div>`;
    $$("[data-s]", v).forEach((b) => (b.onclick = () => { S.storeTab = b.dataset.s; store(); }));
    $("#saveL").onclick = async () => { try { D.me = await API.setLook(pick(draft)); draft = null; toast("Look saved"); D.figs = await API.figs(D.me.team_id); hero(); store(); } catch (e) { toast(e.message, 3500); } };
    const u = $("#undoL"); if (u) u.onclick = () => { draft = null; store(); };
    const shelf = $("#shelf");
    if (!any) { shelf.innerHTML = `<div class="card empty">New LEGO pieces are on the way.<br>Your coaches are adding them now.</div>`; return; }
    const items = FIG.parts.filter((i) => i.slot === S.storeTab);
    const g = h('<div class="items"></div>');
    if (["hair", "hat", "acc"].includes(S.storeTab)) {
      const none = h(`<button class="item ${!draft[S.storeTab] || draft[S.storeTab] === "none" ? "on" : ""}"><span class="mf-part" style="width:86px;height:86px;font-size:40px;display:grid;place-items:center">🚫</span><div class="nm">None</div><span class="free">Take off</span></button>`);
      none.onclick = () => { draft[S.storeTab] = "none"; store(); }; g.append(none);
    }
    if (!items.length) g.append(h('<p class="muted" style="grid-column:1/-1">Nothing here yet. Check back soon.</p>'));
    items.forEach((it) => {
      const owned = it.price === 0 || me.owned.includes(it.id);
      const b = h(`<button class="item ${draft[it.slot] === it.id ? "on" : ""} ${!owned && me.coins < it.price ? "cant" : ""}">${FIG.partImg(it, 86)}
        <div class="nm">${esc(it.name)}</div>${it.price === 0 ? '<span class="free">FREE</span>' : owned ? '<span class="own">✓ Yours</span>' : `<span class="price">${coinHtml}${it.price}</span>`}</button>`);
      b.onclick = () => (owned ? wear(it) : buy(it));
      g.append(b);
    });
    shelf.append(g);
  }
  function wear(it) { draft[it.slot] = draft[it.slot] === it.id && ["hair", "hat", "acc"].includes(it.slot) ? "none" : it.id; store(); }
  async function buy(it) {
    const me = D.me, left = me.coins - it.price;
    const look = Object.assign({}, draft, { [it.slot]: it.id });
    if (left < 0) {
      modal("Not enough coins yet", `<div style="text-align:center">${FIG.partImg(it, 130)}<p style="font-weight:800">${esc(it.name)} costs <b>${it.price}</b> gold coins. You have <b>${me.coins}</b>.<br>Keep leading your team and your coach will give you more.</p></div>`, [{ t: "OK", cls: "" }], { noFocus: true });
      return;
    }
    modal("Buy " + it.name + "?", `<div style="text-align:center"><div class="stage night" style="display:inline-block;padding:10px 20px 0;border-radius:20px">${FIG.render(look, { size: 120, seed: me.username })}</div>
      <p style="font-weight:800;font-size:18px">It costs <span class="chip">${coinHtml}${it.price}</span><br>You will have <b>${left}</b> coins left.</p>
      <p class="err" style="font-size:15px">You can't give it back after you buy it.</p></div>`,
      [{ t: "No, wait", cls: "w" }, { t: "Buy it", cls: "g", fn: async () => {
        await API.buy(it.id); D.me = await API.me(true); draft[it.slot] = it.id; wallet();
        try { D.me = await API.setLook(pick(draft)); draft = null; D.figs = await API.figs(D.me.team_id); hero(); } catch (e) {}
        toast("It's yours now"); store();
      } }], { noFocus: true });
  }

  // ---------- ASK ----------
  async function ask() {
    const msgs = await API.messages(D.me.team_id);
    const v = $("#view");
    v.innerHTML = `<div class="grid g2"><form class="card acc-blue" id="af">${head("💬", "Ask or tell your coach")}
      <div class="tabs"><label class="tab on"><input type="radio" name="k" value="question" checked hidden> ❓ Question</label><label class="tab"><input type="radio" name="k" value="feedback" hidden> 💭 Feedback</label></div>
      <label class="field"><span>Your message</span><textarea class="input" name="b" maxlength="1000" required placeholder="Type here..."></textarea></label>
      <button class="btn" type="submit">Send to my coach</button></form>
      <div class="card acc-green">${head("📬", "Our messages")}${msgs.length ? msgs.map((m) => `<div class="msg"><span class="pill">${m.kind === "question" ? "❓ Question" : "💭 Feedback"}</span> <span class="muted">${ago(m.created_at)}</span>
        <div style="font-weight:700;margin-top:6px;white-space:pre-wrap">${esc(m.body)}</div>${m.reply ? `<div class="reply">${esc(m.reply)}</div>` : '<div class="muted" style="margin-top:6px">Waiting for the coach…</div>'}</div>`).join("") : '<p class="muted">No messages yet.</p>'}</div></div>`;
    $$("#af .tab", v).forEach((l) => (l.onclick = () => { $$("#af .tab", v).forEach((x) => x.classList.remove("on")); l.classList.add("on"); }));
    $("#af").onsubmit = async (e) => {
      e.preventDefault(); const b = e.target.b.value.trim(); if (!b) return;
      try { await API.sendMessage(D.me.team_id, e.target.querySelector("[name=k]:checked").value, b); toast("Sent to your coach"); ask(); } catch (x) { toast(x.message, 3500); }
    };
  }

  // ================= BOOT =================
  async function boot() {
    root.innerHTML = '<div class="spinner"></div>';
    let me = null;
    try { me = await API.me(true); } catch (e) { me = null; }
    if (!me) return showLogin();
    if (me.must_change_pw) { await loadParts(); return showChangePw(me); }
    const allowed = { kid: "minifig", coach: "coach", admin: "admin" }[MODE];
    if (me.role !== allowed) return wrongPlace();
    if (MODE !== "kid") { await loadParts(); return G.COACH.start(me, MODE === "admin"); }
    try { await loadAll(); } catch (e) { root.innerHTML = `<div class="main"><div class="err">${esc(e.message)}</div><button class="btn" id="retry">Try again</button> <button class="btn w" id="so3">Sign out</button></div>`; $("#retry").onclick = () => location.reload(); $("#so3").onclick = async () => { await API.signOut(); boot(); }; return; }
    shell(); hero(); go(S.tab);
  }
  G.HUB = { boot, showLogin };
  const UI = G.UI;
  document.addEventListener("visibilitychange", () => { if (!document.hidden && D.me && MODE === "kid") API.me(true).then((m) => { if (m) { D.me = m; wallet(); } }).catch(() => {}); });
  boot();
})(window);
