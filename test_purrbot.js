const { fetchPurrbot } = require('./utils/api');

async function testPurrbot() {
    console.log('Testing Purrbot APIs...');

    const endpoints = [
        'https://purrbot.site/api/img/nsfw/anal/gif',
        'https://purrbot.site/api/img/nsfw/blowjob/gif',
        'https://purrbot.site/api/img/nsfw/cum/gif',
        'https://purrbot.site/api/img/nsfw/fuck/gif',
        'https://purrbot.site/api/img/nsfw/neko/gif',
        'https://purrbot.site/api/img/nsfw/pussylick/gif',
        'https://purrbot.site/api/img/nsfw/solo/gif',
        'https://purrbot.site/api/img/nsfw/threesome_fff/gif',
        'https://purrbot.site/api/img/nsfw/yuri/gif'
    ];

    for (const endpoint of endpoints) {
        const res = await fetchPurrbot(endpoint);
        console.log(`[${endpoint}]:`, res ? `PASS (${res.url})` : 'FAIL');
    }
}

testPurrbot();
