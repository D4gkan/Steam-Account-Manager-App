/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 0:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   init: () => (/* binding */ init)
/* harmony export */ });
/* harmony import */ var _bridge_handlers_execute_script__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _bridge_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _utils_snips__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _bridge_handlers_execute_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(10);
/* harmony import */ var _bridge_handlers_fetch_extension_file__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(11);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9);







async function initiateChromium(scriptPath) {
    (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_execute_css__WEBPACK_IMPORTED_MODULE_3__.ExecuteCssOnPage, {
        path: 'src/global.css',
    });
    (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_execute_script__WEBPACK_IMPORTED_MODULE_0__.ExecuteScriptOnPage, {
        path: scriptPath,
    });
}
async function initiateFirefox(scriptPath) {
    _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_6__.g_PostMessageBus.handleRequests();
    // Why do we need to use manual DOM script injection and
    // fetch the text of the script?
    // See https://github.com/csfloat/extension/issues/155#issuecomment-1639781914
    // We want to inject the ID of the extension
    const id = browser.runtime.id;
    const entryScript = document.createElement('script');
    entryScript.appendChild(document.createTextNode(`
        window.CSFLOAT_EXTENSION_ID = '${id}';
    `));
    document.head.appendChild(entryScript);
    const scriptResp = await (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_fetch_extension_file__WEBPACK_IMPORTED_MODULE_4__.FetchExtensionFile, {
        path: scriptPath,
    });
    const script = document.createElement('script');
    script.appendChild(document.createTextNode(scriptResp.text));
    document.head.appendChild(script);
    const styleResp = await (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_fetch_extension_file__WEBPACK_IMPORTED_MODULE_4__.FetchExtensionFile, {
        path: 'src/global.css',
    });
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(styleResp.text));
    document.head.appendChild(style);
}
/**
 * Initializes a page script, executing it in the page context if necessary
 *
 * @param scriptPath Relative path of the script (always in .js)
 * @param ifPage Fn to run if we are in the page's execution context
 */
async function init(scriptPath, ifPage) {
    // Don't allow the page script to run this.
    if ((0,_utils_snips__WEBPACK_IMPORTED_MODULE_2__.inPageContext)()) {
        // @ts-ignore Set global identifier for other extensions to use
        window.csfloat = true;
        // @ts-ignore Deprecated name
        window.csgofloat = true;
        ifPage();
        return;
    }
    if ((0,_utils_detect__WEBPACK_IMPORTED_MODULE_5__.isFirefox)()) {
        await initiateFirefox(scriptPath);
    }
    else {
        await initiateChromium(scriptPath);
    }
    console.log(`%c CSFloat Market Checker (v${chrome.runtime.getManifest().version}) by Step7750 `, 'background: #004594; color: #fff;');
    console.log('%c Changelog can be found here: https://github.com/csfloat/extension ', 'background: #004594; color: #fff;');
}


/***/ }),

/***/ 1:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExecuteScriptOnPage: () => (/* binding */ ExecuteScriptOnPage)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



const ExecuteScriptOnPage = new _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__.PrivilegedHandler(new _main__WEBPACK_IMPORTED_MODULE_0__.EmptyResponseHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.EXECUTE_SCRIPT_ON_PAGE, async (req, sender) => {
    var _a, _b;
    // We need to inject the extension ID dynamically so the client knows who to
    // communicate with.
    //
    // On Firefox, extension IDs are random, so this is necessary.
    await chrome.scripting.executeScript({
        target: { tabId: (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id },
        world: 'MAIN',
        args: [chrome.runtime.id],
        func: function ExtensionId(extensionId) {
            window.CSFLOAT_EXTENSION_ID = extensionId;
        },
    });
    await chrome.scripting.executeScript({
        target: { tabId: (_b = sender.tab) === null || _b === void 0 ? void 0 : _b.id },
        files: [req.path],
        world: 'MAIN',
    });
}));


/***/ }),

/***/ 2:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EmptyRequestHandler: () => (/* binding */ EmptyRequestHandler),
/* harmony export */   EmptyResponseHandler: () => (/* binding */ EmptyResponseHandler),
/* harmony export */   SimpleHandler: () => (/* binding */ SimpleHandler)
/* harmony export */ });
class SimpleHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(request, sender);
    }
}
class EmptyRequestHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(sender);
    }
}
class EmptyResponseHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(request, sender);
    }
}


/***/ }),

