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
