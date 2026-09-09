const script = document.createElement('script');
script.src = chrome.runtime.getURL('content-scripts/universal.js');
(document.body || document.head).appendChild(script);

const WHITELISTED_MESSAGES = [
	'checkTabAuthorized',
	'getDomainConfig',
	'setDomainConfig',
	'clearDomainConfig',
	'triggerSync',
	'getStatus'
];

window.addEventListener('message', function (event) {
	if (event.source !== window || !event.data || event.data.source !== '4a9a1079-a8be-410f-9f2e-e6a045bf58ff_request' || !event.data.requestId) {
		return;
	}

	if (!event.data.type || !WHITELISTED_MESSAGES.includes(event.data.type)) {
		console.warn('Received unrecognized message from content script:', event.data);
		window.postMessage({
			source: '4a9a1079-a8be-410f-9f2e-e6a045bf58ff_response',
			requestId: event.data.requestId,
			error: 'Unrecognized message type'
		}, window.origin);
		return;
	}

	chrome.runtime.sendMessage({type: event.data.type, payload: event.data.payload}, function ({response, error}) {
		window.postMessage({
			source: '4a9a1079-a8be-410f-9f2e-e6a045bf58ff_response',
			requestId: event.data.requestId,
			response,
			error
		}, window.origin);
	});
});
