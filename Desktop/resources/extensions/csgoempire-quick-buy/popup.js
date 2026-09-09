(() => {
  "use strict";

  const radios = [...document.querySelectorAll("input[name='buyMode']")];
  const warning = document.querySelector("#warning");
  const status = document.querySelector("#status");
  const closeSidebar = document.querySelector("#closeResponsiveSidebar");

  const render = (mode) => {
    const safeMode = ["one", "two", "off"].includes(mode) ? mode : "two";
    document.querySelector(`input[value='${safeMode}']`).checked = true;
    warning.hidden = safeMode !== "one";
    status.textContent =
      safeMode === "off"
        ? "Quick Buy is disabled."
        : `${safeMode === "one" ? "One" : "Two"}-click mode is active.`;
  };

  chrome.storage.sync.get(
    { buyMode: "two", closeResponsiveSidebar: false },
    ({ buyMode, closeResponsiveSidebar }) => {
      render(buyMode);
      closeSidebar.checked = closeResponsiveSidebar === true;
    }
  );

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      chrome.storage.sync.set({ buyMode: radio.value }, () => render(radio.value));
    });
  });

  closeSidebar.addEventListener("change", () => {
    chrome.storage.sync.set({ closeResponsiveSidebar: closeSidebar.checked });
  });
})();
