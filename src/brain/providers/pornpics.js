import { ProviderEndpoint } from './manifest.js';
import { mediaResult } from './media-result.js';
import { MediaProviderError, providerError } from './errors.js';
import { randomInteger } from '../../lib/random.js';

const PROVIDER = 'pornpics.com';
const FEED_HOST = 'pornpics.com';
const MEDIA_HOST = 'cdni.pornpics.com';
const INITIAL_GALLERY_COUNT = 20;
const GALLERY_LIMIT = 1_000;
const MAXIMUM_FEED_BYTES = 2 * 1024 * 1024;

const HTML_HEADERS = Object.freeze({
  Accept: 'text/html,application/xhtml+xml',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
});

const JSON_HEADERS = Object.freeze({
  Accept: 'application/json',
  'User-Agent': HTML_HEADERS['User-Agent'],
  'X-Requested-With': 'XMLHttpRequest',
});

const defaultDependencies = Object.freeze({ randomInteger });

function codePoint(value, radix) {
  const parsed = Number.parseInt(value, radix);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0x10ffff) return '';
  return String.fromCodePoint(parsed);
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);?/gi, (_match, number) => codePoint(number, 16))
    .replace(/&#(\d+);?/g, (_match, number) => codePoint(number, 10))
    .replace(/&(amp|quot|apos|lt|gt);/gi, (_match, name) => ({
      amp: '&',
      quot: '"',
      apos: "'",
      lt: '<',
      gt: '>',
    })[name.toLowerCase()]);
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(tag).match(new RegExp(
    `\\s${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ));
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? '');
}

function httpsUrl(value, baseUrl) {
  try {
    const normalized = decodeHtml(value).replace(/\\\//g, '/').trim();
    const url = new URL(normalized.startsWith('//') ? `https:${normalized}` : normalized, baseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function galleryUrl(value, baseUrl = ProviderEndpoint.PORNPICS_BUTT_PLUG) {
  const url = httpsUrl(value, baseUrl);
  if (!url || !['pornpics.com', 'www.pornpics.com'].includes(url.hostname)) return null;
  return url.pathname.startsWith('/galleries/') ? url.toString() : null;
}

export function pornPicsHighResolutionUrl(value) {
  const url = httpsUrl(value, ProviderEndpoint.PORNPICS_BUTT_PLUG);
  if (!url || url.hostname !== MEDIA_HOST) return null;
  const match = url.pathname.match(/^\/(?:300|460|1280)(\/[^?#]+\.(?:jpe?g|webp))$/i);
  if (!match) return null;
  url.pathname = `/1280${match[1]}`;
  return url.toString();
}

function imageElementCandidates(block) {
  const candidates = [];
  for (const match of String(block).matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    for (const name of ['data-original', 'data-full', 'data-src', 'data-lazy-src', 'src']) {
      const value = attribute(tag, name);
      if (value) candidates.push(value);
    }
    const srcset = attribute(tag, 'data-srcset') || attribute(tag, 'srcset');
    for (const entry of srcset.split(',')) {
      const value = entry.trim().split(/\s+/, 1)[0];
      if (value) candidates.push(value);
    }
  }
  return candidates;
}

export function extractPornPicsGalleryThumbnails(html, pageUrl = ProviderEndpoint.PORNPICS_BUTT_PLUG) {
  const items = [];
  const seen = new Set();
  for (const match of String(html).matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    const block = match[0];
    const openingTag = block.match(/^<a\b[^>]*>/i)?.[0] ?? '';
    const watchUrl = galleryUrl(attribute(openingTag, 'href'), pageUrl);
    if (!watchUrl || seen.has(watchUrl)) continue;
    const url = imageElementCandidates(block)
      .map((value) => pornPicsHighResolutionUrl(value))
      .find(Boolean);
    if (!url) continue;
    seen.add(watchUrl);
    items.push({ url, watchUrl });
  }
  return items;
}

function itemFromOffsetPayload(payload) {
  if (!Array.isArray(payload) || !payload[0] || typeof payload[0] !== 'object') {
    throw new MediaProviderError('PornPics offset feed did not contain a gallery.', {
      code: 'INVALID_RESPONSE',
    });
  }
  const item = payload[0];
  const url = pornPicsHighResolutionUrl(item.t_url_460 || item.t_url);
  if (!url) {
    throw new MediaProviderError('PornPics offset feed did not contain a valid gallery thumbnail.', {
      code: 'INVALID_RESPONSE',
    });
  }
  return {
    id: item.gid ?? item.mid ?? null,
    url,
    watchUrl: galleryUrl(item.g_url) ?? ProviderEndpoint.PORNPICS_BUTT_PLUG,
  };
}

function parseOffsetPayload(body) {
  try {
    return JSON.parse(body);
  } catch (cause) {
    throw new MediaProviderError('PornPics offset feed returned invalid JSON.', {
      code: 'INVALID_RESPONSE',
      cause,
    });
  }
}

function requestOptions(headers, query) {
  return {
    headers,
    allowedHosts: [FEED_HOST],
    maximumBytes: MAXIMUM_FEED_BYTES,
    ...(query ? { query } : {}),
  };
}

export async function fetchPornPics(_source, context, dependencies = defaultDependencies) {
  try {
    const randomIndex = dependencies.randomInteger(0, GALLERY_LIMIT - 1);
    let item;
    if (randomIndex < INITIAL_GALLERY_COUNT) {
      const html = await context.http.text(
        ProviderEndpoint.PORNPICS_BUTT_PLUG,
        requestOptions(HTML_HEADERS),
      );
      item = extractPornPicsGalleryThumbnails(html)[randomIndex];
      if (!item) {
        throw new MediaProviderError('PornPics category page did not contain the selected gallery thumbnail.', {
          code: 'INVALID_RESPONSE',
        });
      }
    } else {
      const body = await context.http.text(
        ProviderEndpoint.PORNPICS_BUTT_PLUG,
        requestOptions(JSON_HEADERS, { offset: randomIndex }),
      );
      item = itemFromOffsetPayload(parseOffsetPayload(body));
    }
    return mediaResult({
      provider: PROVIDER,
      id: item.id === null || item.id === undefined ? String(randomIndex) : String(item.id),
      url: item.url,
      watchUrl: item.watchUrl,
    });
  } catch (error) {
    throw providerError(error, PROVIDER);
  }
}

export {
  GALLERY_LIMIT,
  INITIAL_GALLERY_COUNT,
  MAXIMUM_FEED_BYTES,
};
