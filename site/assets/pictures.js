// Picture days page: water pictures only (radar on every pass, photos only when clear), month by month,
// the running total, and a rough layer thickness. Data: window.CALENDAR from calendar-data.js.
(() => {
  const C = window.CALENDAR;
  const NS = "http://www.w3.org/2000/svg";
  const $ = (s) => document.querySelector(s);
  const el = (name, attrs, text) => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const SRC = [["s1", "Sentinel-1 radar"], ["ni", "NISAR radar"], ["al", "ALOS-2 radar"], ["s2", "Clear Sentinel-2 photo"], ["ls", "Clear Landsat photo"]];
  const RADAR = new Set(["s1", "ni", "al"]);
  const month = (d) => Number(d.slice(5, 7));

  // how much each event counts: radar 1; a real photo 1 if clear; an expected photo = that month's clear share
  const weight = (e) => (RADAR.has(e.s) ? 1 : e.real ? (e.clear ? 1 : 0) : (C.clearShare[e.s][String(month(e.d))] || 0));
  const pics = C.events.filter((e) => e.s !== "swot").map((e) => ({ ...e, w: weight(e) })).filter((e) => e.w > 0);

  // each day counts once: 1 if it has a real picture, else the chance that at least one expected picture happens
  const days = {};
  pics.forEach((e) => { (days[e.d] = days[e.d] || []).push(e); });
  const dayValue = (list) => (list.some((e) => e.real) ? 1 : 1 - list.reduce((p, e) => p * (1 - e.w), 1));

  const MONTHS = [];
  for (let y = 2026, m = 6; y < 2027 || m <= 3; m === 12 ? (y++, m = 1) : m++) MONTHS.push(`${y}-${String(m).padStart(2, "0")}`);
  const label = (k, opts) => new Date(Date.UTC(Number(k.slice(0, 4)), Number(k.slice(5)) - 1, 1)).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

  const stats = MONTHS.map((k) => {
    const ev = pics.filter((e) => e.d.startsWith(k));
    const by = {};
    SRC.forEach(([s]) => {
      by[s] = { real: ev.filter((e) => e.s === s && e.real).length, exp: ev.filter((e) => e.s === s && !e.real).reduce((a, e) => a + e.w, 0) };
    });
    const any = Object.entries(days).filter(([d]) => d.startsWith(k)).reduce((a, [, list]) => a + dayValue(list), 0);
    const expected = ev.some((e) => !e.real);
    return { k, by, any, expected };
  });

  // ---- bars --------------------------------------------------------------------
  function bars() {
    const svg = $("#bars");
    const X0 = 60, W = 680, Y0 = 290, H = 250, n = MONTHS.length, bw = 40;
    const top = Math.max(...stats.map((s) => SRC.reduce((a, [k]) => a + s.by[k].real + s.by[k].exp, 0)));
    const max = Math.ceil(top / 5) * 5;
    const Y = (v) => Y0 - v / max * H;
    for (let v = 0; v <= max; v += 5) {
      svg.append(el("line", { x1: X0, x2: X0 + W, y1: Y(v), y2: Y(v), class: "st-grid" }));
      svg.append(el("text", { x: X0 - 8, y: Y(v) + 4, class: "st-txt", "text-anchor": "end" }, v));
    }
    stats.forEach((s, i) => {
      const cx = X0 + (i + 0.5) * W / n;
      let base = 0;
      for (const part of ["real", "exp"]) {
        SRC.forEach(([k]) => {
          const v = s.by[k][part];
          if (v <= 0) return;
          svg.append(el("rect", { x: cx - bw / 2, y: Y(base + v), width: bw, height: Y(base) - Y(base + v), class: `pd-${k}` + (part === "exp" ? " pd-exp" : "") }));
          base += v;
        });
      }
      svg.append(el("text", { x: cx, y: Y(base) - 6, class: "st-strong", "text-anchor": "middle" }, (s.expected ? "≈" : "") + Math.round(base)));
      svg.append(el("text", { x: cx, y: Y0 + 18, class: "st-txt", "text-anchor": "middle" }, label(s.k, { month: "short" })));
      if (s.k.endsWith("-01") || i === 0) svg.append(el("text", { x: cx, y: Y0 + 34, class: "st-txt", "text-anchor": "middle" }, s.k.slice(0, 4)));
    });
    const key = $("#bars-key");
    SRC.forEach(([k, name]) => {
      const li = document.createElement("li");
      li.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect width="16" height="16" rx="3" class="pd-${k}"/></svg>${name}`;
      key.append(li);
    });
    const li = document.createElement("li");
    li.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect width="16" height="16" rx="3" class="pd-s1 pd-exp"/></svg>Light: expected`;
    key.append(li);
  }

  // ---- table ---------------------------------------------------------------------
  function table() {
    const body = $("#pd-rows");
    stats.forEach((s) => {
      const cell = (k) => {
        const v = s.by[k].real + s.by[k].exp;
        return s.by[k].exp > 0 ? `≈${Math.round(v)}` : `${v}`;
      };
      const tr = document.createElement("tr");
      // the first month starts part-way (17 June), so say so in the label
      const from = s.k === C.start.slice(0, 7) && Number(C.start.slice(8)) > 1 ? ` (from ${Number(C.start.slice(8))} ${label(s.k, { month: "long" })})` : "";
      tr.innerHTML = `<th scope="row">${label(s.k, { month: "long", year: "numeric" })}${from}${s.expected ? ' <span class="cal-kind">expected</span>' : ""}</th>` +
        SRC.map(([k]) => `<td>${cell(k)}</td>`).join("") + `<td>${s.expected ? "≈" : ""}${Math.round(s.any)}</td>`;
      body.append(tr);
    });
  }

  // ---- running total -----------------------------------------------------------------
  function total() {
    const svg = $("#total");
    const t0 = Date.parse(C.start), t1 = Date.parse(C.end), tt = Date.parse(C.today);
    const sorted = Object.keys(days).sort();
    let run = 0, atToday = 0;
    const pts = sorted.map((d) => { run += dayValue(days[d]); if (d <= C.today) atToday = run; return [Date.parse(d), run]; });
    const end = run;
    const X0 = 60, W = 680, Y0 = 250, H = 220;
    const max = Math.ceil(end / 20) * 20;
    const X = (t) => X0 + (t - t0) / (t1 - t0) * W;
    const Y = (v) => Y0 - v / max * H;
    for (let v = 0; v <= max; v += 20) {
      svg.append(el("line", { x1: X0, x2: X0 + W, y1: Y(v), y2: Y(v), class: "st-grid" }));
      svg.append(el("text", { x: X0 - 8, y: Y(v) + 4, class: "st-txt", "text-anchor": "end" }, v));
    }
    MONTHS.forEach((k) => {
      const t = Date.parse(`${k}-01`);
      if (t >= t0) svg.append(el("text", { x: X(t + 15 * 864e5), y: Y0 + 20, class: "st-txt", "text-anchor": "middle" }, label(k, { month: "short" })));
    });
    const path = (list) => "M" + list.map(([t, v]) => `${X(t).toFixed(1)} ${Y(v).toFixed(1)}`).join(" L");
    const past = [[t0, 0], ...pts.filter(([t]) => t <= tt)];
    const future = [[tt, atToday], ...pts.filter(([t]) => t > tt)];
    svg.append(el("path", { d: path(past), class: "pd-line" }));
    svg.append(el("path", { d: path(future), class: "pd-line pd-dash" }));
    svg.append(el("line", { x1: X(tt), x2: X(tt), y1: Y(max), y2: Y0, class: "st-day" }));
    svg.append(el("text", { x: X(tt) - 8, y: Y(atToday) - 12, class: "st-strong", "text-anchor": "end" }, `today: ${Math.round(atToday)}`));
    svg.append(el("text", { x: X(t1), y: Y(end) - 12, class: "st-strong", "text-anchor": "end" }, `31 Mar 2027: about ${Math.round(end / 5) * 5}`));
    return { atToday, end };
  }

  // ---- layer cards -----------------------------------------------------------------------
  function cards(t) {
    const S = C.season;
    const ahead = Object.entries(days).filter(([d]) => d > C.today);
    const radar = ahead.filter(([, l]) => l.some((e) => RADAR.has(e.s))).length;
    const photos = ahead.filter(([, l]) => !l.some((e) => RADAR.has(e.s))).reduce((a, [, l]) => a + dayValue(l), 0);
    const spanDays = (Date.parse(C.end) - Date.parse(C.start)) / 864e5 + 1;
    const perYear = Math.round(t.end / spanDays * 365 / 10) * 10;
    const box = $("#layer-cards");
    const card = (h, p) => { const d = document.createElement("div"); d.className = "card"; d.innerHTML = `<h3>${h}</h3><p>${p}</p>`; box.append(d); };
    card("Real check, June to October 2026",
      `From ${new Date(S.from).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })} to ${new Date(S.to).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}, Mahakanadarawa's water fell ${S.fallCm} cm. In the same weeks there were ${S.pictureDays} picture days: about one picture for every ${S.cmPerPicture} cm. So the layers were about ${S.cmPerPicture} cm thick.`);
    card("The next five months",
      `About ${Math.round((radar + photos) / 5) * 5} more picture days by 31 March 2027: ${radar} radar days and about ${Math.round(photos)} more days with only a clear photo.`);
    card("In a whole year",
      `About ${perYear} picture days a year. Mahakanadarawa's water moves through about 4 to 5 m a year, so that is roughly one picture for every ${Math.round(450 / perYear)} cm of height.`);
  }

  bars();
  table();
  cards(total());
})();
