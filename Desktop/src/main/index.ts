import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'node:path';
import { openDatabase } from '../persistence/db';
import { ensureSingleInstance } from './singleInstance';
import { createMainWindow } from './windowManager';
import { registerIpcHandlers } from './ipc';
import { BrowserManager } from '../services/browser/browserManager';
import { AccountRepository } from '../persistence/repositories/accountRepository';
app.setName('Steam Account Manager App');
const dataArgument = process.argv.find(arg => arg.startsWith('--user-data-dir='));
app.setPath('userData', dataArgument ? path.resolve(dataArgument.slice('--user-data-dir='.length)) : path.join(app.getPath('appData'), 'SteamAccountManagerApp'));
if (!ensureSingleInstance()) app.quit();
else {
  let browsers: BrowserManager | undefined;
  let closeDatabase: (() => void) | undefined;
  app.whenReady().then(async () => {
    const userDataDir = app.getPath('userData');
    const handle = openDatabase(path.join(userDataDir, 'db', 'app.sqlite3')); closeDatabase = handle.close;
    const resources = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '../../..');
    // Development uses resources/extensions and resources/runtime; other assets live at the root.
    const resourceRoot = app.isPackaged ? resources : path.join(resources, 'resources');
    if (!app.isPackaged) {
      const fs = await import('node:fs');
      for (const name of ['companion-extension', 'native-bridge']) fs.cpSync(path.join(resources, name), path.join(resourceRoot, name), {
        recursive: true,
        filter: (source, destination) => fs.statSync(source).isDirectory() || !fs.existsSync(destination) || !fs.readFileSync(source).equals(fs.readFileSync(destination)),
      });
    }
    const accounts = new AccountRepository(handle.db);
    browsers = new BrowserManager(userDataDir, resourceRoot, process.execPath, () => accounts.listAll());
    await browsers.start();
    registerIpcHandlers({ db: handle.db, userDataDir, browsers, resources: resourceRoot });
    createMainWindow();
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createMainWindow(); });
  }).catch(error => { dialog.showErrorBox('Steam Account Manager could not start', String(error.message || error)); app.quit(); });
  app.on('before-quit', () => { browsers?.bridge.close(); closeDatabase?.(); });
  app.on('window-all-closed', () => app.quit());
}
