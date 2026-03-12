const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('https://www.sex.com/portal/api/gifs', {
            params: {
                page: 1,
                limit: 1,
                order: 'likeCount',
                "sexual-orientation": 'straight'
            }
        });
        console.log("Success! Data:", res.data.data[0]);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
