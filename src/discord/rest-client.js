import { API_BASE_URL } from './constants.js';
import { sleep as defaultSleep } from '../lib/time.js';

const MAX_RETRIES = 5;

export class DiscordRestError extends Error {
  constructor(message, { status, code, details, method, route }) {
    super(message);
    this.name = 'DiscordRestError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.method = method;
    this.route = route;
  }
}

function normalizeRoute(method, route) {
  const pathname = route.split('?')[0];
  const parts = pathname.split('/').filter(Boolean);
  const normalized = parts.map((part, index) => {
    if (!/^\d{17,20}$/.test(part)) return part;
    const parent = parts[index - 1];
    if (parent === 'channels' || parent === 'guilds') return part;
    if (parent === 'webhooks') return part;
    return ':id';
  });
  return `${method.toUpperCase()} /${normalized.join('/')}`;
}

function majorParameterKey(route) {
  const parts = route.split('?')[0].split('/').filter(Boolean);
  for (const resource of ['channels', 'guilds']) {
    const index = parts.indexOf(resource);
    if (index !== -1 && parts[index + 1]) return `${resource}:${parts[index + 1]}`;
  }
  const webhookIndex = parts.indexOf('webhooks');
  if (webhookIndex !== -1 && parts[webhookIndex + 1]) {
    return `webhooks:${parts[webhookIndex + 1]}:${parts[webhookIndex + 2] ?? ''}`;
  }
  return 'none';
}

function parseBody(response, text) {
  if (!text) return null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }
  return text;
}

function makeMultipart(body, files) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify(body ?? {}));
  files.forEach((file, index) => {
    const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const blob = new Blob([bytes], { type: file.contentType || 'application/octet-stream' });
    form.append(`files[${index}]`, blob, file.name);
  });
  return form;
}

export class DiscordRestClient {
  constructor({ token, logger, fetchImpl = globalThis.fetch, sleep = defaultSleep, now = Date.now }) {
    if (typeof fetchImpl !== 'function') throw new Error('A Fetch API implementation is required.');
    this.token = token;
    this.logger = logger.child({ subsystem: 'discord-rest' });
    this.fetch = fetchImpl;
    this.sleep = sleep;
    this.now = now;
    this.routeQueues = new Map();
    this.routeLimits = new Map();
    this.routeBuckets = new Map();
    this.globalResetAt = 0;
  }

  get(path, options) { return this.request('GET', path, options); }
  post(path, options) { return this.request('POST', path, options); }
  put(path, options) { return this.request('PUT', path, options); }
  patch(path, options) { return this.request('PATCH', path, options); }
  delete(path, options) { return this.request('DELETE', path, options); }

  async request(method, route, options = {}) {
    if (!route.startsWith('/')) throw new Error(`Discord route must begin with "/": ${route}`);
    const routeKey = normalizeRoute(method, route);
    const queueKey = this.routeBuckets.get(routeKey) ?? routeKey;
    return this.#enqueue(queueKey, () => this.#requestWithRetries(method, route, routeKey, options));
  }

  async #enqueue(routeKey, operation) {
    const previous = this.routeQueues.get(routeKey) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    this.routeQueues.set(routeKey, current);
    try {
      return await current;
    } finally {
      if (this.routeQueues.get(routeKey) === current) this.routeQueues.delete(routeKey);
    }
  }

  async #requestWithRetries(method, route, routeKey, options) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      await this.#waitForRateLimit(routeKey);

      let response;
      try {
        response = await this.#fetch(method, route, options);
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error;
        const delay = Math.min(1_000 * (2 ** attempt), 10_000);
        this.logger.warn('Discord request failed before receiving a response; retrying.', {
          method,
          route: routeKey,
          attempt: attempt + 1,
          delay,
          error,
        });
        await this.sleep(delay);
        continue;
      }

      const text = await response.text();
      const payload = parseBody(response, text);
      this.#captureRateLimit(routeKey, route, response);

      if (response.status === 429) {
        if (attempt === MAX_RETRIES) {
          throw this.#errorFromResponse(method, route, response, payload);
        }
        const retryAfterSeconds = Number(payload?.retry_after ?? response.headers.get('retry-after') ?? 1);
        const retryAfterMs = Math.max(0, Math.ceil(retryAfterSeconds * 1_000)) + 50;
        if (payload?.global || response.headers.get('x-ratelimit-global') === 'true') {
          this.globalResetAt = Math.max(this.globalResetAt, this.now() + retryAfterMs);
        } else {
          const limitKey = this.routeBuckets.get(routeKey) ?? routeKey;
          this.routeLimits.set(limitKey, this.now() + retryAfterMs);
        }
        this.logger.warn('Discord rate limit encountered; honoring retry_after.', {
          route: routeKey,
          retryAfterMs,
          global: Boolean(payload?.global),
        });
        await this.sleep(retryAfterMs);
        continue;
      }

      if (response.status >= 500 && response.status <= 599 && attempt < MAX_RETRIES) {
        const delay = Math.min(500 * (2 ** attempt), 8_000);
        await this.sleep(delay);
        continue;
      }

      if (!response.ok) throw this.#errorFromResponse(method, route, response, payload);
      return payload;
    }
    throw new Error(`Discord request exhausted retries: ${method} ${route}`);
  }

  async #fetch(method, route, options) {
    const url = new URL(`${API_BASE_URL}${route}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
    }

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', 'DiscordBot (https://github.com/SyntaxGhost404/Discord-NSFW-Bot, 2.0.0)');
    if (options.auth !== false) headers.set('Authorization', `Bot ${this.token}`);

    const files = options.files ?? [];
    let body;
    if (files.length > 0) {
      body = makeMultipart(options.body, files);
    } else if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.body);
    }

    return this.fetch(url, {
      method,
      headers,
      body,
      signal: options.signal,
    });
  }

  #captureRateLimit(routeKey, route, response) {
    const bucket = response.headers.get('x-ratelimit-bucket');
    if (bucket) this.routeBuckets.set(routeKey, `bucket:${bucket}:${majorParameterKey(route)}`);
    const remaining = Number(response.headers.get('x-ratelimit-remaining'));
    const resetAfter = Number(response.headers.get('x-ratelimit-reset-after'));
    if (remaining === 0 && Number.isFinite(resetAfter)) {
      const limitKey = this.routeBuckets.get(routeKey) ?? routeKey;
      this.routeLimits.set(limitKey, this.now() + Math.ceil(resetAfter * 1_000) + 50);
    }
  }

  async #waitForRateLimit(routeKey) {
    const limitKey = this.routeBuckets.get(routeKey) ?? routeKey;
    const resetAt = Math.max(this.globalResetAt, this.routeLimits.get(limitKey) ?? 0);
    const wait = resetAt - this.now();
    if (wait > 0) await this.sleep(wait);
    if ((this.routeLimits.get(limitKey) ?? 0) <= this.now()) this.routeLimits.delete(limitKey);
  }

  #errorFromResponse(method, route, response, payload) {
    const message = typeof payload === 'object' && payload?.message
      ? payload.message
      : `Discord returned HTTP ${response.status}.`;
    return new DiscordRestError(message, {
      status: response.status,
      code: typeof payload === 'object' ? payload?.code : undefined,
      details: payload,
      method,
      route,
    });
  }
}

export { normalizeRoute };
