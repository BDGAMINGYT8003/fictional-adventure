const REQUIRED = ['BOT_TOKEN', 'CLIENT_ID'];
function validateEnv({ exit = true } = {}) {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length && exit) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return { missing, waifuImConfigured: Boolean(process.env.WAIFU_IM_KEY), waifuPicsEnabled: process.env.WAIFU_PICS !== 'false' };
}
module.exports = { validateEnv };
