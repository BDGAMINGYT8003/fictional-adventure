import assert from 'node:assert/strict';
import test from 'node:test';
import breeding from '../src/commands/breeding.js';
import buttplug from '../src/commands/buttplug.js';
import pussylick from '../src/commands/pussylick.js';
import { Logger } from '../src/lib/logger.js';

function responder() {
  const calls = [];
  return {
    calls,
    async defer() { calls.push({ method: 'defer' }); },
    async deferUpdate() { calls.push({ method: 'deferUpdate' }); },
    async editOriginal(body, files = []) { calls.push({ method: 'editOriginal', body, files }); },
  };
}

function context(commandResponder, http, source = 'command') {
  return {
    source,
    responder: commandResponder,
    interaction: {
      id: '123456789012345678',
      data: { options: [] },
      user: { id: '234567890123456789', username: 'tester', discriminator: '0', avatar: null },
    },
    http,
    config: {},
    maxMediaBytes: 10 * 1024 * 1024,
    logger: new Logger('error'),
  };
}

test('media commands defer before provider work and render URL results', async () => {
  const response = responder();
  await pussylick.execute(context(response, {
    async json() { return { link: 'https://cdn.example/media.gif' }; },
  }));
  assert.equal(response.calls[0].method, 'defer');
  const edit = response.calls[1];
  assert.equal(edit.method, 'editOriginal');
  assert.equal(edit.body.embeds[0].image.url, 'https://cdn.example/media.gif');
  assert.deepEqual(edit.body.embeds[0].footer, {
    text: 'tester',
    icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
  });
  assert.ok(!edit.body.embeds[0].footer.text.includes('purrbot.site'));
  assert.ok(!edit.body.embeds[0].footer.text.includes('•'));
  assert.ok(!Number.isNaN(Date.parse(edit.body.embeds[0].timestamp)));
  assert.equal(edit.body.components[0].components[0].custom_id, 'm:pussylick');
  assert.equal(edit.body.components[0].components.length, 2);
  assert.match(edit.body.components[0].components[0].label, /Refresh/);
  assert.match(edit.body.components[0].components[1].label, /Link/);
  assert.equal(edit.body.components[0].components[1].style, 5);
  assert.equal(edit.body.components[0].components[1].url, 'https://cdn.example/media.gif');
  assert.deepEqual(edit.body.attachments, []);
  assert.deepEqual(edit.files, []);
});

test('media refreshes defer message updates and replace native attachments', async () => {
  const response = responder();
  const bytes = Buffer.from('animated-media');
  await breeding.execute(context(response, {
    async json() {
      return { url_japan: 'https://n-sfw.ap-osaka-1.s3.ink/media.webp' };
    },
    async expiredCertificateHttpsBuffer() {
      return { buffer: bytes, contentType: 'image/webp' };
    },
  }, 'component'));
  assert.equal(response.calls[0].method, 'deferUpdate');
  const edit = response.calls[1];
  assert.equal(edit.body.embeds[0].image.url, 'attachment://media.webp');
  assert.deepEqual(edit.body.attachments, [{ id: 0, filename: 'media.webp' }]);
  assert.equal(edit.files.length, 1);
  assert.equal(edit.files[0].data, bytes);
  assert.equal(edit.files[0].contentType, 'image/webp');
  assert.equal(edit.body.components[0].components.length, 2);
  assert.match(edit.body.components[0].components[0].label, /Refresh/);
  assert.match(edit.body.components[0].components[1].label, /Link/);
  assert.equal(edit.body.components[0].components[1].style, 5);
  assert.equal(
    edit.body.components[0].components[1].url,
    'https://n-sfw.ap-osaka-1.s3.ink/media.webp',
  );
});

test('buttplug style selection routes exclusively and persists across Refresh', async () => {
  const animeResponse = responder();
  const animeContext = context(animeResponse, {
    async json(url) {
      assert.equal(url, 'https://api.n-sfw.com/nsfw/buttplug');
      return { url_japan: 'https://n-sfw.ap-osaka-1.s3.ink/buttplug.gif' };
    },
    async expiredCertificateHttpsBuffer(url) {
      return { buffer: Buffer.from('anime'), contentType: 'image/gif', finalUrl: url };
    },
    async text() {
      assert.fail('Anime selection must not contact PornPics');
    },
  });
  animeContext.interaction.data.options = [{ name: 'style', value: 'Anime' }];
  await buttplug.execute(animeContext);
  const animeEdit = animeResponse.calls.at(-1);
  assert.equal(animeEdit.body.embeds[0].image.url, 'attachment://media.gif');
  assert.equal(animeEdit.body.components[0].components[0].custom_id, 'm:buttplug:style=Anime');

  const realResponse = responder();
  let realRequests = 0;
  const realContext = context(realResponse, {
    async json() {
      assert.fail('Real selection must not contact N-SFW');
    },
    async expiredCertificateHttpsBuffer() {
      assert.fail('Real selection must not download N-SFW media');
    },
    async text(_url, options) {
      realRequests += 1;
      if (options.query) {
        return JSON.stringify([{
          gid: 321,
          g_url: 'https://www.pornpics.com/galleries/real-gallery/',
          t_url_460: 'https://cdni.pornpics.com/460/1/2/321/321_cover_hash.jpg',
        }]);
      }
      return Array.from({ length: 20 }, (_value, index) => `
        <a href="/galleries/real-gallery-${index}/">
          <img src="https://cdni.pornpics.com/460/1/2/${index}/${index}_cover_hash.jpg">
        </a>
      `).join('');
    },
  });
  realContext.interaction.data.options = [{ name: 'style', value: 'Real' }];
  await buttplug.execute(realContext);
  const realEdit = realResponse.calls.at(-1);
  assert.equal(realRequests, 1);
  assert.match(realEdit.body.embeds[0].image.url, /^https:\/\/cdni\.pornpics\.com\/1280\//);
  assert.equal(realEdit.body.components[0].components[0].custom_id, 'm:buttplug:style=Real');
});
