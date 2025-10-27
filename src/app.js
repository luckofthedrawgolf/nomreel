import { mapsUrl, orderUrl, reserveUrl, shareClip } from "./utils.js";

const feedEl = document.getElementById("feed");
const citySelect = document.getElementById("citySelect");
const queryInput = document.getElementById("queryInput");
const searchBtn = document.getElementById("searchBtn");
document.getElementById("year").textContent = new Date().getFullYear();

let allClips = [];

async function loadData() {
  const res = await fetch("/data/videos.json", { cache: "no-store" });
  allClips = await res.json();
  render();
}

function filtered() {
  const city = citySelect.value.trim();
  const q = queryInput.value.trim().toLowerCase();
  return allClips.filter(item => {
    const cityOk = !city || item.city === city;
    const qOk = !q || [item.title, item.restaurant, ...(item.tags||[])].join(" ").toLowerCase().includes(q);
    return cityOk && qOk;
  });
}

function cardTemplate(item) {
  // TikTok oEmbed iframe: use a blockquote + script loader
  // We’ll place a placeholder container; TikTok’s script upgrades it.
  return `
    <article class="card" data-id="${item.id}">
      <blockquote class="tiktok-embed" cite="${item.tiktokUrl}" data-video-id="" style="max-width: 605px; min-width: 325px; margin: 0 auto;">
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

function render() {
  const list = filtered();
  const titleCity = citySelect.value || "Feed";
  feedEl.querySelector(".feed-title").textContent = `${titleCity} Feed`;

  const html = list.map(cardTemplate).join("");
  // replace everything after the title
  const nodesToRemove = Array.from(feedEl.children).slice(1);
  nodesToRemove.forEach(n => n.remove());

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  feedEl.appendChild(wrapper);

  // Re-run TikTok embed script to upgrade blockquotes
  if (window.tiktokEmbedLoaded) {
    window.tiktokEmbedLoaded();
  } else if (window.tiktok) {
    window.tiktok?.loadEmbeds?.();
  }

  // Hook up share buttons
  wrapper.querySelectorAll('button[data-action="share"]').forEach(btn => {
    btn.addEventListener("click", () => shareClip({ title: "NomReel", url: btn.dataset.url }));
  });
}

citySelect.addEventListener("change", render);
searchBtn.addEventListener("click", render);
queryInput.addEventListener("keydown", (e) => { if (e.key === "Enter") render(); });

loadData();

