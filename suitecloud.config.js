const SuiteCloudJestUnitTestRunner = require('@oracle/suitecloud-unit-testing/services/SuiteCloudJestUnitTestRunner');
const { execSync } = require('child_process');

module.exports = {
    defaultProjectFolder: 'dist',
    commands: {
        "project:deploy": {
            beforeExecuting: async args => {
                console.log('Running Rollup build...');
                // Runs the npm build script and prints output to the terminal
                execSync('npm run build', { stdio: 'inherit' });

                console.log('Running tests...');
                await SuiteCloudJestUnitTestRunner.run({
                    // Jest configuration options.
                });

                return args;
            },
        },
    },
};
