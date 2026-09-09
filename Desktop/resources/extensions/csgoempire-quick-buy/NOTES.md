# CSGOEmpire Quick Buy

This Chrome/Edge extension keeps CSGOEmpire's native purchase flow, but removes
the original Buy button after it is clicked and replaces it in-place with a
dark **Cancel** button and yellow **Confirm** button:

1. Click **Buy**.
2. Click **Confirm** or **Cancel** in the same area.

The extension does not call a purchase API or skip the website's confirmation.
It waits for the website to create its own confirmation button and then proxies
your second click to that button.

Click the extension icon to switch between **Two-click** (the default) and
**One-click** buying. One-click mode completes the site's final confirmation
automatically after the first Buy click.

Choose **Disabled** to turn Quick Buy off and use the website's original buying
interface.

The optional **Close responsive sidebar** setting closes a trade panel that the
extension opened after the purchase completes.

## Install locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this folder.
5. Reload any open CSGOEmpire tabs.

## Safety behavior

- If the native confirmation does not appear within five seconds, nothing is
  changed and the normal website UI remains available.
- The inline controls disappear on scroll or resize, preventing a confirmation
  from remaining over the wrong item.
- The site's real confirmation button is still the only element that executes
  the purchase.

CSGOEmpire may change its UI. Test this first on an inexpensive item and verify
the displayed item and price before confirming.
