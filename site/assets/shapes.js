// Tank shapes page: five bank shapes, five ways to count the water, and how close each way gets.
(() => {
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const M3 = 10000;                                   // 1 hectare × 1 metre = 10,000 m³

  // h is metres above 100 m and area(h) is the water area in hectares.
  // real is the exact sum of very thin layers (the integral of the area), in hectare-metres.
  const SHAPES = [
    { id: "wall", name: "Straight wall", area: () => 20, real: 40,
      about: "The bank goes straight up, like a rock wall or a spillway. The water area stays at 20 ha at every height.",
      lesson: "The area does not change, so every way of counting gives the same answer." },
    { id: "slope", name: "Straight slope", area: (h) => 10 + 10 * h, real: 40,
      about: "An even slope, as in the basic idea above. The area grows by the same 10 ha every metre: 10, 20, then 30 ha.",
      lesson: "For a long tank like this, the average is exact: the sand that the top area wrongly adds is the same size as the water that the bottom area misses. A round pond is different: see the cone formula below." },
    { id: "shallow", name: "Shallow edges", area: (h) => 10 + 7 * h + 3 * h * h, real: 42,
      about: "The bank gets flatter near the top, like a saucer, so the water spreads out faster as it rises: 10, 20, then 36 ha.",
      lesson: "The average over one big 2 m layer counts 40,000 m³ too much. Two 1 m layers, a and b, cut this to 10,000 m³, and four 50 cm layers to 2,500 m³. Each time the layers get half as thick, the error drops to a quarter." },
    { id: "bowl", name: "Bowl", area: (h) => 10 + 13 * h - 3 * h * h, real: 38,
      about: "The bank gets steeper near the top, like a bowl or the bund: 10, 20, then only 24 ha.",
      lesson: "The average over one big 2 m layer counts 40,000 m³ too little. Two 1 m layers, a and b, cut this to 10,000 m³, and four 50 cm layers to 2,500 m³. Each time the layers get half as thick, the error drops to a quarter." },
    { id: "shore", name: "Flat shore", area: (h) => (h < 1.95 ? 10 : 30), real: 21,
      about: "Steep sides, then a flat shore right at the top. At 102 m the water spreads over 20 more hectares, but there it is only 5 cm deep: 10, 10, then 30 ha.",
      lesson: "The area jumps, but the new water is only 5 cm deep, so even four thin layers count 40,000 m³ too much. The fix: one more height and area, measured just below the shore." },
  ];
  SHAPES.forEach((s) => { s.A = [s.area(0), s.area(1), s.area(2)]; });

  // the four 50 cm layers a1, a2, b1 and b2, using the area at each half metre
  const halves = (s) => [0, 1, 2, 3].map((i) => [i / 2, (i + 1) / 2, (s.area(i / 2) + s.area((i + 1) / 2)) / 2]);

  // each way of counting is a list of boxes: [from height, to height, area in ha]
  const METHODS = [
    { button: "Top area", name: "Top area × height",
      parts: (A) => [[0, 2, A[2]]], sum: (A) => `${A[2]} ha × 2 m` },
    { button: "Bottom area", name: "Bottom area × height",
      parts: (A) => [[0, 2, A[0]]], sum: (A) => `${A[0]} ha × 2 m` },
    { button: "Average", name: "Average area × height",
      parts: (A) => [[0, 2, (A[0] + A[2]) / 2]], sum: (A) => `(${A[0]} + ${A[2]}) ÷ 2 = ${(A[0] + A[2]) / 2} ha, then × 2 m` },
    { button: "Two thin layers", name: "Two thin layers, a + b",
      parts: (A) => [[0, 1, (A[0] + A[1]) / 2], [1, 2, (A[1] + A[2]) / 2]],
      sum: (A) => `a: (${A[0]} + ${A[1]}) ÷ 2 = ${(A[0] + A[1]) / 2} ha, then × 1 m<br>b: (${A[1]} + ${A[2]}) ÷ 2 = ${(A[1] + A[2]) / 2} ha, then × 1 m` },
    { button: "Four thin layers", name: "Four thin layers, a1 + a2 + b1 + b2",
      parts: (A, s) => halves(s),
      sum: (A, s) => `Each 50 cm thick, with 2 more areas measured halfway up each metre:<br>${halves(s).map(([h0, h1, a]) => fmt(a * (h1 - h0) * M3)).join(" + ")} m³` },
  ];
  const counted = (m, s) => m.parts(s.A, s).reduce((v, [h0, h1, a]) => v + a * (h1 - h0), 0);   // hectare-metres
  function compare(v, s) {
    const d = (v - s.real) * M3;
    return d === 0 ? "Exact" : `${fmt(Math.abs(d))} m³ too ${d > 0 ? "much" : "little"}`;
  }

  // ---- side view: a cut through the tank -------------------------------------
  const W = 640, H = 300, CX = 320, X0 = 56, X1 = 584, LAND = 40;
  const Y = (h) => 250 - 90 * h;                      // 100 m at y = 250, 101 m at 160, 102 m at 70
  const HALF = (a) => 6 * a;                          // half the water width: 6 px for each hectare
  const TOPH = (250 - LAND) / 90;                     // the top of the land in the drawing, 2.33 m above 100 m
  const FILM = 0.05;                                  // the flat shore's water is 5 cm deep

  function bank(s) {                                  // [height, area] along the bank, from the bed to the top of the land
    if (s.id === "shore") return [[0, 10], [2 - FILM, 10], [2 - FILM, 30], [TOPH, 30]];
    const above = s.id === "bowl" ? (h) => 24 + 3 * (h - 2) : s.area;   // above 102 m the bank keeps its shape
    const pts = [];
    for (let i = 0; i <= 50; i++) pts.push([i / 25, s.area(i / 25)]);
    for (let i = 1; i <= 8; i++) { const h = 2 + (TOPH - 2) * i / 8; pts.push([h, above(h)]); }
    return pts;
  }
  const side = (pts, sign) => pts.map(([h, a]) => [CX + sign * HALF(a), Y(h)]);
  const path = (pts, close = true) => "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + (close ? " Z" : "");

  function waterPts(s) {
    if (s.id === "shore") {
      const f = Y(2 - FILM);
      return [[CX - HALF(30), Y(2)], [CX - HALF(30), f], [CX - HALF(10), f], [CX - HALF(10), Y(0)],
              [CX + HALF(10), Y(0)], [CX + HALF(10), f], [CX + HALF(30), f], [CX + HALF(30), Y(2)]];
    }
    const b = bank(s).filter(([h]) => h <= 2 + 1e-9);
    return side(b, -1).reverse().concat(side(b, 1));
  }
  function bankPts(s) {
    const b = bank(s);
    return side(b, -1).reverse().concat(side(b, 1));
  }

  function drawSide(s, m) {
    const water = path(waterPts(s)), banks = bankPts(s);
    const earth = path([[X0, H], [X0, LAND], ...banks, [X1, LAND], [X1, H]]);
    const boxes = m.parts(s.A, s).map(([h0, h1, a]) => ({ x: CX - HALF(a), y: Y(h1), w: 2 * HALF(a), h: Y(h0) - Y(h1) }));
    const holes = boxes.map((r) => `M${r.x} ${r.y} h${r.w} v${r.h} h${-r.w} Z`).join(" ");
    const top = s.id === "shore" ? 30 : s.A[2], mid = s.A[1];
    let g = `<defs>
      <pattern id="sand-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="8" class="t-sand"/></pattern>
      <pattern id="miss-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="3" height="8" class="t-miss"/></pattern>
      <clipPath id="clip-water"><path d="${water}"/></clipPath>
      <clipPath id="clip-counted">${boxes.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`).join("")}</clipPath>
      <clipPath id="clip-missed"><path clip-rule="evenodd" d="M0 0 H${W} V${H} H0 Z ${holes}"/></clipPath>
    </defs>`;
    g += `<path class="t-earth" d="${earth}"/>`;
    g += `<g clip-path="url(#clip-water)"><rect class="t-water-a" x="0" y="${Y(1)}" width="${W}" height="${Y(0) - Y(1) + 1}"/>` +
         `<rect class="t-water-b" x="0" y="${Y(2) - 1}" width="${W}" height="${Y(1) - Y(2) + 1}"/></g>`;
    g += `<path d="${water}" fill="url(#miss-hatch)" clip-path="url(#clip-missed)"/>`;
    g += `<path d="${earth}" fill="url(#sand-hatch)" clip-path="url(#clip-counted)"/>`;
    g += `<path class="t-bank" d="${path(banks, false)}"/>`;
    g += `<line class="t-surface" x1="${CX - HALF(top)}" y1="${Y(2)}" x2="${CX + HALF(top)}" y2="${Y(2)}"/>`;
    g += `<line class="t-level" x1="${CX - HALF(mid)}" y1="${Y(1)}" x2="${CX + HALF(mid)}" y2="${Y(1)}"/>`;
    const marks = boxes.length === 4 ? [["a1", 0.25], ["a2", 0.75], ["b1", 1.25], ["b2", 1.75]] : [["a", 0.5], ["b", 1.5]];
    g += marks.map(([t, h]) => `<text class="t-layer" x="${CX}" y="${Y(h) + 8}">${t}</text>`).join("");
    boxes.forEach((r) => {
      g += `<rect class="t-box-halo counted" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>` +
           `<rect class="t-box" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`;
    });
    [0, 1, 2].forEach((h) => {
      g += `<line class="t-tick" x1="${X0 - 6}" y1="${Y(h)}" x2="${X0}" y2="${Y(h)}"/>`;
      g += `<text class="t-label" x="${X0 - 9}" y="${Y(h) + 5}" text-anchor="end">${100 + h} m</text>`;
      g += `<text class="t-label t-strong" x="${X1 + 8}" y="${Y(h) + 5}">${s.A[h]} ha</text>`;
    });
    $("#side-g").innerHTML = g;
  }

  // ---- top view: the water outline at each height ------------------------------
  const BASE = [[150, 22], [194, 27], [236, 45], [262, 80], [260, 120], [240, 158], [200, 184], [150, 192],
                [100, 186], [62, 162], [40, 126], [38, 86], [58, 52], [100, 30]];   // the outline of 36 ha
  const C = [150, 107];
  function smooth(pts) {                              // a smooth closed curve through the points
    const n = pts.length;
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}` +
           ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + " Z";
  }
  const FILLS = ["t-water-a", "t-water-b", "t-water-c"];   // 100 m, 101 m, 102 m
  function drawTop(s) {
    let g = `<rect class="t-land" width="300" height="220" rx="12"/>`;
    [2, 1, 0].forEach((h) => {
      const k = Math.sqrt(s.A[h] / 36);
      g += `<path class="${FILLS[h]}" d="${smooth(BASE.map(([x, y]) => [C[0] + (x - C[0]) * k, C[1] + (y - C[1]) * k]))}"/>`;
    });
    $("#top-g").innerHTML = g;
    const groups = [];                                // heights with the same area share one outline and one key entry
    [0, 1, 2].forEach((h) => {
      const g = groups.find((x) => x.area === s.A[h]);
      if (g) g.hs.push(100 + h); else groups.push({ area: s.A[h], hs: [100 + h], fill: FILLS[h] });
    });
    const list = (a) => (a.length < 2 ? `${a[0]}` : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
    $("#top-key").innerHTML = groups.map((g) =>
      `<li><svg viewBox="0 0 18 14" aria-hidden="true"><rect width="18" height="14" rx="3" class="${g.fill}"/></svg>${list(g.hs)} m: ${g.area} ha</li>`).join("");
  }

  // ---- tables ------------------------------------------------------------------------
  function drawTable(s, m) {
    const rows = METHODS.map((x) => {
      const v = counted(x, s);
      return `<tr${x === m ? ' class="on"' : ""}><th scope="row">${x.name}</th><td class="sum">${x.sum(s.A, s)}</td>` +
             `<td>${fmt(v * M3)} m³</td><td>${compare(v, s)}</td></tr>`;
    });
    rows.push(`<tr class="real"><th scope="row">Real water</th><td class="sum">very thin layers, all the way up</td>` +
              `<td>${fmt(s.real * M3)} m³</td><td></td></tr>`);
    $("#method-rows").innerHTML = rows.join("");
  }
  $("#summary-rows").innerHTML = SHAPES.map((s) => {
    const cell = (v) => `${fmt(v * M3)} m³ <span class="d">(${compare(v, s).toLowerCase()})</span>`;
    return `<tr><th scope="row">${s.name}</th><td>${fmt(s.real * M3)} m³</td><td>${cell(counted(METHODS[2], s))}</td><td>${cell(counted(METHODS[3], s))}</td><td>${cell(counted(METHODS[4], s))}</td></tr>`;
  }).join("");

  // ---- pickers ------------------------------------------------------------------------
  const shapePick = $("#shape-picker"), methodPick = $("#method-picker");
  let si = 1, mi = 0;                                 // start with the straight slope and the top area
  SHAPES.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.id = `tab-${s.id}`;
    b.textContent = s.name;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "shape-panel");
    b.addEventListener("click", () => { si = i; render(); });
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      si = (i + (e.key === "ArrowRight" ? 1 : -1) + SHAPES.length) % SHAPES.length;
      render();
      shapePick.children[si].focus();
    });
    shapePick.appendChild(b);
  });
  METHODS.forEach((m, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m.button;
    b.addEventListener("click", () => { mi = i; render(); });
    methodPick.appendChild(b);
  });

  function render() {
    const s = SHAPES[si], m = METHODS[mi], v = counted(m, s);
    [...shapePick.children].forEach((b, j) => { b.setAttribute("aria-selected", String(j === si)); b.tabIndex = j === si ? 0 : -1; });
    [...methodPick.children].forEach((b, j) => b.setAttribute("aria-pressed", String(j === mi)));
    $("#shape-panel").setAttribute("aria-labelledby", `tab-${s.id}`);
    $("#shape-name").textContent = s.name;
    $("#shape-about").textContent = s.about;
    drawSide(s, m);
    drawTop(s);
    drawTable(s, m);
    if ($("#lesson").textContent !== s.lesson) $("#lesson").textContent = s.lesson;
    $("#result").textContent = `${m.name} counts ${fmt(v * M3)} m³: ${compare(v, s).toLowerCase()}.`;
    $("#side-desc").textContent = `${s.name}. Water area ${s.A[0]} ha at 100 m, ${s.A[1]} ha at 101 m and ${s.A[2]} ha at 102 m. ` +
      `${m.name} counts ${fmt(v * M3)} m³: ${compare(v, s).toLowerCase()}.`;
    $("#top-desc").textContent = `Water outlines from above: ${s.A[0]} ha at 100 m, ${s.A[1]} ha at 101 m and ${s.A[2]} ha at 102 m.`;
  }
  render();
})();
