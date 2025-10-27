// src/app.js
import { mapsUrl, orderUrl, reserveUrl, shareClip } from "./utils.js";

const feedEl     = document.getElementById("feed");
const citySelect = document.getElementById("citySelect");
const queryInput = document.getElementById("queryInput");
const searchBtn  = document.getElementById("searchBtn");
const yearEl     = document.getElementById("year");
const cityBadge  = document.getElementById("cityBadge");

if (yearEl) yearEl.textContent = new Date().getFullYear();

let allClips = [];

/* ---- robust loader for TikTok embeds ---- */
function loadTikTokEmbeds(retry = 0){
  try{
    if (window.tiktok && typeof window.tiktok.loadEmbeds === "function"){
      window.tiktok.loadEmbeds();
      return;
    }
  }catch(_){}
  if (retry < 12) setTimeout(()=>loadTikTokEmbeds(retry+1), 250);
}

/* ---- data ---- */
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

/* ---- render ---- */
function cardTemplate(item){
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
            <div style="color:#b3b3b3;font-size:14px;">${item.title} · ${item.creator}</div>
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

function render(){
  const list = filtered();

  if (cityBadge && citySelect) cityBadge.textContent = `${citySelect.value} • NomReel`;

  feedEl.innerHTML = list.map(cardTemplate).join("");

  loadTikTokEmbeds(); // upgrade blockquotes

  // Share buttons
  feedEl.querySelectorAll('button[data-action="share"]').forEach(btn=>{
    btn.addEventListener("click", ()=>shareClip({ title:"NomReel", url: btn.dataset.url }));
  });

  setupIntersectionControls();
}

/* ---- intersection (slot for future play/pause) ---- */
function setupIntersectionControls(){
  const root = feedEl;
  const slides = [...root.querySelectorAll(".card.snap-slide")];
  if (!slides.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        loadTikTokEmbeds();
      }
    });
  }, { root, threshold: 0.6 });

  slides.forEach(s=>io.observe(s));
}

/* ---- events ---- */
citySelect?.addEventListener("change", render);
searchBtn?.addEventListener("click", render);
queryInput?.addEventListener("keydown", (e)=>{ if (e.key === "Enter") render(); });

/* ---- init ---- */
loadData();
