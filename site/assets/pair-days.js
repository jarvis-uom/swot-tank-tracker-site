// Satellite calendar, second tab: days when a satellite picture and a gauge reading fall on the same day.
// Data: window.PAIR_DAYS from assets/pair-days-data.js (made by temp/calendar/build_pair_days.py).
(() => {
  const D = window.PAIR_DAYS;
  const box = document.getElementById("pg-years");
  if (!D || !box) return;
  const NS = "http://www.w3.org/2000/svg";
  const GAUGE = 1, RADAR = 2, CLEAR = 4, PART = 8, SWOT = 16;
  const DAY = 86400000, CELL = 11, STEP = 14, LEFT = 44, TOP = 16;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const t0 = Date.parse(D.start + "T00:00:00Z"), t1 = Date.parse(D.end + "T00:00:00Z");
  const fmt = (ms) => new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const num = (n) => n.toLocaleString("en-US");
  let cur = 0;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // what a day shows, and the words for its tooltip
  function describe(c, pct) {
    const pics = [];
    if (c & RADAR) pics.push("Sentinel-1 radar");
    if (c & CLEAR) pics.push(`Sentinel-2 photo, clear (under ${D.clear_max}% cloud)`);
    if (c & PART) pics.push(`Sentinel-2 photo, partly cloudy (${D.clear_max}–${D.part_max}% cloud)`);
    const parts = [pics.length ? pics.join(" and ") : "no usable picture"];
    parts.push(c & GAUGE ? `gauge: ${pct}% of capacity` : "no gauge value");
    if (c & SWOT) parts.push("SWOT height too");
    return parts.join(" · ");
  }

  function square(svg, x, y, c, title) {
    const g = el("g", {}, svg);
    const photo = c & CLEAR ? "pg-s2" : c & PART ? "pg-s2p" : null;
    if (!(c & GAUGE)) {
      el("rect", { x, y, width: CELL, height: CELL, rx: 2, class: c & (RADAR | CLEAR | PART) ? "pg-nogauge" : "pg-none" }, g);
    } else if ((c & RADAR) && photo) {        // radar and a photo on the same day: half and half
      el("rect", { x, y, width: CELL / 2, height: CELL, class: "pg-s1" }, g);
      el("rect", { x: x + CELL / 2, y, width: CELL / 2, height: CELL, class: photo }, g);
    } else {
      el("rect", { x, y, width: CELL, height: CELL, rx: 2, class: c & RADAR ? "pg-s1" : photo || "pg-g" }, g);
    }
    if (c & SWOT) el("rect", { x: x - 1, y: y - 1, width: CELL + 2, height: CELL + 2, rx: 3, class: "pg-sw" }, g);
    el("title", {}, g).textContent = title;
  }

  function counts(r, from, to) {   // same-day pairs between two day indexes
    const n = { radar: 0, clear: 0, part: 0, three: 0, gauge: 0 };
    for (let i = from; i <= to; i++) {
      const c = r.codes.charCodeAt(i) - 48;
      if (!(c & GAUGE)) continue;
      n.gauge++;
      if (c & RADAR) n.radar++;
      if (c & CLEAR) n.clear++;
      if (c & PART) n.part++;
      if ((c & SWOT) && (c & (RADAR | CLEAR | PART))) n.three++;
    }
    return n;
  }

  function tile(value, label, src) {
    const d = document.createElement("div"); d.className = "tile";
    const v = document.createElement("div"); v.className = "value"; v.textContent = value;
    const l = document.createElement("p"); l.className = "label"; l.textContent = label;
    const s = document.createElement("p"); s.className = "src"; s.textContent = src;
    d.append(v, l, s);
    return d;
  }

  function render() {
    const r = D.reservoirs[cur];
    [...picker.children].forEach((b, j) => b.setAttribute("aria-pressed", String(j === cur)));
    const all = counts(r, 0, r.codes.length - 1);
    document.getElementById("pg-kpis").replaceChildren(
      tile(num(all.radar), "radar + gauge days", "Sentinel-1 sees through clouds, so every one is usable"),
      tile(num(all.clear), "clear photo + gauge days", `Sentinel-2 photos under ${D.clear_max}% cloud`),
      tile(num(all.part), "partly cloudy photo + gauge days", `${D.clear_max}–${D.part_max}% cloud: the tank may still be clear`),
      tile(num(all.three), "picture + gauge + SWOT days", "all three on one day, since July 2023"));

    const years = [], rows = [];
    for (let y = new Date(t0).getUTCFullYear(); y <= new Date(t1).getUTCFullYear(); y++) {
      const a = Math.max(t0, Date.UTC(y, 0, 1)), b = Math.min(t1, Date.UTC(y, 11, 31));
      const i0 = Math.round((a - t0) / DAY), i1 = Math.round((b - t0) / DAY);
      const jan1 = Date.UTC(y, 0, 1), lead = (new Date(jan1).getUTCDay() + 6) % 7;   // Monday = 0
      const col = (ms) => Math.floor(((ms - jan1) / DAY + lead) / 7);
      const W = LEFT + (col(Date.UTC(y, 11, 31)) + 1) * STEP, H = TOP + 7 * STEP;
      const n = counts(r, i0, i1);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
        "aria-label": `${y}: ${n.radar} radar and ${n.clear + n.part} photo days with a gauge value` });
      el("text", { x: 0, y: TOP + 3.5 * STEP + 4, class: "pg-year" }, svg).textContent = y;
      for (let m = 0; m < 12; m++) {
        const ms = Date.UTC(y, m, 1);
        if (Date.UTC(y, m + 1, 1) <= a || ms > b) continue;   // only months with days in range
        el("text", { x: LEFT + col(Math.max(ms, a)) * STEP, y: 10, class: "pg-month" }, svg).textContent = MONTHS[m];
      }
      for (let i = i0; i <= i1; i++) {
        const ms = t0 + i * DAY, c = r.codes.charCodeAt(i) - 48;
        square(svg, LEFT + col(ms) * STEP, TOP + ((new Date(ms).getUTCDay() + 6) % 7) * STEP, c, `${fmt(ms)}: ${describe(c, r.pct[i])}`);
      }
      years.push(svg);
      const tr = document.createElement("tr");
      [String(y) + (a > Date.UTC(y, 0, 1) ? " (from " + new Date(a).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) + ")" : b < Date.UTC(y, 11, 31) ? " (to " + new Date(b).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) + ")" : ""),
        n.radar, n.clear, n.part, n.three, n.gauge].forEach((v, k) => {
        const td = document.createElement(k ? "td" : "th");
        if (!k) td.scope = "row";
        td.textContent = typeof v === "number" ? num(v) : v;
        tr.appendChild(td);
      });
      rows.push(tr);
    }
    box.replaceChildren(...years);
    document.getElementById("pg-rows").replaceChildren(...rows);
    document.getElementById("pg-table-title").textContent = `Same-day pairs each year at ${r.name}`;
  }

  // reservoir picker
  const picker = document.getElementById("pg-picker");
  D.reservoirs.forEach((r, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = r.name;
    b.addEventListener("click", () => { cur = i; render(); });
    picker.appendChild(b);
  });

  // legend
  const legend = [["pg-g", "Gauge value, no usable picture"], ["pg-s1", "Radar + gauge"], ["pg-s2", "Clear photo + gauge"],
    ["pg-s2p", "Partly cloudy photo + gauge"], ["split", "Radar and photo + gauge"], ["ring", "SWOT height that day too"],
    ["pg-nogauge", "Picture, but no gauge value"], ["pg-none", "Nothing"]];
  document.getElementById("pg-legend").replaceChildren(...legend.map(([k, label]) => {
    const li = document.createElement("li");
    const svg = el("svg", { width: 15, height: 15, viewBox: "-2 -2 15 15", "aria-hidden": "true" });
    if (k === "split") square(svg, 0, 0, GAUGE | RADAR | CLEAR, "");
    else if (k === "ring") square(svg, 0, 0, GAUGE | SWOT, "");
    else el("rect", { x: 0, y: 0, width: CELL, height: CELL, rx: 2, class: k }, svg);
    svg.querySelectorAll("title").forEach((x) => x.remove());
    li.append(svg, document.createTextNode(label));
    return li;
  }));
  document.getElementById("pg-made").textContent = new Date(Date.parse(D.made + "T00:00:00Z")).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  render();
})();
