/* Mini Figures — layered 2D sticker character (original design).
   FIG.svg(look, {size}) → SVG string.  look = {skin, girl, hair, hairColor, hat, glasses, top, topColor, bottom, bottomColor, shoes, shoeColor, buddy} */
(function (G) {
  const INK = "#23233A";
  const SKIN = ["#FFD9B8", "#F6C29A", "#E3A57A", "#C98B5E", "#9E6741", "#6E4528"];
  const HAIR = ["#2B1E16", "#5A3A22", "#8C5A2B", "#D9A441", "#E8E0D0", "#C2453B", "#3F4FB8"];
  const COLORS = ["#2F7BFF", "#FF5A5F", "#FFC21A", "#00B386", "#9B4DFF", "#FF8A00", "#FF4FA3", "#14213D", "#FFFFFF", "#46C2E8"];
  const PANTS = ["#2C3E70", "#3A86FF", "#23233A", "#7A5230", "#00B386", "#9B4DFF"];
  const SHOES = ["#FF5A5F", "#FFFFFF", "#23233A", "#FFC21A", "#2F7BFF", "#00B386"];

  // Store catalog (id, slot, name, price in gold coins). Price 0 = free for everyone.
  const ITEMS = [
    // hair
    ["hair_short", "hair", "Classic", 0], ["hair_bob", "hair", "Bob", 0], ["hair_pony", "hair", "Ponytail", 0],
    ["hair_spiky", "hair", "Spiky", 3], ["hair_curly", "hair", "Curly", 3], ["hair_quiff", "hair", "Cool quiff", 4],
    ["hair_mohawk", "hair", "Mohawk", 5], ["hair_long", "hair", "Long waves", 3], ["hair_buns", "hair", "Space buns", 4],
    ["hair_braids", "hair", "Braids", 4], ["hair_pigtails", "hair", "Pigtails", 3],
    // hats
    ["hat_cap", "hat", "Back cap", 3], ["hat_explorer", "hat", "Jungle explorer", 5], ["hat_beanie", "hat", "Beanie", 3],
    ["hat_helmet", "hat", "Builder helmet", 4], ["hat_headphones", "hat", "Headphones", 5], ["hat_party", "hat", "Party hat", 2],
    ["hat_crown", "hat", "Gold crown", 10], ["hat_bandana", "hat", "Bandana", 3],
    // glasses
    ["gl_round", "glasses", "Round specs", 2], ["gl_shades", "glasses", "Cool shades", 3], ["gl_aviator", "glasses", "Gold aviators", 4],
    ["gl_star", "glasses", "Star glasses", 4], ["gl_heart", "glasses", "Heart glasses", 4], ["gl_visor", "glasses", "Neon visor", 6],
    // tops
    ["top_tee", "top", "T-shirt", 0], ["top_hoodie", "top", "Hoodie", 4], ["top_jacket", "top", "Jacket", 5],
    ["top_vest", "top", "Explorer vest", 5], ["top_jersey", "top", "Team jersey", 4], ["top_overalls", "top", "Overalls", 4],
    ["top_labcoat", "top", "Lab coat", 6], ["top_cape", "top", "Hero cape", 8],
    // bottoms
    ["bot_pants", "bottom", "Pants", 0], ["bot_shorts", "bottom", "Shorts", 2], ["bot_skirt", "bottom", "Skirt", 2],
    ["bot_jeans", "bottom", "Jeans", 3], ["bot_cargo", "bottom", "Cargo pants", 3],
    // shoes
    ["sh_sneakers", "shoes", "Sneakers", 0], ["sh_hightops", "shoes", "High-tops", 3], ["sh_boots", "shoes", "Boots", 3],
    ["sh_rain", "shoes", "Rain boots", 3], ["sh_glow", "shoes", "Light-up shoes", 6],
    // buddies
    ["bd_toucan", "buddy", "Toucan buddy", 10], ["bd_frog", "buddy", "Frog buddy", 8], ["bd_butterfly", "buddy", "Butterfly", 7],
    ["bd_robot", "buddy", "Mini robot", 10]
  ].map(([id, slot, name, price], i) => ({ id, slot, name, price, sort: i }));

  const DEFAULT = { skin: SKIN[1], girl: "0", hair: "hair_short", hairColor: HAIR[0], hat: "none", glasses: "none",
    top: "top_tee", topColor: COLORS[0], bottom: "bot_pants", bottomColor: PANTS[0], shoes: "sh_sneakers", shoeColor: SHOES[0], buddy: "none" };

  const shade = (hex, f) => { // f<0 darker, f>0 lighter
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
  const s2 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

  // ---------- parts ----------
  function hairBack(st, c) {
    const d = shade(c, -0.25);
    switch (st) {
      case "hair_long": return `<path d="M52,58 C44,100 46,140 56,158 L144,158 C154,140 156,100 148,58 Z" fill="${d}" ${S}/>`;
      case "hair_pony": return `<path d="M140,44 C170,48 176,90 162,124 C158,104 150,86 136,74 Z" fill="${d}" ${S}/>`;
      case "hair_pigtails": return `<path d="M50,58 C24,64 22,104 34,122 C40,104 48,90 56,80Z" fill="${d}" ${S}/><path d="M150,58 C176,64 178,104 166,122 C160,104 152,90 144,80Z" fill="${d}" ${S}/>`;
      case "hair_bob": return `<path d="M50,58 C46,84 48,104 56,112 L144,112 C152,104 154,84 150,58 Z" fill="${d}" ${S}/>`;
      case "hair_braids": return `<g fill="${d}" ${s2}>${[0, 1, 2, 3].map(i => `<ellipse cx="52" cy="${92 + i * 15}" rx="9" ry="9"/><ellipse cx="148" cy="${92 + i * 15}" rx="9" ry="9"/>`).join("")}</g>`;
      default: return "";
    }
  }
  function hairFront(st, c) {
    const l = shade(c, 0.18), base = `fill="${c}" ${S}`;
    const shine = `<path d="M74,30 C84,24 96,22 106,23" fill="none" stroke="${l}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
    switch (st) {
      case "hair_short": return `<path d="M54,64 C50,26 76,14 100,14 C126,14 152,26 146,64 C140,50 132,44 120,44 C110,50 92,50 80,44 C68,44 60,50 54,64Z" ${base}/>${shine}`;
      case "hair_bob": return `<path d="M52,74 C46,26 76,12 100,12 C124,12 154,26 148,74 C142,56 132,46 100,46 C78,46 60,54 52,74Z" ${base}/>${shine}`;
      case "hair_pony": return `<path d="M54,66 C50,26 76,14 100,14 C126,14 150,26 146,62 C134,46 112,42 96,44 C80,44 64,50 54,66Z" ${base}/><circle cx="138" cy="42" r="7" fill="${shade(c, -0.3)}" ${s2}/>${shine}`;
      case "hair_spiky": return `<path d="M54,64 L50,32 L66,38 L68,14 L84,30 L94,6 L106,28 L122,8 L126,32 L144,18 L142,40 L152,40 L146,64 C138,50 122,44 100,46 C80,44 62,50 54,64Z" ${base}/>`;
      case "hair_curly": return `<g fill="${c}" ${S}>${[[58, 50], [64, 32], [80, 20], [100, 16], [120, 20], [136, 32], [142, 50], [72, 40], [92, 34], [112, 34], [128, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14"/>`).join("")}</g><g fill="${c}">${[[72, 40], [92, 34], [112, 34], [128, 42], [100, 28], [82, 30], [118, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12"/>`).join("")}</g>`;
      case "hair_quiff": return `<path d="M54,66 C48,34 64,18 84,12 C104,0 140,6 150,22 C156,34 150,48 146,64 C140,52 128,44 112,44 C96,46 76,44 62,52 Z" ${base}/><path d="M86,16 C104,8 132,10 144,24" fill="none" stroke="${l}" stroke-width="5" stroke-linecap="round"/>`;
      case "hair_mohawk": return `<path d="M56,58 C56,40 70,30 84,28 L116,28 C130,30 144,40 144,58 C130,48 70,48 56,58Z" fill="${shade(c, -0.2)}" ${S}/><path d="M86,40 L82,0 L94,10 L100,-4 L106,10 L118,0 L114,40 Z" ${base}/>`;
      case "hair_long": return `<path d="M50,80 C44,26 76,12 100,12 C124,12 156,26 150,80 C144,58 128,44 108,42 C98,52 76,50 66,46 C58,56 54,66 50,80Z" ${base}/>${shine}`;
      case "hair_buns": return `<circle cx="66" cy="22" r="17" fill="${c}" ${S}/><circle cx="134" cy="22" r="17" fill="${c}" ${S}/><path d="M54,66 C50,28 76,16 100,16 C124,16 150,28 146,66 C140,50 124,44 100,46 C78,44 60,50 54,66Z" ${base}/>${shine}`;
      case "hair_braids": return `<path d="M52,72 C46,26 76,14 100,14 C124,14 154,26 148,72 C140,54 122,46 100,40 C80,46 60,54 52,72Z" ${base}/><path d="M100,16 L100,40" stroke="${shade(c, -0.3)}" stroke-width="3"/>`;
      case "hair_pigtails": return `<path d="M54,66 C50,26 76,14 100,14 C126,14 150,26 146,66 C140,50 120,42 100,44 C80,42 60,50 54,66Z" ${base}/><circle cx="54" cy="58" r="7" fill="#FF4FA3" ${s2}/><circle cx="146" cy="58" r="7" fill="#FF4FA3" ${s2}/>${shine}`;
      default: return "";
    }
  }
  function head(skin) {
    const d = shade(skin, -0.12);
    return `<circle cx="56" cy="70" r="10" fill="${skin}" ${S}/><circle cx="144" cy="70" r="10" fill="${skin}" ${S}/>
      <rect x="58" y="22" width="84" height="84" rx="32" fill="${skin}" ${S}/>
      <path d="M62,80 C66,98 80,104 100,104 C120,104 134,98 138,80 C134,96 120,100 100,100 C80,100 66,96 62,80Z" fill="${d}" opacity=".6"/>
      <ellipse cx="80" cy="44" rx="10" ry="6" fill="#fff" opacity=".35"/>`;
  }
  function face(skin) {
    return `<ellipse cx="84" cy="70" rx="6.5" ry="8.5" fill="${INK}"/><ellipse cx="116" cy="70" rx="6.5" ry="8.5" fill="${INK}"/>
      <circle cx="86" cy="67" r="2.6" fill="#fff"/><circle cx="118" cy="67" r="2.6" fill="#fff"/>
      <ellipse cx="72" cy="86" rx="7" ry="4" fill="#FF7A8A" opacity=".45"/><ellipse cx="128" cy="86" rx="7" ry="4" fill="#FF7A8A" opacity=".45"/>
      <path d="M88,86 C94,95 106,95 112,86" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  function glasses(st) {
    const br = `<path d="M96,68 L104,68" stroke="${INK}" stroke-width="3.5"/>`;
    switch (st) {
      case "gl_round": return `<g fill="rgba(255,255,255,.25)" ${s2}><circle cx="83" cy="69" r="12"/><circle cx="117" cy="69" r="12"/></g>${br}<path d="M71,66 L60,63 M129,66 L140,63" stroke="${INK}" stroke-width="3"/>`;
      case "gl_shades": return `<path d="M62,60 L138,60 L136,72 C134,82 122,84 112,80 L104,70 L96,70 L88,80 C78,84 66,82 64,72Z" fill="${INK}" ${s2}/><path d="M70,64 L82,64" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/><path d="M110,64 L122,64" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
      case "gl_aviator": return `<g fill="#3B3B5C" stroke="#E0A400" stroke-width="3.5"><path d="M68,62 L96,62 C96,76 90,84 80,84 C70,84 66,74 68,62Z"/><path d="M104,62 L132,62 C134,74 130,84 120,84 C110,84 104,76 104,62Z"/></g><path d="M96,64 C100,60 100,60 104,64" stroke="#E0A400" stroke-width="3" fill="none"/><path d="M74,68 L84,68" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
      case "gl_star": { const st = (cx) => { let p = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; p += (i ? "L" : "M") + (cx + Math.cos(a) * r).toFixed(1) + "," + (70 + Math.sin(a) * r).toFixed(1); } return p + "Z"; }; return `<g fill="#FFC21A" ${s2}><path d="${st(82)}"/><path d="${st(118)}"/></g>${br}`; }
      case "gl_heart": { const h = (cx) => `M${cx},82 C${cx - 18},70 ${cx - 16},56 ${cx - 6},58 C${cx - 2},58 ${cx},62 ${cx},64 C${cx},62 ${cx + 2},58 ${cx + 6},58 C${cx + 16},56 ${cx + 18},70 ${cx},82Z`; return `<g fill="#FF4FA3" ${s2}><path d="${h(82)}"/><path d="${h(118)}"/></g>${br}`; }
      case "gl_visor": return `<path d="M58,60 C80,54 120,54 142,60 L140,76 C120,82 80,82 60,76Z" fill="#39F3BB" opacity=".85" ${s2}/><path d="M66,64 C86,60 112,60 134,64" stroke="#fff" stroke-width="3" opacity=".7" fill="none" stroke-linecap="round"/>`;
      default: return "";
    }
  }
  function hat(st) {
    switch (st) {
      case "hat_cap": return `<path d="M56,46 C56,18 78,8 100,8 C122,8 144,18 144,46 Z" fill="#FF5A5F" ${S}/><path d="M118,42 C130,40 150,42 162,48 C150,52 132,50 118,48Z" fill="#E0484D" ${S}/><circle cx="100" cy="10" r="5" fill="#fff" ${s2}/><path d="M72,22 C80,16 90,14 98,14" stroke="#fff" stroke-width="4" opacity=".45" fill="none" stroke-linecap="round"/>`;
      case "hat_explorer": return `<ellipse cx="100" cy="42" rx="64" ry="13" fill="#C9A15C" ${S}/><path d="M64,42 C64,10 82,2 100,2 C118,2 136,10 136,42 Z" fill="#D9B46B" ${S}/><path d="M65,34 L135,34 L136,42 L64,42Z" fill="#00B386" ${s2}/><path d="M76,16 C84,10 92,8 100,8" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/>`;
      case "hat_beanie": return `<path d="M54,52 C52,14 76,4 100,4 C124,4 148,14 146,52 Z" fill="#9B4DFF" ${S}/><rect x="52" y="40" width="96" height="16" rx="8" fill="#B983FF" ${S}/><circle cx="100" cy="2" r="9" fill="#FFC21A" ${S}/>`;
      case "hat_helmet": return `<path d="M56,48 C54,14 78,2 100,2 C122,2 146,14 144,48 Z" fill="#FFC21A" ${S}/><path d="M48,48 L152,48 L150,56 L50,56 Z" fill="#E8A800" ${S}/><path d="M92,4 L108,4 L108,46 L92,46Z" fill="#FFD84D" ${s2}/>`;
      case "hat_headphones": return `<path d="M54,70 C44,10 156,10 146,70" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M54,70 C44,10 156,10 146,70" fill="none" stroke="#FF4FA3" stroke-width="7" stroke-linecap="round"/><rect x="40" y="56" width="20" height="30" rx="9" fill="#FF4FA3" ${S}/><rect x="140" y="56" width="20" height="30" rx="9" fill="#FF4FA3" ${S}/>`;
      case "hat_party": return `<path d="M100,-14 L124,34 L76,34 Z" fill="#46C2E8" ${S}/><path d="M88,10 L112,10 M82,22 L118,22" stroke="#FFC21A" stroke-width="5"/><circle cx="100" cy="-16" r="7" fill="#FF5A5F" ${s2}/>`;
      case "hat_crown": return `<path d="M64,38 L60,6 L80,22 L100,0 L120,22 L140,6 L136,38 Z" fill="#FFC21A" ${S}/><circle cx="100" cy="26" r="5" fill="#FF5A5F" ${s2}/><circle cx="78" cy="30" r="4" fill="#2F7BFF" ${s2}/><circle cx="122" cy="30" r="4" fill="#00B386" ${s2}/>`;
      case "hat_bandana": return `<path d="M54,50 C54,16 78,8 100,8 C122,8 146,16 146,50 Z" fill="#FF5A5F" ${S}/><path d="M144,40 L164,30 L160,52 Z" fill="#FF5A5F" ${S}/>${[[76, 26], [100, 20], [124, 28], [88, 40], [114, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`).join("")}`;
      default: return "";
    }
  }
  function legs(look) {
    const c = look.bottomColor, d = shade(c, -0.18), sk = look.skin, st = look.bottom;
    let out = "";
    if (st === "bot_shorts" || st === "bot_skirt") {
      out += `<rect x="70" y="190" width="24" height="44" rx="10" fill="${sk}" ${S}/><rect x="106" y="190" width="24" height="44" rx="10" fill="${sk}" ${S}/>`;
      if (st === "bot_shorts") out += `<path d="M64,172 L136,172 L136,206 L104,206 L100,194 L96,206 L64,206 Z" fill="${c}" ${S}/>`;
      else out += `<path d="M66,170 L134,170 L146,212 L54,212 Z" fill="${c}" ${S}/><path d="M78,176 L72,210 M100,176 L100,210 M122,176 L128,210" stroke="${d}" stroke-width="3"/>`;
    } else {
      out += `<path d="M64,170 L136,170 L136,236 L104,236 L100,190 L96,236 L64,236 Z" fill="${c}" ${S}/>`;
      out += `<path d="M66,206 L94,206 L94,234 L66,234Z" fill="${d}" opacity=".35"/>`;
      if (st === "bot_jeans") out += `<path d="M70,176 L70,232 M130,176 L130,232" stroke="#FFC21A" stroke-width="2" stroke-dasharray="4 4"/><path d="M68,180 C76,186 86,186 92,180 M108,180 C114,186 124,186 132,180" stroke="${d}" stroke-width="3" fill="none"/>`;
      if (st === "bot_cargo") out += `<rect x="66" y="198" width="18" height="16" rx="3" fill="${d}" ${s2}/><rect x="116" y="198" width="18" height="16" rx="3" fill="${d}" ${s2}/>`;
    }
    return out;
  }
  function shoes(look) {
    const c = look.shoeColor, st = look.shoes, d = shade(c, -0.2);
    const one = (x, flip) => {
      const k = flip ? -1 : 1, bx = x;
      switch (st) {
        case "sh_boots": return `<path d="M${bx - 16},214 L${bx + 12},214 L${bx + 12},236 C${bx + 12 + k * 14},236 ${bx + k * 24},240 ${bx + k * 24},250 L${bx - 18},250 Z" fill="#7A5230" ${S}/><path d="M${bx - 16},226 L${bx + 12},226" stroke="#5A3A22" stroke-width="3"/>`;
        case "sh_rain": return `<path d="M${bx - 16},208 L${bx + 12},208 L${bx + 12},236 C${bx + k * 22},236 ${bx + k * 24},242 ${bx + k * 24},250 L${bx - 18},250 Z" fill="#FFC21A" ${S}/><circle cx="${bx - 4}" cy="222" r="4" fill="#fff" opacity=".6"/>`;
        default: {
          const hi = st === "sh_hightops";
          let s = `<path d="M${bx - 16},${hi ? 222 : 232} L${bx + 12},${hi ? 222 : 232} L${bx + 12},236 C${bx + k * 22},236 ${bx + k * 26},242 ${bx + k * 26},250 L${bx - 18},250 Z" fill="${c}" ${S}/><path d="M${bx - 18},246 L${bx + k * 26},246" stroke="#fff" stroke-width="5"/>`;
          if (hi) s += `<circle cx="${bx}" cy="230" r="4" fill="#fff" ${s2}/>`;
          if (st === "sh_glow") s += `<path d="M${bx - 16},246 L${bx + k * 24},246" stroke="#39F3BB" stroke-width="5"/><circle cx="${bx + k * 8}" cy="246" r="9" fill="#39F3BB" opacity=".35"/>`;
          return s;
        }
      }
    };
    return one(82, true) + one(118, false);
  }
  function torso(look) {
    const c = look.topColor, d = shade(c, -0.18), l = shade(c, 0.25), sk = look.skin, st = look.top;
    const white = c.toUpperCase() === "#FFFFFF";
    const sleeveC = st === "top_overalls" ? "#FFFFFF" : (st === "top_labcoat" ? "#FFFFFF" : c);
    const bodyC = st === "top_labcoat" ? "#FFFFFF" : (st === "top_overalls" ? "#FFFFFF" : c);
    let out = "";
    // arms (behind torso edges)
    out += `<path d="M66,118 C52,124 46,146 46,166" fill="none" stroke="${INK}" stroke-width="24" stroke-linecap="round"/><path d="M66,118 C52,124 46,146 46,166" fill="none" stroke="${sleeveC}" stroke-width="16" stroke-linecap="round"/>`;
    out += `<path d="M134,118 C148,124 154,146 154,166" fill="none" stroke="${INK}" stroke-width="24" stroke-linecap="round"/><path d="M134,118 C148,124 154,146 154,166" fill="none" stroke="${sleeveC}" stroke-width="16" stroke-linecap="round"/>`;
    out += `<circle cx="46" cy="172" r="11" fill="${sk}" ${S}/><circle cx="154" cy="172" r="11" fill="${sk}" ${S}/>`;
    // torso
    out += `<path d="M70,104 L130,104 C138,104 140,110 140,118 L140,176 L60,176 L60,118 C60,110 62,104 70,104 Z" fill="${bodyC}" ${S}/>`;
    out += `<path d="M124,108 L134,112 L136,172 L120,172 Z" fill="${shade(bodyC, -0.15)}" opacity=".6"/>`;
    out += `<path d="M86,104 C90,114 110,114 114,104" fill="${sk}" ${s2}/>`;
    switch (st) {
      case "top_hoodie": out += `<path d="M70,104 C76,92 124,92 130,104 C122,112 78,112 70,104Z" fill="${d}" ${s2}/><path d="M92,112 L90,134 M108,112 L110,134" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="78" y="146" width="44" height="20" rx="8" fill="${d}" ${s2}/>`; break;
      case "top_jacket": out += `<path d="M88,104 L100,176 L112,104 Z" fill="#fff" ${s2}/><path d="M88,104 L80,124 L92,130 Z M112,104 L120,124 L108,130Z" fill="${d}" ${s2}/><path d="M100,120 L100,176" stroke="${INK}" stroke-width="3"/>`; break;
      case "top_vest": out += `<path d="M60,118 L88,104 L96,176 L60,176Z M140,118 L112,104 L104,176 L140,176Z" fill="#C9A15C" ${s2}/><rect x="66" y="140" width="18" height="14" rx="3" fill="#B08746" ${s2}/><rect x="116" y="140" width="18" height="14" rx="3" fill="#B08746" ${s2}/><circle cx="76" cy="124" r="4" fill="#00B386" ${s2}/>`; break;
      case "top_jersey": out += `<path d="M60,128 L140,128" stroke="#fff" stroke-width="5"/><text x="100" y="164" text-anchor="middle" font-family="Lilita One, Arial Black, sans-serif" font-size="34" fill="${white ? INK : "#fff"}" stroke="${INK}" stroke-width="1.5">1</text>`; break;
      case "top_overalls": out += `<path d="M66,134 L134,134 L134,176 L66,176Z" fill="${c}" ${s2}/><path d="M72,104 L74,136 M128,104 L126,136" stroke="${c}" stroke-width="8"/><circle cx="74" cy="134" r="4" fill="#FFC21A" ${s2}/><circle cx="126" cy="134" r="4" fill="#FFC21A" ${s2}/><rect x="88" y="144" width="24" height="16" rx="3" fill="${d}" ${s2}/>`; break;
      case "top_labcoat": out += `<path d="M88,104 L96,176 M112,104 L104,176" stroke="${INK}" stroke-width="3"/><rect x="92" y="104" width="16" height="72" fill="${c}"/><rect x="112" y="128" width="16" height="14" rx="2" fill="#E8ECF8" ${s2}/><path d="M116,124 L116,134" stroke="#2F7BFF" stroke-width="3"/>`; break;
      case "top_cape": out += `<circle cx="74" cy="112" r="5" fill="#FFC21A" ${s2}/><circle cx="126" cy="112" r="5" fill="#FFC21A" ${s2}/><path d="M86,132 L100,124 L114,132 L100,154 Z" fill="#FFC21A" ${s2}/>`; break;
      default: out += `<path d="M70,118 C76,112 84,110 90,112" stroke="${l}" stroke-width="5" opacity=".7" fill="none" stroke-linecap="round"/>`;
    }
    return out;
  }
  function capeBack(look) {
    if (look.top !== "top_cape") return "";
    return `<path d="M64,110 L136,110 C150,160 160,210 168,240 L32,240 C40,210 50,160 64,110Z" fill="#FF5A5F" ${S}/><path d="M64,110 L136,110 L150,200" fill="none" stroke="#E0484D" stroke-width="4"/>`;
  }
  function hoodBack(look) {
    if (look.top !== "top_hoodie") return "";
    return `<path d="M62,108 C48,92 60,72 70,78 L130,78 C140,72 152,92 138,108 Z" fill="${shade(look.topColor, -0.18)}" ${S}/>`;
  }
  function buddy(st) {
    switch (st) {
      case "bd_toucan": return `<g transform="translate(140,82)"><ellipse cx="16" cy="22" rx="14" ry="16" fill="${INK}" ${S}/><ellipse cx="14" cy="26" rx="8" ry="10" fill="#fff"/><circle cx="18" cy="10" r="9" fill="${INK}" ${S}/><circle cx="20" cy="8" r="3" fill="#fff"/><path d="M24,8 C40,4 52,10 52,16 C44,18 32,16 24,14Z" fill="#FF8A00" ${s2}/><path d="M38,8 L50,14" stroke="#FFC21A" stroke-width="3"/></g>`;
      case "bd_frog": return `<g transform="translate(138,92)"><ellipse cx="20" cy="20" rx="18" ry="13" fill="#2FBF71" ${S}/><circle cx="10" cy="8" r="7" fill="#2FBF71" ${S}/><circle cx="30" cy="8" r="7" fill="#2FBF71" ${S}/><circle cx="10" cy="8" r="3" fill="${INK}"/><circle cx="30" cy="8" r="3" fill="${INK}"/><path d="M12,22 C18,28 24,28 30,22" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="8" cy="20" r="3" fill="#FF7A8A" opacity=".6"/></g>`;
      case "bd_butterfly": return `<g transform="translate(144,84)"><path d="M16,16 C0,-4 -10,10 4,20 C-8,30 4,40 16,24Z" fill="#46C2E8" ${s2}/><path d="M16,16 C32,-4 42,10 28,20 C40,30 28,40 16,24Z" fill="#9B4DFF" ${s2}/><path d="M16,10 L16,30" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
      case "bd_robot": return `<g transform="translate(142,82)"><rect x="4" y="12" width="28" height="22" rx="6" fill="#B8C4E0" ${S}/><rect x="8" y="16" width="20" height="10" rx="4" fill="${INK}"/><circle cx="13" cy="21" r="2.5" fill="#39F3BB"/><circle cx="23" cy="21" r="2.5" fill="#39F3BB"/><path d="M18,12 L18,4" stroke="${INK}" stroke-width="3"/><circle cx="18" cy="3" r="4" fill="#FF5A5F" ${s2}/></g>`;
      default: return "";
    }
  }

  let uid = 0;
  function svg(lookIn, o = {}) {
    const look = Object.assign({}, DEFAULT, lookIn || {});
    const id = "f" + (++uid);
    const size = o.size || 160;
    const pad = 16;
    const body = [
      capeBack(look), hoodBack(look), hairBack(look.hair, look.hairColor),
      legs(look), shoes(look), torso(look), head(look.skin), face(look.skin),
      hairFront(look.hair, look.hairColor), glasses(look.glasses), hat(look.hat), buddy(look.buddy)
    ].join("");
    const sticker = o.flat ? "" : `filter="url(#${id}s)"`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-24} ${200 + pad * 2} ${300}" width="${size}" height="${size * 300 / 232}" role="img" aria-label="${o.label || "Mini Figure"}">
      <defs><filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/>
        <feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/>
        <feGaussianBlur in="d" stdDeviation="4" result="b"/><feOffset in="b" dx="0" dy="5" result="o"/>
        <feFlood flood-color="#000" flood-opacity=".22"/><feComposite in2="o" operator="in" result="sh"/>
        <feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter></defs>
      <g ${sticker}>${body}</g></svg>`;
  }

  // Preview of a single store item (on a neutral figure, cropped to the slot)
  function itemPreview(item, baseLook) {
    const look = Object.assign({}, DEFAULT, baseLook || {});
    if (item.slot === "hair") { look.hat = "none"; }
    look[item.slot] = item.id;
    return svg(look, { size: 110 });
  }

  function randomLook(girl, seed) {
    let s = seed || Math.floor(Math.random() * 1e9);
    const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const pick = (a) => a[Math.floor(r() * a.length)];
    return Object.assign({}, DEFAULT, {
      girl: girl ? "1" : "0", skin: pick(SKIN.slice(0, 4)), hairColor: pick(HAIR.slice(0, 4)),
      hair: girl ? pick(["hair_bob", "hair_pony"]) : "hair_short",
      topColor: pick(COLORS.slice(0, 7)), bottomColor: pick(PANTS.slice(0, 4)), shoeColor: pick(SHOES)
    });
  }

  G.FIG = { svg, itemPreview, randomLook, ITEMS, DEFAULT, SKIN, HAIR, COLORS, PANTS, SHOES };
})(window);
