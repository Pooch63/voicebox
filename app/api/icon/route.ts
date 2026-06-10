import { NextResponse } from 'next/server';

class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxLimit: number;

  constructor(maxLimit: number = 100) {
    this.cache = new Map<K, V>();
    this.maxLimit = maxLimit;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxLimit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
}

interface CacheEntry {
  url: string;
  source: string;
}

const globalForCache = global as unknown as {
  iconLruCache?: LRUCache<string, CacheEntry>;
};

const iconLruCache = globalForCache.iconLruCache ?? new LRUCache<string, CacheEntry>(500);

if (process.env.NODE_ENV !== 'production') {
  globalForCache.iconLruCache = iconLruCache;
}

function generateSvgFallback(word: string): string {
  const cleanWord = word.toUpperCase();
  const escapedWord = cleanWord
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  let hash = 0;
  for (let i = 0; i < cleanWord.length; i++) {
    hash = cleanWord.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  const color = `hsl(${hue}, 70%, 80%)`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="100%" height="100%" fill="${color}" rx="20"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#374151">
      ${escapedWord}
    </text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function removeEmojis(text: string): string {
  // Remove all emoji characters using Unicode ranges
  // This covers:
  // - Emoticons (U+1F600-U+1F64F)
  // - Symbols & Pictographs (U+1F300-U+1F5FF)
  // - Transport & Map Symbols (U+1F680-U+1F6FF)
  // - Flags (U+1F1E0-U+1F1FF)
  // - Supplemental Symbols (U+1F900-U+1F9FF)
  // - Misc Symbols (U+2600-U+26FF)
  // - Dingbats (U+2700-U+27BF)
  // - Enclosed Characters (U+2460-U+24FF)
  // - Geometric Shapes (U+25A0-U+25FF)
  // - Misc Technical (U+2300-U+23FF)
  // - Variation Selectors (U+FE00-U+FE0F)
  // - Zero Width Joiner (U+200D)
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{2460}-\u{24FF}]/gu, '')   // Enclosed Characters
    .replace(/[\u{25A0}-\u{25FF}]/gu, '')   // Geometric Shapes
    .replace(/[\u{2300}-\u{23FF}]/gu, '')   // Misc Technical
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/\u{200D}/gu, '')              // Zero Width Joiner
    .trim();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const keyword = url.searchParams.get('q') || '';
    const scrubbedKeyword = removeEmojis(keyword);
    const cleanWord = scrubbedKeyword.toLowerCase().trim();

    if (!cleanWord) {
      return NextResponse.json(
        { url: generateSvgFallback('ICON'), source: 'fallback' },
        { headers: { 'Cache-Control': 'public, max-age=60, must-revalidate' } }
      );
    }

    const cachedEntry = iconLruCache.get(cleanWord);
    if (cachedEntry) {
      return NextResponse.json(cachedEntry, {
        headers: { 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // Tier 2: Iconify Noto
    try {
      const notoRes = await fetch(`https://api.iconify.design/noto/${encodeURIComponent(cleanWord)}.svg`);
      if (notoRes.ok) {
        const iconUrl = `https://api.iconify.design/noto/${encodeURIComponent(cleanWord)}.svg`;
        const result = { url: iconUrl, source: 'noto' };
        iconLruCache.set(cleanWord, result);
        return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=86400' } });
      }
    } catch (e) {
      console.warn('Noto fetch failed:', e);
    }

    // Tier 3: Iconify General Search
    try {
      const searchRes = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(cleanWord)}&limit=1`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.icons && searchData.icons.length > 0) {
          const iconName = searchData.icons[0];
          let prefix, name;
          if (iconName.includes(':')) {
             [prefix, name] = iconName.split(':');
          } else if (iconName.includes('-')) {
             // Some icons might be prefix-name, but typically Iconify Search returns prefix:name
             const parts = iconName.split('-');
             prefix = parts[0];
             name = parts.slice(1).join('-');
          } else {
             prefix = '';
             name = iconName;
          }
          
          if (prefix && name) {
            const iconUrl = `https://api.iconify.design/${prefix}/${name}.svg`;
            const result = { url: iconUrl, source: 'iconify' };
            iconLruCache.set(cleanWord, result);
            return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=86400' } });
          }
        }
      }
    } catch (e) {
      console.warn('Iconify search failed:', e);
    }

    // Fallback
    const fallbackUrl = generateSvgFallback(cleanWord);
    const result = { url: fallbackUrl, source: 'fallback' };
    iconLruCache.set(cleanWord, result);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, max-age=86400' } });
    
  } catch (error) {
    console.error('Error in /api/icon:', error);
    return NextResponse.json(
      { url: generateSvgFallback('ERROR'), source: 'fallback' },
      { headers: { 'Cache-Control': 'no-cache' } }
    );
  }
}
