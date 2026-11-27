/* BIOGLOW easter eggs: secret rainforest critters (real photos), glow mode, a flying toucan. */
(function (G) {
  const FACTS = {
    firefly: ["BIOGLOW mode is on", "A firefly's light is called cold light: it glows without getting hot. Tap the firefly again to switch the lights back on."],
    frog: ["You found the red-eyed tree frog", "When it rests, it hides its bright red eyes. If an animal comes close, it pops them open to give it a scare."],
    mushroom: ["You found the glowing mushroom", "Some mushrooms glow green in the dark rainforest. People call this light foxfire."],
    morpho: ["You found the blue morpho", "Its wings have no blue colour at all. Tiny scales bend the light so we see bright blue."],
    toucan: ["You found the toucan", "A toucan's huge beak is light and hollow inside, and it helps the bird keep cool."]
  };
  const KEY = "mf-eggs", GKEY = "mf-glow";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const total = Object.keys(FACTS).length;

  function sticker(k, cls = "", size = 54) {
    return `<button type="button" class="egg ${cls}" data-egg="${k}" style="width:${size}px;height:${size}px" aria-label="Secret ${G.FIG.PHOTOS[k].name}"><img src="${G.FIG.photo(k, 160)}" alt=""></button>`;
  }
  function setGlow(on) {
    document.body.classList.toggle("glow", on);
    try { localStorage.setItem(GKEY, on ? "1" : ""); } catch (e) {}
  }
  function found(k) {
    const f = load(); if (!f.includes(k)) { f.push(k); save(f); }
    if (k === "firefly") setGlow(!document.body.classList.contains("glow"));
    const [t, fact] = FACTS[k];
    G.UI.modal(t, `<div class="eggpop"><img src="${G.FIG.photo(k, 600)}" alt="${G.FIG.PHOTOS[k].name}"><p>${fact}</p>
      <p class="pill">Secret critters found: <b>${f.length} / ${total}</b>${f.length === total ? " · You found them all." : ""}</p></div>`, [{ t: "Close", cls: "g" }], { noFocus: true });
  }
  function toucanFly() {
    const el = document.createElement("img");
    el.src = G.FIG.photo("toucan", 200); el.alt = ""; el.className = "flyer"; el.setAttribute("aria-hidden", "true");
    document.body.append(el); setTimeout(() => el.remove(), 2600);
  }
  function peekFrog(scope) {
    const cards = [...scope.querySelectorAll(".card")]; if (!cards.length) return;
    const c = cards[Math.floor(Math.random() * cards.length)];
    c.insertAdjacentHTML("beforeend", sticker("frog", "peek", 52));
  }
  function credits() {
    G.UI.modal("Photo credits", `<p class="muted">Rainforest photos come from Wikimedia Commons and are free to use under their licences. Tap a name to see the photographer and licence.</p>
      <ul class="credits">${Object.keys(G.FIG.PHOTOS).map((k) => `<li><a href="${G.FIG.photoPage(k)}" target="_blank" rel="noopener noreferrer">${G.FIG.PHOTOS[k].name}</a></li>`).join("")}</ul>`, [{ t: "Close", cls: "w" }], { noFocus: true });
  }
  // keyboard secret: type g-l-o-w
  let typed = "";
  document.addEventListener("keydown", (e) => {
    if (/input|textarea|select/i.test((e.target && e.target.tagName) || "")) return;
    typed = (typed + (e.key || "").toLowerCase()).slice(-4);
    if (typed === "glow") { setGlow(!document.body.classList.contains("glow")); G.UI.toast(document.body.classList.contains("glow") ? "BIOGLOW mode on" : "Lights on"); }
  });
  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-egg]"); if (b) { e.preventDefault(); found(b.dataset.egg); } const c = e.target.closest && e.target.closest("[data-credits]"); if (c) { e.preventDefault(); credits(); } });
  try { if (localStorage.getItem(GKEY)) document.body.classList.add("glow"); } catch (e) {}
  G.EGGS = { sticker, toucanFly, peekFrog, credits, setGlow };
})(window);