/***/ 3:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RequestType: () => (/* binding */ RequestType)
/* harmony export */ });
var RequestType;
(function (RequestType) {
    RequestType[RequestType["EXECUTE_SCRIPT_ON_PAGE"] = 0] = "EXECUTE_SCRIPT_ON_PAGE";
    RequestType[RequestType["EXECUTE_CSS_ON_PAGE"] = 1] = "EXECUTE_CSS_ON_PAGE";
    RequestType[RequestType["FETCH_INSPECT_INFO"] = 2] = "FETCH_INSPECT_INFO";
    RequestType[RequestType["FETCH_STALL"] = 3] = "FETCH_STALL";
    RequestType[RequestType["STORAGE_GET"] = 4] = "STORAGE_GET";
    RequestType[RequestType["STORAGE_SET"] = 5] = "STORAGE_SET";
    RequestType[RequestType["STORAGE_REMOVE"] = 6] = "STORAGE_REMOVE";
    RequestType[RequestType["FETCH_PENDING_TRADES"] = 7] = "FETCH_PENDING_TRADES";
    RequestType[RequestType["FETCH_EXTENSION_FILE"] = 8] = "FETCH_EXTENSION_FILE";
    RequestType[RequestType["ANNOTATE_OFFER"] = 9] = "ANNOTATE_OFFER";
    RequestType[RequestType["EXTENSION_VERSION"] = 10] = "EXTENSION_VERSION";
    RequestType[RequestType["TRADE_HISTORY_STATUS"] = 11] = "TRADE_HISTORY_STATUS";
    RequestType[RequestType["TRADE_OFFER_STATUS"] = 12] = "TRADE_OFFER_STATUS";
    RequestType[RequestType["HAS_PERMISSIONS"] = 13] = "HAS_PERMISSIONS";
    RequestType[RequestType["PING_SETUP_EXTENSION"] = 14] = "PING_SETUP_EXTENSION";
    RequestType[RequestType["PING_EXTENSION_STATUS"] = 15] = "PING_EXTENSION_STATUS";
    RequestType[RequestType["PING_CANCEL_TRADE"] = 16] = "PING_CANCEL_TRADE";
    RequestType[RequestType["CREATE_TRADE_OFFER"] = 17] = "CREATE_TRADE_OFFER";
    RequestType[RequestType["FETCH_STEAM_USER"] = 18] = "FETCH_STEAM_USER";
    RequestType[RequestType["PING_TRADE_STATUS"] = 19] = "PING_TRADE_STATUS";
    RequestType[RequestType["PING_STATUS"] = 20] = "PING_STATUS";
    RequestType[RequestType["FETCH_OWN_INVENTORY"] = 21] = "FETCH_OWN_INVENTORY";
    RequestType[RequestType["CANCEL_TRADE_OFFER"] = 22] = "CANCEL_TRADE_OFFER";
    RequestType[RequestType["FETCH_STEAM_TRADES"] = 23] = "FETCH_STEAM_TRADES";
    RequestType[RequestType["FETCH_BLOCKED_USERS"] = 24] = "FETCH_BLOCKED_USERS";
    RequestType[RequestType["PING_BLOCKED_USERS"] = 25] = "PING_BLOCKED_USERS";
    RequestType[RequestType["FETCH_BLUEGEM"] = 26] = "FETCH_BLUEGEM";
    RequestType[RequestType["LIST_ITEM"] = 27] = "LIST_ITEM";
    RequestType[RequestType["FETCH_RECOMMENDED_PRICE"] = 28] = "FETCH_RECOMMENDED_PRICE";
    RequestType[RequestType["FETCH_CSFLOAT_ME"] = 29] = "FETCH_CSFLOAT_ME";
    RequestType[RequestType["PING_ROLLBACK_TRADE"] = 30] = "PING_ROLLBACK_TRADE";
    RequestType[RequestType["FETCH_TRADE_HISTORY"] = 31] = "FETCH_TRADE_HISTORY";
    RequestType[RequestType["FETCH_SLIM_TRADES"] = 32] = "FETCH_SLIM_TRADES";
    RequestType[RequestType["NOTARY_PROVE"] = 33] = "NOTARY_PROVE";
    RequestType[RequestType["FETCH_NOTARY_META"] = 34] = "FETCH_NOTARY_META";
    RequestType[RequestType["FETCH_NOTARY_TOKEN"] = 35] = "FETCH_NOTARY_TOKEN";
    RequestType[RequestType["FETCH_STEAM_POWERED_INVENTORY"] = 36] = "FETCH_STEAM_POWERED_INVENTORY";
    RequestType[RequestType["FETCH_REVERSAL_STATUS"] = 37] = "FETCH_REVERSAL_STATUS";
    RequestType[RequestType["FETCH_INSPECT_INFO_BATCH"] = 38] = "FETCH_INSPECT_INFO_BATCH";
})(RequestType || (RequestType = {}));


/***/ }),

/***/ 4:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PrivilegedHandler: () => (/* binding */ PrivilegedHandler)
/* harmony export */ });
/**
 * Restricts a given handler such that it can only run if the sender is
 * verified to be from the extension's origin (ie. content script)
 */
class PrivilegedHandler {
    constructor(handler) {
        this.handler = handler;
    }
    getType() {
        return this.handler.getType();
    }
    handleRequest(request, sender) {
        if (sender.id !== chrome.runtime.id) {
            throw new Error('Attempt to access restricted method outside of secure context (ie. content script)');
        }
        return this.handler.handleRequest(request, sender);
    }
}


/***/ }),

/***/ 5:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ClientSend: () => (/* binding */ ClientSend)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _utils_snips__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9);




function canUseSendMessage() {
    // Not supported in Firefox Page Context
    return !((0,_utils_detect__WEBPACK_IMPORTED_MODULE_1__.isFirefox)() && (0,_utils_snips__WEBPACK_IMPORTED_MODULE_2__.inPageContext)());
}
/**
 * Send a request to be handled by the background worker
 *
 * Can be called from a content script or page itself
 */
async function ClientSend(handler, args) {
    const bundle = {
        version: _types__WEBPACK_IMPORTED_MODULE_0__.Version.V1,
        request_type: handler.getType(),
        request: args,
        id: Math.ceil(Math.random() * 100000000000),
    };
    if (canUseSendMessage()) {
        return new Promise((resolve, reject) => {
            // @ts-ignore Bad types
            (0,_utils_detect__WEBPACK_IMPORTED_MODULE_1__.runtimeNamespace)().runtime.sendMessage(window.CSFLOAT_EXTENSION_ID || chrome.runtime.id, bundle, (resp) => {
                if (resp === null || resp === void 0 ? void 0 : resp.error) {
                    reject(resp.error);
                }
                else {
                    resolve(resp === null || resp === void 0 ? void 0 : resp.response);
                }
            });
        });
    }
    else {
        // Fallback to postmessage bus for browsers that don't implement
        // specs fully
        return _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_3__.g_PostMessageBus.sendRequest(bundle);
    }
}


/***/ }),

/***/ 6:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Version: () => (/* binding */ Version)
/* harmony export */ });
var Version;
(function (Version) {
    Version["V1"] = "CSFLOAT_V1";
})(Version || (Version = {}));


/***/ }),

/***/ 7:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFirefox: () => (/* binding */ isFirefox),
/* harmony export */   runtimeNamespace: () => (/* binding */ runtimeNamespace)
/* harmony export */ });
function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
/**
 * Thanks to our browser overlords, we have two namespaces for `x.runtime.fn()`
 */
function runtimeNamespace() {
    if (isFirefox()) {
        return browser;
    }
    else {
        return chrome;
    }
}


/***/ }),

/***/ 8:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   inPageContext: () => (/* binding */ inPageContext)
/* harmony export */ });
/* unused harmony export wait */
function inPageContext() {
    return typeof chrome === 'undefined' || !chrome.extension;
}
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


/***/ }),

/***/ 9:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   g_PostMessageBus: () => (/* binding */ g_PostMessageBus)
/* harmony export */ });
/* harmony import */ var _bridge_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);


/**
 * Message bus that uses `postMessage` in order to communicate with the background
 * service worker/script.
 *
 * Why? Because the client page (ie. Steam page) on Firefox is not capable of
 * sending a message directly to the extension background.
 *
 * So it requires us to do the following dance:
 * page <--(postmessage)--> content script <--(sendmessage)--> background script
 *
 * This dance is abstracted in `ClientSend`, and only uses this bus if
 * `sendmessage` is not supported in the page.
 */
