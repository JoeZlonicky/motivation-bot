const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const completionModel = 'text-davinci-003';
const completionTemperature = 0.8; // Is on a scale of 0 to 1 where a higher value results in more inconsistent replies
const completionMaxTokens = 100; // 100 tokens = ~75 English words
const nCompletionReturns = 1;

/**
 * Constructs the prompt to give to the OpenAI API
 * @param {string} about - What the prompt should be about
 * @returns {string}
 */
function constructPrompt (about = '') {
    if (about) {
        return `Write me a strongly motivational message about ${about} that will make me believe in myself.`;
    } else {
        return 'Write me a strongly motivational message that will make me believe in myself.';
    }
}

/**
 * Attempt to use the OpenAI API to generate a response.
 * @param {OpenAIApi} openAI - OpenAIApi instance
 * @param {string} prompt - Prompt to use
 * @returns {Promise<string|null>} - Generated response, or null if the operation failed.
 */
async function tryToFetchAICompletion (openAI, prompt) {
    try {
        console.log(`Fetching OpenAI completion for the prompt "${prompt}"...`);
        const completion = await openAI.createCompletion({
            model: completionModel,
            prompt,
            temperature: completionTemperature,
            max_tokens: completionMaxTokens,
            n: nCompletionReturns
        });

        if (!completion || !completion.data || !completion.data.choices || completion.data.choices.length === 0) {
            console.error(`WARNING: Invalid OpenAI completion data: ${JSON.stringify(completion)}`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * completion.data.choices.length);
        let randomCompletionText = completion.data.choices[randomIndex].text;

        // Result usually has whitespace at the start, which messes with the following slicing
        randomCompletionText = randomCompletionText.trim();

        // Sometimes the answer is in double-quotes, which makes it feel like it isn't the bot talking to you.
        if (randomCompletionText.startsWith('"')) {
            randomCompletionText = randomCompletionText.slice(1);
        }
        if (randomCompletionText.endsWith('"')) {
            randomCompletionText = randomCompletionText.slice(0, -1);
        }

        console.log(`Generated the following completion: ${randomCompletionText}`);
        return randomCompletionText;
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('motivate-me')
        .setDescription('Get motivated by an AI!')
        .addStringOption(option =>
            option.setName('about')
                .setDescription('What the message should be about')),
    async execute (interaction) {
        if (!process.env.OPENAI_API_KEY) {
            console.error('WARNING: OPENAI_API_KEY not set.');
            await interaction.reply(
                'I\'m sorry, but I\'m not properly set up for AI right now! But I still believe in you!');
            return;
        }

        await interaction.deferReply(); // May take some time to generate

        const config = new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        });
        const openAI = new OpenAIApi(config);

        const prompt = constructPrompt(interaction.options.getString('about'));
        const aiCompletion = await tryToFetchAICompletion(openAI, prompt);

        if (aiCompletion) {
            await interaction.editReply(aiCompletion);
        } else {
            await interaction.editReply(
                'I\'m sorry, but I was unable to generate a response... But I still believe in you!');
        }
    }
};
