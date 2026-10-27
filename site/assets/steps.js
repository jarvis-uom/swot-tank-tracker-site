// Step by step page: the real days with data, five example dots, the function A(h) and its layers.
// The days are real (catalogues for Mahakanadarawa, 2026); the heights and areas are made-up round numbers.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  // real days with data in 2026 (local dates). SWOT: usable passes; Sentinel-2: clear photos only.
  const DAYS = {
    swot: ["01-06", "01-13", "01-27", "02-03", "02-17", "02-24", "03-10", "03-16", "04-06", "04-21", "04-27",
           "05-12", "05-18", "06-08", "06-22", "06-29", "07-13", "07-20", "08-03", "08-24", "08-30"],
    s1: ["01-01", "01-13", "01-25", "02-06", "02-18", "03-02", "03-14", "03-26", "04-07", "04-19", "05-01",
         "05-13", "05-25", "06-06", "06-18", "06-25", "07-07", "07-19", "07-31", "08-06", "08-12", "08-24"],
    s2: ["02-28", "03-07", "03-25"],
    ni: ["06-17", "06-20", "06-29", "07-02", "07-11", "07-14", "07-23", "07-26", "08-16", "08-19", "08-28", "08-31"],
  };
  const ROWS = [["swot", "SWOT: height"], ["s1", "Sentinel-1 radar: area"], ["s2", "Sentinel-2 photo: area"], ["ni", "NISAR radar: area"]];
  const NAMES = { s1: "Sentinel-1", s2: "Sentinel-2", ni: "NISAR" };

  // the five example dots: day, height (m), area (ha), where the area came from, SWOT passes either side if not the same day
  const DOTS = [
    { n: 1, day: "01-13", label: "13 Jan", h: 104, a: 32, src: "s1" },
    { n: 2, day: "02-28", label: "28 Feb", h: 103, a: 24, src: "s2", between: ["02-24", "03-10"] },
    { n: 3, day: "03-25", label: "25 Mar", h: 102, a: 20, src: "s2", between: ["03-16", "04-06"] },
    { n: 4, day: "06-29", label: "29 Jun", h: 101, a: 14, src: "ni" },
    { n: 5, day: "08-24", label: "24 Aug", h: 100, a: 10, src: "s1" },
  ];

  const el = (name, attrs, text) => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // ---- step 1: the timeline -----------------------------------------------------
  function timeline() {
    const svg = $("#timeline");
    const t0 = Date.UTC(2026, 0, 1), t1 = Date.UTC(2026, 7, 31);
    const X = (d) => 190 + (Date.parse(`2026-${d}T00:00:00Z`) - t0) / (t1 - t0) * 690;
    const Y = (i) => 78 + i * 40;
    for (let m = 0; m < 8; m++) {
      const x = 190 + (Date.UTC(2026, m, 1) - t0) / (t1 - t0) * 690;
      svg.append(el("line", { x1: x, x2: x, y1: 52, y2: 212, class: "st-grid" }));
      const mid = 190 + ((Date.UTC(2026, m, 1) + Date.UTC(2026, m + 1, 1)) / 2 - t0) / (t1 - t0) * 690;
      svg.append(el("text", { x: mid, y: 236, class: "st-txt", "text-anchor": "middle" },
        new Date(Date.UTC(2026, m, 1)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })));
    }
    DOTS.forEach((d) => {
      svg.append(el("line", { x1: X(d.day), x2: X(d.day), y1: 38, y2: 210, class: "st-guide" }));
      if (d.between) svg.append(el("line", { x1: X(d.between[0]), x2: X(d.between[1]), y1: Y(0) + 17, y2: Y(0) + 17, class: "st-between" }));
    });
    ROWS.forEach(([key, name], i) => {
      svg.append(el("text", { x: 178, y: Y(i) + 5, class: "st-row", "text-anchor": "end" }, name));
      DAYS[key].forEach((d) => svg.append(el("line", { x1: X(d), x2: X(d), y1: Y(i) - 12, y2: Y(i) + 12, class: `st-t-${key}` })));
    });
    DOTS.forEach((d) => {
      svg.append(el("circle", { cx: X(d.day), cy: 28, r: 12, class: "st-badge" }));
      svg.append(el("text", { x: X(d.day), y: 33, class: "st-badge-n" }, d.n));
    });
  }

  // ---- steps 2 and 3: area against height --------------------------------------
  const X = (a) => 80 + a / 40 * 560;
  const Y = (h) => 320 - (h - 99.5) / 5 * 290;

  function axes(svg) {
    [100, 101, 102, 103, 104].forEach((h) => {
      svg.append(el("line", { x1: X(0), x2: X(40), y1: Y(h), y2: Y(h), class: "st-grid" }));
      svg.append(el("text", { x: X(0) - 8, y: Y(h) + 4, class: "st-txt", "text-anchor": "end" }, `${h} m`));
    });
    [0, 10, 20, 30, 40].forEach((a) => {
      svg.append(el("line", { x1: X(a), x2: X(a), y1: Y(99.5), y2: Y(104.5), class: "st-grid" }));
      svg.append(el("text", { x: X(a), y: Y(99.5) + 20, class: "st-txt", "text-anchor": "middle" }, `${a} ha`));
    });
    svg.append(el("text", { x: X(20), y: Y(99.5) + 38, class: "st-txt", "text-anchor": "middle" }, "Water area"));
  }

  function marker(svg, d, r) {
    const x = X(d.a), y = Y(d.h);
    if (d.src === "s2") svg.append(el("circle", { cx: x, cy: y, r, class: "st-s2" }));
    else if (d.src === "s1") svg.append(el("rect", { x: x - r, y: y - r, width: 2 * r, height: 2 * r, class: "st-s1" }));
    else svg.append(el("path", { d: `M${x} ${y - r - 1} L${x + r + 1} ${y} L${x} ${y + r + 1} L${x - r - 1} ${y} Z`, class: "st-ni" }));
  }

  const line = () => "M" + DOTS.map((d) => `${X(d.a)} ${Y(d.h)}`).join(" L");

  function curve() {
    const svg = $("#curve");
    axes(svg);
    svg.append(el("path", { d: line(), class: "st-curve" }));
    DOTS.forEach((d) => {
      marker(svg, d, 7);
      const right = d.a < 18;
      svg.append(el("text", { x: X(d.a) + (right ? 16 : -16), y: Y(d.h) + 5, class: "st-strong",
        "text-anchor": right ? "start" : "end" }, `${d.label}: SWOT + ${NAMES[d.src]}`));
    });
    svg.append(el("text", { x: X(31), y: Y(102.4), class: "st-strong" }, "A(h)"));
  }

  function layers() {
    const svg = $("#layers");
    axes(svg);
    const names = ["a", "b", "c", "d"];
    const sorted = [...DOTS].sort((p, q) => p.h - q.h);
    let total = 0;
    for (let i = 0; i < 4; i++) {
      const lo = sorted[i], hi = sorted[i + 1];
      const pts = [[0, lo.h], [lo.a, lo.h], [hi.a, hi.h], [0, hi.h]].map(([a, h]) => `${X(a)},${Y(h)}`).join(" ");
      svg.append(el("polygon", { points: pts, class: `st-l st-l${i + 1}` }));
      const v = (lo.a + hi.a) / 2 * (hi.h - lo.h) * 10000;
      total += v;
      svg.append(el("text", { x: X(0) + 12, y: Y(lo.h + 0.5) + 5, class: i < 2 ? "st-on-dark" : "st-strong" }, `${names[i]}: ${fmt(v)} m³`));
    }
    svg.append(el("path", { d: line(), class: "st-curve" }));
    DOTS.forEach((d) => marker(svg, d, 5));
    svg.append(el("line", { x1: X(0), x2: X(40), y1: Y(104), y2: Y(104), class: "st-day" }));
    svg.append(el("line", { x1: X(0), x2: X(40), y1: Y(100), y2: Y(100), class: "st-day" }));
    svg.append(el("text", { x: X(40), y: Y(104) - 8, class: "st-strong", "text-anchor": "end" }, "13 Jan: 104 m"));
    svg.append(el("text", { x: X(40), y: Y(100) + 18, class: "st-strong", "text-anchor": "end" }, "24 Aug: 100 m"));
    svg.append(el("text", { x: X(40), y: Y(100.6), class: "st-strong", "text-anchor": "end" }, `a + b + c + d = ${fmt(total)} m³`));
  }

  timeline();
  curve();
  layers();
})();
