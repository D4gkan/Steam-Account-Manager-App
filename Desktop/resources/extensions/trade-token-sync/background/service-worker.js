import {getPartnerSiteStatuses, uploadNewAccessToken, enumerateDomainConfigs} from './partner-sites.js';
import {getSteamAccessToken} from './steam.js';
import {handleContentScriptMessage} from './injected-api.js';

/** @var {PartnerSiteStatus[]} g_PartnerSiteStatuses */
let g_PartnerSiteStatuses = [];
/** @var {SteamAccessTokenData|null} g_SteamAccessTokenData */
let g_SteamAccessTokenData = null;

let g_CookieListenerSyncTimer = null;

export async function doSteamSync() {
	const domainConfigs = await enumerateDomainConfigs();
	if (domainConfigs.length === 0) {
		// No partner sites configured, so we don't need to do anything.
		g_PartnerSiteStatuses = [];
		g_SteamAccessTokenData = null;
		return;
	}

	g_SteamAccessTokenData = await getSteamAccessToken();

	if (!g_SteamAccessTokenData) {
		// Not logged into Steam, so we can't sync up an access token. Fetch partner site statuses instead.
		g_PartnerSiteStatuses = await getPartnerSiteStatuses();
	} else {
		// We are logged into Steam, so attempt to sync access token. This will also fetch partner site statuses.
		g_PartnerSiteStatuses = await uploadNewAccessToken(g_SteamAccessTokenData);
	}

	// Broadcast the updated status to popup
	broadcastStatus();
}

doSteamSync();
setInterval(doSteamSync, 10 * 60 * 1000); // Every 10 minutes

// When service worker starts up, the extension itself has started up. Inject the content script into all existing tabs.
injectContentScriptIntoExistingTabs();

// Set up listener for cookie changes on steamcommunity.com
chrome.cookies.onChanged.addListener((changeInfo) => {
	if (changeInfo.cookie.domain === 'steamcommunity.com' && changeInfo.cookie.name === 'steamLoginSecure') {
		// If steamLoginSecure has changed, delay 10 seconds before triggering a sync. When the cookie is refreshed,
		// we expect to see multiple rapid changes, so we debounce the sync to avoid unnecessary calls.
		clearTimeout(g_CookieListenerSyncTimer);
		g_CookieListenerSyncTimer = setTimeout(doSteamSync, 10 * 1000);
	}
});

// Listen for messages from the popup page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (sender.tab) {
		// This is a message from a content script, so route it to the content script handler
		handleContentScriptMessage(message, sender, sendResponse);
		return true;
	}

	// Message is from some other part of the extension (probably popup)
	switch (message.type) {
		case 'getStatus':
			broadcastStatus();
			break;
	}
});

async function broadcastStatus() {
	try {
		await chrome.runtime.sendMessage({
			type: 'status',
			payload: getStatusPayload()
		});
	} catch (ex) {
		// Ignore errors, which probably just mean no listeners are registered (i.e. popup is not open)
	}
}

/**
 * @returns {{partnerSiteStatuses: PartnerSiteStatus[], steamAccessTokenData: SteamAccessTokenData|null}}
 */
export function getStatusPayload() {
	return {
		partnerSiteStatuses: g_PartnerSiteStatuses,
		steamAccessTokenData: g_SteamAccessTokenData
	};
}

async function injectContentScriptIntoExistingTabs() {
	try {
		const tabs = await chrome.tabs.query({});
		await Promise.all(tabs.map(async (tab) => {
			if (!tab.id || !tab.url || !tab.url.startsWith('http') || tab.status !== 'complete') {
				// Cannot inject into this tab
				return;
			}

			try {
				await chrome.scripting.executeScript({
					target: {tabId: tab.id},
					files: ['content-scripts/universal_injector.js']
				});
			} catch (ex) {
				console.error(`Error injecting universal_injector.js into tab ${tab.id} (${tab.url}):`, ex);
			}
		}));
	} catch (ex) {
		console.error('Error injecting content script into existing tabs:', ex);
	}
}
