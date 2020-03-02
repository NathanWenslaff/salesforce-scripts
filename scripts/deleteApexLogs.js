const { auth, executeScript } = require('./scriptUtils');

const conn = auth();
const { result: orgInfo } = JSON.parse(executeScript('sfdx force:org:display --json').toString());
const orgName = orgInfo.alias || orgInfo.username;

const deleteLogs = async () => {
    console.log(`Deleting Apex logs from ${orgName}`);
    const apexLogs = await conn.tooling
        .sobject('ApexLog')
        .find()
        .execute();
    await conn.tooling.delete('ApexLog', apexLogs.map((log) => log.Id));
    console.log(`${apexLogs.length} log records deleted`);
};

const execute = async () => {
    await deleteLogs();
};

execute();
