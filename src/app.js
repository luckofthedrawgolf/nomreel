// src/app.js
import { mapsUrl, orderUrl, reserveUrl, shareClip } from "./utils.js";

const feedEl     = document.getElementById("feed");
const citySelect = document.getElementById("citySelect");
const queryInput = document.getElementById("queryInput");
const searchBtn  = document.getElementById("searchBtn");
const yearEl     = document.getElementById("year");
const cityBadge  = document.getElementById("cityBadge");

if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Reliable 100vh on mobile ---------- */
function setVH(){
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
setVH();
window.addEventListener("resize", setVH);
window.addEventListener("orientationchange", setVH);

let allClips = [];

/* ---------- Robust TikTok embed loader ---------- */
function loadTikTokEmbeds(retry = 0){
  try{
    if (window.tiktok && typeof window.tiktok.loadEmbeds === "function"){
      window.tiktok.loadEmbeds();
      return;
    }
  }catch(_){}
  if (retry < 16) setTimeout(()=>loadTikTokEmbeds(retry+1), 200);
}

/* ---------- Data ---------- */
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

function filtered(){
  const city = (citySelect?.value || "").trim();
  const q = (queryInput?.value || "").trim().toLowerCase();
  return allClips.filter(item=>{
    const cityOk = !city || item.city === city;
    const hay = [item.title, item.restaurant, item.creator, ...(item.tags||[])].join(" ").toLowerCase();
    const qOk = !q || hay.includes(q);
    return cityOk && qOk;
  });
}

/* ---------- Templates ---------- */
function slideTemplate(item){
  return `
  <section class="slide" data-id="${item.id}">
    <blockquote class="tiktok-embed"
                cite="${item.tiktokUrl}"
                style="max-width: 605px; min-width: 325px;">
      <section></section>
    </blockquote>

    <div class="info">
      <div class="meta">
        <strong>${item.restaurant}</strong> • ${item.city}
        <div>${item.title} · ${item.creator}</div>
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
  if (cityBadge && citySelect) cityBadge.textContent = `${citySelect.value} • NomReel`;

  feedEl.innerHTML = list.map(slideTemplate).join("");
  loadTikTokEmbeds();

  // Share buttons
  feedEl.querySelectorAll('button[data-action="share"]').forEach(btn=>{
    btn.addEventListener("click", ()=>shareClip({ title:"NomReel", url: btn.dataset.url }));
  });

  // Snap Assist: ensure we end exactly on a slide after scrolling stops
  snapAssist(feedEl);
}

/* Snap to nearest slide after user stops scrolling */
function snapAssist(container){
  let snapTimer = null;

  const doSnap = ()=>{
    const slides = [...container.querySelectorAll(".slide")];
    if (!slides.length) return;

    const viewportH = container.clientHeight || window.innerHeight;
    const scrollTop = container.scrollTop;

    // Find nearest slide by center distance
    let best = { el:null, dist: Infinity };
    slides.forEach(slide=>{
      const top = slide.offsetTop;
      const dist = Math.abs(top - scrollTop);
      if (dist < best.dist) best = { el: slide, dist };
    });
    if (best.el){
      best.el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onScroll = ()=>{
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(doSnap, 90); // small delay after scroll stops
  };

  container.removeEventListener("scroll", onScroll, { passive:true });
  container.addEventListener("scroll", onScroll, { passive:true });

  // Also snap on touchend to feel tighter on phones
  container.addEventListener("touchend", ()=>{ setTimeout(doSnap, 30); }, { passive:true });
}

/* ---------- Events ---------- */
citySelect?.addEventListener("change", render);
searchBtn?.addEventListener("click", render);
queryInput?.addEventListener("keydown", (e)=>{ if (e.key === "Enter") render(); });

/* ---------- Init ---------- */
loadData();