class PostMessageBus {
    /**
     * For the requester (ie. page), to wait until it gets a response
     * from the content script via. postMessage for the given request ID
     *
     * @param id Request ID
     */
    waitUntilResponseFor(id) {
        return new Promise((resolve, reject) => {
            const handler = (e) => {
                const resp = e.data;
                if (resp.id !== id || !resp.response) {
                    return;
                }
                // Prevent leaks
                window.removeEventListener('message', handler, false);
                if (resp === null || resp === void 0 ? void 0 : resp.response) {
                    resolve(resp.response);
                }
                else {
                    reject(resp === null || resp === void 0 ? void 0 : resp.error);
                }
            };
            window.addEventListener('message', handler);
        });
    }
    /**
     * Sends a request to be done through the bus, returns the appropriate
     * response for the input bundle handler
     *
     * @param bundle Request Bundle
     */
    sendRequest(bundle) {
        window.postMessage(bundle);
        return this.waitUntilResponseFor(bundle.id);
    }
    /**
     * Request handler (content script) for new requests from the page.
     *
     * Each request is effectively "proxied" to the background script/worker
     * to actually execute it's handler.
     */
    handleRequests() {
        const h = (e) => {
            if (e.data.version !== _bridge_types__WEBPACK_IMPORTED_MODULE_0__.Version.V1 || !e.data.request) {
                // Ignore messages that aren't for this bridge
                return;
            }
            // Send to the background script
            // @ts-ignore Bad types
            (0,_utils_detect__WEBPACK_IMPORTED_MODULE_1__.runtimeNamespace)().runtime.sendMessage(chrome.runtime.id, e.data, 
            // @ts-ignore Bad types
            (resp) => {
                window.postMessage(resp);
            });
        };
        window.addEventListener('message', h);
    }
}
const g_PostMessageBus = new PostMessageBus();


/***/ }),

/***/ 10:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExecuteCssOnPage: () => (/* binding */ ExecuteCssOnPage)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



const ExecuteCssOnPage = new _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__.PrivilegedHandler(new _main__WEBPACK_IMPORTED_MODULE_0__.EmptyResponseHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.EXECUTE_CSS_ON_PAGE, async (req, sender) => {
    var _a;
    await chrome.scripting.insertCSS({
        target: { tabId: (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id },
        files: [req.path],
    });
}));


/***/ }),

/***/ 11:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FetchExtensionFile: () => (/* binding */ FetchExtensionFile)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



const FetchExtensionFile = new _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__.PrivilegedHandler(new _main__WEBPACK_IMPORTED_MODULE_0__.SimpleHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.FETCH_EXTENSION_FILE, async (req) => {
    const url = chrome.runtime.getURL(req.path);
    const r = await fetch(url);
    const text = await r.text();
    return {
        text,
    };
}));


/***/ }),

/***/ 60:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExtensionVersion: () => (/* binding */ ExtensionVersion)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);



