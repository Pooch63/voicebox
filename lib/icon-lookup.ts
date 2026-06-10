import pluralize from 'pluralize';

let iconMap: Record<string, string> | null = null;
let mapFetchPromise: Promise<void> | null = null;

const clientCache = new Map<string, string>();

function normalizeKeyword(word: string): string {
  let clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  try {
    clean = pluralize.singular(clean);
  } catch (e) {
    // Ignore pluralize errors
  }
  return clean;
}

async function loadIconMap() {
  if (iconMap) return;
  if (mapFetchPromise) {
    await mapFetchPromise;
    return;
  }
  
  mapFetchPromise = fetch('/icon-map.json')
    .then(res => res.json())
    .then(data => {
      iconMap = data;
    })
    .catch(err => {
      console.error('Failed to load icon-map.json:', err);
      iconMap = {};
    });
    
  await mapFetchPromise;
}

export async function getIconUrl(keyword: string): Promise<string> {
  const normalized = normalizeKeyword(keyword);
  
  // 1. Client-side memory cache (instant lookup)
  if (clientCache.has(normalized)) {
    return clientCache.get(normalized)!;
  }
  
  // 2. Tier 1: Local Static Assets
  await loadIconMap();
  
  if (iconMap && iconMap[normalized]) {
    const url = iconMap[normalized];
    clientCache.set(normalized, url);
    return url;
  }
  
  // Try without pluralization if singular miss
  const cleanOriginal = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (iconMap && iconMap[cleanOriginal]) {
    const url = iconMap[cleanOriginal];
    clientCache.set(normalized, url);
    return url;
  }

  // 3. Tier 2 & Tier 3: Iconify API (Server-side)
  try {
    const res = await fetch(`/api/icon?q=${encodeURIComponent(keyword)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        clientCache.set(normalized, data.url);
        return data.url;
      }
    }
  } catch (error) {
    console.error('Error fetching icon from API:', error);
  }
  
  // Fallback (handled by server, but if server fails completely, return empty string)
  return '';
}
