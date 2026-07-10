import assert from 'node:assert/strict';
import test from 'node:test';
import { MediaHttpClient } from '../src/brain/providers/http.js';
import { Logger } from '../src/lib/logger.js';

function client(fetchImpl, maximumBytes = 1024) {
  return new MediaHttpClient({
    timeoutMs: 1_000,
    maximumBytes,
    logger: new Logger('error'),
    fetchImpl,
  });
}

test('media HTTP client returns bounded buffers and content types', async () => {
  const http = client(async () => new Response(Buffer.from('media'), {
    status: 200,
    headers: { 'content-type': 'image/gif', 'content-length': '5' },
  }));
  const result = await http.buffer('https://cdn.example/media.gif', {
    allowedHosts: ['cdn.example'],
  });
  assert.equal(result.buffer.toString(), 'media');
  assert.equal(result.contentType, 'image/gif');
});

test('media HTTP client rejects unexpected hosts before fetching', async () => {
  let fetched = false;
  const http = client(async () => {
    fetched = true;
    return new Response('media');
  });
  await assert.rejects(
    http.buffer('https://internal.example/media.gif', { allowedHosts: ['cdn.example'] }),
    (error) => error.code === 'UNEXPECTED_HOST',
  );
  assert.equal(fetched, false);
});

test('media HTTP client enforces declared and scoped size limits', async () => {
  const http = client(async () => new Response(Buffer.alloc(20), {
    status: 200,
    headers: { 'content-length': '20' },
  }), 100);
  await assert.rejects(
    http.withMaximumBytes(10).buffer('https://cdn.example/media.gif'),
    (error) => error.code === 'TOO_LARGE',
  );
});

test('media HTTP client reports invalid JSON explicitly', async () => {
  const http = client(async () => new Response('not-json', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));
  await assert.rejects(
    http.json('https://api.example/data'),
    (error) => error.code === 'INVALID_RESPONSE',
  );
});
