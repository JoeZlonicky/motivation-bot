const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const ReminderModel = require('./database-models/reminder');
const getName = require('./utility/get-name');

const MIN_POLLING_INTERVAL_SECONDS = 10;
const DEFAULT_POLLING_INTERVAL_SECONDS = 60;
const BUTTON_INTERACTION_WAIT_TIME_MS = 1000 * 60 * 60; // 60 Minutes

/**
 * For reminding Discord users about reminders they have set.
 */
class ReminderPoller {
    #discordClient = null;
    #intervalObj = null;
    #immediateObj = null;
    #pollingIntervalSeconds = DEFAULT_POLLING_INTERVAL_SECONDS;

    /**
     * Creates a new ReminderPoller. Polling will not start until you call startPolling().
     * @param {Discord.Client} discordClient - a logged-in Discord Client
     */
    constructor (discordClient) {
        this.#discordClient = discordClient;
    }

    /**
     * Changes how often to check for reminders that are due. Make sure it is above MIN_POLLING_INTERVAL_SECONDS.
     * The interval is only changeable when polling is not active.
     * @param {number} intervalSeconds - new polling interval (in seconds)
     */
    setPollingInterval (intervalSeconds) {
        if (intervalSeconds < MIN_POLLING_INTERVAL_SECONDS) {
            console.error(`WARNING: Trying to set remind-me polling interval to ${intervalSeconds} seconds but the` +
                `minimum interval is ${MIN_POLLING_INTERVAL_SECONDS} seconds.`);
            return;
        }
        if (this.#intervalObj) {
            console.error(
                'WARNING: Trying to set polling interval while polling is active. The interval will not change.');
            return;
        }

        this.#pollingIntervalSeconds = intervalSeconds;
    }

    /**
     * Returns the current polling interval in seconds.
     * @returns {number} - the current polling interval (seconds)
     */
    getPollingIntervalSeconds () {
        return this.#pollingIntervalSeconds;
    }

    /**
     * Begins polling the database for reminders.
     */
    startPolling () {
        if (this.#intervalObj) {
            return;
        }

        this.#immediateObj = setImmediate(async () => {
            await this.#pollForReminders();
        });

        this.#intervalObj = setInterval(async () => {
            await this.#pollForReminders();
        }, 1000.0 * this.#pollingIntervalSeconds);
    }

    /**
     * Stops polling the database for reminders.
     */
    stopPolling () {
        if (this.#intervalObj) {
            clearInterval(this.#intervalObj);
            this.#intervalObj = null;
        }
        if (this.#immediateObj) {
            clearImmediate(this.#immediateObj);
            this.#immediateObj = null;
        }
    }

    /**
     * Queries the database for reminders that are due and message users about due reminders.
     * @returns {Promise<void>}
     */
    async #pollForReminders () {
        const currentDate = new Date();
        console.log('Looking for reminders that are due...');

        // Calculates reminders that are due based off their lastNotified date and the reminder interval
        const results = await ReminderModel.aggregate([
            {
                $project: {
                    userID: 1,
                    what: 1,
                    started: 1,
                    timeTillReminder: {
                        $subtract: [
                            {
                                $add: ['$lastNotified',
                                    { $multiply: ['$intervalMinutes', 60 * 1000] } // Need to convert from minutes to ms
                                ]
                            },
                            currentDate
                        ]
                    }
                }
            },
            {
                $match: {
                    timeTillReminder: { $lte: 0 }
                }
            }
        ]).exec();

        console.log(`Found ${results.length} reminders that are due.`);

        results.forEach(document => {
            this.#messageUserAboutReminder(document._id, document.userID, document.what);
        });
    }

    /**
     * Updates the specified reminder document to have a lastNotified date of now.
     * @param {mongoose.Types.ObjectId} reminderID - _id field of the reminder to update
     * @returns {Promise<void>}
     */
    async #updateLastNotified (reminderID) {
        await ReminderModel.updateOne({
            _id: reminderID
        },
        {
            lastNotified: Date.now()
        });
    }

    /**
     * Messages a Discord user asking if they have completed the task for a reminder they set. Will provide two buttons:
     * One for marking the reminder as done (deleting it) and one for it not being done yet (reminder will stay active).
     * @param {mongoose.Types.ObjectId} reminderID - _id field of the reminder
     * @param {string} userID - Discord user ID
     * @param {string} what - Reminder description
     * @returns {Promise<void>}
     */
    async #messageUserAboutReminder (reminderID, userID, what = '') {
        const doneButton = new ButtonBuilder().setCustomId('done').setLabel('Done!').setStyle(ButtonStyle.Primary);
        const notYetButton = new ButtonBuilder().setCustomId('notYet').setLabel('Not yet')
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents([doneButton, notYetButton]);

        try {
            const user = await this.#discordClient.users.fetch(userID, false);

            const message = await this.#constructReminderPromptMessage(user, what);
            const response = await user.send({
                content: message,
                components: [row]
            });

            this.#updateLastNotified(reminderID).then(_ => {});

            const confirmation = await response.awaitMessageComponent(
                {
                    filter: interaction => interaction.user.id === user.id,
                    time: BUTTON_INTERACTION_WAIT_TIME_MS
                });

            if (confirmation.customId === 'done') {
                await ReminderModel.deleteOne({ _id: reminderID });
                const doneMessage = await this.#constructTaskDoneMessage(user);
                await confirmation.update({
                    content: doneMessage,
                    components: []
                });
            } else if (confirmation.customId === 'notYet') {
                const notDoneMessage = await this.#constructTaskNotDoneMessage(user);
                await confirmation.update({
                    content: notDoneMessage,
                    components: []
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Constructs a message for reminding the user.
     * @param user - Discord User
     * @param {string} what - What the reminder was about
     * @returns {Promise<string>} - The constructed message
     */
    async #constructReminderPromptMessage (user, what) {
        const name = await getName(user);
        if (name) {
            if (what) {
                return `Hey, ${name}, have you completed "${what}" yet?`;
            } else {
                return `Hey, ${name}, have you completed the task yet?`;
            }
        } else if (what) {
            return `Have you completed "${what}" yet?`;
        } else {
            return 'Have you completed the task yet?';
        }
    }

    /**
     * Constructs a message for congratulating the user.
     * @param user - Discord User
     * @returns {Promise<string>} - The constructed message
     */
    async #constructTaskDoneMessage (user) {
        const name = await getName(user);
        if (name) {
            return `Awesome! I've cleared the reminder. Great job, ${name}!`;
        }
        return 'Awesome! I\'ve cleared the reminder. Great job!';
    }

    /**
     * Constructs a message for telling the user they will be reminded again.
     * @param user - Discord User
     * @returns {Promise<string>} - The constructed message
     */
    async #constructTaskNotDoneMessage (user) {
        const name = await getName(user);
        if (name) {
            return `I believe in you, ${name}! I'll remind you again in a bit.`;
        }
        return 'I believe in you! I\'ll remind you again in a bit.';
    }
}

module.exports = ReminderPoller;
