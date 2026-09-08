# Desktop websites and dismissible extension controls

The browser previously used Gecko's mobile defaults and displayed the complete
extension-management/debug panel above the website at all times. Native extension
dialogs also lacked an app-owned close button.

The browser now requests desktop user-agent and viewport modes before opening both
the main website session and extension-created website helper tabs. Official
extension popup documents retain their extension context and layout. Browser and
package versions, profile boundaries, permissions and install consent are unchanged.

Extension controls start collapsed behind **Extensions**. Expanded controls scroll
within 40% of the screen height; **Hide extensions** remains outside that scroll
area. Opening an official popup or visible helper tab collapses the controls.
Both types of dialog have **Back to website**, and Android Back also dismisses
them. Dismissal closes only the popup/helper session and restores the main tab;
it does not disable or uninstall the extension.

## Device checks

1. Open a configured website: it should display the desktop layout.
2. On a supported extension website, verify controls are initially collapsed.
3. Tap Extensions, then Hide extensions. The page should regain its height.
4. Install the supported package using its normal permission prompt.
5. Open its official popup, then tap Back to website. The original page should
   remain available with the controls collapsed.
6. Reopen the popup to verify the extension is still enabled; dismiss with Android Back.
7. For an extension login helper, verify desktop layout and the same return button.

The emulator regression fixture checks the actual page's `navigator.userAgent` and
desktop viewport width on a generic website and a CSFloat website, plus control
expansion/collapse. A separate official CSFloat regression covers popup close,
reopen and Android Back without revocation. These checks do not establish
authenticated trading or long-duration background tracking behavior.
