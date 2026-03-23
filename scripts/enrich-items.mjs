/**
 * Enrich items.json with correct Wikimedia Commons thumbnail image URLs.
 *
 * Strategy per item:
 *  1. If the item already has a Wikimedia Commons image URL, extract the
 *     filename and query the Wikimedia Commons API
 *       GET https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo
 *               &iiprop=url&iiurlwidth=320
 *     to obtain a verified thumbnail at exactly TARGET_WIDTH pixels.
 *  2. Fall back to the Wikipedia REST API (page/summary) which returns the
 *     article's representative thumbnail.  Only Commons-hosted thumbnails
 *     are accepted from this source; non-free /wikipedia/en/ images are
 *     skipped to avoid broken hotlinks.
 *  3. Keep the existing image URL when neither source yields a result.
 *  4. Validate the final URL with an HTTP HEAD request.  Items whose URL
 *     returns a non-2xx response are flagged with `"image_broken": true`
 *     in items.json so that broken images are easy to spot and count.
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

/** Target thumbnail width used when normalising URLs fetched from the API.
 *  320 px is a valid Wikimedia thumbnail step.
 *  See https://www.mediawiki.org/wiki/Common_thumbnail_sizes
 */
const TARGET_WIDTH = 320;

/**
 * Replace the width encoded in a Wikimedia thumbnail URL with `targetWidth`.
 * Handles the common pattern:
 *   …/thumb/a/ab/Filename.jpg/{width}px-Filename.jpg
 * as well as lossy TIFF variants:
 *   …/thumb/a/ab/Filename.tiff/lossy-page1-{width}px-Filename.tiff.jpg
 *
 * Returns the original URL unchanged when the pattern is not recognised.
 *
 * @param {string} url
 * @param {number} targetWidth
 * @returns {string}
 */
function normaliseThumbWidth(url, targetWidth = TARGET_WIDTH) {
  return url.replace(/(\/(?:lossy-page\d+-)?)\d+(px-)/g, `$1${targetWidth}$2`);
}

const USER_AGENT =
  'Daily-Timeline/1.0 (https://github.com/jespervnielsen/Daily-Timeline; enrichment-script)';

/**
 * Extract a Wikimedia Commons filename from a Wikimedia upload URL.
 *
 * Handles both thumbnail and full-resolution URLs in the /wikipedia/commons/
 * namespace:
 *   …/wikipedia/commons/thumb/a/ab/Filename.ext/{width}px-Filename.ext
 *   …/wikipedia/commons/a/ab/Filename.ext
 *
 * Returns null for /wikipedia/en/ or other non-Commons URLs.
 *
 * @param {string|undefined} imageUrl
 * @returns {string|null}
 */
function extractCommonsFilename(imageUrl) {
  if (!imageUrl) return null;
  const match = imageUrl.match(
    /\/wikipedia\/commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/([^/]+)/,
  );
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

/**
 * Fetch a thumbnail URL from the Wikimedia Commons API for a given filename.
 *
 * Calls:
 *   GET https://commons.wikimedia.org/w/api.php?action=query
 *           &titles=File:{filename}&prop=imageinfo&iiprop=url
 *           &iiurlwidth={TARGET_WIDTH}&format=json
 *
 * When iiurlwidth is provided the API returns `thumburl` in the imageinfo
 * object; this is preferred over the full-resolution `url`.  Falls back to
 * normalising the full-resolution URL to the target width when `thumburl` is
 * absent (e.g. for images smaller than TARGET_WIDTH).
 *
 * @param {string} filename  e.g. "Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg"
 * @returns {Promise<string|null>}
 */
async function fetchCommonsImage(filename) {
  const apiUrl =
    `https://commons.wikimedia.org/w/api.php` +
    `?action=query` +
    `&titles=File:${encodeURIComponent(filename)}` +
    `&prop=imageinfo` +
    `&iiprop=url` +
    `&iiurlwidth=${TARGET_WIDTH}` +
    `&format=json` +
    `&origin=*`;

  try {
    const response = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) {
      console.warn(`  Commons HTTP ${response.status} for "${filename}"`);
      return null;
    }
    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (!page || 'missing' in page) {
      console.warn(`  Commons: file not found – "${filename}"`);
      return null;
    }
    const info = page.imageinfo?.[0];
    if (!info) return null;
    // Prefer the thumbnail URL supplied when iiurlwidth is requested.
    // Fall back to normalising the full-resolution URL to TARGET_WIDTH.
    return info.thumburl ?? normaliseThumbWidth(info.url);
  } catch (err) {
    console.warn(`  Commons fetch error for "${filename}": ${err.message}`);
    return null;
  }
}

