/**
 * On calling handleCommand will try to execute a command that matches the interaction.
 */
class CommandHandler {
    #commands;

    /**
     * Create a new CommandHandler.
     * @param {Discord.Collection} commands - Commands to match against.
     */
    constructor (commands) {
        this.#commands = commands;
    }

    /**
     * Try to execute a matching command.
     * @param {Discord.Interaction} interaction - The interaction to match
     */
    async handleCommand (interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = this.#commands.get(interaction.commandName);

        if (!command) {
            console.log(`WARNING: No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
}

module.exports = {
    CommandHandler
};
