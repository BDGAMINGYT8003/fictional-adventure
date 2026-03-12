const axios = require('axios');
const { logError, logWarn, logInfo, logTimeout } = require('./logger');

const API_TIMEOUT = 15000;

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
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to oboobs.ru exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
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
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to obutts.ru exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from obutts.ru: ${error.message}`);
        return null;
    }
}

async function fetchPurrbot(endpoint) {
    try {
        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || response.data.error || !response.data.link) {
            return null;
        }

        return {
            url: response.data.link
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to purrbot.site exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from purrbot.site: ${error.message}`);
        return null;
    }
}

async function fetchWaifu(endpoint) {
    try {
        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data || !response.data.url) {
            return null;
        }

        return {
            url: response.data.url
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to waifu.pics exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from waifu.pics: ${error.message}`);
        return null;
    }
}

async function fetchABD(endpoint) {
    try {
        const response = await axios.get(endpoint, { timeout: API_TIMEOUT });

        if (!response.data) {
            return null;
        }

        let targetUrl = response.data.url_japan;
        let fieldUsed = 'url_japan';

        if (!targetUrl) {
            logWarn(`url_japan missing, falling back to url_usa`);
            targetUrl = response.data.url_usa;
            fieldUsed = 'url_usa';
        }

        if (!targetUrl) {
            return null;
        }

        logInfo(`[fetchABD] Successfully extracted image using field: ${fieldUsed}`);

        return {
            url: targetUrl
        };
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            logTimeout(`Request to n-sfw.com (ABD) exceeded 15 seconds.`);
            return { error: 'TIMEOUT' };
        }
        logError(`Failed to fetch from n-sfw.com (ABD): ${error.message}`);
        return null;
    }
}

module.exports = {
    fetchBoobs,
    fetchAss,
    fetchPurrbot,
    fetchWaifu,
    fetchABD
};
