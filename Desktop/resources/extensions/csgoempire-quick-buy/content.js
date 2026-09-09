(() => {
  "use strict";

  const LOG_PREFIX = "[CSGOEmpire Quick Buy v1.0.2]";
  const log = (...args) => console.info(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  log("Content script loaded", location.href);

  // Remove state left on DOM nodes by older versions of the extension. Vue can
  // detach a node during cleanup and reuse it later, including its old classes.
  document.documentElement.classList.remove("emp-two-click-active");
  document
    .querySelectorAll(".emp-two-click-original-hidden")
    .forEach((button) => button.classList.remove("emp-two-click-original-hidden"));
  document
    .querySelectorAll(".emp-two-click-hidden-panel")
    .forEach((panel) => panel.classList.remove("emp-two-click-hidden-panel"));

  let buyMode = "two";
  let closeResponsiveSidebar = false;
  chrome.storage.sync.get({ buyMode: "two", closeResponsiveSidebar: false }, (settings) => {
    buyMode = ["one", "two", "off"].includes(settings.buyMode) ? settings.buyMode : "two";
    closeResponsiveSidebar = settings.closeResponsiveSidebar === true;
    log("Purchase mode loaded", buyMode === "off" ? "disabled" : `${buyMode}-click`);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.buyMode) {
      const nextMode = changes.buyMode.newValue;
      buyMode = ["one", "two", "off"].includes(nextMode) ? nextMode : "two";
      log("Purchase mode changed", buyMode === "off" ? "disabled" : `${buyMode}-click`);
      if (buyMode === "off" && STATE.phase !== "idle") cleanup({ closeNative: true });
    }
    if (area === "sync" && changes.closeResponsiveSidebar) {
      closeResponsiveSidebar = changes.closeResponsiveSidebar.newValue === true;
      log("Close responsive sidebar after purchase", closeResponsiveSidebar);
    }
  });

  const STATE = {
    originalButton: null,
    confirmButton: null,
    cancelButton: null,
    actions: null,
    hiddenPanel: null,
    timeout: null,
    pendingPoll: null,
    activePoll: null,
    anchor: null,
    uiConfirm: null,
    advancedSidebarStep: false,
    autoConfirmTriggered: false,
    phase: "idle",
    runId: 0,
    mount: null,
    mountParent: null,
    openedResponsiveTradePanel: false,
    waitStartedAt: 0,
  };

  const text = (element) =>
    (element?.innerText || element?.textContent || "").replace(/\s+/g, " ").trim();

  const isVisible = (element) => {
    if (!(element instanceof HTMLElement)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      rect.width > 1 &&
      rect.height > 1
    );
  };

  const isInitialBuyButton = (element) => {
    const button = element.closest?.("button, [role='button']");
    if (!button || !isVisible(button) || button.dataset.empTwoClick) return null;
    if (
      button.id === "trade-sidebar-main-action-button-confirm" ||
      button.id === "trade-sidebar-main-action-button-cancel" ||
      button.closest("[data-testid*='trade-sidebar' i], [id*='trade-sidebar' i]")
    ) {
      return null;
    }
    return /^buy(?:\s|$)/i.test(text(button)) ? button : null;
  };

  const isConfirmationText = (value) => /^confirm(?: purchase)?(?:\s|$)/i.test(value);

  const findConfirmButton = () => {
    const exact = document.querySelector("#trade-sidebar-main-action-button-confirm");
    if (
      exact &&
      exact !== STATE.originalButton &&
      isVisible(exact) &&
      isConfirmationText(text(exact))
    ) {
      return exact;
    }

    const candidates = document.querySelectorAll("button, [role='button']");
    for (const candidate of candidates) {
      if (
        candidate !== STATE.originalButton &&
        isVisible(candidate) &&
        isConfirmationText(text(candidate))
      ) {
        return candidate;
      }
    }
    return null;
  };

  const findCancelButton = () => {
    const exact = document.querySelector("#trade-sidebar-main-action-button-cancel");
    if (exact && isVisible(exact)) return exact;
    return [...document.querySelectorAll("button, [role='button']")].find(
      (candidate) => candidate !== STATE.originalButton && isVisible(candidate) && /^cancel$/i.test(text(candidate))
    );
  };

  const findSidebarAdvanceButton = () => {
    const candidates = document.querySelectorAll("button, [role='button']");
    for (const candidate of candidates) {
      const value = text(candidate);
      const tradeIdentity = `${candidate.id} ${candidate.dataset.testid || ""}`;
      const belongsToTradeSidebar =
        /trade-sidebar/i.test(tradeIdentity) ||
        Boolean(candidate.closest("[data-testid*='trade-sidebar' i], [id*='trade-sidebar' i]"));
      if (
        candidate !== STATE.originalButton &&
        !candidate.dataset.empTwoClick &&
        isVisible(candidate) &&
        (/^buy\s+\d+\s+items?(?:\s|$)/i.test(value) ||
          (belongsToTradeSidebar && /^buy(?:\s|$)/i.test(value)))
      ) {
        return candidate;
      }
    }
    return null;
  };

  const findSidebar = (button) => {
    const identifiedPanel = button.parentElement?.closest(
      "aside, [role='dialog'], [data-testid='trade-sidebar'], [id='trade-sidebar']"
    );
    if (identifiedPanel) return identifiedPanel;

    let node = button.parentElement;
    while (node && node !== document.body) {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const nearEdge = rect.right >= innerWidth - 4 || rect.left <= 4;
      const panelSized = rect.width >= 240 && rect.width <= Math.min(720, innerWidth * 0.8);
      if ((style.position === "fixed" || style.position === "absolute") && nearEdge && panelSized) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  const cleanup = ({ closeNative = false } = {}) => {
    log("Cleaning up confirmation UI", { closeNative });
    STATE.phase = "closing";
    STATE.runId += 1;
    clearTimeout(STATE.timeout);
    clearInterval(STATE.pendingPoll);
    clearInterval(STATE.activePoll);
    const nativeCancel =
      document.querySelector("#trade-sidebar-main-action-button-cancel") || STATE.cancelButton;
    STATE.actions?.remove();
    STATE.mount?.remove();
    document.documentElement.classList.remove("emp-two-click-active");
    document
      .querySelectorAll(".emp-two-click-original-hidden")
      .forEach((button) => button.classList.remove("emp-two-click-original-hidden"));
    STATE.hiddenPanel?.classList.remove("emp-two-click-hidden-panel");

    if (closeNative) {
      if (nativeCancel?.isConnected) {
        nativeCancel.click();
      } else {
        const close = STATE.hiddenPanel?.querySelector(
          "button[aria-label*='close' i], button[title*='close' i], [data-testid*='close' i]"
        );
        close?.click();
        if (!close) {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        }
      }
    }

    STATE.originalButton = null;
    STATE.confirmButton = null;
    STATE.cancelButton = null;
    STATE.actions = null;
    STATE.hiddenPanel = null;
    STATE.timeout = null;
    STATE.pendingPoll = null;
    STATE.activePoll = null;
    STATE.anchor = null;
    STATE.uiConfirm = null;
    STATE.advancedSidebarStep = false;
    STATE.mount = null;
    STATE.mountParent = null;
    STATE.openedResponsiveTradePanel = false;
    STATE.waitStartedAt = 0;
    STATE.phase = "idle";
  };

  const syncActiveUi = () => {
    if (!STATE.actions || !STATE.anchor) return;

    const exactConfirm = document.querySelector("#trade-sidebar-main-action-button-confirm");
    const nativeConfirm =
      exactConfirm && isConfirmationText(text(exactConfirm)) ? exactConfirm : null;
    const nativeCancel = document.querySelector("#trade-sidebar-main-action-button-cancel");
    STATE.confirmButton = nativeConfirm;
    STATE.cancelButton = nativeCancel;
    if (STATE.uiConfirm) {
      STATE.uiConfirm.disabled =
        !STATE.confirmButton ||
        STATE.confirmButton.disabled ||
        STATE.confirmButton.getAttribute("aria-disabled") === "true";
    }

    attemptOneClickConfirm();
    if (!STATE.actions || !STATE.anchor) return;

    const currentPanel = STATE.confirmButton && findSidebar(STATE.confirmButton);
    if (currentPanel && currentPanel !== STATE.hiddenPanel) {
      STATE.hiddenPanel?.classList.remove("emp-two-click-hidden-panel");
      STATE.hiddenPanel = currentPanel;
    }
    STATE.hiddenPanel?.classList.add("emp-two-click-hidden-panel");

    const exactBuy = document.querySelector("#item-page-buy-withdraw");
    if (exactBuy) {
      STATE.originalButton = exactBuy;
      STATE.mountParent = exactBuy.parentElement;
      if (!STATE.mount?.isConnected || STATE.mount.parentElement !== exactBuy.parentElement) {
        exactBuy.before(STATE.mount);
      }
    } else if (!STATE.mount?.isConnected && STATE.mountParent?.isConnected) {
      STATE.mountParent.append(STATE.mount);
    }
  };

  const nativeConfirmIsReady = (button) =>
    Boolean(
      button?.isConnected &&
        !button.disabled &&
        button.getAttribute("aria-disabled") !== "true"
    );

  const closeResponsiveSidebarAfterPurchase = (extensionOpenedIt) => {
    if (!closeResponsiveSidebar || !extensionOpenedIt) return;
    setTimeout(() => {
      const tradeButton = document.querySelector("#trade-button");
      const sidebarStillOpen = [...document.querySelectorAll("button, [role='button']")].some(
        (button) =>
          /trade-sidebar-main-action-button/i.test(`${button.id} ${button.dataset.testid || ""}`) &&
          isVisible(button)
      );
      if (tradeButton && isVisible(tradeButton) && sidebarStillOpen) {
        log("Closing the responsive trade sidebar after purchase");
        tradeButton.click();
      }
    }, 400);
  };

  const attemptOneClickConfirm = () => {
    if (buyMode !== "one" || STATE.autoConfirmTriggered) return;
    const nativeConfirm =
      document.querySelector("#trade-sidebar-main-action-button-confirm") || STATE.confirmButton;
    if (!nativeConfirmIsReady(nativeConfirm) || !isConfirmationText(text(nativeConfirm))) return;

    STATE.autoConfirmTriggered = true;
    log("One-click mode: forwarding final confirmation automatically");
    const extensionOpenedSidebar = STATE.openedResponsiveTradePanel;
    cleanup();
    nativeConfirm.click();
    closeResponsiveSidebarAfterPurchase(extensionOpenedSidebar);
  };

  const showInlineConfirmation = (confirmButton) => {
    if (STATE.actions || STATE.phase !== "waiting") return;

    if (!STATE.mount?.isConnected && STATE.anchor) {
      const exactBuy = document.querySelector("#item-page-buy-withdraw");
      if (exactBuy) {
        STATE.originalButton = exactBuy;
        STATE.mountParent = exactBuy.parentElement;
        exactBuy.before(STATE.mount);
      } else if (STATE.mountParent?.isConnected) {
        STATE.mountParent.append(STATE.mount);
      }
    }
    if (!STATE.mount?.isConnected) {
      warn("Native Confirm was found, but the reserved Buy-button slot was removed");
      cleanup({ closeNative: true });
      return;
    }

    log("Native confirmation found; replacing Buy button", confirmButton);

    clearTimeout(STATE.timeout);
    clearInterval(STATE.pendingPoll);
    STATE.pendingPoll = null;
    STATE.phase = "active";

    STATE.confirmButton = confirmButton;
    STATE.cancelButton = findCancelButton();
    STATE.hiddenPanel = findSidebar(confirmButton);
    STATE.hiddenPanel?.classList.add("emp-two-click-hidden-panel");

    const actions = document.createElement("div");
    actions.className = "emp-two-click-actions";
    actions.dataset.empTwoClick = "true";
    actions.style.width = "100%";
    actions.style.height = "100%";

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "emp-two-click-confirm";
    confirm.dataset.empTwoClick = "true";
    confirm.textContent = "Confirm";
    confirm.addEventListener("click", () => {
      const nativeConfirm =
        document.querySelector("#trade-sidebar-main-action-button-confirm") || STATE.confirmButton;
      if (!nativeConfirmIsReady(nativeConfirm) || !isConfirmationText(text(nativeConfirm))) {
        warn("Confirm clicked while the native Confirm button is unavailable or disabled");
        return;
      }
      log("Confirm clicked; forwarding to native button");
      const extensionOpenedSidebar = STATE.openedResponsiveTradePanel;
      cleanup();
      nativeConfirm.click();
      closeResponsiveSidebarAfterPurchase(extensionOpenedSidebar);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "emp-two-click-cancel";
    cancel.dataset.empTwoClick = "true";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => {
      log("Cancel clicked; forwarding to native button");
      cleanup({ closeNative: true });
    });

    // Put the replacement in the exact layout slot occupied by Buy. The
    // original stays in the DOM for the site's framework, but is not shown.
    STATE.mount.append(actions);
    document.documentElement.classList.add("emp-two-click-active");
    actions.append(cancel, confirm);
    STATE.actions = actions;
    STATE.uiConfirm = confirm;

    // Vue may replace either the Buy button or the sidebar DOM at any time.
    // Keep the replacement attached and always refresh the native controls.
    STATE.activePoll = setInterval(syncActiveUi, 100);
    syncActiveUi();
  };

  const watchForNativeConfirmation = () => {
    const runId = STATE.runId;
    log("Waiting for native sidebar confirmation");
    const existing = findConfirmButton();
    if (existing) return showInlineConfirmation(existing);

    const pendingPoll = setInterval(() => {
      if (STATE.runId !== runId || STATE.phase !== "waiting") {
        clearInterval(pendingPoll);
        return;
      }
      const confirm = findConfirmButton();
      if (confirm) {
        showInlineConfirmation(confirm);
        return;
      }

      if (!STATE.advancedSidebarStep) {
        const advance = findSidebarAdvanceButton();
        if (advance) {
          STATE.advancedSidebarStep = true;
          log("Intermediate sidebar Buy button found; advancing to final confirmation", {
            text: text(advance),
            id: advance.id,
          });
          advance.click();
          return;
        }
      }

      if (
        !STATE.openedResponsiveTradePanel &&
        performance.now() - STATE.waitStartedAt >= 600
      ) {
        const tradeButton = document.querySelector("#trade-button");
        if (tradeButton && isVisible(tradeButton)) {
          STATE.openedResponsiveTradePanel = true;
          log("Responsive layout detected; opening the trade sidebar", tradeButton);
          tradeButton.click();
        }
      }
    }, 50);
    STATE.pendingPoll = pendingPoll;

    const timeout = setTimeout(() => {
      if (STATE.runId !== runId || STATE.phase !== "waiting") return;
      const sidebarButtons = [...document.querySelectorAll("button, [role='button']")]
        .filter((button) => /trade-sidebar/i.test(`${button.id} ${button.dataset.testid || ""}`))
        .map((button) => ({ id: button.id, text: text(button), visible: isVisible(button) }));
      warn("Timed out after 10 seconds without finding a native Confirm button", {
        sidebarButtons,
      });
      clearInterval(pendingPoll);
      STATE.pendingPoll = null;
      cleanup();
    }, 10000);
    STATE.timeout = timeout;
  };

  document.addEventListener(
    "click",
    (event) => {
      if (STATE.phase !== "idle" || STATE.actions || event.button !== 0) return;
      const clickedControl = event.target.closest?.("button, [role='button']");
      if (clickedControl) log("Button clicked", { text: text(clickedControl), id: clickedControl.id });
      if (buyMode === "off") return;
      const buyButton = isInitialBuyButton(event.target);
      if (!buyButton) return;

      log("Buy click detected", buyButton);

      STATE.phase = "waiting";
      STATE.runId += 1;
      STATE.advancedSidebarStep = false;
      STATE.autoConfirmTriggered = false;
      STATE.openedResponsiveTradePanel = false;
      STATE.waitStartedAt = performance.now();

      // Do not prevent the site's click. Its own code must create the native
      // confirmation so price, availability, and account checks remain intact.
      STATE.originalButton = buyButton;
      const rect = buyButton.getBoundingClientRect();
      STATE.anchor = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      };
      const mount = document.createElement("div");
      mount.className = "emp-two-click-mount";
      mount.dataset.empTwoClick = "true";
      mount.style.width = `${Math.max(180, rect.width)}px`;
      mount.style.height = `${Math.max(40, rect.height)}px`;
      STATE.mount = mount;
      STATE.mountParent = buyButton.parentElement;
      buyButton.before(mount);
      queueMicrotask(watchForNativeConfirmation);
    },
    true
  );

})();
