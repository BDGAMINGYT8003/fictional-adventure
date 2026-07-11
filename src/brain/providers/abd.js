import { mediaResult } from './media-result.js';
import { MediaProviderError, providerError } from './errors.js';

const PROVIDER = 'n-sfw.com';
const OSAKA_MEDIA_HOST = 'n-sfw.ap-osaka-1.s3.ink';
const ABD_MEDIA_HOSTS = Object.freeze([
  'cdn.n-sfw.com',
  'n-sfw.com',
  'n-sfw.cdn.s3.ink',
  'n-sfw.us-phoenix-1.s3.ink',
  OSAKA_MEDIA_HOST,
]);
const SECURE_URL_FIELDS = Object.freeze(['url', 'url_cdn', 'url_usa']);
const TERMINAL_DOWNLOAD_ERRORS = new Set(['ABORTED', 'TOO_LARGE']);
const MAXIMUM_MIRROR_TIMEOUT_MS = 5_000;
let compatibilityWarningLogged = false;

function uniqueUrls(payload, fields) {
  return [...new Set(fields
    .map((field) => payload?.[field])
    .filter((value) => typeof value === 'string' && value.trim()))];
}

function nativeResult(url, download) {
  return mediaResult({
    provider: PROVIDER,
    url,
    watchUrl: null,
    download,
  });
}

function validatedAbdUrl(value, { osakaOnly = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (cause) {
    throw new MediaProviderError('N-SFW returned a malformed media URL.', {
      code: 'INVALID_URL',
      cause,
    });
  }
  if (parsed.protocol !== 'https:' || (parsed.port && parsed.port !== '443')) {
    throw new MediaProviderError('N-SFW media URLs must use HTTPS on the standard port.', {
      code: 'INVALID_URL',
    });
  }
  if (!ABD_MEDIA_HOSTS.includes(parsed.hostname)
    || (osakaOnly && parsed.hostname !== OSAKA_MEDIA_HOST)) {
    throw new MediaProviderError(`N-SFW returned an unexpected media host: ${parsed.hostname}`, {
      code: 'UNEXPECTED_HOST',
    });
  }
  return parsed;
}

function hostnameForLog(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return 'invalid';
  }
}

function downloadOptions(context) {
  return {
    minimumBytes: 1_024,
    allowedHosts: ABD_MEDIA_HOSTS,
    allowSubdomains: false,
    timeoutMs: Math.min(
      context.config?.mediaTimeoutMs ?? MAXIMUM_MIRROR_TIMEOUT_MS,
      MAXIMUM_MIRROR_TIMEOUT_MS,
    ),
  };
}

export async function fetchAbd(source, context) {
  try {
    const payload = await context.http.json(source.endpoint);
    const secureCandidates = uniqueUrls(payload, SECURE_URL_FIELDS);
    const osakaUrl = typeof payload?.url_japan === 'string' ? payload.url_japan : null;
    if (secureCandidates.length === 0 && !osakaUrl) {
      throw new MediaProviderError('N-SFW response did not contain a supported media URL.', {
        code: 'INVALID_RESPONSE',
      });
    }

    const failures = [];
    for (const url of secureCandidates) {
      try {
        const parsed = validatedAbdUrl(url);
        const download = await context.http.buffer(parsed.toString(), downloadOptions(context));
        return nativeResult(parsed.toString(), download);
      } catch (error) {
        if (TERMINAL_DOWNLOAD_ERRORS.has(error?.code)) throw error;
        failures.push(error);
        context.logger.debug('Verified N-SFW media mirror failed; trying the next declared mirror.', {
          host: hostnameForLog(url),
          code: error?.code,
        });
      }
    }

    if (osakaUrl) {
      const parsed = validatedAbdUrl(osakaUrl, { osakaOnly: true });
      const log = compatibilityWarningLogged
        ? context.logger.debug.bind(context.logger)
        : context.logger.warn.bind(context.logger);
      log('Using the bounded N-SFW Osaka compatibility path after verified mirrors failed.', {
        host: parsed.hostname,
        tlsPolicy: 'hostname required; only CERT_HAS_EXPIRED may be tolerated',
      });
      compatibilityWarningLogged = true;
      const download = await context.http.expiredCertificateHttpsBuffer(
        parsed.toString(),
        downloadOptions(context),
      );
      return nativeResult(parsed.toString(), download);
    }

    throw new MediaProviderError('Every declared N-SFW media mirror failed.', {
      code: failures.at(-1)?.code || 'NETWORK_ERROR',
      cause: new AggregateError(failures, 'N-SFW mirror failures'),
    });
  } catch (error) {
    throw providerError(error, PROVIDER);
  }
}

export {
  ABD_MEDIA_HOSTS,
  OSAKA_MEDIA_HOST,
  SECURE_URL_FIELDS,
};
