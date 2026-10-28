// Satellite calendar page: a legend, month-by-month counts and a day-by-day calendar.
// Data: window.CALENDAR from calendar-data.js (made by temp/calendar/build_calendar_data.py).
(() => {
  const C = window.CALENDAR;
  const $ = (s) => document.querySelector(s);
  const SRC = [
    ["swot", "SW", "SWOT: water height"],
    ["s1", "S1", "Sentinel-1 radar: water area"],
    ["ni", "NI", "NISAR radar: water area"],
    ["al", "AL", "ALOS-2 radar: water area"],
    ["s2", "S2", "Sentinel-2 photo: water area"],
    ["ls", "LS", "Landsat photo: water area"],
  ];
  const NAME = Object.fromEntries(SRC.map(([k, , n]) => [k, n]));
  const SHORT = Object.fromEntries(SRC.map(([k, s]) => [k, s]));
  const byDay = {};
  C.events.forEach((e) => { (byDay[e.d] = byDay[e.d] || []).push(e); });
  const iso = (dt) => dt.toISOString().slice(0, 10);
  const MONTHS = [];
  for (let m = new Date(Date.UTC(2026, 5, 1)); iso(m) <= C.end; m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))) MONTHS.push(m);

  function chip(e) {
    const s = document.createElement("span");
    s.className = `cal-chip cal-${e.s}` + (e.real ? "" : " exp") + (e.real && e.clear === false ? " cloudy" : "");
    s.textContent = SHORT[e.s];
    s.title = `${NAME[e.s]}: ${e.real ? (e.clear === false ? "real, too cloudy" : e.clear ? "real, clear" : "real") : "expected"}`;
    return s;
  }

  // legend: pictures (areas) as tags; SWOT and the gauge give heights, so they are marked differently
  const legend = $("#legend");
  SRC.filter(([k]) => k !== "swot").forEach(([k, , n]) => {
    const li = document.createElement("li");
    li.append(chip({ s: k, real: true }), document.createTextNode(n));
    legend.append(li);
  });
  const sw = document.createElement("li");
  const ss = document.createElement("span"); ss.className = "cal-sw-sample";
  sw.append(ss, document.createTextNode("Dark stripe on top: SWOT pass, water height (dashed when expected)"));
  legend.append(sw);
  const g = document.createElement("li");
  const gs = document.createElement("span"); gs.className = "cal-g"; gs.textContent = "G";
  g.append(gs, document.createTextNode("Gauge height, every day (5 big reservoirs only)"));
  legend.append(g);

  // month table
  const rows = $("#month-rows");
  MONTHS.forEach((m) => {
    const key = iso(m).slice(0, 7);
    const ev = C.events.filter((e) => e.d.startsWith(key));
    const days = new Set(ev.map((e) => e.d)).size;
    const cnt = (s) => ev.filter((e) => e.s === s).length;
    const photos = (s) => {
      const all = ev.filter((e) => e.s === s);
      const known = all.filter((e) => e.real);
      const clear = known.filter((e) => e.clear).length;
      return known.length === all.length ? `${all.length} (${clear} clear)` : known.length ? `${all.length} (${clear} clear so far)` : `${all.length} (not known yet)`;
    };
    const first = key === C.start.slice(0, 7) ? Number(C.start.slice(8)) : 1;
    const last = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
    const real = ev.length && ev.every((e) => e.real) ? "real" : ev.some((e) => e.real) ? "real and expected" : "expected";
    const tr = document.createElement("tr");
    const label = m.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    tr.innerHTML = `<th scope="row">${label} <span class="cal-kind">${real}</span></th><td>${cnt("swot")}</td><td>${cnt("s1")}</td><td>${cnt("ni")}</td>` +
      `<td>${cnt("al")}</td><td>${photos("s2")}</td><td>${photos("ls")}</td><td>${days}</td><td>${last - first + 1}</td>`;
    rows.append(tr);
  });

  // calendar
  const box = $("#months");
  MONTHS.forEach((m) => {
    const wrap = document.createElement("div");
    wrap.className = "cal-month";
    const h = document.createElement("h3");
    h.textContent = m.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    wrap.append(h);
    const grid = document.createElement("div");
    grid.className = "cal-grid";
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => {
      const x = document.createElement("div"); x.className = "cal-head"; x.textContent = d; grid.append(x);
    });
    const lead = (m.getUTCDay() + 6) % 7;
    for (let i = 0; i < lead; i++) grid.append(Object.assign(document.createElement("div"), { className: "cal-day empty" }));
    const last = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)).getUTCDate();
    for (let d = 1; d <= last; d++) {
      const key = iso(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), d)));
      const cell = document.createElement("div");
      const inside = key >= C.start && key <= C.end;
      cell.className = "cal-day" + (inside ? "" : " out") + (key === C.today ? " today" : "") + (key > C.today ? " future" : "");
      const n = document.createElement("span"); n.className = "cal-n"; n.textContent = d;
      cell.append(n);
      if (inside) {
        const gg = document.createElement("span"); gg.className = "cal-g"; gg.textContent = "G"; gg.title = "Gauge height (big reservoirs)";
        cell.append(gg);
        const list = byDay[key] || [];
        const swot = list.find((e) => e.s === "swot");
        if (swot) {   // a height, not a picture: a stripe on top of the day instead of a tag
          cell.classList.add(swot.real ? "sw-real" : "sw-exp");
          cell.title = `SWOT pass (water height), ${swot.real ? "real" : "expected"}`;
          const t = document.createElement("span"); t.className = "sr"; t.textContent = `SWOT pass, ${swot.real ? "real" : "expected"}.`;
          cell.append(t);
        }
        list.filter((e) => e.s !== "swot").forEach((e) => cell.append(chip(e)));
      }
      if (key === C.today) cell.setAttribute("aria-label", `Today, ${key}`);
      grid.append(cell);
    }
    wrap.append(grid);
    box.append(wrap);
  });
})();
