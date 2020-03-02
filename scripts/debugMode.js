const argv = require('minimist')(process.argv.slice(2));
const reader = require('prompts');
const { auth } = require('./scriptUtils');

const conn = auth();

const updateDebugMode = async () => {
    let usersToEnable = [];
    let usersToDisable = [];

    if (argv.e) {
        const users = await conn
            .sobject('User')
            .find({ UserPreferencesUserDebugModePref: false })
            .execute();

        const questions = [
            {
                type: 'autocompleteMultiselect',
                message: 'Select users to enable debug mode for',
                name: 'enable',
                choices: users.map((user) => ({
                    title: user.Name,
                    value: user,
                })),
            },
        ];

        const { enable } = await reader(questions);
        usersToEnable = enable;
    }

    if (argv.d) {
        const users = await conn
            .sobject('User')
            .find({ UserPreferencesUserDebugModePref: true })
            .execute();

        const questions = [
            {
                type: 'autocompleteMultiselect',
                message: 'Select users to disable debug mode for',
                name: 'disable',
                choices: users.map((user) => ({
                    title: user.Name,
                    value: user,
                })),
            },
        ];

        const { disable } = await reader(questions);
        usersToDisable = disable;
    }

    await conn.sobject('User').update([
        ...usersToEnable.map((user) => ({
            Id: user.Id,
            UserPreferencesUserDebugModePref: true,
        })),
        ...usersToDisable.map((user) => ({
            Id: user.Id,
            UserPreferencesUserDebugModePref: false,
        })),
    ]);

    if (usersToEnable.length > 0) {
        console.log(
            `Successfully enabled debug mode for the following users: ${usersToEnable
                .map((user) => user.Name)
                .join(', ')}`,
        );
    }

    if (usersToDisable.length > 0) {
        console.log(
            `Successfully disabled debug mode for the following users: ${usersToDisable
                .map((user) => user.Name)
                .join(', ')}`,
        );
    }
};

const execute = async () => {
    await updateDebugMode();
};

execute();
