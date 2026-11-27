/* Mini Figures Hub — Coach Room. Coaches see only their own teams; the admin sees everything. */
(function (G) {
  const { $, $$, esc, h, ago, toast, modal, confirmBox, teamTitle, progressBricks, progressPct, tower, nowNext, libraryGrid, openItem, addItemModal, coinHtml, labelChip } = G.UI;
  const API = G.API, FIG = G.FIG;
  const root = $("#app");
  let ME = null, C = {}, libTab = "idea", ADMIN = false;

  const tempPw = () => ["tiger", "panda", "toucan", "gecko", "otter", "comet", "robot", "brick"][Math.floor(Math.random() * 8)] + "-" + (100 + Math.floor(Math.random() * 900));

  async function start(me, isAdmin) {
    ME = me; ADMIN = !!isAdmin;
    root.innerHTML = `${API.demo ? '<div class="demo-banner">DEMO MODE — sample data <button type="button" id="demoReset">reset</button></div>' : ""}
      <div class="shell" style="--side:0px"><header class="topbar"><img class="logo" src="${G.HUB_BASE}logo.png" alt="Bottactix" style="display:block"><b style="font-family:var(--display);font-size:20px">${ADMIN ? "Admin Room" : "Coach Room"}</b>
      <span class="grow"></span><span class="muted">${esc(me.display_name)}</span>${G.EGGS.sticker("firefly", "", 38)}<button class="btn sm w" id="so">Sign out</button></header>
      <main class="main" id="view"></main><p class="foot"><a href="#" data-credits>Photos: Wikimedia Commons contributors</a></p></div>`;
    const dr = $("#demoReset"); if (dr) dr.onclick = () => { API.reset(); location.reload(); };
    $("#so").onclick = async () => { await API.signOut(); location.reload(); };
    dashboard();
  }

  // ================= DASHBOARD =================
  async function dashboard() {
    const v = $("#view"); v.innerHTML = '<div class="spinner"></div>';
    const teams = await API.teams();
    const ids = teams.map((t) => t.id);
    const [figs, tasks, msgs] = await Promise.all([API.figs(null), ids.length ? API.tasks(ids) : [], ids.length ? API.messages(ids) : []]);
    C = { teams, figs, tasks, msgs };
    v.innerHTML = `<div class="pagehead"><h2 style="flex:1">${ADMIN ? "All teams" : "My teams"} (${teams.length})</h2>
      ${ADMIN ? '<button class="btn sm" id="studio">Layer art</button><button class="btn sm w" id="annAll">Message everyone</button><button class="btn sm w" id="assign">Coaches & teams</button>' : ""}</div>
      ${teams.length ? "" : '<div class="card empty">No teams are assigned to you yet. Ask the admin.</div>'}<div class="cgrid" id="boxes"></div>`;
    const boxes = $("#boxes");
    teams.forEach((t) => {
      const tf = figs.filter((f) => f.team_id === t.id), tt = tasks.filter((x) => x.team_id === t.id);
      const { now, next } = nowNext(tt); const unread = msgs.filter((m) => m.team_id === t.id && !m.reply).length;
      const b = h(`<button class="tbox"><div class="th"><span class="num">${t.id}</span><div style="flex:1;min-width:0"><div style="font-family:var(--display);font-size:20px;line-height:1.1">${esc(teamTitle(t))}</div><div class="muted">${esc(t.slot)}</div></div>${unread ? `<span class="badge-n">${unread} new</span>` : ""}</div>
        <div class="figs lay" data-layer="emergent" ${G.UI.layerBg("emergent")}>${tf.length ? tf.map((f) => FIG.render(f.look, { size: 74, seed: f.username, label: f.display_name })).join("") : '<span class="muted" style="align-self:center;padding-bottom:20px;color:#cde">No Mini Figure yet</span>'}</div>
        <div class="muted" style="font-size:13px">${tf.map((f) => esc(f.display_name)).join(" · ")}</div>
        <div class="pbar"><i style="width:${progressPct(t)}%"></i></div>
        <div class="line"><b>Now</b>${now ? esc(now.title) + (now.status === "doing" ? " (working on it)" : "") : "—"}</div><div class="line"><b>Next</b>${next ? esc(next.title) : "—"}</div></button>`);
      b.onclick = () => teamPage(t.id);
      boxes.append(b);
    });
    if (ADMIN) {
      $("#studio").onclick = () => G.STUDIO.open($("#view"), dashboard);
      $("#annAll").onclick = () => {
        const f = h('<div><label class="field"><span>Message to every Mini Figure</span><textarea class="input" name="b" maxlength="1000"></textarea></label></div>');
        modal("Announcement for everyone", f, [{ t: "Cancel", cls: "w" }, { t: "Post", cls: "g", fn: async () => { const b = $("[name=b]", f).value.trim(); if (!b) throw new Error("Write something first"); await API.postAnnouncement(null, b); toast("Posted to everyone"); } }]);
      };
      $("#assign").onclick = assignView;
    }
  }

  // ================= ADMIN: coaches & teams =================
  async function assignView() {
    const v = $("#view"); v.innerHTML = '<div class="spinner"></div>';
    const [staff, tc, figs, teams] = await Promise.all([API.staff(), API.teamCoaches(), API.figs(null), API.teams()]);
    const coaches = staff.filter((s) => s.role !== "minifig");
    v.innerHTML = `<button class="btn sm w back" id="bk">◀ All teams</button><h2 style="margin-bottom:12px">Coaches & teams</h2>
      <div class="card" style="overflow:auto;margin-bottom:16px"><h3>Who coaches which team</h3><p class="muted">Tick a box to give a coach a team. Coaches only see the teams ticked for them.</p>
      <table class="plain"><thead><tr><th>Team</th>${coaches.map((c) => `<th>${esc(c.display_name)}</th>`).join("")}</tr></thead><tbody>
      ${teams.map((t) => `<tr><td><b>${t.id}</b> ${esc(t.name || "")}</td>${coaches.map((c) => `<td><input type="checkbox" aria-label="${esc(c.display_name)} coaches team ${t.id}" data-t="${t.id}" data-c="${c.id}" ${tc.some((x) => x.team_id === t.id && x.coach_id === c.id) ? "checked" : ""}></td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="card"><h3>Mini Figures' teams</h3><table class="plain"><thead><tr><th>Mini Figure</th><th>Username</th><th>Team</th></tr></thead><tbody>
      ${figs.map((f) => `<tr><td>${esc(f.display_name)}</td><td>${esc(f.username)}</td><td><select class="input" style="min-height:40px;padding:6px" data-f="${f.id}">${teams.map((t) => `<option value="${t.id}" ${t.id === f.team_id ? "selected" : ""}>Team ${t.id}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>`;
    $("#bk").onclick = dashboard;
    $$("input[data-c]", v).forEach((cb) => (cb.onchange = async () => { try { await API.setCoach(+cb.dataset.t, cb.dataset.c, cb.checked); toast("Saved"); } catch (e) { cb.checked = !cb.checked; toast(e.message); } }));
    $$("select[data-f]", v).forEach((s) => (s.onchange = async () => { try { await API.moveFig(s.dataset.f, +s.value); toast("Moved to Team " + s.value); } catch (e) { toast(e.message); } }));
  }

  // ================= TEAM PAGE =================
  async function teamPage(id) {
    const v = $("#view"); v.innerHTML = '<div class="spinner"></div>';
    const [team, figs, tasks, kids, ann, msgs, lib] = await Promise.all([API.team(id), API.figs(id), API.tasks(id), API.kids(id), API.announcements(id), API.messages(id), API.library(id)]);
    if (!team) { v.innerHTML = '<div class="err">You can\'t open this team.</div>'; return; }
    const T = { team, figs, tasks, kids, ann: ann.filter((a) => a.team_id === id), msgs, lib };
    v.innerHTML = `<button class="btn sm w back" id="bk">◀ All teams</button>
      <section class="teamhero lay card" data-layer="emergent" ${G.UI.layerBg("emergent")} style="padding:16px;margin-bottom:16px"><div class="row"><span class="num">${id}</span>
        ${team.logo_url ? `<img class="tlogo" src="${esc(team.logo_url)}" alt="">` : ""}<span class="tname">${esc(teamTitle(team))}</span><span class="slot">📅 ${esc(team.slot)}</span></div>${G.UI.layerTag("emergent", true)}</section>
      <div class="grid" style="gap:16px">
        <div class="card"><h3>Mini Figures</h3><div class="figrow" id="figs"></div></div>
        <div class="card"><h3 style="flex-wrap:wrap"><span style="flex:1">Task queue</span><button class="btn sm g" id="addT">+ Add task</button></h3>
          <p class="muted" style="margin-top:-4px">Level 1 is done first. Tasks on the same level can be done at the same time. Use ▲▼ to move a task between levels.</p><div id="tw"></div></div>
        <div class="grid g2">
          <div class="card"><h3>Progress</h3><div id="prog"></div></div>
          <div class="card"><h3>Team name & logo</h3><div id="ident"></div></div>
          <div class="card"><h3>Announcements</h3><div id="ann"></div></div>
          <div class="card"><h3>Questions & feedback</h3><div id="msgs"></div></div>
        </div>
        <div class="card"><h3 style="flex-wrap:wrap"><span style="flex:1">Library</span><button class="btn sm g" id="addIdea">+ Idea for the team</button></h3><div id="lib"></div></div>
        <div class="card"><h3>Team members (${kids.length})</h3><div id="kids"></div></div>
      </div>`;
    $("#bk").onclick = dashboard;
    const refresh = () => teamPage(id);

    // --- mini figures ---
    const fr = $("#figs");
    if (!figs.length) fr.innerHTML = '<p class="muted">No Mini Figure on this team yet.</p>';
    figs.forEach((f) => {
      const c = h(`<div class="figcard"><div class="night figbox">${FIG.render(f.look, { size: 80, seed: f.username, label: f.display_name })}</div><div style="flex:1;min-width:0"><div style="font-family:var(--display);font-size:19px">${esc(f.display_name)}</div>
        <div class="muted">@${esc(f.username)} ${f.must_change_pw ? '· <span style="color:#B3242A">hasn\'t set a password yet</span>' : ""}</div>
        <div class="acts" style="margin-top:6px"><button class="btn sm w" data-a="pw">New password</button></div></div></div>`);
      $("[data-a=pw]", c).onclick = () => {
        const p = tempPw();
        const fm = h(`<div><p>Give <b>${esc(f.display_name)}</b> a new temporary password. They will have to change it when they sign in.</p><label class="field"><span>Temporary password</span><input class="input" name="p" value="${p}"></label></div>`);
        modal("New password", fm, [{ t: "Cancel", cls: "w" }, { t: "Set password", cls: "r", fn: async () => {
          const pw = $("[name=p]", fm).value.trim(); await API.resetPassword(f.id, pw);
          modal("Done", `<p>Tell ${esc(f.display_name)}:</p><p style="font-size:20px">Username: <b>${esc(f.username)}</b><br>Password: <b>${esc(pw)}</b></p>`, [{ t: "OK", cls: "g" }], { noFocus: true }); refresh();
        } }]);
      };
      fr.append(c);
    });

    // --- tasks ---
    const taskForm = (t) => {
      const lbl = t && !API.LABELS.includes(t.label) ? "other" : t ? t.label : "model";
      const fm = h(`<div><label class="field"><span>Task</span><input class="input" name="t" maxlength="140" value="${esc(t ? t.title : "")}"></label>
        <label class="field"><span>Details</span><textarea class="input" name="d" maxlength="1000">${esc(t ? t.details : "")}</textarea></label>
        <div class="grid g2" style="gap:10px"><label class="field"><span>Label</span><select class="input" name="l">${API.LABELS.map((l) => `<option ${l === lbl ? "selected" : ""}>${l}</option>`).join("")}<option value="other" ${lbl === "other" ? "selected" : ""}>other…</option></select></label>
        <label class="field"><span>Level (1 = first)</span><input class="input" name="p" type="number" min="1" max="20" value="${t ? t.priority : Math.max(1, ...tasks.filter((x) => x.status !== "done").map((x) => x.priority))}"></label></div>
        <label class="field ol ${lbl === "other" ? "" : "hidden"}"><span>Other label</span><input class="input" name="o" maxlength="30" value="${esc(t && lbl === "other" ? t.label : "")}"></label></div>`);
      $("[name=l]", fm).onchange = (e) => $(".ol", fm).classList.toggle("hidden", e.target.value !== "other");
      const read = () => {
        const title = $("[name=t]", fm).value.trim(); if (!title) throw new Error("Write the task");
        let label = $("[name=l]", fm).value; if (label === "other") { label = $("[name=o]", fm).value.trim().toLowerCase(); if (!label) throw new Error("Type the label"); }
        const priority = Math.min(20, Math.max(1, parseInt($("[name=p]", fm).value, 10) || 1));
        return { title, details: $("[name=d]", fm).value.trim(), label, priority };
      };
      const btns = [{ t: "Cancel", cls: "w" }];
      if (t) btns.push({ t: "Delete", cls: "r", fn: async () => { if (await confirmBox("Delete task?", esc(t.title), "Delete", "r")) { await API.deleteTask(t.id); refresh(); } } });
      btns.push({ t: t ? "Save" : "Add task", cls: "g", fn: async () => { const d = read(); if (t) await API.updateTask(t.id, d); else await API.addTask(Object.assign({ team_id: id }, d)); toast("Saved"); refresh(); } });
      modal(t ? "Edit task" : "New task", fm, btns);
    };
    $("#addT").onclick = () => taskForm(null);
    $("#tw").append(tower(tasks, {
      coach: true,
      onMove: async (t, d) => { try { await API.updateTask(t.id, { priority: Math.min(20, Math.max(1, t.priority + d)) }); refresh(); } catch (e) { toast(e.message); } },
      onEdit: taskForm,
      onStatus: async (t, s) => { try { await API.updateTask(t.id, { status: s }); refresh(); } catch (e) { toast(e.message, 3500); } }
    }));

    // --- progress ---
    const prog = JSON.parse(JSON.stringify(team.progress || []));
    const pr = $("#prog");
    const drawProg = () => {
      pr.innerHTML = prog.map((p, i) => `<div class="chk"><input type="checkbox" data-i="${i}" ${p.done ? "checked" : ""} id="pg${i}"><label for="pg${i}" style="flex:1">${esc(p.k)}</label><button class="btn sm w" data-x="${i}" aria-label="Remove ${esc(p.k)}">✕</button></div>`).join("") +
        `<div style="display:flex;gap:8px;margin-top:8px"><input class="input" id="newStep" placeholder="Add a step (e.g. Team poster)" maxlength="40"><button class="btn sm" id="addStep">Add</button></div><button class="btn g" id="saveProg" style="margin-top:12px">Save progress</button>`;
      $$("[data-i]", pr).forEach((cb) => (cb.onchange = () => (prog[cb.dataset.i].done = cb.checked)));
      $$("[data-x]", pr).forEach((b) => (b.onclick = () => { prog.splice(+b.dataset.x, 1); drawProg(); }));
      $("#addStep").onclick = () => { const k = $("#newStep").value.trim(); if (k) { prog.push({ k, done: false }); drawProg(); } };
      $("#saveProg").onclick = async () => { try { await API.updateTeam(id, { progress: prog }); toast("Progress saved"); } catch (e) { toast(e.message); } };
    };
    drawProg();

    // --- identity ---
    const idt = $("#ident");
    idt.innerHTML = `<label class="field"><span>Team name</span><input class="input" id="tn" maxlength="40" value="${esc(team.name || "")}" placeholder="Still Team ${id}"></label>
      <label class="chk"><input type="checkbox" id="tnp" ${team.name_public ? "checked" : ""}> Show the name to everyone (when it's final)</label>
      <div style="display:flex;align-items:center;gap:12px;margin:8px 0">${team.logo_url ? `<img src="${esc(team.logo_url)}" alt="Team logo" style="width:72px;height:72px;border-radius:16px;border:3px solid var(--ink);object-fit:cover">` : '<span class="muted">No logo yet</span>'}
      <label class="btn sm w" style="cursor:pointer">Upload logo<input type="file" id="lf" accept="image/*" hidden></label></div>
      <label class="chk"><input type="checkbox" id="tlp" ${team.logo_public ? "checked" : ""}> Show the logo to everyone</label>
      <button class="btn g" id="saveId" style="margin-top:8px">Save</button>`;
    let newLogo = null;
    $("#lf").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { toast("Uploading…"); newLogo = await API.uploadLogo(id, f); toast("Logo uploaded. Press Save."); } catch (x) { toast(x.message); } };
    $("#saveId").onclick = async () => {
      const patch = { name: $("#tn").value.trim() || null, name_public: $("#tnp").checked, logo_public: $("#tlp").checked };
      if (newLogo) patch.logo_url = newLogo;
      try { await API.updateTeam(id, patch); toast("Saved"); refresh(); } catch (e) { toast(e.message); }
    };

    // --- announcements ---
    const an = $("#ann");
    an.innerHTML = `<label class="field"><span>New announcement for this team</span><textarea class="input" id="anb" maxlength="1000" placeholder="Bring 2 model ideas next session."></textarea></label><button class="btn sm y" id="anp">Post 📣</button><div style="margin-top:12px">
      ${T.ann.map((a) => `<div class="ann"><div class="meta">${ago(a.created_at)} <button class="link" data-del="${a.id}">delete</button></div>${esc(a.body)}</div>`).join("")}</div>`;
    $("#anp").onclick = async () => { const b = $("#anb").value.trim(); if (!b) return; try { await API.postAnnouncement(id, b); toast("Posted"); refresh(); } catch (e) { toast(e.message); } };
    $$("[data-del]", an).forEach((b) => (b.onclick = async () => { await API.deleteAnnouncement(+b.dataset.del); refresh(); }));

    // --- messages ---
    const ms = $("#msgs");
    ms.innerHTML = msgs.length ? "" : '<p class="muted">No questions yet.</p>';
    msgs.forEach((m) => {
      const who = figs.find((f) => f.id === m.author_id);
      const d = h(`<div class="msg"><span class="pill">${m.kind === "question" ? "❓ Question" : "💭 Feedback"}</span> <b>${esc(who ? who.display_name : "")}</b> <span class="muted">${ago(m.created_at)}</span>
        <div style="font-weight:700;margin-top:6px;white-space:pre-wrap">${esc(m.body)}</div>${m.reply ? `<div class="reply">${esc(m.reply)}</div>` : ""}
        <div style="display:flex;gap:8px;margin-top:8px"><input class="input" placeholder="${m.reply ? "Change reply" : "Reply…"}" maxlength="1000" style="min-height:42px"><button class="btn sm">Send</button></div></div>`);
      $("button", d).onclick = async () => { const r = $("input", d).value.trim(); if (!r) return; try { await API.reply(m.id, r); toast("Replied"); refresh(); } catch (e) { toast(e.message); } };
      ms.append(d);
    });

    // --- library ---
    const lb = $("#lib");
    const drawLib = async () => {
      const tabs = [["idea", "💡 Model ideas"], ["photo", "📷 Photos"], ["coach_idea", "🎓 Coach ideas"]];
      lb.innerHTML = `<div class="tabs">${tabs.map(([k, t]) => `<button class="tab ${libTab === k ? "on" : ""}" data-l="${k}">${t} (${lib.filter((i) => i.section === k).length})</button>`).join("")}</div>`;
      $$("[data-l]", lb).forEach((b) => (b.onclick = () => { libTab = b.dataset.l; drawLib(); }));
      lb.append(await libraryGrid(lib.filter((i) => i.section === libTab), (it, url) => openItem(it, url, true, async (x) => { await API.deleteLibrary(x); toast("Deleted"); refresh(); })));
    };
    drawLib();
    $("#addIdea").onclick = () => addItemModal(id, "coach_idea", refresh);

    // --- kids ---
    const kd = $("#kids");
    kd.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${kids.map((k) => `<span class="pill">${esc(k.name)} <button class="link" style="padding:0 2px;text-decoration:none" data-k="${k.id}" aria-label="Remove ${esc(k.name)}">✕</button></span>`).join("")}</div>
      <div style="display:flex;gap:8px"><input class="input" id="nk" placeholder="Add a kid's name" maxlength="80"><button class="btn sm" id="ak">Add</button></div>`;
    $$("[data-k]", kd).forEach((b) => (b.onclick = async () => { if (await confirmBox("Remove from team?", "", "Remove", "r")) { await API.removeKid(+b.dataset.k); refresh(); } }));
    $("#ak").onclick = async () => { const n = $("#nk").value.trim(); if (!n) return; await API.addKid(id, n); refresh(); };
  }

  G.COACH = { start };
})(window);