const ExtensionVersion = new _main__WEBPACK_IMPORTED_MODULE_0__.EmptyRequestHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.EXTENSION_VERSION, async (req) => {
    const manifest = (0,_utils_detect__WEBPACK_IMPORTED_MODULE_2__.runtimeNamespace)().runtime.getManifest();
    return {
        version: manifest.version,
    };
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var _bridge_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _bridge_handlers_extension_version__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(60);



(0,_utils__WEBPACK_IMPORTED_MODULE_0__.init)('src/lib/page_scripts/csfloat.js', main);
async function main() {
    // @ts-ignore
    window.CSFLOAT_EXTENSION_ENABLED = true;
    const resp = await (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_extension_version__WEBPACK_IMPORTED_MODULE_2__.ExtensionVersion, {});
    // @ts-ignore
    window.CSFLOAT_EXTENSION_VERSION = resp.version;
}

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7Ozs7OztBQ0E2QjtBQUNlO0FBQzBCO0FBRXRFLDRDQUFJLENBQUMsaUNBQWlDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFOUMsS0FBSyxVQUFVLElBQUk7SUFDZixhQUFhO0lBQ2IsTUFBTSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQztJQUN4QyxNQUFNLElBQUksR0FBRyxNQUFNLDBEQUFVLENBQUMsZ0ZBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEQsYUFBYTtJQUNiLE1BQU0sQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3BELENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvbGliL3BhZ2Vfc2NyaXB0cy91dGlscy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9oYW5kbGVycy9leGVjdXRlX3NjcmlwdC50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9oYW5kbGVycy9tYWluLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL3R5cGVzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL3dyYXBwZXJzL3ByaXZpbGVnZWQudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvY2xpZW50LnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL3R5cGVzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvdXRpbHMvZGV0ZWN0LnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvdXRpbHMvc25pcHMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9idXMvcG9zdF9tZXNzYWdlX2J1cy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9oYW5kbGVycy9leGVjdXRlX2Nzcy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9oYW5kbGVycy9mZXRjaF9leHRlbnNpb25fZmlsZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9oYW5kbGVycy9leHRlbnNpb25fdmVyc2lvbi50cyIsIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL3BhZ2Vfc2NyaXB0cy9jc2Zsb2F0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RXhlY3V0ZVNjcmlwdE9uUGFnZX0gZnJvbSAnLi4vYnJpZGdlL2hhbmRsZXJzL2V4ZWN1dGVfc2NyaXB0JztcbmltcG9ydCB7Q2xpZW50U2VuZH0gZnJvbSAnLi4vYnJpZGdlL2NsaWVudCc7XG5pbXBvcnQge2luUGFnZUNvbnRleHR9IGZyb20gJy4uL3V0aWxzL3NuaXBzJztcbmltcG9ydCB7RXhlY3V0ZUNzc09uUGFnZX0gZnJvbSAnLi4vYnJpZGdlL2hhbmRsZXJzL2V4ZWN1dGVfY3NzJztcbmltcG9ydCB7RmV0Y2hFeHRlbnNpb25GaWxlfSBmcm9tICcuLi9icmlkZ2UvaGFuZGxlcnMvZmV0Y2hfZXh0ZW5zaW9uX2ZpbGUnO1xuaW1wb3J0IHtpc0ZpcmVmb3h9IGZyb20gJy4uL3V0aWxzL2RldGVjdCc7XG5pbXBvcnQge2dfUG9zdE1lc3NhZ2VCdXN9IGZyb20gJy4uL2J1cy9wb3N0X21lc3NhZ2VfYnVzJztcblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhdGVDaHJvbWl1bShzY3JpcHRQYXRoOiBzdHJpbmcpIHtcbiAgICBDbGllbnRTZW5kKEV4ZWN1dGVDc3NPblBhZ2UsIHtcbiAgICAgICAgcGF0aDogJ3NyYy9nbG9iYWwuY3NzJyxcbiAgICB9KTtcblxuICAgIENsaWVudFNlbmQoRXhlY3V0ZVNjcmlwdE9uUGFnZSwge1xuICAgICAgICBwYXRoOiBzY3JpcHRQYXRoLFxuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWF0ZUZpcmVmb3goc2NyaXB0UGF0aDogc3RyaW5nKSB7XG4gICAgZ19Qb3N0TWVzc2FnZUJ1cy5oYW5kbGVSZXF1ZXN0cygpO1xuXG4gICAgLy8gV2h5IGRvIHdlIG5lZWQgdG8gdXNlIG1hbnVhbCBET00gc2NyaXB0IGluamVjdGlvbiBhbmRcbiAgICAvLyBmZXRjaCB0aGUgdGV4dCBvZiB0aGUgc2NyaXB0P1xuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vY3NmbG9hdC9leHRlbnNpb24vaXNzdWVzLzE1NSNpc3N1ZWNvbW1lbnQtMTYzOTc4MTkxNFxuXG4gICAgLy8gV2Ugd2FudCB0byBpbmplY3QgdGhlIElEIG9mIHRoZSBleHRlbnNpb25cbiAgICBjb25zdCBpZCA9IGJyb3dzZXIucnVudGltZS5pZDtcbiAgICBjb25zdCBlbnRyeVNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIGVudHJ5U2NyaXB0LmFwcGVuZENoaWxkKFxuICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShgXG4gICAgICAgIHdpbmRvdy5DU0ZMT0FUX0VYVEVOU0lPTl9JRCA9ICcke2lkfSc7XG4gICAgYClcbiAgICApO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZW50cnlTY3JpcHQpO1xuXG4gICAgY29uc3Qgc2NyaXB0UmVzcCA9IGF3YWl0IENsaWVudFNlbmQoRmV0Y2hFeHRlbnNpb25GaWxlLCB7XG4gICAgICAgIHBhdGg6IHNjcmlwdFBhdGgsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBzY3JpcHQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc2NyaXB0UmVzcC50ZXh0KSk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXG4gICAgY29uc3Qgc3R5bGVSZXNwID0gYXdhaXQgQ2xpZW50U2VuZChGZXRjaEV4dGVuc2lvbkZpbGUsIHtcbiAgICAgICAgcGF0aDogJ3NyYy9nbG9iYWwuY3NzJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShzdHlsZVJlc3AudGV4dCkpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuLyoqXG4gKiBJbml0aWFsaXplcyBhIHBhZ2Ugc2NyaXB0LCBleGVjdXRpbmcgaXQgaW4gdGhlIHBhZ2UgY29udGV4dCBpZiBuZWNlc3NhcnlcbiAqXG4gKiBAcGFyYW0gc2NyaXB0UGF0aCBSZWxhdGl2ZSBwYXRoIG9mIHRoZSBzY3JpcHQgKGFsd2F5cyBpbiAuanMpXG4gKiBAcGFyYW0gaWZQYWdlIEZuIHRvIHJ1biBpZiB3ZSBhcmUgaW4gdGhlIHBhZ2UncyBleGVjdXRpb24gY29udGV4dFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdChzY3JpcHRQYXRoOiBzdHJpbmcsIGlmUGFnZTogKCkgPT4gYW55KSB7XG4gICAgLy8gRG9uJ3QgYWxsb3cgdGhlIHBhZ2Ugc2NyaXB0IHRvIHJ1biB0aGlzLlxuICAgIGlmIChpblBhZ2VDb250ZXh0KCkpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBTZXQgZ2xvYmFsIGlkZW50aWZpZXIgZm9yIG90aGVyIGV4dGVuc2lvbnMgdG8gdXNlXG4gICAgICAgIHdpbmRvdy5jc2Zsb2F0ID0gdHJ1ZTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZSBEZXByZWNhdGVkIG5hbWVcbiAgICAgICAgd2luZG93LmNzZ29mbG9hdCA9IHRydWU7XG5cbiAgICAgICAgaWZQYWdlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoaXNGaXJlZm94KCkpIHtcbiAgICAgICAgYXdhaXQgaW5pdGlhdGVGaXJlZm94KHNjcmlwdFBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGluaXRpYXRlQ2hyb21pdW0oc2NyaXB0UGF0aCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICAgIGAlYyBDU0Zsb2F0IE1hcmtldCBDaGVja2VyICh2JHtjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb259KSBieSBTdGVwNzc1MCBgLFxuICAgICAgICAnYmFja2dyb3VuZDogIzAwNDU5NDsgY29sb3I6ICNmZmY7J1xuICAgICk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICAgICclYyBDaGFuZ2Vsb2cgY2FuIGJlIGZvdW5kIGhlcmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9jc2Zsb2F0L2V4dGVuc2lvbiAnLFxuICAgICAgICAnYmFja2dyb3VuZDogIzAwNDU5NDsgY29sb3I6ICNmZmY7J1xuICAgICk7XG59XG4iLCJpbXBvcnQge0VtcHR5UmVzcG9uc2VIYW5kbGVyfSBmcm9tICcuL21haW4nO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge1ByaXZpbGVnZWRIYW5kbGVyfSBmcm9tICcuLi93cmFwcGVycy9wcml2aWxlZ2VkJztcblxuaW50ZXJmYWNlIEV4ZWN1dGVTY3JpcHRSZXF1ZXN0IHtcbiAgICBwYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBFeGVjdXRlU2NyaXB0T25QYWdlID0gbmV3IFByaXZpbGVnZWRIYW5kbGVyKFxuICAgIG5ldyBFbXB0eVJlc3BvbnNlSGFuZGxlcjxFeGVjdXRlU2NyaXB0UmVxdWVzdD4oUmVxdWVzdFR5cGUuRVhFQ1VURV9TQ1JJUFRfT05fUEFHRSwgYXN5bmMgKHJlcSwgc2VuZGVyKSA9PiB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gaW5qZWN0IHRoZSBleHRlbnNpb24gSUQgZHluYW1pY2FsbHkgc28gdGhlIGNsaWVudCBrbm93cyB3aG8gdG9cbiAgICAgICAgLy8gY29tbXVuaWNhdGUgd2l0aC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gT24gRmlyZWZveCwgZXh0ZW5zaW9uIElEcyBhcmUgcmFuZG9tLCBzbyB0aGlzIGlzIG5lY2Vzc2FyeS5cbiAgICAgICAgYXdhaXQgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgICAgICAgIHRhcmdldDoge3RhYklkOiBzZW5kZXIudGFiPy5pZCBhcyBudW1iZXJ9LFxuICAgICAgICAgICAgd29ybGQ6ICdNQUlOJyxcbiAgICAgICAgICAgIGFyZ3M6IFtjaHJvbWUucnVudGltZS5pZF0sXG4gICAgICAgICAgICBmdW5jOiBmdW5jdGlvbiBFeHRlbnNpb25JZChleHRlbnNpb25JZCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5DU0ZMT0FUX0VYVEVOU0lPTl9JRCA9IGV4dGVuc2lvbklkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgICAgICAgIHRhcmdldDoge3RhYklkOiBzZW5kZXIudGFiPy5pZCBhcyBudW1iZXJ9LFxuICAgICAgICAgICAgZmlsZXM6IFtyZXEucGF0aF0sXG4gICAgICAgICAgICB3b3JsZDogJ01BSU4nLFxuICAgICAgICB9KTtcbiAgICB9KVxuKTtcbiIsImltcG9ydCB7UmVxdWVzdEhhbmRsZXJ9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCBNZXNzYWdlU2VuZGVyID0gY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcjtcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlSGFuZGxlcjxSZXEsIFJlc3A+IGltcGxlbWVudHMgUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPiB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgdHlwZTogUmVxdWVzdFR5cGUsXG4gICAgICAgIHByaXZhdGUgaGFuZGxlcjogKHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKSA9PiBQcm9taXNlPFJlc3A+XG4gICAgKSB7fVxuXG4gICAgZ2V0VHlwZSgpOiBSZXF1ZXN0VHlwZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGU7XG4gICAgfVxuXG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcik6IFByb21pc2U8UmVzcD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyKHJlcXVlc3QsIHNlbmRlcik7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVtcHR5IHt9XG5cbmV4cG9ydCBjbGFzcyBFbXB0eVJlcXVlc3RIYW5kbGVyPFJlc3A+IGltcGxlbWVudHMgUmVxdWVzdEhhbmRsZXI8RW1wdHksIFJlc3A+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB0eXBlOiBSZXF1ZXN0VHlwZSxcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVyOiAoc2VuZGVyOiBNZXNzYWdlU2VuZGVyKSA9PiBQcm9taXNlPFJlc3A+XG4gICAgKSB7fVxuXG4gICAgZ2V0VHlwZSgpOiBSZXF1ZXN0VHlwZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGU7XG4gICAgfVxuXG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0OiBFbXB0eSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTxSZXNwPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIoc2VuZGVyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFbXB0eVJlc3BvbnNlSGFuZGxlcjxSZXE+IGltcGxlbWVudHMgUmVxdWVzdEhhbmRsZXI8UmVxLCB2b2lkPiB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgdHlwZTogUmVxdWVzdFR5cGUsXG4gICAgICAgIHByaXZhdGUgaGFuZGxlcjogKHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKSA9PiBQcm9taXNlPHZvaWQ+XG4gICAgKSB7fVxuXG4gICAgZ2V0VHlwZSgpOiBSZXF1ZXN0VHlwZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGU7XG4gICAgfVxuXG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyKHJlcXVlc3QsIHNlbmRlcik7XG4gICAgfVxufVxuIiwiZXhwb3J0IGVudW0gUmVxdWVzdFR5cGUge1xuICAgIEVYRUNVVEVfU0NSSVBUX09OX1BBR0UgPSAwLFxuICAgIEVYRUNVVEVfQ1NTX09OX1BBR0UgPSAxLFxuICAgIEZFVENIX0lOU1BFQ1RfSU5GTyA9IDIsXG4gICAgRkVUQ0hfU1RBTEwgPSAzLFxuICAgIFNUT1JBR0VfR0VUID0gNCxcbiAgICBTVE9SQUdFX1NFVCA9IDUsXG4gICAgU1RPUkFHRV9SRU1PVkUgPSA2LFxuICAgIEZFVENIX1BFTkRJTkdfVFJBREVTID0gNyxcbiAgICBGRVRDSF9FWFRFTlNJT05fRklMRSA9IDgsXG4gICAgQU5OT1RBVEVfT0ZGRVIgPSA5LFxuICAgIEVYVEVOU0lPTl9WRVJTSU9OID0gMTAsXG4gICAgVFJBREVfSElTVE9SWV9TVEFUVVMgPSAxMSxcbiAgICBUUkFERV9PRkZFUl9TVEFUVVMgPSAxMixcbiAgICBIQVNfUEVSTUlTU0lPTlMgPSAxMyxcbiAgICBQSU5HX1NFVFVQX0VYVEVOU0lPTiA9IDE0LFxuICAgIFBJTkdfRVhURU5TSU9OX1NUQVRVUyA9IDE1LFxuICAgIFBJTkdfQ0FOQ0VMX1RSQURFID0gMTYsXG4gICAgQ1JFQVRFX1RSQURFX09GRkVSID0gMTcsXG4gICAgRkVUQ0hfU1RFQU1fVVNFUiA9IDE4LFxuICAgIFBJTkdfVFJBREVfU1RBVFVTID0gMTksXG4gICAgUElOR19TVEFUVVMgPSAyMCxcbiAgICBGRVRDSF9PV05fSU5WRU5UT1JZID0gMjEsXG4gICAgQ0FOQ0VMX1RSQURFX09GRkVSID0gMjIsXG4gICAgRkVUQ0hfU1RFQU1fVFJBREVTID0gMjMsXG4gICAgRkVUQ0hfQkxPQ0tFRF9VU0VSUyA9IDI0LFxuICAgIFBJTkdfQkxPQ0tFRF9VU0VSUyA9IDI1LFxuICAgIEZFVENIX0JMVUVHRU0gPSAyNixcbiAgICBMSVNUX0lURU0gPSAyNyxcbiAgICBGRVRDSF9SRUNPTU1FTkRFRF9QUklDRSA9IDI4LFxuICAgIEZFVENIX0NTRkxPQVRfTUUgPSAyOSxcbiAgICBQSU5HX1JPTExCQUNLX1RSQURFID0gMzAsXG4gICAgRkVUQ0hfVFJBREVfSElTVE9SWSA9IDMxLFxuICAgIEZFVENIX1NMSU1fVFJBREVTID0gMzIsXG4gICAgTk9UQVJZX1BST1ZFID0gMzMsXG4gICAgRkVUQ0hfTk9UQVJZX01FVEEgPSAzNCxcbiAgICBGRVRDSF9OT1RBUllfVE9LRU4gPSAzNSxcbiAgICBGRVRDSF9TVEVBTV9QT1dFUkVEX0lOVkVOVE9SWSA9IDM2LFxuICAgIEZFVENIX1JFVkVSU0FMX1NUQVRVUyA9IDM3LFxuICAgIEZFVENIX0lOU1BFQ1RfSU5GT19CQVRDSCA9IDM4LFxufVxuIiwiaW1wb3J0IHtSZXF1ZXN0SGFuZGxlcn0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi4vaGFuZGxlcnMvdHlwZXMnO1xuaW1wb3J0IE1lc3NhZ2VTZW5kZXIgPSBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyO1xuXG4vKipcbiAqIFJlc3RyaWN0cyBhIGdpdmVuIGhhbmRsZXIgc3VjaCB0aGF0IGl0IGNhbiBvbmx5IHJ1biBpZiB0aGUgc2VuZGVyIGlzXG4gKiB2ZXJpZmllZCB0byBiZSBmcm9tIHRoZSBleHRlbnNpb24ncyBvcmlnaW4gKGllLiBjb250ZW50IHNjcmlwdClcbiAqL1xuZXhwb3J0IGNsYXNzIFByaXZpbGVnZWRIYW5kbGVyPFJlcSwgUmVzcD4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+IHtcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGhhbmRsZXI6IFJlcXVlc3RIYW5kbGVyPFJlcSwgUmVzcD4pIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlci5nZXRUeXBlKCk7XG4gICAgfVxuXG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcik6IFByb21pc2U8UmVzcD4ge1xuICAgICAgICBpZiAoc2VuZGVyLmlkICE9PSBjaHJvbWUucnVudGltZS5pZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0IHRvIGFjY2VzcyByZXN0cmljdGVkIG1ldGhvZCBvdXRzaWRlIG9mIHNlY3VyZSBjb250ZXh0IChpZS4gY29udGVudCBzY3JpcHQpJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyLmhhbmRsZVJlcXVlc3QocmVxdWVzdCwgc2VuZGVyKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge0ludGVybmFsUmVxdWVzdEJ1bmRsZSwgSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSwgUmVxdWVzdEhhbmRsZXIsIFZlcnNpb259IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtpc0ZpcmVmb3gsIHJ1bnRpbWVOYW1lc3BhY2V9IGZyb20gJy4uL3V0aWxzL2RldGVjdCc7XG5pbXBvcnQge2luUGFnZUNvbnRleHR9IGZyb20gJy4uL3V0aWxzL3NuaXBzJztcbmltcG9ydCB7Z19Qb3N0TWVzc2FnZUJ1c30gZnJvbSAnLi4vYnVzL3Bvc3RfbWVzc2FnZV9idXMnO1xuXG5mdW5jdGlvbiBjYW5Vc2VTZW5kTWVzc2FnZSgpIHtcbiAgICAvLyBOb3Qgc3VwcG9ydGVkIGluIEZpcmVmb3ggUGFnZSBDb250ZXh0XG4gICAgcmV0dXJuICEoaXNGaXJlZm94KCkgJiYgaW5QYWdlQ29udGV4dCgpKTtcbn1cblxuLyoqXG4gKiBTZW5kIGEgcmVxdWVzdCB0byBiZSBoYW5kbGVkIGJ5IHRoZSBiYWNrZ3JvdW5kIHdvcmtlclxuICpcbiAqIENhbiBiZSBjYWxsZWQgZnJvbSBhIGNvbnRlbnQgc2NyaXB0IG9yIHBhZ2UgaXRzZWxmXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBDbGllbnRTZW5kPFJlcSwgUmVzcD4oaGFuZGxlcjogUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPiwgYXJnczogUmVxKTogUHJvbWlzZTxSZXNwPiB7XG4gICAgY29uc3QgYnVuZGxlOiBJbnRlcm5hbFJlcXVlc3RCdW5kbGUgPSB7XG4gICAgICAgIHZlcnNpb246IFZlcnNpb24uVjEsXG4gICAgICAgIHJlcXVlc3RfdHlwZTogaGFuZGxlci5nZXRUeXBlKCksXG4gICAgICAgIHJlcXVlc3Q6IGFyZ3MsXG4gICAgICAgIGlkOiBNYXRoLmNlaWwoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwMDAwMCksXG4gICAgfTtcblxuICAgIGlmIChjYW5Vc2VTZW5kTWVzc2FnZSgpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIEJhZCB0eXBlc1xuICAgICAgICAgICAgcnVudGltZU5hbWVzcGFjZSgpLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgd2luZG93LkNTRkxPQVRfRVhURU5TSU9OX0lEIHx8IGNocm9tZS5ydW50aW1lLmlkLFxuICAgICAgICAgICAgICAgIGJ1bmRsZSxcbiAgICAgICAgICAgICAgICAocmVzcDogSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcD8uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwLmVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcD8ucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmFsbGJhY2sgdG8gcG9zdG1lc3NhZ2UgYnVzIGZvciBicm93c2VycyB0aGF0IGRvbid0IGltcGxlbWVudFxuICAgICAgICAvLyBzcGVjcyBmdWxseVxuICAgICAgICByZXR1cm4gZ19Qb3N0TWVzc2FnZUJ1cy5zZW5kUmVxdWVzdChidW5kbGUpO1xuICAgIH1cbn1cbiIsImltcG9ydCBNZXNzYWdlU2VuZGVyID0gY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcjtcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vaGFuZGxlcnMvdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlcXVlc3RIYW5kbGVyPFJlcSwgUmVzcD4ge1xuICAgIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpOiBQcm9taXNlPFJlc3A+O1xuICAgIGdldFR5cGUoKTogUmVxdWVzdFR5cGU7XG59XG5cbmV4cG9ydCBlbnVtIFZlcnNpb24ge1xuICAgIFYxID0gJ0NTRkxPQVRfVjEnLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsUmVxdWVzdEJ1bmRsZSB7XG4gICAgdmVyc2lvbjogc3RyaW5nO1xuXG4gICAgcmVxdWVzdF90eXBlOiBSZXF1ZXN0VHlwZTtcblxuICAgIC8vIElucHV0IHJlcXVlc3RcbiAgICByZXF1ZXN0OiBhbnk7XG5cbiAgICAvLyBSYW5kb20gSUQgdG8gaWRlbnRpZnkgdGhlIHJlcXVlc3RcbiAgICBpZDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsUmVzcG9uc2VCdW5kbGUge1xuICAgIHJlcXVlc3RfdHlwZTogUmVxdWVzdFR5cGU7XG5cbiAgICAvLyBSZXNwb25zZVxuICAgIHJlc3BvbnNlOiBhbnk7XG5cbiAgICBlcnJvcjogc3RyaW5nO1xuXG4gICAgLy8gUmFuZG9tIElEIHRvIGlkZW50aWZ5IHRoZSByZXF1ZXN0XG4gICAgaWQ6IG51bWJlcjtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpc0ZpcmVmb3goKSB7XG4gICAgcmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMTtcbn1cblxuLyoqXG4gKiBUaGFua3MgdG8gb3VyIGJyb3dzZXIgb3ZlcmxvcmRzLCB3ZSBoYXZlIHR3byBuYW1lc3BhY2VzIGZvciBgeC5ydW50aW1lLmZuKClgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBydW50aW1lTmFtZXNwYWNlKCkge1xuICAgIGlmIChpc0ZpcmVmb3goKSkge1xuICAgICAgICByZXR1cm4gYnJvd3NlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY2hyb21lO1xuICAgIH1cbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBpblBhZ2VDb250ZXh0KCkge1xuICAgIHJldHVybiB0eXBlb2YgY2hyb21lID09PSAndW5kZWZpbmVkJyB8fCAhY2hyb21lLmV4dGVuc2lvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhaXQobXM6IG51bWJlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xufVxuIiwiaW1wb3J0IHtJbnRlcm5hbFJlcXVlc3RCdW5kbGUsIEludGVybmFsUmVzcG9uc2VCdW5kbGUsIFZlcnNpb259IGZyb20gJy4uL2JyaWRnZS90eXBlcyc7XG5pbXBvcnQge3J1bnRpbWVOYW1lc3BhY2V9IGZyb20gJy4uL3V0aWxzL2RldGVjdCc7XG5cbi8qKlxuICogTWVzc2FnZSBidXMgdGhhdCB1c2VzIGBwb3N0TWVzc2FnZWAgaW4gb3JkZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB0aGUgYmFja2dyb3VuZFxuICogc2VydmljZSB3b3JrZXIvc2NyaXB0LlxuICpcbiAqIFdoeT8gQmVjYXVzZSB0aGUgY2xpZW50IHBhZ2UgKGllLiBTdGVhbSBwYWdlKSBvbiBGaXJlZm94IGlzIG5vdCBjYXBhYmxlIG9mXG4gKiBzZW5kaW5nIGEgbWVzc2FnZSBkaXJlY3RseSB0byB0aGUgZXh0ZW5zaW9uIGJhY2tncm91bmQuXG4gKlxuICogU28gaXQgcmVxdWlyZXMgdXMgdG8gZG8gdGhlIGZvbGxvd2luZyBkYW5jZTpcbiAqIHBhZ2UgPC0tKHBvc3RtZXNzYWdlKS0tPiBjb250ZW50IHNjcmlwdCA8LS0oc2VuZG1lc3NhZ2UpLS0+IGJhY2tncm91bmQgc2NyaXB0XG4gKlxuICogVGhpcyBkYW5jZSBpcyBhYnN0cmFjdGVkIGluIGBDbGllbnRTZW5kYCwgYW5kIG9ubHkgdXNlcyB0aGlzIGJ1cyBpZlxuICogYHNlbmRtZXNzYWdlYCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoZSBwYWdlLlxuICovXG5jbGFzcyBQb3N0TWVzc2FnZUJ1cyB7XG4gICAgLyoqXG4gICAgICogRm9yIHRoZSByZXF1ZXN0ZXIgKGllLiBwYWdlKSwgdG8gd2FpdCB1bnRpbCBpdCBnZXRzIGEgcmVzcG9uc2VcbiAgICAgKiBmcm9tIHRoZSBjb250ZW50IHNjcmlwdCB2aWEuIHBvc3RNZXNzYWdlIGZvciB0aGUgZ2l2ZW4gcmVxdWVzdCBJRFxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFJlcXVlc3QgSURcbiAgICAgKi9cbiAgICB3YWl0VW50aWxSZXNwb25zZUZvcihpZDogbnVtYmVyKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSAoZTogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcCA9IGUuZGF0YSBhcyBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwLmlkICE9PSBpZCB8fCAhcmVzcC5yZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUHJldmVudCBsZWFrc1xuICAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlciwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3A/LnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcC5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3A/LmVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIHJlcXVlc3QgdG8gYmUgZG9uZSB0aHJvdWdoIHRoZSBidXMsIHJldHVybnMgdGhlIGFwcHJvcHJpYXRlXG4gICAgICogcmVzcG9uc2UgZm9yIHRoZSBpbnB1dCBidW5kbGUgaGFuZGxlclxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1bmRsZSBSZXF1ZXN0IEJ1bmRsZVxuICAgICAqL1xuICAgIHNlbmRSZXF1ZXN0KGJ1bmRsZTogSW50ZXJuYWxSZXF1ZXN0QnVuZGxlKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKGJ1bmRsZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMud2FpdFVudGlsUmVzcG9uc2VGb3IoYnVuZGxlLmlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGhhbmRsZXIgKGNvbnRlbnQgc2NyaXB0KSBmb3IgbmV3IHJlcXVlc3RzIGZyb20gdGhlIHBhZ2UuXG4gICAgICpcbiAgICAgKiBFYWNoIHJlcXVlc3QgaXMgZWZmZWN0aXZlbHkgXCJwcm94aWVkXCIgdG8gdGhlIGJhY2tncm91bmQgc2NyaXB0L3dvcmtlclxuICAgICAqIHRvIGFjdHVhbGx5IGV4ZWN1dGUgaXQncyBoYW5kbGVyLlxuICAgICAqL1xuICAgIGhhbmRsZVJlcXVlc3RzKCkge1xuICAgICAgICBjb25zdCBoID0gKGU6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGUuZGF0YS52ZXJzaW9uICE9PSBWZXJzaW9uLlYxIHx8ICFlLmRhdGEucmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIC8vIElnbm9yZSBtZXNzYWdlcyB0aGF0IGFyZW4ndCBmb3IgdGhpcyBicmlkZ2VcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlbmQgdG8gdGhlIGJhY2tncm91bmQgc2NyaXB0XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIEJhZCB0eXBlc1xuICAgICAgICAgICAgcnVudGltZU5hbWVzcGFjZSgpLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuaWQsXG4gICAgICAgICAgICAgICAgZS5kYXRhLFxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgQmFkIHR5cGVzXG4gICAgICAgICAgICAgICAgKHJlc3A6IEludGVybmFsUmVzcG9uc2VCdW5kbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKHJlc3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBnX1Bvc3RNZXNzYWdlQnVzID0gbmV3IFBvc3RNZXNzYWdlQnVzKCk7XG4iLCJpbXBvcnQge0VtcHR5UmVzcG9uc2VIYW5kbGVyfSBmcm9tICcuL21haW4nO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge1ByaXZpbGVnZWRIYW5kbGVyfSBmcm9tICcuLi93cmFwcGVycy9wcml2aWxlZ2VkJztcblxuaW50ZXJmYWNlIEV4ZWN1dGVDc3NSZXF1ZXN0IHtcbiAgICBwYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBFeGVjdXRlQ3NzT25QYWdlID0gbmV3IFByaXZpbGVnZWRIYW5kbGVyKFxuICAgIG5ldyBFbXB0eVJlc3BvbnNlSGFuZGxlcjxFeGVjdXRlQ3NzUmVxdWVzdD4oUmVxdWVzdFR5cGUuRVhFQ1VURV9DU1NfT05fUEFHRSwgYXN5bmMgKHJlcSwgc2VuZGVyKSA9PiB7XG4gICAgICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuaW5zZXJ0Q1NTKHtcbiAgICAgICAgICAgIHRhcmdldDoge3RhYklkOiBzZW5kZXIudGFiPy5pZCBhcyBudW1iZXJ9LFxuICAgICAgICAgICAgZmlsZXM6IFtyZXEucGF0aF0sXG4gICAgICAgIH0pO1xuICAgIH0pXG4pO1xuIiwiaW1wb3J0IHtTaW1wbGVIYW5kbGVyfSBmcm9tICcuL21haW4nO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge1ByaXZpbGVnZWRIYW5kbGVyfSBmcm9tICcuLi93cmFwcGVycy9wcml2aWxlZ2VkJztcblxuZXhwb3J0IGludGVyZmFjZSBGZXRjaEV4dGVuc2lvbkZpbGVSZXF1ZXN0IHtcbiAgICBwYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmV0Y2hFeHRlbnNpb25GaWxlUmVzcG9uc2Uge1xuICAgIHRleHQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEZldGNoRXh0ZW5zaW9uRmlsZSA9IG5ldyBQcml2aWxlZ2VkSGFuZGxlcihcbiAgICBuZXcgU2ltcGxlSGFuZGxlcjxGZXRjaEV4dGVuc2lvbkZpbGVSZXF1ZXN0LCBGZXRjaEV4dGVuc2lvbkZpbGVSZXNwb25zZT4oXG4gICAgICAgIFJlcXVlc3RUeXBlLkZFVENIX0VYVEVOU0lPTl9GSUxFLFxuICAgICAgICBhc3luYyAocmVxKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBjaHJvbWUucnVudGltZS5nZXRVUkwocmVxLnBhdGgpO1xuICAgICAgICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCk7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgci50ZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgKVxuKTtcbiIsImltcG9ydCB7RW1wdHlSZXF1ZXN0SGFuZGxlciwgU2ltcGxlSGFuZGxlcn0gZnJvbSAnLi9tYWluJztcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtBbm5vdGF0ZU9mZmVyUmVxdWVzdCwgQW5ub3RhdGVPZmZlclJlc3BvbnNlfSBmcm9tICcuL2Fubm90YXRlX29mZmVyJztcbmltcG9ydCB7cnVudGltZU5hbWVzcGFjZX0gZnJvbSAnLi4vLi4vdXRpbHMvZGV0ZWN0JztcblxuZXhwb3J0IGludGVyZmFjZSBFeHRlbnNpb25WZXJzaW9uUmVzcG9uc2Uge1xuICAgIHZlcnNpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEV4dGVuc2lvblZlcnNpb24gPSBuZXcgRW1wdHlSZXF1ZXN0SGFuZGxlcjxFeHRlbnNpb25WZXJzaW9uUmVzcG9uc2U+KFxuICAgIFJlcXVlc3RUeXBlLkVYVEVOU0lPTl9WRVJTSU9OLFxuICAgIGFzeW5jIChyZXEpID0+IHtcbiAgICAgICAgY29uc3QgbWFuaWZlc3QgPSBydW50aW1lTmFtZXNwYWNlKCkucnVudGltZS5nZXRNYW5pZmVzdCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmVyc2lvbjogbWFuaWZlc3QudmVyc2lvbixcbiAgICAgICAgfTtcbiAgICB9XG4pO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCJpbXBvcnQge2luaXR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtDbGllbnRTZW5kfSBmcm9tICcuLi9icmlkZ2UvY2xpZW50JztcbmltcG9ydCB7RXh0ZW5zaW9uVmVyc2lvbn0gZnJvbSAnLi4vYnJpZGdlL2hhbmRsZXJzL2V4dGVuc2lvbl92ZXJzaW9uJztcblxuaW5pdCgnc3JjL2xpYi9wYWdlX3NjcmlwdHMvY3NmbG9hdC5qcycsIG1haW4pO1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fRU5BQkxFRCA9IHRydWU7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IENsaWVudFNlbmQoRXh0ZW5zaW9uVmVyc2lvbiwge30pO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fVkVSU0lPTiA9IHJlc3AudmVyc2lvbjtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==