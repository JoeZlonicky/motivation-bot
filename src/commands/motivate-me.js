const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const completionModel = 'text-davinci-003';
const completionTemperature = 0.8; // Is on a scale of 0 to 1 where a higher value results in more inconsistent replies
const completionMaxTokens = 100; // 100 tokens = ~75 English words
const nCompletionReturns = 1;

function constructPrompt (about = '') {
    if (about) {
        return `Write me a strongly motivational message about ${about} that will make me believe in myself.`;
    } else {
        return 'Write me a strongly motivational message that will make me believe in myself.';
    }
}

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
        const randomCompletionText = completion.data.choices[randomIndex].text;
        console.log(`Received the following completion: "${randomCompletionText}".`);

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
            await interaction.reply('I\'m sorry, but I\'m not properly set up for AI right now! But I still believe in you!');
            return;
        }

        await interaction.deferReply(); // May take some time to generate

        const config = new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        });
        const openAI = new OpenAIApi(config);

        const prompt = constructPrompt(interaction.options.getString('about'));
        const aiCompletion = await tryToFetchAICompletion(openAI, prompt);

        if (!aiCompletion) {
            await interaction.editReply('I\'m sorry, but I was unable to generate a response... But I still believe in you!');
            return;
        }

        await interaction.editReply(aiCompletion);
    }
};
