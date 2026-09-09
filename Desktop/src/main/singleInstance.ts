import { app, BrowserWindow } from "electron";

/**
 * Ensures only one manager window/process runs at a time. Returns false if
 * this process should quit immediately because another instance already
 * holds the lock (Electron will forward the second launch's args to the
 * first instance via 'second-instance').
 */
export function ensureSingleInstance(): boolean {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    return false;
  }

  app.on("second-instance", () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const win = windows[0];
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  return true;
}
