'use strict';
const { request } = require('./discord');
const { definitions } = require('./commands');
(async () => {
  if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID) throw new Error('BOT_TOKEN and CLIENT_ID are required.');
  const body = definitions();
  await request(`/applications/${process.env.CLIENT_ID}/commands`, { method: 'PUT', body });
  console.log(`Registered ${body.length} global application commands via Discord API v10.`);
})().catch(err => { console.error(err); process.exit(1); });
