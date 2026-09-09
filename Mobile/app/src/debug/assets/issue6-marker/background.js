let attempts = 0;
function connect() {
  if (attempts++ >= 30) return;
  try {
    const port = browser.runtime.connectNative("issue6Marker");
    let disconnected = false;
    let receivedRead = false;
    let retryScheduled = false;
    const retry = () => {
      if (!retryScheduled) {
        retryScheduled = true;
        setTimeout(connect, 2000);
      }
    };
    const watchdog = setTimeout(() => {
      if (!disconnected && !receivedRead) {
        disconnected = true;
        retry();
        port.disconnect();
      }
    }, 2000);
    port.onMessage.addListener(async message => {
      if (!message || message.type !== "read" || !["A", "B"].includes(message.slot)) return;
      attempts = 0;
      receivedRead = true;
      clearTimeout(watchdog);
      const old = await browser.storage.local.get("slot");
      const prior = old.slot || message.slot;
      if (!old.slot) await browser.storage.local.set({ slot: message.slot });
      port.postMessage({ type: "result", slot: message.slot, prior, current: old.slot || message.slot });
    });
    port.onDisconnect.addListener(() => {
      disconnected = true;
      retry();
    });
  } catch (_) {
    setTimeout(connect, 2000);
  }
}
connect();
