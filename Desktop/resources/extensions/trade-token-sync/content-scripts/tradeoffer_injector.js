const script = document.createElement('script');
script.src = chrome.runtime.getURL('content-scripts/tradeoffer.js');
(document.body || document.head).appendChild(script);
