/**
 * Enrich items.json with correct Wikipedia thumbnail image URLs.
 *
 * For every entry in src/data/items.json the Wikipedia REST API endpoint
 *   GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}
 * is called.  The `thumbnail.source` field from the response replaces the
 * existing (manually-guessed) `image` value.
 *
 * Usage:
 *   node scripts/enrich-items.mjs
 *
 * Requires Node 18+ (built-in fetch).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ITEMS_PATH = join(__dirname, '../src/data/items.json');

/** Milliseconds to wait between requests so we are polite to the Wikipedia API. */
const RATE_LIMIT_MS = 200;

const USER_AGENT =
  'Daily-Timeline/1.0 (https://github.com/jespervnielsen/Daily-Timeline; enrichment-script)';

/**
 * Fetch the thumbnail image URL for a Wikipedia article.
 *
 * @param {string} wikipediaUrl  e.g. "https://en.wikipedia.org/wiki/Stonehenge"
 * @returns {Promise<string|null>}  The thumbnail URL, or null when not found.
 */
async function fetchWikipediaImage(wikipediaUrl) {
  const wikiPath = wikipediaUrl.split('/wiki/')[1];
  if (wikiPath === undefined) {
    console.warn(`  Could not parse title from URL: ${wikipediaUrl}`);
    return null;
  }

  const title = decodeURIComponent(wikiPath);
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      console.warn(`  HTTP ${response.status} for ${apiUrl}`);
      return null;
    }

    const data = await response.json();
    return data?.thumbnail?.source ?? null;
  } catch (err) {
    console.warn(`  Fetch error for ${apiUrl}: ${err.message}`);
    return null;
  }
}

/** Simple promise-based sleep. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const items = JSON.parse(readFileSync(ITEMS_PATH, 'utf-8'));
  console.log(`Enriching ${items.length} items…\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    process.stdout.write(`[${item.id}] Fetching image… `);

    const imageUrl = await fetchWikipediaImage(item.wikipedia);

    if (imageUrl) {
      item.image = imageUrl;
      console.log('✓');
      updated++;
    } else {
      console.log('– kept existing');
      skipped++;
    }

    if (i < items.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2) + '\n');

  console.log(`\nDone. Updated: ${updated}, Kept existing: ${skipped}`);
  console.log(`Saved to ${ITEMS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