/**
 * Fetch the thumbnail image URL for a Wikipedia article.
 *
 * Only returns URLs hosted on Wikimedia Commons; non-free /wikipedia/en/
 * images are skipped to avoid broken hotlinks.
 *
 * @param {string} wikipediaUrl  e.g. "https://en.wikipedia.org/wiki/Stonehenge"
 * @returns {Promise<string|null>}  A Commons thumbnail URL, or null.
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
    const source = data?.thumbnail?.source ?? null;
    if (!source) return null;

    // Only accept images hosted on Wikimedia Commons.  Articles about
    // copyrighted works (films, logos, etc.) may return fair-use images
    // from /wikipedia/en/ which cannot be reliably hotlinked.
    if (!source.includes('/wikipedia/commons/')) return null;

    return normaliseThumbWidth(source);
  } catch (err) {
    console.warn(`  Fetch error for ${apiUrl}: ${err.message}`);
    return null;
  }
}

/** Simple promise-based sleep. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate that an image URL is accessible via an HTTP HEAD request.
 *
 * Returns true when the server responds with a 2xx status code.
 *
 * @param {string|undefined} url
 * @returns {Promise<boolean>}
 */
async function validateImageUrl(url) {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
    });
    return response.ok;
  } catch (err) {
    console.warn(`  Image validation error for "${url}": ${err.message}`);
    return false;
  }
}

async function main() {
  const items = JSON.parse(readFileSync(ITEMS_PATH, 'utf-8'));
  console.log(`Enriching ${items.length} items…\n`);

  let updated = 0;
  let skipped = 0;
  let broken = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    process.stdout.write(`[${item.id}] Fetching image… `);

    let imageUrl = null;

    // 1. Try the Wikimedia Commons API using the filename extracted from the
    //    existing image URL (most reliable when the item already has a valid
    //    Commons image that just needs its URL verified / resized).
    const commonsFilename = extractCommonsFilename(item.image);
    if (commonsFilename) {
      imageUrl = await fetchCommonsImage(commonsFilename);
    }

    // 2. Fall back to the Wikipedia REST API (Commons images only).
    if (!imageUrl) {
      imageUrl = await fetchWikipediaImage(item.wikipedia);
    }

    if (imageUrl) {
      item.image = imageUrl;
      updated++;
    } else {
      skipped++;
    }

    // 4. Validate the final image URL with an HTTP HEAD request.
    const isValid = await validateImageUrl(item.image);
    if (isValid) {
      delete item.image_broken;
      console.log(imageUrl ? '✓' : '– kept existing');
    } else {
      item.image_broken = true;
      broken++;
      console.log(imageUrl ? '✗ saved but URL is broken!' : '✗ existing URL is broken');
    }

    if (i < items.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2) + '\n');

  console.log(`\nDone. Updated: ${updated}, Kept existing: ${skipped}, Broken: ${broken}`);
  if (broken > 0) {
    console.log(
      `\n⚠️  ${broken} item(s) have broken image URLs (marked with "image_broken": true in items.json).`,
    );
    const brokenIds = items.filter((item) => item.image_broken).map((item) => item.id);
    console.log(`   Broken IDs: ${brokenIds.join(', ')}`);
  }
  console.log(`Saved to ${ITEMS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
