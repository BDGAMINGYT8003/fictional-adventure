import { mediaResult } from './media-result.js';
import { MediaProviderError, providerError } from './errors.js';

export async function fetchAbd(source, context) {
  const provider = 'n-sfw.com';
  try {
    const payload = await context.http.json(source.endpoint);
    const url = payload?.url_japan || payload?.url_usa;
    if (!url) throw new MediaProviderError('N-SFW response did not contain url_japan or url_usa.', { code: 'INVALID_RESPONSE' });

    try {
      const download = await context.http.buffer(url, {
        minimumBytes: 1_024,
        allowedHosts: ['s3.ink', 'n-sfw.com'],
      });
      return mediaResult({ provider, url, download });
    } catch (error) {
      if (context.config.allowInsecureMediaTls) {
        context.logger.warn('Retrying N-SFW media with certificate verification disabled by configuration.', { error });
        const download = await context.http.insecureHttpsBuffer(url, {
          minimumBytes: 1_024,
          allowedHosts: ['s3.ink', 'n-sfw.com'],
        });
        return mediaResult({ provider, url, download });
      }
      context.logger.warn('N-SFW media download failed; returning the provider URL for Discord proxying.', { error });
      return mediaResult({ provider, url });
    }
  } catch (error) {
    throw providerError(error, provider);
  }
}
