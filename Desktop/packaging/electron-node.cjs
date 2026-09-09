const { spawnSync } = require('node:child_process');
const result = spawnSync(require('electron'), [require('node:path').resolve(process.argv[2])], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status || 0;
