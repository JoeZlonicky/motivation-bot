const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const NicknameModel = require('../database-models/nickname');

const SEARCH_TEXT = 'I believe in you';
const SEARCH_LIMIT = 50;

/**
 * Constructs the Giphy API URL.
 * @returns {string} - API URL
 */
function constructAPIUrl () {
    const apiKey = process.env.GIPHY_API_KEY;
    return `https://api.giphy.com/v1/gifs/search?q=${SEARCH_TEXT}&api_key=${apiKey}&limit=${SEARCH_LIMIT}`;
}

/**
 * Attempts to use the Giphy API URL to get a relevant GIF URL
 * @param {string} apiURL - Giphy API URL
 * @returns {Promise<string|null>} - GIF URL, or null if the operation failed.
 */
async function tryToFetchGIFUrl (apiURL) {
    try {
        console.log(`Fetching GIF from "${apiURL}"...`);
        const res = await fetch(apiURL);
        if (!res.ok) {
            console.error(`WARNING: Failed to fetch GIF using the URL "${apiURL}". Status code: ${res.status}`);
            return null;
        }
        const json = await res.json();
        if (!json.data || json.data.length === 0) {
            console.error(`WARNING: Invalid JSON data from fetching a GIF. Result JSON: ${JSON.stringify(json)}`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * json.data.length);
        const gifURL = json.data[randomIndex].url;
        console.log(`Received the following GIF URL: ${gifURL}.`);
        return gifURL;
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * Constructs a reply message based off the URL, the user, and whether they have a nickname.
 * @param {string} url - GIF URL
 * @param user - Discord user
 * @returns {Promise<string>} - Reply message
 */
async function constructReply (url, user) {
    let nicknameDocument = null;
    try {
        nicknameDocument = await NicknameModel.findOne({ userID: user.id }).exec();
    } catch (error) {
        console.error(error);
    }
    if (nicknameDocument && nicknameDocument.nickname) {
        return `You can do it, ${nicknameDocument.nickname}!\n${url}`;
    } else if (user && user.username) {
        return `You can do it, ${user.username}!\n${url}`;
    } else {
        return `You can do it!\n${url}`;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Sends a motivational GIF.'),
    async execute (interaction) {
        if (!process.env.GIPHY_API_KEY) {
            console.error('WARNING: GIPHY_API_KEY not set.');
            await interaction.reply(
                'I\'m sorry, but I\'m not properly set up to send GIFs right now! But I still believe in you!');
            return;
        }

        await interaction.deferReply(); // May take some time to get the GIF

        const apiURL = constructAPIUrl();
        const gifURL = await tryToFetchGIFUrl(apiURL);

        if (!gifURL) {
            await interaction.editReply(
                'I\'m sorry, but I was unable to find a GIF for you... But I still believe in you!');
            return;
        }

        const replyMessage = await constructReply(gifURL, interaction.user);
        await interaction.editReply(replyMessage);
    }
};
