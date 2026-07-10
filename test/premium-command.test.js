import assert from 'node:assert/strict';
import test from 'node:test';
import premium, { SUBSCRIBE_URL } from '../src/commands/premium.js';

function recorder() {
  const calls = [];
  return {
    calls,
    async defer() { calls.push({ method: 'defer' }); },
    async editOriginal(body) { calls.push({ method: 'editOriginal', body }); },
  };
}

function snapshot(userId, isPremium) {
  return {
    userId,
    premium: isPremium,
    minuteLimit: isPremium ? null : 60,
    minuteRemaining: isPremium ? null : 29,
    dailyLimit: isPremium ? 5_000 : 1_000,
    dailyRemaining: isPremium ? 4_594 : 594,
  };
}

test('premium command renders the author free plan, meters, footer, and subscribe link', async () => {
  const responder = recorder();
  const user = { id: '123456789012345678', username: 'Moin', discriminator: '0', avatar: null };
  await premium.execute({
    responder,
    interaction: { user, data: { options: [] } },
    rateLimiter: { snapshot: (userId) => snapshot(userId, false) },
  });
  const body = responder.calls[1].body;
  assert.equal(body.embeds[0].title, 'Free Plan ($0)');
  assert.match(body.embeds[0].description, /You are currently \*\*NOT\*\* a Premium User/);
  assert.match(body.embeds[0].description, /Rate Limit: 29 \/ 60 per min/);
  assert.match(body.embeds[0].description, /Daily Cap: 594 \/ 1,000/);
  assert.match(body.embeds[0].description, /5,000 requests per day hard ceiling/);
  assert.equal(body.embeds[0].footer.text, 'Moin');
  assert.equal(body.components[0].components[0].url, SUBSCRIBE_URL);
  assert.equal(body.components[0].components[0].style, 5);
});

test('premium command personalizes another premium user profile', async () => {
  const responder = recorder();
  const author = { id: '123456789012345678', username: 'author' };
  const target = { id: '234567890123456789', username: 'supporter', discriminator: '0', avatar: null };
  await premium.execute({
    responder,
    interaction: {
      user: author,
      data: {
        options: [{ name: 'user', value: target.id }],
        resolved: { users: { [target.id]: target } },
      },
    },
    rateLimiter: { snapshot: (userId) => snapshot(userId, true) },
  });
  const embed = responder.calls[1].body.embeds[0];
  assert.equal(embed.title, 'Premium Plan ($1)');
  assert.match(embed.description, /supporter.*currently a \*\*Premium User\*\*/);
  assert.match(embed.description, /Rate Limit: Unlimited per min/);
  assert.match(embed.description, /Daily Cap: 4,594 \/ 5,000/);
  assert.equal(embed.footer.text, 'supporter');
});
