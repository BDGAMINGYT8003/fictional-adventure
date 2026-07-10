import { fetchAbd } from './abd.js';
import { fetchNekoBot } from './nekobot.js';
import { fetchNekosV4 } from './nekos-v4.js';
import { fetchOBoobs, fetchOButts } from './obru.js';
import { fetchPorngifs } from './porngifs.js';
import { fetchPorngifsTv } from './porngifs-tv.js';
import { fetchPurrbot } from './purrbot.js';
import { fetchSexCom } from './sexcom.js';
import { fetchWaifuIm } from './waifu-im.js';
import { fetchWaifuPics } from './waifu-pics.js';
import { MediaProviderError } from './errors.js';

const providers = Object.freeze({
  abd: fetchAbd,
  nekobot: fetchNekoBot,
  nekosv4: fetchNekosV4,
  oboobs: fetchOBoobs,
  obutts: fetchOButts,
  porngifs: fetchPorngifs,
  porngifstv: fetchPorngifsTv,
  purrbot: fetchPurrbot,
  sexcom: fetchSexCom,
  waifuim: fetchWaifuIm,
  waifupics: fetchWaifuPics,
});

export async function fetchMedia(source, context) {
  const fetcher = providers[source.provider];
  if (!fetcher) {
    throw new MediaProviderError(`Unknown media provider: ${source.provider}`, {
      code: 'UNKNOWN_PROVIDER',
      provider: source.provider,
    });
  }
  return fetcher(source, context);
}

export const providerNames = Object.freeze(Object.keys(providers));
