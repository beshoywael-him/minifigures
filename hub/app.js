/* Mini Figures Hub — kids' app (and the shared login / password screens for the coach room). */
(function (G) {
  const { $, $$, esc, h, ago, toast, modal, confirmBox, teamTitle, parade, progressBricks, tower, libraryGrid, openItem, addItemModal, coinHtml, studHtml } = G.UI;
  const API = G.API, FIG = G.FIG;
  const COACH = G.HUB_MODE === "coach";
  const root = $("#app");
  const S = { tab: "home", libTab: "idea", storeTab: "hair" };

  function demoBanner() {
    if (!API.demo) return "";
    return `<div class="demo-banner">DEMO MODE — sample data only. Try <b>zeyad / tiger-123a</b>${COACH ? " or <b>tarif / coach1</b>" : ""} <button type="button" id="demoReset">reset</button></div>`;
  }
  function wireDemo() { const b = $("#demoReset"); if (b) b.onclick = () => { API.reset(); location.reload(); }; }

  // ================= LOGIN =================
  async function showLogin(msg) {
    root.innerHTML = `${demoBanner()}<div class="login"><div class="hero studs sun"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix">
      <h1>${COACH ? "Coach Room" : "Mini Figures<br>Hub"}</h1><div class="parade" id="lp"></div></div><div class="ground"></div>
      <form class="card" id="lf" autocomplete="on" novalidate><h2 style="margin-bottom:14px">${COACH ? "Coach sign in" : "Hi Mini Figure! 👋"}</h2>
      ${msg ? `<div class="ok">${esc(msg)}</div>` : ""}<div class="err hidden" id="le"></div>
      <label class="field"><span>Username</span><input class="input" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      <label class="field"><span>Password</span><input class="input" name="p" type="password" autocomplete="current-password" required></label>
      <button class="btn y" style="width:100%" type="submit">Let's go! ▶</button>
      <p class="muted" style="text-align:center;margin:14px 0 0">Forgot your password? Ask your coach for a new one.</p></form></div>`;
    wireDemo();
    try {
      const looks = await API.parade(); const n = Math.min(looks.length, innerWidth < 600 ? 5 : 11);
      const shuffled = looks.sort(() => Math.random() - 0.5).slice(0, n);
      $("#lp").innerHTML = shuffled.map((l) => FIG.svg(l, { size: innerWidth < 600 ? 92 : 120 })).join("");
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
    root.innerHTML = `${demoBanner()}<div class="login"><div class="hero studs sun" style="min-height:220px"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix">
      <div class="parade">${FIG.svg(me.look, { size: 110 })}</div></div><div class="ground"></div>
      <form class="card" id="pf" novalidate><h2>Welcome, ${esc(me.display_name.split(" ")[0])}!</h2>
      <p style="font-weight:700">First, make your <b>own secret password</b>. Don't share it with anyone, not even your teammates.</p>
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
        await API.changePassword(f.a.value); toast("Password saved! 🔒"); boot();
      } catch (x) { err.textContent = x.message; err.classList.remove("hidden"); }
    };
  }

  function wrongPlace(me) {
    root.innerHTML = `<div class="login"><div class="hero studs sun" style="min-height:200px"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix"><h1>Oops!</h1></div><div class="ground"></div>
      <div class="card" style="width:min(440px,calc(100% - 28px));margin:20px auto"><p style="font-weight:800">${COACH ? "This page is only for coaches." : "This page is for Mini Figures. Coaches have their own link."}</p>
      <button class="btn" id="so">Sign out</button></div></div>`;
    $("#so").onclick = async () => { await API.signOut(); boot(); };
  }

  // ================= KID APP =================
  const TABS = [["home", "🏠", "Home"], ["tasks", "🧱", "Tasks"], ["library", "📚", "Library"], ["store", "🛍️", "Store"], ["ask", "💬", "Ask"]];
  let D = {}; // data cache

  async function loadAll() {
    const me = await API.me(true);
    const t = me.team_id;
    const [team, figs, coaches, kids, tasks, ann] = await Promise.all([API.team(t), API.figs(t), API.myCoaches(), API.kids(t), API.tasks(t), API.announcements(t)]);
    D = Object.assign(D, { me, team, figs, coaches, kids, tasks, ann });
  }

  function shell() {
    const me = D.me;
    root.innerHTML = `${demoBanner()}<aside class="side"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix">${TABS.map(([k, i, t]) => `<button class="navbtn" data-t="${k}"><span class="ni">${i}</span>${t}</button>`).join("")}
      <div class="grow"></div><button class="navbtn" id="so2"><span class="ni">🚪</span>Sign out</button></aside>
      <div class="shell"><header class="topbar"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix"><span class="uname" style="font-weight:900">${esc(me.display_name)}</span><span class="grow"></span>
        <div class="wallet"><span class="chip" title="Gold coins (for the store)">${coinHtml}<span id="wc">${me.coins}</span></span><span class="chip stud" title="Session studs (your salary)">${studHtml}<span id="ws">${me.studs}</span></span></div>
        <button class="btn sm w" id="so" aria-label="Sign out" title="Sign out">🚪</button></header>
        <nav class="topnav">${TABS.map(([k, i, t]) => `<button class="navbtn" data-t="${k}"><span class="ni">${i}</span>${t}</button>`).join("")}</nav>
        <section class="teamhero studs sun" id="hero"></section><main class="main" id="view"></main></div>
      <nav class="bottomnav">${TABS.map(([k, i, t]) => `<button class="navbtn" data-t="${k}"><span class="ni">${i}</span>${t}</button>`).join("")}</nav>`;
    wireDemo();
    $$("[data-t]").forEach((b) => (b.onclick = () => go(b.dataset.t)));
    $("#so").onclick = $("#so2").onclick = async () => { await API.signOut(); D = {}; boot(); };
  }
  function hero() {
    const t = D.team;
    $("#hero").innerHTML = `<div class="row">${t && t.logo_url ? `<img class="tlogo" src="${esc(t.logo_url)}" alt="">` : ""}<span class="tname">${esc(teamTitle(t))}</span>${t ? `<span class="slot">📅 ${esc(t.slot)}</span>` : ""}</div>
      <div class="parade">${parade(D.figs, D.me.id, innerWidth < 600 ? 100 : 128)}</div>`;
  }
  function wallet() { $("#wc").textContent = D.me.coins; $("#ws").textContent = D.me.studs; }

  function go(tab) {
    S.tab = tab;
    $$("[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
    const v = $("#view"); v.innerHTML = '<div class="spinner"></div>';
    ({ home, tasks: tasksView, library, store, ask })[tab]().catch((e) => { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; });
    scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- HOME ----------
  async function home() {
    const me = D.me, t = D.team;
    const { now, next } = UI.nowNext(D.tasks);
    const v = $("#view");
    v.innerHTML = `<div class="grid g3">
      <div class="card"><h3><span class="ic" style="background:#FFE8E9">⭐</span>Me</h3><div class="mecard"><div class="big">${FIG.svg(me.look, { size: 130 })}</div>
        <div class="stats"><div style="font-family:var(--display);font-size:24px;line-height:1">${esc(me.display_name)}</div>
        <div class="stat">${studHtml}<div><b>${me.studs}</b><div class="lbl">session studs<br>= ${me.studs * 100} EGP salary</div></div></div>
        <div class="stat">${coinHtml}<div><b>${me.coins}</b><div class="lbl">gold coins<br>for the store</div></div></div>
        <button class="btn sm y" data-go="store">Dress up 🛍️</button></div></div></div>
      <div class="card"><h3><span class="ic" style="background:#EAF1FF">👥</span>My team</h3>
        <p style="margin:0 0 6px"><b>${esc(teamTitle(t))}</b> · ${esc(t ? t.slot : "")}</p>
        <p class="muted" style="margin:0 0 10px">Coach: <b>${esc(D.coaches.join(", ") || "—")}</b></p>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${D.kids.map((k) => `<span class="pill">${esc(k.name.split(" ").slice(0, 2).join(" "))}</span>`).join("")}</div></div>
      <div class="card"><h3><span class="ic" style="background:#E3FAF2">🏗️</span>Our build</h3>${progressBricks(t)}</div>
      <div class="card"><h3><span class="ic" style="background:#FFF1C2">🧱</span>Do now</h3>
        ${now ? `<div class="task ${now.status}" style="margin-bottom:10px">${UI.labelChip(now.label)}<div class="tt">${esc(now.title)}</div></div>` : '<p class="muted">No tasks right now 🎉</p>'}
        ${next ? `<p class="muted" style="margin:6px 0 10px">Next: <b>${esc(next.title)}</b></p>` : ""}<button class="btn sm" data-go="tasks">Open the task tower ▶</button></div>
      <div class="card" style="grid-column:1/-1"><h3><span class="ic" style="background:#FFF6D6">📣</span>Announcements</h3>
        ${D.ann.length ? D.ann.slice(0, 6).map((a) => `<div class="ann ${a.team_id == null ? "all" : ""}"><div class="meta">${a.team_id == null ? "For all Mini Figures" : "From your coach"} · ${ago(a.created_at)}</div>${esc(a.body)}</div>`).join("") : '<p class="muted">Nothing new.</p>'}</div>
    </div>`;
    $$("[data-go]", v).forEach((b) => (b.onclick = () => go(b.dataset.go)));
  }

  // ---------- TASKS ----------
  async function tasksView() {
    D.tasks = await API.tasks(D.me.team_id);
    const v = $("#view");
    v.innerHTML = `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px"><h2 style="flex:1">Task tower 🧱</h2><button class="btn g" id="addT">+ Add a task</button></div>
      <p class="muted" style="margin:-6px 0 14px">Start at the top. A level opens only when the level above it is all done.</p>`;
    v.append(tower(D.tasks, {
      kid: true, meId: D.me.id,
      onStatus: async (t, s) => {
        try { await API.setTaskStatus(t.id, s); if (s === "done") { toast("Great job! ✓"); } tasksView(); }
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
    v.innerHTML = `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px"><h2 style="flex:1">Team library 📚</h2>
      ${S.libTab !== "coach_idea" ? `<button class="btn g" id="addL">+ Add ${S.libTab === "photo" ? "a photo" : "an idea"}</button>` : ""}</div>
      <div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button class="tab ${S.libTab === k ? "on" : ""}" role="tab" aria-selected="${S.libTab === k}" data-l="${k}">${t} (${items.filter((i) => i.section === k).length})</button>`).join("")}</div>`;
    $$("[data-l]", v).forEach((b) => (b.onclick = () => { S.libTab = b.dataset.l; library(); }));
    v.append(await libraryGrid(list, (it, url) => openItem(it, url, it.added_by === D.me.id, async (x) => { await API.deleteLibrary(x); toast("Deleted"); library(); })));
    const add = $("#addL"); if (add) add.onclick = () => addItemModal(D.me.team_id, S.libTab, library);
  }

  // ---------- STORE ----------
  const SLOTS = [["hair", "💇 Hair"], ["hat", "🧢 Hats"], ["glasses", "🕶️ Glasses"], ["top", "👕 Tops"], ["bottom", "👖 Bottoms"], ["shoes", "👟 Shoes"], ["buddy", "🦜 Buddies"], ["colors", "🎨 Colors"]];
  let draft = null;
  async function store() {
    if (!D.items) D.items = await API.store();
    const me = D.me; if (!draft) draft = Object.assign({}, FIG.DEFAULT, me.look);
    const v = $("#view");
    const dirty = JSON.stringify(draft) !== JSON.stringify(Object.assign({}, FIG.DEFAULT, me.look));
    v.innerHTML = `<div class="storewrap"><div class="mirror"><div class="card"><div class="stage studs sun">${FIG.svg(draft, { size: 190 })}<div class="floor"></div></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px"><span class="chip">${coinHtml}${me.coins} coins</span></div>
      <button class="btn g" id="saveL" style="width:100%" ${dirty ? "" : "disabled"}>${dirty ? "Save my look ✓" : "Looking good!"}</button>
      ${dirty ? '<button class="link" id="undoL">Undo changes</button>' : ""}</div></div>
      <div><div class="tabs">${SLOTS.map(([k, t]) => `<button class="tab ${S.storeTab === k ? "on" : ""}" data-s="${k}">${t}</button>`).join("")}</div><div id="shelf"></div></div></div>`;
    $$("[data-s]", v).forEach((b) => (b.onclick = () => { S.storeTab = b.dataset.s; store(); }));
    $("#saveL").onclick = async () => { try { D.me = await API.setLook(draft); draft = null; toast("Look saved! 😎"); hero(); store(); } catch (e) { toast(e.message, 3500); } };
    const u = $("#undoL"); if (u) u.onclick = () => { draft = null; store(); };
    const shelf = $("#shelf");
    if (S.storeTab === "colors") {
      const row = (label, key, list) => `<div class="card" style="margin-bottom:12px"><h3 style="font-size:18px;margin-bottom:10px">${label}</h3><div class="swatches">${list.map((c) => `<button class="sw ${draft[key] === c ? "on" : ""}" data-k="${key}" data-c="${c}" style="background:${c}" aria-label="${label} ${c}"></button>`).join("")}</div></div>`;
      shelf.innerHTML = row("Skin", "skin", FIG.SKIN) + row("Hair color", "hairColor", FIG.HAIR) + row("Top color", "topColor", FIG.COLORS) + row("Bottom color", "bottomColor", FIG.PANTS) + row("Shoe color", "shoeColor", FIG.SHOES);
      $$(".sw", shelf).forEach((b) => (b.onclick = () => { draft[b.dataset.k] = b.dataset.c; store(); }));
      return;
    }
    const items = D.items.filter((i) => i.slot === S.storeTab);
    const g = h('<div class="items"></div>');
    if (["hat", "glasses", "buddy"].includes(S.storeTab)) {
      const none = h(`<button class="item ${draft[S.storeTab] === "none" ? "on" : ""}"><div class="prev" style="display:grid;place-items:center;font-size:40px">🚫</div><div class="nm">None</div><span class="free">Take off</span></button>`);
      none.onclick = () => { draft[S.storeTab] = "none"; store(); }; g.append(none);
    }
    items.forEach((it) => {
      const owned = it.price === 0 || me.owned.includes(it.id);
      const prevLook = Object.assign({}, draft, { [it.slot]: it.id }); if (it.slot === "hair") prevLook.hat = "none";
      const b = h(`<button class="item ${draft[it.slot] === it.id ? "on" : ""} ${!owned && me.coins < it.price ? "cant" : ""}"><div class="prev p-${it.slot}">${FIG.svg(prevLook, { size: 92, flat: true })}</div>
        <div class="nm">${esc(it.name)}</div>${it.price === 0 ? '<span class="free">FREE</span>' : owned ? '<span class="own">✓ Yours</span>' : `<span class="price">${coinHtml}${it.price}</span>`}</button>`);
      b.onclick = () => (owned ? wear(it) : buy(it));
      g.append(b);
    });
    shelf.append(g);
  }
  function wear(it) { draft[it.slot] = draft[it.slot] === it.id && ["hat", "glasses", "buddy"].includes(it.slot) ? "none" : it.id; store(); }
  async function buy(it) {
    const me = D.me, left = me.coins - it.price;
    const look = Object.assign({}, draft, { [it.slot]: it.id });
    if (left < 0) {
      modal("Not enough coins yet", `<div style="text-align:center">${FIG.svg(look, { size: 120 })}<p style="font-weight:800">${esc(it.name)} costs <b>${it.price}</b> gold coins. You have <b>${me.coins}</b>.<br>Keep leading your team and your coach will give you more!</p></div>`, [{ t: "OK", cls: "y" }]);
      return;
    }
    modal("Buy " + it.name + "?", `<div style="text-align:center">${FIG.svg(look, { size: 130 })}<p style="font-weight:800;font-size:18px">It costs <span class="chip">${coinHtml}${it.price}</span><br>You will have <b>${left}</b> coins left.</p>
      <p class="err" style="font-size:15px">You can't give it back after you buy it.</p></div>`,
      [{ t: "No, wait", cls: "w" }, { t: "Yes, buy it!", cls: "g", fn: async () => {
        await API.buy(it.id); D.me = await API.me(true); draft[it.slot] = it.id; wallet();
        try { D.me = await API.setLook(draft); draft = null; hero(); } catch (e) {}
        toast("🎉 It's yours!"); store();
      } }]);
  }

  // ---------- ASK ----------
  async function ask() {
    const msgs = await API.messages(D.me.team_id);
    const v = $("#view");
    v.innerHTML = `<div class="grid g2"><form class="card" id="af"><h3><span class="ic" style="background:#EAF1FF">💬</span>Ask or tell your coach</h3>
      <div class="tabs"><label class="tab on"><input type="radio" name="k" value="question" checked hidden> ❓ Question</label><label class="tab"><input type="radio" name="k" value="feedback" hidden> 💭 Feedback</label></div>
      <label class="field"><span>Your message</span><textarea class="input" name="b" maxlength="1000" required placeholder="Type here..."></textarea></label>
      <button class="btn" type="submit">Send ▶</button></form>
      <div class="card"><h3><span class="ic" style="background:#E3FAF2">📬</span>Our messages</h3>${msgs.length ? msgs.map((m) => `<div class="msg"><span class="pill">${m.kind === "question" ? "❓ Question" : "💭 Feedback"}</span> <span class="muted">${ago(m.created_at)}</span>
        <div style="font-weight:700;margin-top:6px;white-space:pre-wrap">${esc(m.body)}</div>${m.reply ? `<div class="reply">${esc(m.reply)}</div>` : '<div class="muted" style="margin-top:6px">Waiting for the coach…</div>'}</div>`).join("") : '<p class="muted">No messages yet.</p>'}</div></div>`;
    $$("#af .tab", v).forEach((l) => (l.onclick = () => { $$("#af .tab", v).forEach((x) => x.classList.remove("on")); l.classList.add("on"); }));
    $("#af").onsubmit = async (e) => {
      e.preventDefault(); const b = e.target.b.value.trim(); if (!b) return;
      try { await API.sendMessage(D.me.team_id, e.target.querySelector("[name=k]:checked").value, b); toast("Sent to your coach!"); ask(); } catch (x) { toast(x.message, 3500); }
    };
  }

  // ================= BOOT =================
  async function boot() {
    root.innerHTML = '<div class="spinner"></div>';
    let me = null;
    try { me = await API.me(true); } catch (e) { me = null; }
    if (!me) return showLogin();
    if (me.must_change_pw) return showChangePw(me);
    if (COACH) { if (me.role === "minifig") return wrongPlace(me); return G.COACH.start(me); }
    if (me.role !== "minifig") return wrongPlace(me);
    try { await loadAll(); } catch (e) { root.innerHTML = `<div class="main"><div class="err">${esc(e.message)}</div><button class="btn" onclick="location.reload()">Try again</button></div>`; return; }
    shell(); hero(); go(S.tab);
  }
  G.HUB = { boot, showLogin };
  const UI = G.UI;
  document.addEventListener("visibilitychange", () => { if (!document.hidden && D.me && !COACH && ["home", "tasks"].includes(S.tab)) API.me(true).then((m) => { if (m) { D.me = m; wallet(); } }).catch(() => {}); });
  boot();
})(window);
