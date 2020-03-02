const { execSync } = require('child_process');
const jsforce = require('jsforce');

const executeScript = (script) => execSync(script, { stdio: ['pipe', 'pipe', 'ignore'] });

const auth = () => {
    const { result } = JSON.parse(executeScript('sfdx force:org:display --json'));
    return new jsforce.Connection({
        instanceUrl: result.instanceUrl,
        accessToken: result.accessToken,
    });
};

module.exports = { executeScript, auth };
