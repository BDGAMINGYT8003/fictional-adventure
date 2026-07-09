'use strict';

const axios = require('axios');
const https = require('https');
const dns = require('dns/promises');
const { logInfo, logWarn, logError } = require('../core/logger');

const API_TIMEOUT = 15000;
const MAX_DISCORD_BYTES = 8 * 1024 * 1024;
const browserHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

async function getJson(url, options = {}) { const r = await axios.get(url, { timeout: API_TIMEOUT, ...options }); return r.data; }
async function asBuffer(url, options = {}) { const r = await axios.get(url, { responseType: 'arraybuffer', timeout: API_TIMEOUT, ...options }); return Buffer.from(r.data); }
function timeout(error) { return error.code === 'ECONNABORTED' || String(error.message).toLowerCase().includes('timeout'); }
function fail(source, error) { if (timeout(error)) return { error: 'TIMEOUT' }; logError(`${source}: ${error.message}`); return null; }

async function fetchPurrbot(endpoint) { try { const d = await getJson(endpoint); return d?.link ? { url: d.link, source: 'purrbot' } : null; } catch (e) { return fail('Purrbot', e); } }
async function fetchWaifu(endpoint) { if (process.env.WAIFU_PICS === 'false') return null; try { const d = await getJson(endpoint); return d?.url ? { url: d.url, source: 'waifu.pics' } : null; } catch (e) { return fail('Waifu.pics', e); } }
async function fetchWaifuIm(tag, isNsfw = true) { try { const d = await getJson('https://api.waifu.im/images', { params: { IncludedTags: tag, IsNsfw: isNsfw ? 'True' : 'False' }, headers: { Authorization: `ApiKey ${process.env.WAIFU_IM_KEY || ''}`, 'Accept-Version': 'v7' } }); return d?.items?.[0]?.url ? { url: d.items[0].url, source: 'waifu.im' } : null; } catch (e) { return fail('Waifu.im', e); } }
async function fetchNekoBot(type) { try { const d = await getJson(`https://nekobot.xyz/api/image?type=${encodeURIComponent(type)}`, { headers: { Authorization: '015445535454455354D6' } }); return d?.success && d?.message ? { url: d.message, source: 'nekobot' } : null; } catch (e) { return fail('NekoBot', e); } }
async function fetchNekosV4(endpoint) { try { const d = await getJson(endpoint); return Array.isArray(d) && d[0]?.url ? { url: d[0].url, source: 'nekosapi' } : null; } catch (e) { return fail('Nekos API', e); } }
async function fetchABD(endpoint) { try { const d = await getJson(endpoint); const url = d?.url_japan || d?.url_usa; if (!url) return null; try { const buffer = await asBuffer(url, { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }); return { url, source: 'n-sfw.com', buffer }; } catch { return { url, source: 'n-sfw.com' }; } } catch (e) { return fail('N-SFW.COM', e); } }
async function fetchBoobs(id = null) { try { const ep = id ? `http://api.oboobs.ru/boobs/get/${id}/` : 'http://api.oboobs.ru/boobs/0/1/random/'; const d = await getJson(ep); return d?.[0]?.preview ? { id: d[0].id, url: `http://media.oboobs.ru/${d[0].preview}`, source: 'oboobs' } : null; } catch (e) { return fail('OBoobs', e); } }
async function fetchAss(id = null) { try { const ep = id ? `http://api.obutts.ru/butts/get/${id}/` : 'http://api.obutts.ru/butts/0/1/random/'; const d = await getJson(ep); return d?.[0]?.preview ? { id: d[0].id, url: `http://media.obutts.ru/${d[0].preview}`, source: 'obutts' } : null; } catch (e) { return fail('OButts', e); } }
async function fetchSexcom(niche) { try { const page = Math.floor(Math.random() * 10) + 1; const d = await getJson('https://www.sex.com/portal/api/gifs/search', { headers: browserHeaders, params: { 'sexual-orientation': 'straight', order: 'likeCount', search: niche, page, limit: 40 } }); const item = d?.data?.[Math.floor(Math.random() * d.data.length)]; if (!item?.uri) return null; const path = item.uri.endsWith('.webp') ? `${item.uri.slice(0, -5)}.gif` : item.uri; return { id: item.id, url: `https://imagex1.sx.cdn.live${path}`, source: 'sex.com' }; } catch (e) { return fail('Sex.com', e); } }
async function fetchPorngifs() { try { const ip = await dns.lookup('porngifs.com'); const agent = new https.Agent({ servername: 'cdn.porngifs.com' }); for (let i = 0; i < 15; i++) { const id = Math.floor(Math.random() * 39239) + 1; try { const buffer = await asBuffer(`https://${ip.address}/img/${id}`, { httpsAgent: agent, headers: { ...browserHeaders, Host: 'cdn.porngifs.com', Referer: 'https://porngifs.com/', Accept: 'image/*' } }); if (buffer.length > 1024 && buffer.length <= MAX_DISCORD_BYTES) return { id: String(id), url: `https://cdn.porngifs.com/img/${id}`, source: 'porngifs', buffer }; } catch {} } return null; } catch (e) { return fail('Porngifs', e); } }
async function fetchPorngifsTv() { try { for (let i = 0; i < 15; i++) { const page = Math.floor(Math.random() * 2603) + 1; const html = await getJson(`https://porngifs.tv/?action=ajax&mode=async&function=get_block&block_id=list_videos_most_recent_videos&sort_by=post_date&from=${page}`, { headers: { ...browserHeaders, 'X-Requested-With': 'XMLHttpRequest' }, transformResponse: [x => x] }); const matches = [...String(html).matchAll(/data-webp="([^\"]+\.(?:webp|gif))"/g)]; const url = matches[Math.floor(Math.random() * matches.length)]?.[1]; if (!url) continue; const buffer = await asBuffer(url); if (buffer.length > 1024 && buffer.length <= MAX_DISCORD_BYTES) return { id: String(page), url, source: 'porngifs.tv', buffer }; } return null; } catch (e) { return fail('Porngifs.tv', e); } }

async function fetchBySource(source) {
  logInfo(`Fetching ${source.id}${source.endpoint ? ` ${source.endpoint}` : ''}${source.type ? ` ${source.type}` : ''}${source.tag ? ` ${source.tag}` : ''}`);
  if (source.id === 'purrbot') return fetchPurrbot(source.endpoint);
  if (source.id === 'abd') return fetchABD(source.endpoint);
  if (source.id === 'waifupics') return fetchWaifu(source.endpoint);
  if (source.id === 'waifuim') return fetchWaifuIm(source.tag, true);
  if (source.id === 'nekobot') return fetchNekoBot(source.type);
  if (source.id === 'nekosv4') return fetchNekosV4(source.endpoint);
  if (source.id === 'oboobs') return fetchBoobs(source.idValue);
  if (source.id === 'obutts') return fetchAss(source.idValue);
  if (source.id === 'sexcom') return fetchSexcom(source.niche);
  if (source.id === 'porngifs') return fetchPorngifs();
  if (source.id === 'porngifstv') return fetchPorngifsTv();
  logWarn(`Unknown source ${source.id}`); return null;
}

module.exports = { fetchBySource, fetchPurrbot, fetchWaifu, fetchWaifuIm, fetchNekoBot, fetchNekosV4, fetchABD, fetchBoobs, fetchAss, fetchSexcom, fetchPorngifs, fetchPorngifsTv };
