/**
 * Client Work portfolio — data logic and UI are kept in two separate layers.
 *
 *  - `Repository`    : grouping + filtering. Pure functions over window.VIDEOS_DATA. No DOM.
 *  - `PortfolioGrid` : renders filtered items into a section root. DOM only, no classification logic.
 */

/* eslint-disable no-restricted-globals */

const Repository = (items) => {
  const CATEGORY_LABELS = {
    ads: "Ads",
    beauty: "Beauty of Egypt"
  };

  /** @type {import("./videos-data").Video[]} */
  const all = Array.isArray(items) ? items.filter(Boolean) : [];

  const categories = () => {
    const seen = new Set(all.map((v) => v.category).filter(Boolean));
    return [...seen].sort();
  };

  const labelFor = (cat) => CATEGORY_LABELS[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));

  const filterBy = (cat) => (cat === "all" ? all : all.filter((v) => v.category === cat));

  const valid = (v) => Boolean(v && v.id && v.videoUrl);

  return { all, categories, labelFor, filterBy, valid };
};

const PortfolioGrid = (root) => {
  const state = { category: "all" };
  const repo = Repository(window.VIDEOS_DATA || []);
  const els = {};
  let gridEl;
  let modal;

  const fmtDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const fallbackTile = (title) => {
    const t = document.createElement("div");
    t.className = "folio-tile folio-fallback";
    t.innerHTML = `
      <div class="folio-fallback-mark">✦</div>
      <p>${esc(title)}</p>
      <span>preview pending</span>`;
    return t;
  };

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const tileFor = (v) => {
    const tall = v.orientation === "portrait";
    const t = document.createElement("article");
    t.className = `folio-tile ${tall ? "tall" : ""}`;
    t.setAttribute("data-id", v.id);
    t.innerHTML = `
      <div class="folio-media">
        <img src="${esc(v.thumbnailUrl)}" alt="${esc(v.title)}" loading="lazy" decoding="async">
        <div class="folio-shade"></div>
        <span class="folio-tag">${esc(repo.labelFor(v.category))}</span>
        <span class="folio-dur">${fmtDuration(v.durationSec)}</span>
        <button class="folio-play" aria-label="Play ${esc(v.title)}">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="folio-shimmer"></div>
      </div>
      <div class="folio-cap">
        <h4>${esc(v.title)}</h4>
        <p>${esc(v.location)}</p>
      </div>`;
    const img = t.querySelector("img");
    img.addEventListener("load", () => t.classList.add("is-ready"));
    img.addEventListener("error", () => {
      t.classList.add("is-broken");
      t.querySelector(".folio-shimmer").style.display = "none";
      const shade = t.querySelector(".folio-shade");
      shade.style.background = "linear-gradient(135deg,#f0b42966,#d7263d55)";
    });
    t.querySelector(".folio-play").addEventListener("click", () => openModal(v));
    return t;
  };

  const buildFilters = () => {
    els.filters.innerHTML = "";
    const cats = ["all", ...repo.categories()];
    for (const cat of cats) {
      const b = document.createElement("button");
      b.className = `folio-filter${cat === state.category ? " is-active" : ""}`;
      b.textContent = cat === "all" ? "All" : repo.labelFor(cat);
      b.setAttribute("data-cat", cat);
      b.addEventListener("click", () => setCategory(cat));
      els.filters.appendChild(b);
    }
  };

  const setCategory = (cat) => {
    state.category = cat;
    buildFilters();
    render();
  };

  const render = () => {
    gridEl.innerHTML = "";
    const items = repo.filterBy(state.category);
    if (!items.length) {
      gridEl.innerHTML = '<p class="folio-empty">Nothing filed under this tag yet — check back soon.</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    for (const v of items) {
      frag.appendChild(repo.valid(v) ? tileFor(v) : fallbackTile(v.title));
    }
    gridEl.appendChild(frag);
  };

  const openModal = (v) => {
    closeModal();
    modal = document.createElement("div");
    modal.className = "folio-modal";
    modal.innerHTML = `
      <div class="folio-modal-box">
        <button class="folio-modal-close" aria-label="Close">&times;</button>
        <video src="${esc(v.videoUrl)}" controls autoplay playsinline></video>
        <div class="folio-modal-meta"><h4>${esc(v.title)}</h4><p>${esc(v.location)}</p></div>
      </div>`;
    const vid = modal.querySelector("video");
    vid.addEventListener("error", () => {
      vid.outerHTML = `<div class="folio-modal-broken">✦<p>This clip couldn’t stream — sorry.</p></div>`;
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector(".folio-modal-close").addEventListener("click", closeModal);
    document.addEventListener("keydown", onEsc);
    document.body.appendChild(modal);
  };

  const onEsc = (e) => {
    if (e.key === "Escape") closeModal();
  };

  const closeModal = () => {
    document.removeEventListener("keydown", onEsc);
    if (modal) { modal.remove(); modal = null; }
  };

  const boot = () => {
    root.innerHTML = `
      <div class="folio-head">
        <div class="folio-filters" aria-label="Filter videos by venue"></div>
        <p class="folio-count"></p>
      </div>
      <div class="folio-grid"></div>`;
    els.filters = root.querySelector(".folio-filters");
    els.count = root.querySelector(".folio-count");
    gridEl = root.querySelector(".folio-grid");

    buildFilters();
    render();
    els.count.textContent = `Made by Mazen mbappe — ${repo.all.length} clips · ${repo.categories().length} sections`;
  };

  return { boot };
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-folio]").forEach((el) => PortfolioGrid(el).boot());
  });
} else {
  document.querySelectorAll("[data-folio]").forEach((el) => PortfolioGrid(el).boot());
}