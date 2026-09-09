const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const platform = process.argv[2] || process.platform;
const target = platform === 'win32' ? 'node22-win-x64' : 'node22-linux-x64';
const output = path.join(root, 'native-bridge/bin', platform === 'win32' ? 'sam-native.exe' : 'sam-native');
execFileSync(process.execPath, [path.join(root, 'node_modules/@yao-pkg/pkg/lib-es5/bin.js'), path.join(root, 'native-bridge/host.js'), '--targets', target, '--output', output, '--no-bytecode', '--public'], { stdio: 'inherit' });
if (platform !== 'win32') fs.chmodSync(output, 0o755);
