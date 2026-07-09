const axios = require('axios');
const API_TIMEOUT = Number(process.env.API_TIMEOUT_MS || 15000);
const client = axios.create({ timeout: API_TIMEOUT, maxRedirects: 5, validateStatus: (s) => s >= 200 && s < 300 });
function timeoutResult(error) { return error.code === 'ECONNABORTED' || /timeout/i.test(error.message); }
module.exports = { client, API_TIMEOUT, timeoutResult };
