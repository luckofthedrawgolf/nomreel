export function mapsUrl(restaurant, city){
  const q = encodeURIComponent(`${restaurant} ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
export function orderUrl(restaurant, city){
  const q = encodeURIComponent(`${restaurant} ${city} order online`);
  return `https://www.google.com/search?q=${q}`;
}
export function reserveUrl(restaurant, city){
  const q = encodeURIComponent(`${restaurant} ${city} reservations OpenTable`);
  return `https://www.google.com/search?q=${q}`;
}
export function shareClip({ title, url }){
  if(navigator.share){ return navigator.share({ title, url }).catch(()=>{}); }
  navigator.clipboard.writeText(url).catch(()=>{});
  alert("Link copied.");
}
// --- TikTok helpers (minimal, no global scripts) ---
export function tiktokIdFromUrl(url) {
  // Accepts any TikTok link that contains /video/<digits>
  // Examples:
  //  https://www.tiktok.com/@user/video/7469144267508780330
  //  https://www.tiktok.com/@user/video/7469144267508780330?is_from_webapp=1
  const m = String(url).match(/video\/(\d{10,})/);
  return m ? m[1] : null;
}

export function tiktokIframeHtml(id) {
  // Full-bleed, sandboxed player—no embed.js, no layout side-effects
  return `
    <div style="position:relative;width:100%;height:100%;">
      <iframe
        src="https://www.tiktok.com/embed/v2/${id}"
        style="position:absolute;inset:0;width:100%;height:100%;border:0;"
        allow="encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen
        scrolling="no"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  `;
}
