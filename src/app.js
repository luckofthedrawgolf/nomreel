// TEMP: hard reset any old service worker & caches causing stale loads
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}
if (window.caches) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));

// src/app.js
import { mapsUrl, orderUrl, reserveUrl, shareClip } from "./utils.js";

/* ---------- DOM ---------- */
const feedEl      = document.getElementById("feed");
const citySelect  = document.getElementById("citySelect");
const queryInput  = document.getElementById("queryInput");
const searchBtn   = document.getElementById("searchBtn");
const yearEl      = document.getElementById("year");
const cityBadge   = document.getElementById("cityBadge");

if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Reliable 100vh on mobile ---------- */
function setVH(){
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
setVH();
window.addEventListener("resize", setVH);
window.addEventListener("orientationchange", setVH);

/* ---------- Data ---------- */
let allClips = [];

async function loadData(){
  try{
    const res = await fetch("./data/videos.json", { cache: "no-store" });
    allClips = await res.json();
  }catch(err){
    console.error("videos.json load failed", err);
    allClips = [];
  }
  render();
}

/* ---------- Helpers ---------- */
function filtered(){
  const city = (citySelect?.value || "").trim();
  const q    = (queryInput?.value || "").trim().toLowerCase();

  return allClips.filter(item=>{
    const cityOk = !city || item.city === city;
    const hay    = [item.title, item.restaurant, item.creator, ...(item.tags||[])].join(" ").toLowerCase();
    const qOk    = !q || hay.includes(q);
    return cityOk && qOk;
  });
}

/* ---------- Templates ---------- */
function slideTemplate(item){
  // Extract numeric TikTok ID from any pasted URL form
  const id  = (item.tiktokUrl || "").match(/video\/(\d{10,})/)?.[1] || "";
  const src = id ? `https://www.tiktok.com/embed/v2/${id}` : "";

  return `
<section class="slide" data-id="${item.id}">
  <div class="tiktok-embed" style="max-width: 605px; min-width: 325px;">
    ${src ? `
    <iframe
      src="${src}"
      style="position:relative;width:100%;height:100%;aspect-ratio:9/16;border:0;"
      allow="encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      scrolling="no"
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin">
    </iframe>` : `
    <div style="padding:12px;text-align:center;border:1px solid var(--border);border-radius:10px;">
      Invalid or missing TikTok link
    </div>`}
  </div>

  <div class="info">
    <div class="meta">
      <strong>${item.restaurant}</strong> • ${item.city}
      <div>${item.title} • ${item.creator}</div>
    </div>
    <div class="actions">
      <a href="${mapsUrl(item.restaurant, item.city)}" target="_blank" rel="noopener">Map</a>
      <button type="button" data-action="share" data-url="${item.tiktokUrl}">Share</button>
      <a href="${orderUrl(item.restaurant, item.city)}" target="_blank" rel="noopener">Order Online</a>
      <a href="${reserveUrl(item.restaurant, item.city)}" target="_blank" rel="noopener">Reserve Table</a>
    </div>
  </div>
</section>`;
}

/* ---------- Render + Snap Assist ---------- */
function render(){
  const list = filtered();
  if (cityBadge && citySelect) cityBadge.textContent = `${citySelect.value || ""} • NomReel`;

  feedEl.innerHTML = list.map(slideTemplate).join("");

  // Share buttons
  feedEl.querySelectorAll('button[data-action="share"]').forEach(btn=>{
    btn.addEventListener("click", ()=>shareClip({ title:"NomReel", url: btn.dataset.url }));
  });

  // Snap assist: ensure we end exactly on a slide after scrolling stops
  snapAssist(feedEl);
}

/* Attach-once snap assist (prevents duplicate listeners across renders) */
const SNAP_HANDLERS = new WeakMap();
function snapAssist(container){
  if (!container || SNAP_HANDLERS.has(container)) return;

  const doSnap = () => {
    const slides = [...container.querySelectorAll(".slide")];
    if (!slides.length) return;

    const scrollTop = container.scrollTop;
    let best = { el:null, dist: Infinity };

    slides.forEach(slide=>{
      const top  = slide.offsetTop;
      const dist = Math.abs(top - scrollTop);
      if (dist < best.dist) best = { el: slide, dist };
    });

    if (best.el) best.el.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  let snapTimer = null;
  const onScroll   = () => { if (snapTimer) clearTimeout(snapTimer); snapTimer = setTimeout(doSnap, 90); };
  const onTouchEnd = () => { setTimeout(doSnap, 30); };

  container.addEventListener("scroll",   onScroll,   { passive:true });
  container.addEventListener("touchend", onTouchEnd, { passive:true });

  SNAP_HANDLERS.set(container, { onScroll, onTouchEnd });
}

/* ---------- Events ---------- */
citySelect?.addEventListener("change", render);
searchBtn?.addEventListener("click", render);
queryInput?.addEventListener("keydown", (e)=>{ if (e.key === "Enter") render(); });

/* ---------- Init ---------- */
loadData();
