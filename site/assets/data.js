// Real SWOT data page: a reservoir picker, key numbers, two linked charts and a table.
// Data: window.SWOT_DATA from data/reservoirs.js (made by tools/prep_data.py).
(() => {
  const D = window.SWOT_DATA;
  const NS = "http://www.w3.org/2000/svg";
  const $ = (sel) => document.querySelector(sel);
  const T0 = Date.UTC(2023, 6, 1), T1 = Date.UTC(2026, 9, 31);     // x range: July 2023 to October 2026
  const DITWAH = [Date.UTC(2025, 10, 25), Date.UTC(2025, 11, 23)];  // the cyclone's main rise
  const GAP_DAYS = 45;                                              // break the line where SWOT has no reading this long
  const DAY = 86400000;
  const t = (d) => Date.parse(d + "T00:00:00Z");
  const fmtDate = (d) => new Date(t(d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const fix = (x, n) => x.toLocaleString("en-US", { minimumFractionDigits: n, maximumFractionDigits: n });

  let cur = 0;      // selected reservoir
  let hover = null; // index into all(reservoir)
  // every reading by date: best quality (line, storage, key numbers) and suspect (hollow dots on the level chart)
  const all = (r) => r._all || (r._all = [...r.readings.map((x) => ({ ...x, q: "best" })),
    ...(r.suspect || []).map((x) => ({ ...x, q: "suspect", stored_mcm: null }))].sort((a, b) => (a.date < b.date ? -1 : 1)));
  const charts = [
    { el: $("#plot-level"), tip: $("#tip-level"), key: "wse", height: 250, zero: false, digits: 2,
      unit: " m", name: "water level", empty: "" },
    { el: $("#plot-stored"), tip: $("#tip-stored"), key: "stored_mcm", height: 220, zero: true, digits: 1,
      unit: " million m³", name: "stored above the lowest reading", empty: "SWOT's lake file gives no storage numbers for this reservoir." },
  ];

  // ---- picker -------------------------------------------------------------
  const picker = $("#picker");
  D.reservoirs.forEach((r, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.textContent = r.name;
    b.addEventListener("click", () => select(i));
    b.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const j = (i + (e.key === "ArrowRight" ? 1 : -1) + D.reservoirs.length) % D.reservoirs.length;
      select(j);
      picker.children[j].focus();
    });
    picker.appendChild(b);
  });

  function select(i) {
    cur = i;
    hover = null;
    [...picker.children].forEach((b, j) => {
      b.setAttribute("aria-selected", String(j === i));
      b.tabIndex = j === i ? 0 : -1;
    });
    try { history.replaceState(null, "", "#" + D.reservoirs[i].name.toLowerCase().replace(/\s+/g, "-")); } catch (e) { /* file pages */ }
    render();
  }

  // ---- numbers and notes -----------------------------------------------------
  function tile(value, label, src, unit) {
    const d = document.createElement("div");
    d.className = "tile";
    const v = document.createElement("div"); v.className = "value"; v.textContent = value;
    if (unit) { const u = document.createElement("span"); u.className = "unit"; u.textContent = unit; v.appendChild(u); }
    const l = document.createElement("p"); l.className = "label"; l.textContent = label;
    const s = document.createElement("p"); s.className = "src"; s.textContent = src;
    d.append(v, l, s);
    return d;
  }

  function summary(r) {
    const rd = r.readings;
    const levels = rd.map((x) => x.wse);
    const stored = rd.map((x) => x.stored_mcm).filter((x) => x !== null);
    const lo = Math.min(...levels), hi = Math.max(...levels);
    const maxStored = stored.length ? Math.max(...stored) : null;
    const kpis = $("#kpis");
    kpis.replaceChildren(
      tile(String(rd.length), "best-quality SWOT readings", `${fmtDate(rd[0].date)} to ${fmtDate(rd[rd.length - 1].date)}`),
      tile(fix(hi - lo, 1), "rise and fall of the water level", `from ${fix(lo, 2)} to ${fix(hi, 2)} m above sea level`, "m"),
      tile(maxStored === null ? "Not given" : fix(maxStored, 1),
        "most water stored above the lowest reading",
        `Official full capacity: ${fix(r.gross_capacity_mcm, 1)} million m³ (Irrigation Department)`,
        maxStored === null ? "" : "million m³"),
      tile(r.ditwah ? "+" + fix(r.ditwah.rise_m, 2) : "No readings",
        "rise around Cyclone Ditwah",
        r.ditwah ? `${r.ditwah.gain_mcm === null ? "Storage not given" : "+" + fix(r.ditwah.gain_mcm, 1) + " million m³"} · ${fmtDate(r.ditwah.from)} to ${fmtDate(r.ditwah.to)}` : "",
        r.ditwah ? "m" : ""),
    );

    const notes = [];
    if (maxStored === null) {
      notes.push(`SWOT's lake file gives no storage numbers for ${r.name}, so its volume has to come from our own height–area–volume curve.`);
    } else if (maxStored > r.gross_capacity_mcm) {
      notes.push(`SWOT's numbers say the stored water swung by ${fix(maxStored, 1)} million m³, but the official full capacity is only ${fix(r.gross_capacity_mcm, 1)} million m³. At least one of them is off: checking this is part of our project (research question 3).`);
    }
    if (r.ditwah) {
      const weeks = Math.round((t(r.ditwah.to) - t(r.ditwah.from)) / DAY / 7);
      if (weeks > 5) {
        notes.push(`The nearest best-quality readings around Cyclone Ditwah are ${weeks} weeks apart, so this rise includes more than the cyclone.`);
      } else if (r.ditwah.gain_mcm !== null && maxStored !== null && maxStored <= r.gross_capacity_mcm) {
        const pct = Math.round(r.ditwah.gain_mcm / r.gross_capacity_mcm * 100);
        notes.push(`In Cyclone Ditwah, ${r.name} gained about ${fix(r.ditwah.gain_mcm, 0)} million m³ in ${weeks} weeks: about ${pct}% of its official full capacity.`);
      }
    }
    const ul = $("#notes");
    ul.replaceChildren(...notes.map((n) => { const li = document.createElement("li"); li.textContent = n; return li; }));
  }

  // ---- charts --------------------------------------------------------------
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function niceTicks(lo, hi, count) {
    const span = hi - lo, raw = span / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => span / s <= count) || 10 * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
    return { ticks: out, step };
  }

  function draw(c) {
    const r = D.reservoirs[cur];
    const pts = all(r).map((x, i) => ({ i, t: t(x.date), v: x[c.key], q: x.q })).filter((p) => p.v !== null);
    c.el.replaceChildren();
    c.pts = pts;
    if (!pts.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = c.empty;
      c.el.appendChild(p);
      c.el.removeAttribute("tabindex");
      c.el.setAttribute("aria-label", c.empty);
      return;
    }
    c.el.tabIndex = 0;
    const W = Math.max(280, c.el.clientWidth), H = c.height;
    const m = { l: 46, r: 14, t: 22, b: 28 };
    let lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
    if (c.zero) lo = 0;
    const pad = (hi - lo) * 0.08 || 1;
    const { ticks } = niceTicks(c.zero ? 0 : lo - pad, hi + pad, 5);
    const y0 = c.zero ? 0 : Math.min(ticks[0], lo - pad), y1 = Math.max(ticks[ticks.length - 1], hi + pad);
    const x = (tt) => m.l + (tt - T0) / (T1 - T0) * (W - m.l - m.r);
    const y = (v) => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    c.x = x; c.y = y; c.W = W; c.m = m;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, "aria-hidden": "true" }, c.el);
    // Cyclone Ditwah band, behind everything
    el("rect", { class: "band", x: x(DITWAH[0]), y: m.t, width: x(DITWAH[1]) - x(DITWAH[0]), height: H - m.t - m.b }, svg);
    const bl = el("text", { class: "band-label", x: x(DITWAH[0]) - 4, y: m.t - 6, "text-anchor": "end" }, svg);
    bl.textContent = "Cyclone Ditwah";
    // grid and y ticks
    ticks.filter((v) => v >= y0 && v <= y1).forEach((v) => {
      el("line", { class: "gridline", x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, svg);
      const tx = el("text", { class: "tick", x: m.l - 8, y: y(v) + 4, "text-anchor": "end" }, svg);
      tx.textContent = Number.isInteger(v) ? String(v) : v.toFixed(1);
    });
    el("line", { class: "axis", x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }, svg);
    // x ticks: each January, plus the first month when there is room for its label
    const roomForFirst = x(Date.UTC(2024, 0, 1)) - x(T0) > 64;
    [[T0, roomForFirst ? "Jul 2023" : ""], [Date.UTC(2024, 0, 1), "2024"], [Date.UTC(2025, 0, 1), "2025"], [Date.UTC(2026, 0, 1), "2026"]].forEach(([tt, label]) => {
      el("line", { class: "axis", x1: x(tt), x2: x(tt), y1: H - m.b, y2: H - m.b + 5 }, svg);
      const tx = el("text", { class: "tick", x: x(tt) + 4, y: H - m.b + 18 }, svg);
      tx.textContent = label;
    });
    // line through the best-quality readings, broken where there is none for a long time
    const runs = [[]];
    const good = pts.filter((p) => p.q === "best");
    good.forEach((p, k) => {
      if (k && (p.t - good[k - 1].t) / DAY > GAP_DAYS) runs.push([]);
      runs[runs.length - 1].push(p);
    });
    runs.forEach((run) => {
      const d = run.map((p, k) => `${k ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
      if (c.zero && run.length > 1) {
        el("path", { class: "area", d: `${d} L${x(run[run.length - 1].t).toFixed(1)} ${y(0)} L${x(run[0].t).toFixed(1)} ${y(0)} Z` }, svg);
      }
      el("path", { class: "line", d }, svg);
    });
    pts.forEach((p) => el("circle", { class: p.q === "best" ? "dot" : "dot hollow", cx: x(p.t), cy: y(p.v), r: 4 }, svg));
    c.cross = el("line", { class: "cross", y1: m.t, y2: H - m.b, visibility: "hidden" }, svg);
    c.focusDot = el("circle", { class: "focus", r: 6, visibility: "hidden" }, svg);
    c.el.setAttribute("aria-label", `${r.name}, ${c.name}: ${pts.length} readings from ${fmtDate(all(r)[pts[0].i].date)} to ${fmtDate(all(r)[pts[pts.length - 1].i].date)}, between ${fix(Math.min(...pts.map((p) => p.v)), c.digits)} and ${fix(Math.max(...pts.map((p) => p.v)), c.digits)}${c.unit}. Use the left and right arrow keys to read each value.`);
  }

  function showHover() {
    const r = D.reservoirs[cur];
    charts.forEach((c) => {
      if (!c.pts || !c.pts.length || !c.cross) return;
      if (hover === null) {
        c.cross.setAttribute("visibility", "hidden");
        c.focusDot.setAttribute("visibility", "hidden");
        c.tip.hidden = true;
        return;
      }
      const reading = all(r)[hover];
      const tt = t(reading.date), xx = c.x(tt);
      c.cross.setAttribute("x1", xx); c.cross.setAttribute("x2", xx);
      c.cross.setAttribute("visibility", "visible");
      const v = reading[c.key];
      if (v === null) c.focusDot.setAttribute("visibility", "hidden");
      else {
        c.focusDot.setAttribute("cx", xx); c.focusDot.setAttribute("cy", c.y(v));
        c.focusDot.setAttribute("visibility", "visible");
      }
      const strong = document.createElement("strong");
      const sus = reading.q === "suspect";
      strong.textContent = v !== null ? fix(v, c.digits) + c.unit : sus ? "Not used" : "Not given";
      const what = document.createElement("div");
      const key = document.createElement("span"); key.className = sus ? "k hollow" : "k";
      what.append(key, document.createTextNode(sus ? `${c.name} (suspect reading)` : c.name));
      const when = document.createElement("div"); when.className = "d"; when.textContent = fmtDate(reading.date);
      c.tip.replaceChildren(strong, what, when);
      c.tip.hidden = false;
      const w = c.tip.offsetWidth;
      const left = xx + 14 + w > c.W ? xx - 14 - w : xx + 14;
      c.tip.style.left = Math.max(0, left) + "px";
      c.tip.style.top = "6px";
    });
    const live = $("#live");
    if (hover !== null) {
      const reading = all(r)[hover];
      live.textContent = `${fmtDate(reading.date)}: water level ${fix(reading.wse, 2)} m${reading.q === "suspect" ? " (suspect reading)" : ""}` +
        (reading.stored_mcm === null ? "" : `, stored above the lowest reading ${fix(reading.stored_mcm, 1)} million m³`);
    }
  }

  function nearest(c, clientX) {
    const box = c.el.getBoundingClientRect();
    const px = clientX - box.left;
    let best = null, dist = Infinity;
    c.pts.forEach((p) => { const d = Math.abs(c.x(p.t) - px); if (d < dist) { dist = d; best = p.i; } });
    return best;
  }

  charts.forEach((c) => {
    c.el.addEventListener("pointermove", (e) => { if (!c.pts || !c.pts.length) return; hover = nearest(c, e.clientX); showHover(); });
    c.el.addEventListener("pointerleave", () => { hover = null; showHover(); });
    c.el.addEventListener("blur", () => { hover = null; showHover(); });
    c.el.addEventListener("keydown", (e) => {
      if (!c.pts || !c.pts.length) return;
      const idx = c.pts.map((p) => p.i);
      let k = hover === null ? -1 : idx.indexOf(hover);
      if (e.key === "ArrowRight") k = Math.min(idx.length - 1, k + 1);
      else if (e.key === "ArrowLeft") k = k < 0 ? idx.length - 1 : Math.max(0, k - 1);
      else if (e.key === "Home") k = 0;
      else if (e.key === "End") k = idx.length - 1;
      else if (e.key === "Escape") { hover = null; showHover(); return; }
      else return;
      e.preventDefault();
      hover = idx[k];
      showHover();
    });
  });

  // ---- table view -------------------------------------------------------------
  function table(r) {
    const n = (r.suspect || []).length;
    $("#table-title").textContent = `All ${r.readings.length + n} readings for ${r.name}: ${r.readings.length} best quality, ${n} suspect`;
    const body = $("#table-body");
    body.replaceChildren(...all(r).map((x) => {
      const tr = document.createElement("tr");
      const sus = x.q === "suspect";
      [fmtDate(x.date), sus ? "Suspect" : "Best", fix(x.wse, 2), fix(x.area_km2, 2), sus ? "Not used" : x.stored_mcm === null ? "Not given" : fix(x.stored_mcm, 1)].forEach((v) => {
        const td = document.createElement("td"); td.textContent = v; tr.appendChild(td);
      });
      return tr;
    }));
  }

  function render() {
    const r = D.reservoirs[cur];
    $("#res-name").textContent = r.name;
    $("#res-id").textContent = `SWOT lake ID ${r.lake_id}`;
    summary(r);
    charts.forEach(draw);
    table(r);
    showHover();
  }

  new ResizeObserver(() => { charts.forEach(draw); showHover(); }).observe($("#plot-level"));
  const fromHash = D.reservoirs.findIndex((r) => "#" + r.name.toLowerCase().replace(/\s+/g, "-") === location.hash);
  $("#made").textContent = new Date(t(D.made)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  select(fromHash >= 0 ? fromHash : 0);
})();
