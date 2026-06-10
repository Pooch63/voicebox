import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getIconData, iconToSVG } from '@iconify/utils';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const MAP_FILE = path.join(PUBLIC_DIR, 'icon-map.json');

// Ensure output directories exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

function normalizeKeyword(word) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function processIconSet(prefix) {
  console.log(`Processing icon set: ${prefix}`);
  const pkgPath = path.dirname(require.resolve(`@iconify-json/${prefix}/package.json`));
  const iconSetPath = path.join(pkgPath, 'icons.json');
  
  const iconSet = JSON.parse(fs.readFileSync(iconSetPath, 'utf8'));
  const outDir = path.join(ICONS_DIR, prefix);
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const keywordMap = {};

  // Process all icons
  const processEntry = (name, data) => {
    // Generate SVG string
    const renderData = iconToSVG(data);
    const svgAttributes = Object.keys(renderData.attributes)
      .map((key) => `${key}="${renderData.attributes[key]}"`)
      .join(' ');
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" ${svgAttributes}>${renderData.body}</svg>`;

    // Save SVG file
    const filename = `${name}.svg`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, svgStr);

    // Map normalized name
    const normalized = normalizeKeyword(name);
    keywordMap[normalized] = `/icons/${prefix}/${filename}`;
  };

  const icons = Object.keys(iconSet.icons);
  for (const name of icons) {
    const data = getIconData(iconSet, name);
    if (data) {
      processEntry(name, data);
    }
  }

  // Handle aliases
  if (iconSet.aliases) {
    for (const alias of Object.keys(iconSet.aliases)) {
      const parent = iconSet.aliases[alias].parent;
      if (parent) {
        const normalizedAlias = normalizeKeyword(alias);
        keywordMap[normalizedAlias] = `/icons/${prefix}/${parent}.svg`;
      }
    }
  }

  return keywordMap;
}

async function main() {
  console.log('Building icon assets...');
  
  // Twemoji has priority, then OpenMoji
  const openmojiMap = await processIconSet('openmoji');
  const twemojiMap = await processIconSet('twemoji');
  
  // Custom manual mappings to ensure very common words work perfectly
  const manualOverrides = {
    'yes': twemojiMap['thumbsup'] || openmojiMap['thumbsup'],
    'no': twemojiMap['thumbsdown'] || openmojiMap['thumbsdown'],
    'help': twemojiMap['sosbutton'] || openmojiMap['sosbutton'],
    'water': twemojiMap['potablewater'] || openmojiMap['potablewater'] || twemojiMap['droplet'],
    'food': twemojiMap['hamburger'] || openmojiMap['hamburger'] || twemojiMap['forkandknife'],
    'eat': twemojiMap['forkandknife'] || openmojiMap['forkandknife'],
    'toilet': twemojiMap['toilet'] || openmojiMap['toilet'] || twemojiMap['restroom'],
    'restroom': twemojiMap['restroom'] || openmojiMap['restroom'],
    'sleep': twemojiMap['sleepingface'] || openmojiMap['sleepingface'] || twemojiMap['bed'],
    'pain': twemojiMap['facebandaged'] || openmojiMap['facebandaged'] || twemojiMap['syringe'],
    'sad': twemojiMap['sadbutrelievedface'] || openmojiMap['sadbutrelievedface'],
    'happy': twemojiMap['grinningface'] || openmojiMap['grinningface'],
  };

  const finalMap = {
    ...openmojiMap,
    ...twemojiMap, // Twemoji overwrites OpenMoji
  };

  // Apply overrides
  for (const [key, val] of Object.entries(manualOverrides)) {
    if (val) {
      finalMap[normalizeKeyword(key)] = val;
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(finalMap, null, 2));
  console.log(`Icon map generated with ${Object.keys(finalMap).length} entries at ${MAP_FILE}`);
}

main().catch(console.error);
