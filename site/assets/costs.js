// Cost calculator: prices checked on 27 Oct 2026 (sources listed on the page).
(() => {
  const RATE = 332.17; // rupees per US dollar, ExchangeRate-API, 26 Oct 2026
  const ITEMS = [
    { id: "logger", name: "Home-made water-level logger", lkr: 14530, monthly: 265,
      gets: (n) => `Daily water height at ${n} village tank${n > 1 ? "s" : ""}` },
    { id: "sonar", name: "Deeper PRO+ 2 sonar", usd: 159.99,
      gets: () => "A depth map of each village tank's bed, which checks every layer directly" },
    { id: "hobo", name: "Ready-made HOBO logger", usd: 425, firstUsd: 723,
      gets: (n) => `Daily water height, to about 0.4 cm, at ${n} tank${n > 1 ? "s" : ""}` },
    { id: "radar", name: "Paid radar image (Umbra, 1 m)", usd: 675,
      gets: (n) => `${n} radar image${n > 1 ? "s" : ""} of the water area through cloud` },
    { id: "drone", name: "Drone (DJI Mini 4 Pro Fly More Combo)", lkr: 309500,
      gets: () => "Maps of the dry tank beds in the dry season" },
  ];
  const PRESETS = {
    free: { label: "Free data only", set: {} },
    smallest: { label: "Smallest: sonar only", set: { sonar: 1 } },
    pilot: { label: "Pilot: 3 loggers", set: { logger: 3 } },
    recommended: { label: "Recommended: 8 loggers + sonar", set: { logger: 8, sonar: 1 } },
  };
  const $ = (id) => document.getElementById(id);
  const rs = (x) => "Rs " + Math.round(x).toLocaleString("en-US");
  const usd = (x) => "US$" + Math.round(x).toLocaleString("en-US");

  const inputs = Object.fromEntries(ITEMS.map((it) => [it.id, $("in-" + it.id)]));
  const months = $("in-months");

  function value(id) {
    const el = inputs[id];
    return el.type === "checkbox" ? (el.checked ? 1 : 0) : Number(el.value);
  }

  function cost(it, n) {
    if (!n) return 0;
    if (it.lkr) return it.lkr * n;
    return (it.usd * n + (it.firstUsd || 0)) * RATE;
  }

  function update() {
    let oneOff = 0, monthly = 0;
    const lines = [], gets = [];
    ITEMS.forEach((it) => {
      const n = value(it.id);
      const out = $("n-" + it.id);
      if (out) out.textContent = String(n);
      if (!n) return;
      const c = cost(it, n);
      oneOff += c;
      monthly += (it.monthly || 0) * n;
      lines.push([`${it.name}${n > 1 ? " × " + n : ""}`, c]);
      gets.push(it.gets(n));
    });
    const m = Number(months.value);
    $("n-months").textContent = `${m} month${m > 1 ? "s" : ""}`;
    $("out-oneoff").textContent = rs(oneOff);
    $("out-oneoff-usd").textContent = oneOff ? `about ${usd(oneOff / RATE)}` : "Free satellite and gauge data only";
    $("out-monthly").textContent = rs(monthly);
    $("out-months").textContent = `Total for ${m} month${m > 1 ? "s" : ""}`;
    $("out-total").textContent = rs(oneOff + monthly * m);

    const ul = $("out-lines");
    ul.replaceChildren(...(lines.length ? lines : [["Nothing to buy", 0]]).map(([name, c]) => {
      const li = document.createElement("li");
      const span = document.createElement("span"); span.textContent = name;
      const b = document.createElement("b"); b.textContent = rs(c);
      li.append(span, b);
      return li;
    }));
    const g = $("out-gets");
    const all = ["Free: daily gauge heights for the 5 reservoirs, and satellite water maps", ...gets];
    g.replaceChildren(...all.map((s) => { const li = document.createElement("li"); li.textContent = s; return li; }));

    // which preset (if any) matches the current choice
    Object.entries(PRESETS).forEach(([key, p]) => {
      const match = ITEMS.every((it) => value(it.id) === (p.set[it.id] || 0));
      $("p-" + key).setAttribute("aria-pressed", String(match));
    });
  }

  Object.entries(PRESETS).forEach(([key, p]) => {
    $("p-" + key).addEventListener("click", () => {
      ITEMS.forEach((it) => {
        const el = inputs[it.id];
        if (el.type === "checkbox") el.checked = !!p.set[it.id];
        else el.value = p.set[it.id] || 0;
      });
      update();
    });
  });
  [...Object.values(inputs), months].forEach((el) => el.addEventListener("input", update));
  update();
})();
