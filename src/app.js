// src/app.js  — full replacement

import { mapsUrl, orderUrl, reserveUrl, shareClip } from "./utils.js";

const feedEl     = document.getElementById("feed");
const citySelect = document.getElementById("citySelect");
const queryInput = document.getElementById("queryInput");
const searchBtn  = document.getElementById("searchBtn");
const yearEl     = document.getElementById("year");
const cityBadge  = document.getElementById("cityBadge"); // optional overlay badge

if (yearEl) yearEl.textContent = new Date().getFullYear();

let allClips = [];

/* ---------------- TikTok embed loader (robust) ---------------- */
function loadTikTokEmbeds(retry = 0) {
  try {
    if (window.tiktok && typeof window.tiktok.loadEmbeds === "function") {
      window.tiktok.loadEmbeds();
      return;
    }
  } catch (_) {}
  if (retry < 12) setTimeout(() => loadTikTokEmbeds(retry + 1), 250);
}

/* ---------------- Data ---------------- */
async function loadData() {
  try {
    const res = await fetch("/data/videos.json", { cache: "no-store" });
    allClips = await res.json();
  } catch (e) {
    console.error("Failed to load videos.json", e);
    allClips = [];
  }
  render();
}

function filtered() {
  const city = (citySelect?.value || "").trim();
  const q = (queryInput?.value || "").trim().toLowerCase();
  return allClips.filter(item => {
    const cityOk = !city || item.city === city;
    const hay = [item.title, item.restaurant, item.creator, ...(item.tags||[])].join(" ").toLowerCase();
    const qOk = !q || hay.includes(q);
    return cityOk && qOk;
  });
}

/* ---------------- Rendering ---------------- */
function cardTemplate(item) {
  return `
    <article class="card snap-slide" data-id="${item.id}">
      <blockquote class="tiktok-embed"
                  cite="${item.tiktokUrl}"
                  style="max-width: 605px; min-width: 325px; margin: 0 auto;">
        <section></section>
      </blockquote>

      <div class="card-body">
        <div class="meta">
          <div>
            <strong>${item.restaurant}</strong> • ${item.city}
            <div style="color:#b3b3b3;font-size:14px;">
              ${item.title} · ${item.creator}
            </div>
          </div>
        </div>

        <div class="actions">
          <a href="${mapsUrl(item.restaurant, item.city)}" target="_blank" rel="noopener">Map</a>
          <button type="button" data-action="share" data-url="${item.tiktokUrl}">Share</button>
          <a href="${orderUrl(item.restaurant, item.city)}" target="_blank" rel="noopener">Order Online</a>
          <a href="${reserveUrl(item.restaurant, item.city)}" target="_blank" rel="noopener">Reserve Table</a>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const list = filtered();

  // Optional fixed badge at top-left
  if (cityBadge && citySelect) {
    cityBadge.textContent = `${citySelect.value} • NomReel`;
  }

  // Build slides (full-viewport snap)
  feedEl.innerHTML = list.map(cardTemplate).join("");

  // Upgrade TikTok blockquotes to embeds
  loadTikTokEmbeds();

  // Hook up Share buttons
  feedEl.querySelectorAll('button[data-action="share"]').forEach(btn => {
    btn.addEventListener("click", () =>
      shareClip({ title: "NomReel", url: btn.dataset.url })
    );
  });

  // Light optimization: observe slides (slot for future play/pause if needed)
  setupIntersectionControls();
}

/* ---------------- Intersection controls ---------------- */
function setupIntersectionControls() {
  const root = feedEl;
  const slides = [...root.querySelectorAll(".card.snap-slide")];
  if (!slides.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // If you later swap to native <video>, this is where you'd play/pause.
      // With TikTok embeds we can't programmatically control playback.
      // We keep this observer for future enhancements & perf tweaks.
      if (entry.isIntersecting) {
        // ensure embed exists/loaded
        loadTikTokEmbeds();
      }
    });
  }, { root, threshold: 0.6 });

  slides.forEach(s => io.observe(s));
}

/* ---------------- Events ---------------- */
citySelect?.addEventListener("change", render);
searchBtn?.addEventListener("click", render);
queryInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") render(); });

/* ---------------- Init ---------------- */
loadData();

