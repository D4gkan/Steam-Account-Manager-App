(function() {
	const EXTENSION_UUID = '4a9a1079-a8be-410f-9f2e-e6a045bf58ff';

	/** @var {{[requestId: string]: {resolve: function, reject: function}}} requestResolvers */
	const requestResolvers = {};

	window[EXTENSION_UUID] = function (requestName, payload) {
		return new Promise(function (resolve, reject) {
			const requestId = uuidGenerate();
			requestResolvers[requestId] = {resolve, reject};

			setTimeout(() => {
				if (!requestResolvers[requestId]) {
					// request already fulfilled
					return;
				}

				delete requestResolvers[requestId];
				reject(new Error('Request timed out'));
			}, 5000); // 5 seconds timeout

			window.postMessage({
				source: EXTENSION_UUID + '_request',
				requestId,
				type: requestName,
				payload
			}, window.origin);
		});
	};

	window.addEventListener('message', function (event) {
		if (event.source !== window || event.data.source !== EXTENSION_UUID + '_response' || !event.data.requestId) {
			return;
		}

		const {requestId} = event.data;
		if (!requestResolvers[requestId]) {
			// No resolver found for this requestId, it might have been already resolved or timed out
			return;
		}

		const {resolve, reject} = requestResolvers[requestId];
		delete requestResolvers[requestId];

		if (event.data.error) {
			reject(new Error(event.data.error));
		} else {
			resolve(event.data.response);
		}
	});

	function uuidGenerate() {
		const array = new Uint8Array(16);
		crypto.getRandomValues(array);
		array[6] = (array[6] & 0x0f) | 0x40; // version 4
		array[8] = (array[8] & 0x3f) | 0x80; // variant 10xx
		const uuidWithoutDashes = Array.from(array).map(b => ('0' + b.toString(16)).slice(-2)).join('');
		return uuidWithoutDashes.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');
	}

	// Inform that the content script is ready
	window.postMessage({source: EXTENSION_UUID + '_ready'}, window.origin);
})();
