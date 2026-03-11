const axios = require('axios');
const { logError } = require('./logger');

const API_TIMEOUT = 5000;

async function fetchBoobs(id = null) {
    try {
        let endpoint = 'http://api.oboobs.ru/boobs/0/1/random/';
        if (id !== null && !isNaN(id)) {
            endpoint = `http://api.oboobs.ru/boobs/get/${id}/`;
        }

        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || response.data.length === 0) {
            return null;
        }

        const imageData = response.data[0];
        const imageUrl = `http://media.oboobs.ru/${imageData.preview}`;

        return {
            id: imageData.id,
            url: imageUrl
        };
    } catch (error) {
        logError(`Failed to fetch from oboobs.ru: ${error.message}`);
        return null;
    }
}

async function fetchAss(id = null) {
    try {
        let endpoint = 'http://api.obutts.ru/butts/0/1/random/';
        if (id !== null && !isNaN(id)) {
            endpoint = `http://api.obutts.ru/butts/get/${id}/`;
        }

        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || response.data.length === 0) {
            return null;
        }

        const imageData = response.data[0];
        const imageUrl = `http://media.obutts.ru/${imageData.preview}`;

        return {
            id: imageData.id,
            url: imageUrl
        };
    } catch (error) {
        logError(`Failed to fetch from obutts.ru: ${error.message}`);
        return null;
    }
}

module.exports = {
    fetchBoobs,
    fetchAss
};
