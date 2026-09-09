import { app, BrowserWindow } from "electron";
import * as path from "node:path";

/**
 * Creates the trusted local dashboard window. This window only ever
 * displays app-bundled renderer content -- it must never navigate to or
 * embed a third-party website (those open in the separate, unprivileged
 * Chromium runtime via browserLauncher.ts).
 */
export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#0b0b0d",
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "app-icon.png")
      : path.resolve(__dirname, "..", "..", "..", "app-icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "..", "..", "preload", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  applyContentSecurityPolicy(win);

  // Windows can inherit SW_HIDE from a launcher. Explicitly show the loaded
  // dashboard instead of relying on the constructor's initial visibility.
  win.webContents.once("did-finish-load", () => {
    win.hide();
    win.show();
    win.focus();
  });

  // Refuse any attempt to navigate this privileged window to a remote URL
  // or to open it as a new window pointed at a third-party site.
  win.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile(path.join(__dirname, "..", "..", "renderer", "index.html"));
  }

  return win;
}

function applyContentSecurityPolicy(win: BrowserWindow): void {
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: file:; connect-src 'self';",
        ],
      },
    });
  });
}
