const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

const SEARCH_TEXT = 'I believe in you';
const SEARCH_LIMIT = 50;

function constructAPIUrl () {
    return `http://api.giphy.com/v1/gifs/search?q=${SEARCH_TEXT}&api_key=${process.env.GIPHY_API_KEY}&limit=${SEARCH_LIMIT}`;
}

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

function constructReply (url, user = null) {
    if (user && user.username) {
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
            await interaction.reply('I\'m sorry, but I\'m not properly set up to send GIFs right now! But I still believe in you!');
            return;
        }

        await interaction.deferReply(); // May take some time to get the GIF

        const apiURL = constructAPIUrl();
        const gifURL = await tryToFetchGIFUrl(apiURL);

        if (!gifURL) {
            await interaction.editReply('I\'m sorry, but I was unable to find a GIF for you... But I still believe in you!');
            return;
        }

        const replyMessage = constructReply(gifURL, interaction.user);

        await interaction.editReply(replyMessage);
    }
};
