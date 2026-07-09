const { client, timeoutResult } = require('./http');
const logger = require('../utils/logger');

const MAX_ATTACHMENT_BYTES = Number(process.env.MAX_ATTACHMENT_BYTES || 8 * 1024 * 1024);
const MIN_ATTACHMENT_BYTES = 1024;

function ok(data) { return data?.url || data?.buffer ? data : null; }
function normalizeError(provider, error) {
  if (timeoutResult(error)) return { error: 'TIMEOUT', provider };
  logger.warn(`${provider} failed: ${error.message}`);
  return null;
}
async function fetchPurrbot({ path }) {
  try { const { data } = await client.get(`https://purrbot.site/api/img/nsfw/${path}`); return ok({ url: data?.link, provider: 'purrbot' }); } catch (e) { return normalizeError('purrbot', e); }
}
async function fetchABD({ tag }) {
  try {
    const { data } = await client.get(`https://api.n-sfw.com/nsfw/${tag}`);
    const url = data?.url || data?.message || data?.image;
    return ok({ url, provider: 'abd' });
  } catch (e) { return normalizeError('abd', e); }
}
async function fetchWaifuPics({ category }) {
  if (process.env.WAIFU_PICS === 'false') return null;
  try { const { data } = await client.get(`https://api.waifu.pics/nsfw/${category}`); return ok({ url: data?.url, provider: 'waifuPics' }); } catch (e) { return normalizeError('waifuPics', e); }
}
async function fetchWaifuIm({ tag }) {
  if (!process.env.WAIFU_IM_KEY) return null;
  try {
    const { data } = await client.get('https://api.waifu.im/images', {
      params: { included_tags: tag, is_nsfw: 'true' },
      headers: { Authorization: `ApiKey ${process.env.WAIFU_IM_KEY}`, 'Accept-Version': 'v7' }
    });
    return ok({ url: data?.images?.[0]?.url || data?.items?.[0]?.url, provider: 'waifuIm' });
  } catch (e) { return normalizeError('waifuIm', e); }
}
async function fetchNekoBot({ type }) {
  try {
    const headers = process.env.NEKOBOT_AUTH ? { Authorization: process.env.NEKOBOT_AUTH } : undefined;
    const { data } = await client.get('https://nekobot.xyz/api/image', { params: { type }, headers });
    return ok({ url: data?.message, provider: 'nekobot' });
  } catch (e) { return normalizeError('nekobot', e); }
}
async function fetchNekosV4({ tags = [] }) {
  try {
    const { data } = await client.get('https://api.nekosapi.com/v4/images/random', { params: { limit: 1, rating: 'explicit,suggestive', tags: tags.join(',') } });
    const image = Array.isArray(data) ? data[0] : data?.items?.[0] || data?.images?.[0];
    return ok({ url: image?.url || image?.image_url, provider: 'nekosV4' });
  } catch (e) { return normalizeError('nekosV4', e); }
}
async function fetchOboobs() {
  try { const { data } = await client.get('http://api.oboobs.ru/boobs/0/1/random/'); const item = data?.[0]; return ok({ id: item?.id, url: item?.preview && `http://media.oboobs.ru/${item.preview}`, provider: 'oboobs' }); } catch (e) { return normalizeError('oboobs', e); }
}
async function fetchObutts() {
  try { const { data } = await client.get('http://api.obutts.ru/butts/0/1/random/'); const item = data?.[0]; return ok({ id: item?.id, url: item?.preview && `http://media.obutts.ru/${item.preview}`, provider: 'obutts' }); } catch (e) { return normalizeError('obutts', e); }
}
async function fetchSexcom({ category }) {
  const encoded = encodeURIComponent(category || 'Hardcore');
  return ok({ url: `https://www.sex.com/gifs/${encoded}/`, provider: 'sexcom' });
}
async function fetchPorngifs() {
  const id = Math.floor(Math.random() * 9000000) + 1000000;
  return ok({ url: `https://cdn.porngifs.com/img/${id}`, provider: 'porngifs' });
}
async function fetchPorngifsTv() {
  try {
    const page = Math.floor(Math.random() * 2603) + 1;
    const { data } = await client.get('https://porngifs.tv/', { params: { action: 'ajax', mode: 'async', function: 'get_block', block_id: 'list_videos_most_recent_videos', sort_by: 'post_date', from: page }, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    const matches = [...String(data).matchAll(/data-webp="([^\"]+\.(?:webp|gif))"/g)];
    const url = matches.length ? matches[Math.floor(Math.random() * matches.length)][1] : null;
    if (!url) return null;
    const media = await client.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(media.data);
    if (buffer.length < MIN_ATTACHMENT_BYTES || buffer.length > MAX_ATTACHMENT_BYTES) return null;
    return ok({ url, buffer, filename: url.endsWith('.gif') ? 'media.gif' : 'media.webp', provider: 'porngifsTv' });
  } catch (e) { return normalizeError('porngifsTv', e); }
}

const providers = { purrbot: fetchPurrbot, abd: fetchABD, waifuPics: fetchWaifuPics, waifuIm: fetchWaifuIm, nekobot: fetchNekoBot, nekosV4: fetchNekosV4, oboobs: fetchOboobs, obutts: fetchObutts, sexcom: fetchSexcom, porngifs: fetchPorngifs, porngifsTv: fetchPorngifsTv };
async function fetchFromSource(source) { const fn = providers[source.provider]; if (!fn) throw new Error(`Unknown provider: ${source.provider}`); return fn(source); }
async function fetchWithFallback(sources) {
  const shuffled = [...sources].sort(() => Math.random() - 0.5);
  let timeout = false;
  for (const source of shuffled) {
    const result = await fetchFromSource(source);
    if (result?.error === 'TIMEOUT') timeout = true;
    if (result?.url || result?.buffer) return result;
  }
  return timeout ? { error: 'TIMEOUT' } : null;
}
module.exports = { fetchWithFallback, fetchFromSource, providers };
