const reader = require('prompts');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const { auth } = require('./scriptUtils');

const conn = auth();

if (!fs.existsSync('./scripts/node/defaults.json')) {
    fs.writeFileSync('./scripts/node/defaults.json', JSON.stringify({ users: [], classes: [] }));
}

const defaults = require('./defaults.json');

let fullApexId;
let noApexId;

const getDebugLevelIds = async () => {
    // because upsert isn't allowed on DebugLevel :(
    const debugLevels = await conn.tooling
        .sobject('DebugLevel')
        .find({ MasterLabel: { $in: ['FullApex', 'NoApex'] } })
        .sort({ DeveloperName: 1 })
        .execute();

    if (debugLevels.length === 0) {
        const results = await conn.tooling.sobject('DebugLevel').create(
            [
                {
                    DeveloperName: 'FullApex',
                    Language: 'en_US',
                    MasterLabel: 'NoApex',
                    Workflow: 'NONE',
                    Validation: 'NONE',
                    Callout: 'NONE',
                    ApexCode: 'FINEST',
                    ApexProfiling: 'NONE',
                    Visualforce: 'FINER',
                    System: 'NONE',
                    Database: 'NONE',
                    Wave: 'NONE',
                },
                {
                    DeveloperName: 'NoApex',
                    Language: 'en_US',
                    MasterLabel: 'NoApex',
                    Workflow: 'NONE',
                    Validation: 'NONE',
                    Callout: 'NONE',
                    ApexCode: 'NONE',
                    ApexProfiling: 'NONE',
                    Visualforce: 'NONE',
                    System: 'NONE',
                    Database: 'NONE',
                    Wave: 'NONE',
                },
            ],
            'Id',
            { allOrNone: true },
        );
        fullApexId = results[0].id;
        noApexId = results[1].id;
    } else {
        fullApexId = debugLevels[0].Id;
        noApexId = debugLevels[1].Id;
    }
};

const deleteExistingTraceFlags = async () => {
    const records = await conn.tooling
        .sobject('TraceFlag')
        .find()
        .execute();
    await conn.tooling.delete('TraceFlag', records.map((record) => record.Id));
};

const getUsersAndClasses = async () => {
    let users;
    let classes;

    if (argv.d) {
        console.log('Creating default trace flags');
        users =
            defaults.users.length > 0
                ? await conn
                      .sobject('User')
                      .find({ Name: { $in: defaults.users } }, { Id: 1, Name: 1 })
                      .execute()
                : [];
        if (defaults.users.length === 0) {
            console.warn('You have no default users');
        }

        classes =
            defaults.classes.length > 0
                ? await conn
                      .sobject('ApexClass')
                      .find({ Name: { $in: defaults.classes } }, { Id: 1, Name: 1 })
                      .execute()
                : [];
        if (defaults.classes.length === 0) {
            console.warn('You have no default classes');
        }
    } else {
        const queriedUsers = await conn
            .sobject('User')
            .find(null, { Id: 1, Name: 1 })
            .autoFetch(true)
            .maxFetch(100000)
            .execute();
        const queriedClasses = await conn
            .sobject('ApexClass')
            .find(null, { Id: 1, Name: 1 })
            .autoFetch(true)
            .maxFetch(100000)
            .execute();
        const questions = [
            {
                type: 'autocompleteMultiselect',
                name: 'users',
                message: 'Pick which users to trace',
                choices: queriedUsers.map((user) => ({
                    title: user.Name,
                    value: user,
                })),
            },
            {
                type: 'autocompleteMultiselect',
                name: 'classes',
                message: 'Pick which Apex classes to ignore',
                choices: queriedClasses.map((apexClass) => ({
                    title: apexClass.Name,
                    value: apexClass,
                })),
            },
        ];
        const prompt = await reader(questions);
        users = prompt.users;
        classes = prompt.classes;
    }

    return { users, classes };
};

const createTraceFlags = async (users, classes) => {
    const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

    await conn.tooling.create('TraceFlag', [
        ...users.map((user) => ({
            DebugLevelId: fullApexId,
            ExpirationDate: tomorrow,
            LogType: 'USER_DEBUG',
            StartDate: new Date(),
            TracedEntityId: user.Id,
        })),
        ...classes.map((apexClass) => ({
            DebugLevelId: noApexId,
            ExpirationDate: tomorrow,
            LogType: 'CLASS_TRACING',
            StartDate: new Date(),
            TracedEntityId: apexClass.Id,
        })),
    ]);

    if (users.length > 0) {
        console.log(`Tracing the following users: ${users.map((user) => user.Name).join(', ')}`);
    }
    if (classes.length > 0) {
        console.log(`Ignoring the following classes: ${classes.map((apexClass) => apexClass.Name).join(', ')}`);
    }

    if (argv.s) {
        const newDefaults = {
            users: users.map((user) => user.Name),
            classes: classes.map((apexClass) => apexClass.Name),
        };
        fs.writeFileSync('./scripts/node/defaults.json', JSON.stringify(newDefaults));
        console.log('Saved these choices as your defaults');
    }
};

const execute = async () => {
    await getDebugLevelIds();
    await deleteExistingTraceFlags();
    const { users, classes } = await getUsersAndClasses();
    await createTraceFlags(users, classes);
};

execute();
