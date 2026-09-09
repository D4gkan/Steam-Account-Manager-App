/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

window.addEventListener('DOMContentLoaded', async () => {
    const requestButton = document.getElementById('requestPermissions');
    if (!requestButton) {
        return;
    }
    const hasPermissions = await chrome.permissions.contains({
        origins: ['*://*.steampowered.com/*'],
    });
    if (hasPermissions) {
        // If permissions are already granted, disable the button
        requestButton.children[1].textContent = 'Offer Tracking Enabled';
        requestButton.setAttribute('disabled', 'true');
    }
    else {
        requestButton.addEventListener('click', async () => {
            try {
                const success = await chrome.permissions.request({
                    origins: ['*://*.steampowered.com/*'],
                });
                if (success) {
                    // extension requires reload to apply permissions
                    browser.runtime.reload();
                }
            }
            catch (error) {
                console.error('Error requesting permissions:', error);
            }
        });
    }
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjL3BvcHVwL3BvcHVwLmpzIiwibWFwcGluZ3MiOiI7OztBQUFBLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLElBQUksRUFBRTtJQUNuRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDcEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ2pCLE9BQU87SUFDWCxDQUFDO0lBRUQsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztRQUNyRCxPQUFPLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQztLQUN4QyxDQUFDLENBQUM7SUFFSCxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLHlEQUF5RDtRQUN6RCxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyx3QkFBd0IsQ0FBQztRQUNqRSxhQUFhLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNuRCxDQUFDO1NBQU0sQ0FBQztRQUNKLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0MsSUFBSSxDQUFDO2dCQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUM7b0JBQzdDLE9BQU8sRUFBRSxDQUFDLDBCQUEwQixDQUFDO2lCQUN4QyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDVixpREFBaUQ7b0JBQ2pELE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzdCLENBQUM7WUFDTCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9wb3B1cC9wb3B1cC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByZXF1ZXN0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcXVlc3RQZXJtaXNzaW9ucycpO1xuICAgIGlmICghcmVxdWVzdEJ1dHRvbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaGFzUGVybWlzc2lvbnMgPSBhd2FpdCBjaHJvbWUucGVybWlzc2lvbnMuY29udGFpbnMoe1xuICAgICAgICBvcmlnaW5zOiBbJyo6Ly8qLnN0ZWFtcG93ZXJlZC5jb20vKiddLFxuICAgIH0pO1xuXG4gICAgaWYgKGhhc1Blcm1pc3Npb25zKSB7XG4gICAgICAgIC8vIElmIHBlcm1pc3Npb25zIGFyZSBhbHJlYWR5IGdyYW50ZWQsIGRpc2FibGUgdGhlIGJ1dHRvblxuICAgICAgICByZXF1ZXN0QnV0dG9uLmNoaWxkcmVuWzFdLnRleHRDb250ZW50ID0gJ09mZmVyIFRyYWNraW5nIEVuYWJsZWQnO1xuICAgICAgICByZXF1ZXN0QnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAndHJ1ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBjaHJvbWUucGVybWlzc2lvbnMucmVxdWVzdCh7XG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbnM6IFsnKjovLyouc3RlYW1wb3dlcmVkLmNvbS8qJ10sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXh0ZW5zaW9uIHJlcXVpcmVzIHJlbG9hZCB0byBhcHBseSBwZXJtaXNzaW9uc1xuICAgICAgICAgICAgICAgICAgICBicm93c2VyLnJ1bnRpbWUucmVsb2FkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXF1ZXN0aW5nIHBlcm1pc3Npb25zOicsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=