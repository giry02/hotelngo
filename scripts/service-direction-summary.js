(() => {
  "use strict";

  const deck = document.querySelector("[data-deck]");
  const slides = [...document.querySelectorAll(".summary-slide")];
  const currentLabel = document.querySelector("[data-current]");
  const totalLabel = document.querySelector("[data-total]");
  const progress = document.querySelector("[data-progress]");
  const sectionLabel = document.querySelector("[data-section]");
  const prev = document.querySelector("[data-prev]");
  const next = document.querySelector("[data-next]");
  const overview = document.querySelector("[data-overview]");
  const overviewGrid = document.querySelector("[data-overview-grid]");
  let current = 0;
  let touchX = 0;

  function clamp(value) {
    return Math.max(0, Math.min(slides.length - 1, value));
  }

  function readHash() {
    const matched = location.hash.match(/slide-(\d+)/);
    return matched ? clamp(Number(matched[1]) - 1) : 0;
  }

  function show(index, updateHash = true) {
    current = clamp(index);
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === current));
    currentLabel.textContent = String(current + 1).padStart(2, "0");
    totalLabel.textContent = String(slides.length).padStart(2, "0");
    progress.style.height = `${((current + 1) / slides.length) * 100}%`;
    sectionLabel.textContent = slides[current].dataset.section || "SUMMARY";
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.title = `${String(current + 1).padStart(2, "0")} · ${slides[current].dataset.title} | HotelNGo`;
    if (updateHash) history.replaceState(null, "", `#slide-${current + 1}`);
  }

  function buildOverview() {
    overviewGrid.innerHTML = slides.map((slide, index) => `
      <button type="button" data-overview-slide="${index}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>${slide.dataset.title}</strong>
        <small>${slide.dataset.section}</small>
      </button>`).join("");
  }

  function openOverview() {
    overview.hidden = false;
    requestAnimationFrame(() => overview.classList.add("is-open"));
    overview.querySelector(`[data-overview-slide="${current}"]`)?.focus();
  }

  function closeOverview() {
    overview.classList.remove("is-open");
    window.setTimeout(() => { overview.hidden = true; }, 180);
  }

  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  document.querySelector("[data-overview-open]").addEventListener("click", openOverview);
  document.querySelectorAll("[data-overview-close]").forEach((button) => button.addEventListener("click", closeOverview));
  overviewGrid.addEventListener("click", (event) => {
    const target = event.target.closest("[data-overview-slide]");
    if (!target) return;
    show(Number(target.dataset.overviewSlide));
    closeOverview();
  });
  document.querySelector("[data-fullscreen]").addEventListener("click", async () => {
    if (!document.fullscreenElement) await deck.requestFullscreen?.();
    else await document.exitFullscreen?.();
  });

  window.addEventListener("hashchange", () => show(readHash(), false));
  window.addEventListener("keydown", (event) => {
    if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); show(current + 1); }
    if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); show(current - 1); }
    if (event.key.toLowerCase() === "o") openOverview();
    if (event.key === "Escape" && !overview.hidden) closeOverview();
  });
  deck.addEventListener("touchstart", (event) => { touchX = event.changedTouches[0].clientX; }, { passive: true });
  deck.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 48) show(current + (delta < 0 ? 1 : -1));
  }, { passive: true });

  buildOverview();
  show(readHash(), false);
})();
