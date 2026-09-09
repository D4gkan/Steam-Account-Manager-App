const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.cpSync(path.join(root, 'src/persistence/migrations'),
  path.join(root, 'dist/main/persistence/migrations'), { recursive: true });
for (const name of ['companion-extension', 'native-bridge']) {
  fs.cpSync(path.join(root, name), path.join(root, 'resources', name), {
    recursive: true,
    filter: (source, destination) => fs.statSync(source).isDirectory() || !fs.existsSync(destination) || !fs.readFileSync(source).equals(fs.readFileSync(destination)),
  });
}
