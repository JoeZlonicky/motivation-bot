const NicknameModel = require('../database-models/nickname');

/**
 * Tries to get the name for a Discord user in the priority of nickname > username.
 * @param user - Discord user
 * @returns {Promise<string|null>} - Best name found. Null if no name was found.
 */
async function getName (user) {
    try {
        const nicknameDocument = await NicknameModel.findOne({ userID: user.id }).exec();
        if (nicknameDocument && nicknameDocument.nickname) {
            return nicknameDocument.nickname;
        }
    } catch (error) {
        console.error(error);
    }

    if (user && user.username) {
        return user.username;
    }

    return null;
}

module.exports = getName;
