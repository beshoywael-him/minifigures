/* Mini Figures Hub — data layer. window.API is either the Supabase backend or an in-browser demo (?demo=1). */
(function (G) {
  const CFG = G.HUB_CONFIG || {};
  const DOMAIN = "hub.minifigures.example";
  const LABELS = ["core values", "poster", "model", "evaluation"];
  const errMsg = (e) => (e && (e.message || e.error_description || e.msg)) || String(e);

  // ---------------- image helper: shrink before upload ----------------
  async function shrink(file, max = 1600, q = 0.82) {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    return await new Promise((res) => c.toBlob(res, "image/jpeg", q));
  }
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  // ================= SUPABASE =================
  function supaApi() {
    const sb = G.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, storageKey: "mf-hub-auth" } });
    const ok = ({ data, error }) => { if (error) throw new Error(errMsg(error)); return data; };
    let me = null;
    const api = {
      demo: false,
      async signIn(username, pw) {
        const u = String(username || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
        if (!u || !pw) throw new Error("Type your username and password");
        const { error } = await sb.auth.signInWithPassword({ email: u + "@" + DOMAIN, password: pw });
        if (error) throw new Error(/invalid/i.test(error.message) ? "Wrong username or password" : errMsg(error));
        return api.me(true);
      },
      async signOut() { me = null; await sb.auth.signOut(); },
      async me(force) {
        if (me && !force) return me;
        const { data } = await sb.auth.getSession();
        if (!data.session) return (me = null);
        me = ok(await sb.from("profiles").select("*").eq("id", data.session.user.id).maybeSingle());
        return me;
      },
      async changePassword(pw) {
        if (!pw || pw.length < 6) throw new Error("Use at least 6 letters or numbers");
        ok(await sb.auth.updateUser({ password: pw }));
        const done = ok(await sb.rpc("password_changed"));
        if (!done) throw new Error("Pick a different password from the one you were given");
        return api.me(true);
      },
      async parade() { return ok(await sb.rpc("parade")) || []; },
      async publicTeams() { return ok(await sb.rpc("public_teams")) || []; },
      async myCoaches() { return (ok(await sb.rpc("my_coaches")) || []).map((r) => r.display_name); },
      async teams() { return ok(await sb.from("teams").select("*").order("id")); },
      async team(id) { return ok(await sb.from("teams").select("*").eq("id", id).maybeSingle()); },
      async updateTeam(id, patch) { return ok(await sb.from("teams").update(patch).eq("id", id).select().single()); },
      async kids(team) { return ok(await sb.from("team_kids").select("*").eq("team_id", team).order("name")); },
      async addKid(team, name) { return ok(await sb.from("team_kids").insert({ team_id: team, name }).select().single()); },
      async removeKid(id) { ok(await sb.from("team_kids").delete().eq("id", id)); },
      async figs(team) {
        let q = sb.from("profiles").select("*").eq("role", "minifig").order("display_name");
        if (team != null) q = q.eq("team_id", team);
        return ok(await q);
      },
      async staff() { return ok(await sb.from("profiles").select("id,username,display_name,role").in("role", ["coach", "admin"]).order("display_name")); },
      async teamCoaches() { return ok(await sb.from("team_coaches").select("*")); },
      async setCoach(team, coach, on) {
        if (on) ok(await sb.from("team_coaches").insert({ team_id: team, coach_id: coach }));
        else ok(await sb.from("team_coaches").delete().eq("team_id", team).eq("coach_id", coach));
      },
      async moveFig(user, team) { ok(await sb.rpc("admin_set_team", { p_user: user, p_team: team })); },
      async resetPassword(user, pw) { ok(await sb.rpc("reset_password", { p_user: user, p_pw: pw })); },
      // tasks
      async tasks(team) {
        let q = sb.from("tasks").select("*").order("priority").order("created_at");
        if (Array.isArray(team)) q = q.in("team_id", team); else q = q.eq("team_id", team);
        return ok(await q);
      },
      async addTask(t) { const m = await api.me(); return ok(await sb.from("tasks").insert(Object.assign({}, t, { created_by: m.id })).select().single()); },
      async updateTask(id, patch) { return ok(await sb.from("tasks").update(patch).eq("id", id).select().single()); },
      async setTaskStatus(id, status) { ok(await sb.rpc("set_task_status", { p_task: id, p_status: status })); },
      async deleteTask(id) { ok(await sb.from("tasks").delete().eq("id", id)); },
      // library
      async library(team) { return ok(await sb.from("library").select("*").eq("team_id", team).order("created_at", { ascending: false })); },
      async addLibrary(item, file) {
        const m = await api.me();
        const row = Object.assign({ added_by: m.id }, item);
        if (file) {
          const blob = await shrink(file);
          const path = `${item.team_id}/${rid()}.jpg`;
          ok(await sb.storage.from("library").upload(path, blob, { contentType: "image/jpeg", upsert: false }));
          row.storage_path = path;
        }
        return ok(await sb.from("library").insert(row).select().single());
      },
      async deleteLibrary(item) {
        if (item.storage_path) await sb.storage.from("library").remove([item.storage_path]);
        ok(await sb.from("library").delete().eq("id", item.id));
      },
      async photoUrls(paths) {
        if (!paths.length) return {};
        const data = ok(await sb.storage.from("library").createSignedUrls(paths, 3600));
        const out = {}; data.forEach((d) => { if (d.signedUrl) out[d.path] = d.signedUrl; }); return out;
      },
      async uploadLogo(team, file) {
        const blob = await shrink(file, 800, 0.9);
        const path = `${team}/${rid()}.jpg`;
        ok(await sb.storage.from("logos").upload(path, blob, { contentType: "image/jpeg" }));
        return sb.storage.from("logos").getPublicUrl(path).data.publicUrl;
      },
      // announcements & messages
      async announcements(team) {
        let q = sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(30);
        if (team === "all") q = q.is("team_id", null); else if (team != null) q = q.or(`team_id.is.null,team_id.eq.${Number(team)}`);
        return ok(await q);
      },
      async postAnnouncement(team, body) { const m = await api.me(); return ok(await sb.from("announcements").insert({ team_id: team, body, created_by: m.id }).select().single()); },
      async deleteAnnouncement(id) { ok(await sb.from("announcements").delete().eq("id", id)); },
      async messages(team) {
        let q = sb.from("messages").select("*").order("created_at", { ascending: false }).limit(60);
        if (Array.isArray(team)) q = q.in("team_id", team); else q = q.eq("team_id", team);
        return ok(await q);
      },
      async sendMessage(team, kind, body) { const m = await api.me(); return ok(await sb.from("messages").insert({ team_id: team, author_id: m.id, kind, body }).select().single()); },
      async reply(id, text) { const m = await api.me(); return ok(await sb.from("messages").update({ reply: text, replied_by: m.id, replied_at: new Date().toISOString() }).eq("id", id).select().single()); },
      // store & rewards
      async store() { return ok(await sb.from("store_items").select("*").eq("active", true).order("sort")); },
      async buy(item) { const left = ok(await sb.rpc("buy_item", { p_item: item })); await api.me(true); return left; },
      async setLook(look) { ok(await sb.rpc("set_look", { p_look: look })); return api.me(true); },
      async grant(user, kind, amount, reason) { return ok(await sb.rpc("grant_reward", { p_user: user, p_kind: kind, p_amount: amount, p_reason: reason })); },
      async ledger(user) { return ok(await sb.from("ledger").select("*").eq("user_id", user).order("created_at", { ascending: false }).limit(50)); },
    };
    return api;
  }

  // ================= DEMO (in-browser, for previews & tests) =================
  function demoApi() {
    const KEY = "mf-hub-demo";
    const look = (g, s) => G.FIG.randomLook(g, s);
    const seed = () => {
      const teams = [1, 2, 3].map((id) => ({ id, slot: ["Sat 5:30", "Sat 5:30", "Sat 7:30"][id - 1], name: id === 3 ? "Glow Toucans" : null, name_public: id === 3, logo_url: null, logo_public: false,
        progress: [{ k: "Tree house", done: true }, { k: "3 animals", done: true }, { k: "Research device", done: true }, { k: "Lifting platform", done: false }, { k: "Team name", done: id === 3 }, { k: "Team logo", done: false }, { k: "Team model", done: false }, { k: "Team poster", done: false }] }));
      const P = (id, username, display_name, role, team_id, g, s, extra) => Object.assign({ id, username, display_name, role, team_id, must_change_pw: true, studs: 0, coins: 0, look: look(g, s), owned: [] }, extra || {});
      const profiles = [P("u1", "zeyad", "Zeyad Tarek", "minifig", 1, 0, 3, { coins: 7, studs: 2 }), P("u2", "yousef", "Yousef Sayed", "minifig", 1, 0, 8, { must_change_pw: false }),
        P("u3", "moussa", "Moussa George", "minifig", 2, 0, 11), P("u4", "marla", "Marla Remon", "minifig", 3, 1, 5), P("u5", "selena", "Selena Fady", "minifig", 3, 1, 9),
        P("c1", "tarif", "Tarif", "coach", null, 0, 1), P("c2", "beshoy", "Beshoy", "admin", null, 0, 2)];
      const T = (id, team_id, title, label, priority, status, details) => ({ id, team_id, title, label, priority, status: status || "todo", details: details || "", created_at: new Date(Date.now() - id * 6e4).toISOString() });
      return { teams, profiles, pw: { u1: "tiger-123a", u2: "x", u3: "x", u4: "x", u5: "x", c1: "coach1", c2: "admin1" },
        team_coaches: [{ team_id: 1, coach_id: "c1" }, { team_id: 3, coach_id: "c1" }],
        kids: [[1, "Zeyad Tarek"], [1, "Ayman Mostafa"], [1, "Hana Basil"], [1, "Yamen Karim"], [1, "Yousef Sayed"], [2, "Moussa George"], [2, "Roshan Mahmoud"], [3, "Marla Remon"], [3, "Selena Fady"], [3, "Evan Beshoy"]].map(([t, n], i) => ({ id: i + 1, team_id: t, name: n })),
        tasks: [T(1, 1, "Find team model ideas", "model", 1, "doing", "Add ideas to the Library: photo, Rebrickable link, YouTube or text."), T(2, 1, "Build the lifting platform", "model", 1), T(3, 1, "Practice our Core Values share", "core values", 2), T(4, 1, "Sketch the poster", "poster", 3),
          T(5, 2, "Find team model ideas", "model", 1), T(6, 3, "Find team model ideas", "model", 1)],
        library: [{ id: 1, team_id: 1, section: "idea", kind: "text", title: "Rope bridge", body: "A bridge between two trees that the animals can cross", url: null, created_at: new Date().toISOString(), added_by: "u2" },
          { id: 2, team_id: 1, section: "idea", kind: "video", title: "Moving parts idea", body: "", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", created_at: new Date().toISOString(), added_by: "u1" },
          { id: 3, team_id: 1, section: "coach_idea", kind: "link", title: "Treehouse MOC", body: "Look at how they used hinges", url: "https://rebrickable.com/mocs/", created_at: new Date().toISOString(), added_by: "c1" }],
        announcements: [{ id: 1, team_id: null, body: "Welcome to the Mini Figures Hub! Change your password, then check your team's tasks. First mission: find model ideas for your team.", created_at: new Date().toISOString() },
          { id: 2, team_id: 1, body: "Great work on the research device! Bring 2 model ideas next session.", created_at: new Date().toISOString(), created_by: "c1" }],
        messages: [{ id: 1, team_id: 1, author_id: "u1", kind: "question", body: "Can we use Technic gears in our model?", reply: "Yes! Any LEGO Education parts are fine.", created_at: new Date().toISOString() }],
        ledger: [], purchases: [], session: null, n: 100 };
    };
    let db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !db.teams) db = seed();
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
    const wait = (v) => new Promise((r) => setTimeout(() => r(JSON.parse(JSON.stringify(v === undefined ? null : v))), 60));
    const meRow = () => db.profiles.find((p) => p.id === db.session);
    const role = () => { const m = meRow(); return m && !m.must_change_pw ? m.role : null; };
    const coaches = (t) => role() === "admin" || (role() === "coach" && db.team_coaches.some((c) => c.team_id === t && c.coach_id === db.session));
    const see = (t) => coaches(t) || (role() === "minifig" && meRow().team_id === t);
    const need = (c, msg) => { if (!c) throw new Error(msg || "Not allowed"); };
    const api = {
      demo: true,
      reset() { localStorage.removeItem(KEY); db = seed(); },
      async signIn(u, pw) {
        const p = db.profiles.find((x) => x.username === String(u).trim().toLowerCase());
        if (!p || db.pw[p.id] !== pw) throw new Error("Wrong username or password");
        db.session = p.id; save(); return wait(p);
      },
      async signOut() { db.session = null; save(); },
      async me() { return wait(meRow() || null); },
      async changePassword(pw) {
        if (!pw || pw.length < 6) throw new Error("Use at least 6 letters or numbers");
        if (pw === db.pw[db.session]) throw new Error("Pick a different password from the one you were given");
        db.pw[db.session] = pw; meRow().must_change_pw = false; save(); return wait(meRow());
      },
      async parade() { return wait(db.profiles.filter((p) => p.role === "minifig").map((p) => p.look)); },
      async publicTeams() { return wait(db.teams.map((t) => ({ id: t.id, name: t.name_public ? t.name : null, logo_url: t.logo_public ? t.logo_url : null }))); },
      async myCoaches() { const t = meRow().team_id; return wait(db.team_coaches.filter((c) => c.team_id === t).map((c) => db.profiles.find((p) => p.id === c.coach_id).display_name)); },
      async teams() { return wait(db.teams.filter((t) => see(t.id))); },
      async team(id) { return wait(see(id) ? db.teams.find((t) => t.id === id) : null); },
      async updateTeam(id, patch) { need(coaches(id)); Object.assign(db.teams.find((t) => t.id === id), patch); save(); return wait(db.teams.find((t) => t.id === id)); },
      async kids(team) { return wait(see(team) ? db.kids.filter((k) => k.team_id === team) : []); },
      async addKid(team, name) { need(coaches(team)); const k = { id: ++db.n, team_id: team, name }; db.kids.push(k); save(); return wait(k); },
      async removeKid(id) { const k = db.kids.find((x) => x.id === id); need(k && coaches(k.team_id)); db.kids = db.kids.filter((x) => x.id !== id); save(); },
      async figs(team) { return wait(db.profiles.filter((p) => p.role === "minifig" && see(p.team_id) && (team == null || p.team_id === team))); },
      async staff() { return wait(db.profiles.filter((p) => p.role !== "minifig")); },
      async teamCoaches() { return wait(db.team_coaches.filter((c) => see(c.team_id))); },
      async setCoach(team, coach, on) { need(role() === "admin"); db.team_coaches = db.team_coaches.filter((c) => !(c.team_id === team && c.coach_id === coach)); if (on) db.team_coaches.push({ team_id: team, coach_id: coach }); save(); },
      async moveFig(user, team) { need(role() === "admin"); db.profiles.find((p) => p.id === user).team_id = team; save(); },
      async resetPassword(user, pw) { const p = db.profiles.find((x) => x.id === user); need(p && (role() === "admin" || coaches(p.team_id))); db.pw[user] = pw; p.must_change_pw = true; save(); },
      async tasks(team) { const ts = Array.isArray(team) ? team : [team]; return wait(db.tasks.filter((t) => ts.includes(t.team_id) && see(t.team_id)).sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at))); },
      async addTask(t) {
        need(see(t.team_id));
        const row = Object.assign({ id: ++db.n, status: "todo", details: "", created_at: new Date().toISOString(), created_by: db.session }, t);
        if (role() === "minifig") { const open = db.tasks.filter((x) => x.team_id === t.team_id && x.status !== "done"); row.priority = open.length ? Math.max(...open.map((x) => x.priority)) : 1; }
        db.tasks.push(row); save(); return wait(row);
      },
      async updateTask(id, patch) { const t = db.tasks.find((x) => x.id === id); need(t && coaches(t.team_id)); if (patch.status) api._guard(t, patch.status); Object.assign(t, patch); save(); return wait(t); },
      _guard(t, status) { if (status === "done" && db.tasks.some((x) => x.team_id === t.team_id && x.status !== "done" && x.priority < t.priority && x.id !== t.id)) throw new Error("Finish the more important tasks first!"); },
      async setTaskStatus(id, status) { const t = db.tasks.find((x) => x.id === id); need(t && see(t.team_id), "Not your task"); api._guard(t, status); t.status = status; save(); },
      async deleteTask(id) { const t = db.tasks.find((x) => x.id === id); need(t && (coaches(t.team_id) || (t.created_by === db.session && t.status !== "done"))); db.tasks = db.tasks.filter((x) => x.id !== id); save(); },
      async library(team) { return wait(see(team) ? db.library.filter((l) => l.team_id === team).sort((a, b) => b.id - a.id) : []); },
      async addLibrary(item, file) {
        need(see(item.team_id) && (item.section !== "coach_idea" || coaches(item.team_id)));
        if (item.url && !/^https:\/\//.test(item.url)) throw new Error("Links must start with https://");
        const row = Object.assign({ id: ++db.n, created_at: new Date().toISOString(), added_by: db.session, title: "", body: "" }, item);
        if (file) { const b = await shrink(file, 500, 0.7); row.storage_path = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); }
        db.library.push(row); save(); return wait(row);
      },
      async deleteLibrary(item) { need(coaches(item.team_id) || item.added_by === db.session); db.library = db.library.filter((x) => x.id !== item.id); save(); },
      async photoUrls(paths) { const o = {}; paths.forEach((p) => (o[p] = p)); return o; },
      async uploadLogo(team, file) { const b = await shrink(file, 400, 0.85); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); },
      async announcements(team) { return wait(db.announcements.filter((a) => (team === "all" ? a.team_id == null : a.team_id == null || a.team_id === team)).sort((a, b) => b.id - a.id)); },
      async postAnnouncement(team, body) { need(team == null ? role() === "admin" : coaches(team)); const a = { id: ++db.n, team_id: team, body, created_by: db.session, created_at: new Date().toISOString() }; db.announcements.push(a); save(); return wait(a); },
      async deleteAnnouncement(id) { db.announcements = db.announcements.filter((a) => a.id !== id); save(); },
      async messages(team) { const ts = Array.isArray(team) ? team : [team]; return wait(db.messages.filter((m) => ts.includes(m.team_id) && see(m.team_id)).sort((a, b) => b.id - a.id)); },
      async sendMessage(team, kind, body) { need(role() === "minifig" && meRow().team_id === team); const m = { id: ++db.n, team_id: team, author_id: db.session, kind, body, reply: null, created_at: new Date().toISOString() }; db.messages.push(m); save(); return wait(m); },
      async reply(id, text) { const m = db.messages.find((x) => x.id === id); need(m && coaches(m.team_id)); m.reply = text; m.replied_at = new Date().toISOString(); save(); return wait(m); },
      async store() { return wait(G.FIG.ITEMS); },
      async buy(item) {
        const m = meRow(), it = G.FIG.ITEMS.find((i) => i.id === item);
        need(m && m.role === "minifig" && !m.must_change_pw, "Only Mini Figures can buy");
        need(it, "That item is not in the store"); need(!m.owned.includes(item), "You already have this!");
        need(m.coins - it.price >= 0, "Not enough gold coins yet");
        m.coins -= it.price; m.owned.push(item); db.ledger.push({ id: ++db.n, user_id: m.id, kind: "coin", delta: -it.price, reason: "Bought " + item, created_at: new Date().toISOString() }); save(); return wait(m.coins);
      },
      async setLook(lk) {
        const m = meRow();
        for (const [k, v] of Object.entries(lk)) { const it = G.FIG.ITEMS.find((i) => i.id === v); if (it && it.price > 0 && !m.owned.includes(v)) throw new Error("You don't own " + it.name); }
        m.look = lk; save(); return wait(m);
      },
      async grant(user, kind, amount, reason) {
        const p = db.profiles.find((x) => x.id === user); need(p && coaches(p.team_id), "Not your team");
        need(amount > 0 || role() === "admin", "Only the admin can take away");
        const f = kind === "stud" ? "studs" : "coins"; p[f] = Math.max(0, p[f] + amount);
        db.ledger.push({ id: ++db.n, user_id: user, kind, delta: amount, reason, created_at: new Date().toISOString() }); save(); return wait(p[f]);
      },
      async ledger(user) { return wait(db.ledger.filter((l) => l.user_id === user).sort((a, b) => b.id - a.id)); },
    };
    return api;
  }

  const demo = (/[?&]demo=1/.test(location.search) && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) || !CFG.url;
  G.API = demo ? demoApi() : supaApi();
  G.API.LABELS = LABELS;
  G.API.ytId = (u) => { const m = String(u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/); return m ? m[1] : null; };
})(window);
