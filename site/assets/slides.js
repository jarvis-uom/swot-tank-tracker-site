// Slide viewer: arrows, keyboard, swipe, thumbnails, full screen and a #slide-N link.
(() => {
  const TITLES = JSON.parse(document.getElementById("slide-titles").textContent);
  const N = TITLES.length;
  const $ = (id) => document.getElementById(id);
  const img = $("slide"), counter = $("counter"), prev = $("prev"), next = $("next"), thumbs = $("thumbs"), viewer = $("viewer"), full = $("full");
  const num = (i) => String(i + 1).padStart(2, "0");
  let cur = 0;

  TITLES.forEach((title, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Slide ${i + 1}: ${title}`);
    const im = document.createElement("img");
    im.src = `assets/slides/thumb-${num(i)}.jpg`;
    im.alt = "";
    im.width = 320; im.height = 180;
    im.loading = "lazy";
    const n = document.createElement("span");
    n.className = "n";
    n.textContent = `${i + 1}. ${title}`;
    b.append(im, n);
    b.addEventListener("click", () => show(i));
    thumbs.appendChild(b);
  });

  function show(i, quiet) {
    cur = Math.max(0, Math.min(N - 1, i));
    img.src = `assets/slides/slide-${num(cur)}.jpg`;
    img.alt = `Slide ${cur + 1}: ${TITLES[cur]}`;
    counter.textContent = `Slide ${cur + 1} of ${N} · ${TITLES[cur]}`;
    prev.disabled = cur === 0;
    next.disabled = cur === N - 1;
    [...thumbs.children].forEach((b, k) => b.setAttribute("aria-current", String(k === cur)));
    const t = thumbs.children[cur];
    thumbs.scrollTo({ left: t.offsetLeft - thumbs.clientWidth / 2 + t.clientWidth / 2, behavior: quiet ? "auto" : "smooth" });
    if (!quiet) { try { history.replaceState(null, "", `#slide-${cur + 1}`); } catch (e) { /* opened from disk */ } }
    [cur - 1, cur + 1].filter((k) => k >= 0 && k < N).forEach((k) => { new Image().src = `assets/slides/slide-${num(k)}.jpg`; });
  }

  prev.addEventListener("click", () => show(cur - 1));
  next.addEventListener("click", () => show(cur + 1));
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const inViewer = viewer.contains(document.activeElement) || document.fullscreenElement === viewer;
    if (e.key === "ArrowRight" || (inViewer && e.key === "PageDown")) { show(cur + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || (inViewer && e.key === "PageUp")) { show(cur - 1); e.preventDefault(); }
    else if (inViewer && e.key === "Home") { show(0); e.preventDefault(); }
    else if (inViewer && e.key === "End") { show(N - 1); e.preventDefault(); }
  });

  // swipe left or right on the slide
  let x0 = null;
  img.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  img.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
  });
  img.addEventListener("dragstart", (e) => e.preventDefault());

  // full screen, where the browser allows it (not on iPhone)
  if (document.fullscreenEnabled) {
    full.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else viewer.requestFullscreen().catch(() => {});
    });
    document.addEventListener("fullscreenchange", () => {
      full.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
    });
  } else {
    full.hidden = true;
  }

  // open the slide named in the link (#slide-N), also when the link changes; other links (#main) are left alone
  const linked = () => { const m = location.hash.match(/^#slide-(\d+)$/); return m ? Number(m[1]) - 1 : null; };
  window.addEventListener("hashchange", () => { const k = linked(); if (k !== null) show(k, true); });
  show(linked() ?? 0, true);
})();
