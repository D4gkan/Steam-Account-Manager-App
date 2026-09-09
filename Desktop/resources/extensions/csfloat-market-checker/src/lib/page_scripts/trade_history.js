/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
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
/* 1 */
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
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EmptyResponseHandler: () => (/* binding */ EmptyResponseHandler),
/* harmony export */   SimpleHandler: () => (/* binding */ SimpleHandler)
/* harmony export */ });
/* unused harmony export EmptyRequestHandler */
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
/* 3 */
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
/* 4 */
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
/* 5 */
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
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Version: () => (/* binding */ Version)
/* harmony export */ });
var Version;
(function (Version) {
    Version["V1"] = "CSFLOAT_V1";
})(Version || (Version = {}));


/***/ }),
/* 7 */
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
/* 8 */
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
/* 9 */
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
/* 10 */
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
/* 11 */
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


/***/ })
/******/ 	]);
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

(0,_utils__WEBPACK_IMPORTED_MODULE_0__.init)('src/lib/page_scripts/trade_history.js', main);
async function main() { }

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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YWNrOi8vLy4vc3JjL2xpYi9wYWdlX3NjcmlwdHMvdXRpbHMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvaGFuZGxlcnMvZXhlY3V0ZV9zY3JpcHQudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvaGFuZGxlcnMvbWFpbi50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9oYW5kbGVycy90eXBlcy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS93cmFwcGVycy9wcml2aWxlZ2VkLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2NsaWVudC50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS90eXBlcy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL3V0aWxzL2RldGVjdC50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL3V0aWxzL3NuaXBzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnVzL3Bvc3RfbWVzc2FnZV9idXMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvaGFuZGxlcnMvZXhlY3V0ZV9jc3MudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvaGFuZGxlcnMvZmV0Y2hfZXh0ZW5zaW9uX2ZpbGUudHMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9wYWdlX3NjcmlwdHMvdHJhZGVfaGlzdG9yeS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0V4ZWN1dGVTY3JpcHRPblBhZ2V9IGZyb20gJy4uL2JyaWRnZS9oYW5kbGVycy9leGVjdXRlX3NjcmlwdCc7XG5pbXBvcnQge0NsaWVudFNlbmR9IGZyb20gJy4uL2JyaWRnZS9jbGllbnQnO1xuaW1wb3J0IHtpblBhZ2VDb250ZXh0fSBmcm9tICcuLi91dGlscy9zbmlwcyc7XG5pbXBvcnQge0V4ZWN1dGVDc3NPblBhZ2V9IGZyb20gJy4uL2JyaWRnZS9oYW5kbGVycy9leGVjdXRlX2Nzcyc7XG5pbXBvcnQge0ZldGNoRXh0ZW5zaW9uRmlsZX0gZnJvbSAnLi4vYnJpZGdlL2hhbmRsZXJzL2ZldGNoX2V4dGVuc2lvbl9maWxlJztcbmltcG9ydCB7aXNGaXJlZm94fSBmcm9tICcuLi91dGlscy9kZXRlY3QnO1xuaW1wb3J0IHtnX1Bvc3RNZXNzYWdlQnVzfSBmcm9tICcuLi9idXMvcG9zdF9tZXNzYWdlX2J1cyc7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYXRlQ2hyb21pdW0oc2NyaXB0UGF0aDogc3RyaW5nKSB7XG4gICAgQ2xpZW50U2VuZChFeGVjdXRlQ3NzT25QYWdlLCB7XG4gICAgICAgIHBhdGg6ICdzcmMvZ2xvYmFsLmNzcycsXG4gICAgfSk7XG5cbiAgICBDbGllbnRTZW5kKEV4ZWN1dGVTY3JpcHRPblBhZ2UsIHtcbiAgICAgICAgcGF0aDogc2NyaXB0UGF0aCxcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhdGVGaXJlZm94KHNjcmlwdFBhdGg6IHN0cmluZykge1xuICAgIGdfUG9zdE1lc3NhZ2VCdXMuaGFuZGxlUmVxdWVzdHMoKTtcblxuICAgIC8vIFdoeSBkbyB3ZSBuZWVkIHRvIHVzZSBtYW51YWwgRE9NIHNjcmlwdCBpbmplY3Rpb24gYW5kXG4gICAgLy8gZmV0Y2ggdGhlIHRleHQgb2YgdGhlIHNjcmlwdD9cbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2NzZmxvYXQvZXh0ZW5zaW9uL2lzc3Vlcy8xNTUjaXNzdWVjb21tZW50LTE2Mzk3ODE5MTRcblxuICAgIC8vIFdlIHdhbnQgdG8gaW5qZWN0IHRoZSBJRCBvZiB0aGUgZXh0ZW5zaW9uXG4gICAgY29uc3QgaWQgPSBicm93c2VyLnJ1bnRpbWUuaWQ7XG4gICAgY29uc3QgZW50cnlTY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBlbnRyeVNjcmlwdC5hcHBlbmRDaGlsZChcbiAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYFxuICAgICAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fSUQgPSAnJHtpZH0nO1xuICAgIGApXG4gICAgKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVudHJ5U2NyaXB0KTtcblxuICAgIGNvbnN0IHNjcmlwdFJlc3AgPSBhd2FpdCBDbGllbnRTZW5kKEZldGNoRXh0ZW5zaW9uRmlsZSwge1xuICAgICAgICBwYXRoOiBzY3JpcHRQYXRoLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgc2NyaXB0LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHNjcmlwdFJlc3AudGV4dCkpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuICAgIGNvbnN0IHN0eWxlUmVzcCA9IGF3YWl0IENsaWVudFNlbmQoRmV0Y2hFeHRlbnNpb25GaWxlLCB7XG4gICAgICAgIHBhdGg6ICdzcmMvZ2xvYmFsLmNzcycsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3R5bGVSZXNwLnRleHQpKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cbi8qKlxuICogSW5pdGlhbGl6ZXMgYSBwYWdlIHNjcmlwdCwgZXhlY3V0aW5nIGl0IGluIHRoZSBwYWdlIGNvbnRleHQgaWYgbmVjZXNzYXJ5XG4gKlxuICogQHBhcmFtIHNjcmlwdFBhdGggUmVsYXRpdmUgcGF0aCBvZiB0aGUgc2NyaXB0IChhbHdheXMgaW4gLmpzKVxuICogQHBhcmFtIGlmUGFnZSBGbiB0byBydW4gaWYgd2UgYXJlIGluIHRoZSBwYWdlJ3MgZXhlY3V0aW9uIGNvbnRleHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXQoc2NyaXB0UGF0aDogc3RyaW5nLCBpZlBhZ2U6ICgpID0+IGFueSkge1xuICAgIC8vIERvbid0IGFsbG93IHRoZSBwYWdlIHNjcmlwdCB0byBydW4gdGhpcy5cbiAgICBpZiAoaW5QYWdlQ29udGV4dCgpKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgU2V0IGdsb2JhbCBpZGVudGlmaWVyIGZvciBvdGhlciBleHRlbnNpb25zIHRvIHVzZVxuICAgICAgICB3aW5kb3cuY3NmbG9hdCA9IHRydWU7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgRGVwcmVjYXRlZCBuYW1lXG4gICAgICAgIHdpbmRvdy5jc2dvZmxvYXQgPSB0cnVlO1xuXG4gICAgICAgIGlmUGFnZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGlzRmlyZWZveCgpKSB7XG4gICAgICAgIGF3YWl0IGluaXRpYXRlRmlyZWZveChzY3JpcHRQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBpbml0aWF0ZUNocm9taXVtKHNjcmlwdFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgJWMgQ1NGbG9hdCBNYXJrZXQgQ2hlY2tlciAodiR7Y2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS52ZXJzaW9ufSkgYnkgU3RlcDc3NTAgYCxcbiAgICAgICAgJ2JhY2tncm91bmQ6ICMwMDQ1OTQ7IGNvbG9yOiAjZmZmOydcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAnJWMgQ2hhbmdlbG9nIGNhbiBiZSBmb3VuZCBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vY3NmbG9hdC9leHRlbnNpb24gJyxcbiAgICAgICAgJ2JhY2tncm91bmQ6ICMwMDQ1OTQ7IGNvbG9yOiAjZmZmOydcbiAgICApO1xufVxuIiwiaW1wb3J0IHtFbXB0eVJlc3BvbnNlSGFuZGxlcn0gZnJvbSAnLi9tYWluJztcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtQcml2aWxlZ2VkSGFuZGxlcn0gZnJvbSAnLi4vd3JhcHBlcnMvcHJpdmlsZWdlZCc7XG5cbmludGVyZmFjZSBFeGVjdXRlU2NyaXB0UmVxdWVzdCB7XG4gICAgcGF0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgRXhlY3V0ZVNjcmlwdE9uUGFnZSA9IG5ldyBQcml2aWxlZ2VkSGFuZGxlcihcbiAgICBuZXcgRW1wdHlSZXNwb25zZUhhbmRsZXI8RXhlY3V0ZVNjcmlwdFJlcXVlc3Q+KFJlcXVlc3RUeXBlLkVYRUNVVEVfU0NSSVBUX09OX1BBR0UsIGFzeW5jIChyZXEsIHNlbmRlcikgPT4ge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIGluamVjdCB0aGUgZXh0ZW5zaW9uIElEIGR5bmFtaWNhbGx5IHNvIHRoZSBjbGllbnQga25vd3Mgd2hvIHRvXG4gICAgICAgIC8vIGNvbW11bmljYXRlIHdpdGguXG4gICAgICAgIC8vXG4gICAgICAgIC8vIE9uIEZpcmVmb3gsIGV4dGVuc2lvbiBJRHMgYXJlIHJhbmRvbSwgc28gdGhpcyBpcyBuZWNlc3NhcnkuXG4gICAgICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4gICAgICAgICAgICB0YXJnZXQ6IHt0YWJJZDogc2VuZGVyLnRhYj8uaWQgYXMgbnVtYmVyfSxcbiAgICAgICAgICAgIHdvcmxkOiAnTUFJTicsXG4gICAgICAgICAgICBhcmdzOiBbY2hyb21lLnJ1bnRpbWUuaWRdLFxuICAgICAgICAgICAgZnVuYzogZnVuY3Rpb24gRXh0ZW5zaW9uSWQoZXh0ZW5zaW9uSWQpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fSUQgPSBleHRlbnNpb25JZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4gICAgICAgICAgICB0YXJnZXQ6IHt0YWJJZDogc2VuZGVyLnRhYj8uaWQgYXMgbnVtYmVyfSxcbiAgICAgICAgICAgIGZpbGVzOiBbcmVxLnBhdGhdLFxuICAgICAgICAgICAgd29ybGQ6ICdNQUlOJyxcbiAgICAgICAgfSk7XG4gICAgfSlcbik7XG4iLCJpbXBvcnQge1JlcXVlc3RIYW5kbGVyfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgTWVzc2FnZVNlbmRlciA9IGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXI7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIFNpbXBsZUhhbmRsZXI8UmVxLCBSZXNwPiBpbXBsZW1lbnRzIFJlcXVlc3RIYW5kbGVyPFJlcSwgUmVzcD4ge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHR5cGU6IFJlcXVlc3RUeXBlLFxuICAgICAgICBwcml2YXRlIGhhbmRsZXI6IChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcikgPT4gUHJvbWlzZTxSZXNwPlxuICAgICkge31cblxuICAgIGdldFR5cGUoKTogUmVxdWVzdFR5cGUge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpOiBQcm9taXNlPFJlc3A+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlcihyZXF1ZXN0LCBzZW5kZXIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbXB0eSB7fVxuXG5leHBvcnQgY2xhc3MgRW1wdHlSZXF1ZXN0SGFuZGxlcjxSZXNwPiBpbXBsZW1lbnRzIFJlcXVlc3RIYW5kbGVyPEVtcHR5LCBSZXNwPiB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgdHlwZTogUmVxdWVzdFR5cGUsXG4gICAgICAgIHByaXZhdGUgaGFuZGxlcjogKHNlbmRlcjogTWVzc2FnZVNlbmRlcikgPT4gUHJvbWlzZTxSZXNwPlxuICAgICkge31cblxuICAgIGdldFR5cGUoKTogUmVxdWVzdFR5cGUge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogRW1wdHksIHNlbmRlcjogTWVzc2FnZVNlbmRlcik6IFByb21pc2U8UmVzcD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyKHNlbmRlcik7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRW1wdHlSZXNwb25zZUhhbmRsZXI8UmVxPiBpbXBsZW1lbnRzIFJlcXVlc3RIYW5kbGVyPFJlcSwgdm9pZD4ge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHR5cGU6IFJlcXVlc3RUeXBlLFxuICAgICAgICBwcml2YXRlIGhhbmRsZXI6IChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcikgPT4gUHJvbWlzZTx2b2lkPlxuICAgICkge31cblxuICAgIGdldFR5cGUoKTogUmVxdWVzdFR5cGUge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlO1xuICAgIH1cblxuICAgIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlcihyZXF1ZXN0LCBzZW5kZXIpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBlbnVtIFJlcXVlc3RUeXBlIHtcbiAgICBFWEVDVVRFX1NDUklQVF9PTl9QQUdFID0gMCxcbiAgICBFWEVDVVRFX0NTU19PTl9QQUdFID0gMSxcbiAgICBGRVRDSF9JTlNQRUNUX0lORk8gPSAyLFxuICAgIEZFVENIX1NUQUxMID0gMyxcbiAgICBTVE9SQUdFX0dFVCA9IDQsXG4gICAgU1RPUkFHRV9TRVQgPSA1LFxuICAgIFNUT1JBR0VfUkVNT1ZFID0gNixcbiAgICBGRVRDSF9QRU5ESU5HX1RSQURFUyA9IDcsXG4gICAgRkVUQ0hfRVhURU5TSU9OX0ZJTEUgPSA4LFxuICAgIEFOTk9UQVRFX09GRkVSID0gOSxcbiAgICBFWFRFTlNJT05fVkVSU0lPTiA9IDEwLFxuICAgIFRSQURFX0hJU1RPUllfU1RBVFVTID0gMTEsXG4gICAgVFJBREVfT0ZGRVJfU1RBVFVTID0gMTIsXG4gICAgSEFTX1BFUk1JU1NJT05TID0gMTMsXG4gICAgUElOR19TRVRVUF9FWFRFTlNJT04gPSAxNCxcbiAgICBQSU5HX0VYVEVOU0lPTl9TVEFUVVMgPSAxNSxcbiAgICBQSU5HX0NBTkNFTF9UUkFERSA9IDE2LFxuICAgIENSRUFURV9UUkFERV9PRkZFUiA9IDE3LFxuICAgIEZFVENIX1NURUFNX1VTRVIgPSAxOCxcbiAgICBQSU5HX1RSQURFX1NUQVRVUyA9IDE5LFxuICAgIFBJTkdfU1RBVFVTID0gMjAsXG4gICAgRkVUQ0hfT1dOX0lOVkVOVE9SWSA9IDIxLFxuICAgIENBTkNFTF9UUkFERV9PRkZFUiA9IDIyLFxuICAgIEZFVENIX1NURUFNX1RSQURFUyA9IDIzLFxuICAgIEZFVENIX0JMT0NLRURfVVNFUlMgPSAyNCxcbiAgICBQSU5HX0JMT0NLRURfVVNFUlMgPSAyNSxcbiAgICBGRVRDSF9CTFVFR0VNID0gMjYsXG4gICAgTElTVF9JVEVNID0gMjcsXG4gICAgRkVUQ0hfUkVDT01NRU5ERURfUFJJQ0UgPSAyOCxcbiAgICBGRVRDSF9DU0ZMT0FUX01FID0gMjksXG4gICAgUElOR19ST0xMQkFDS19UUkFERSA9IDMwLFxuICAgIEZFVENIX1RSQURFX0hJU1RPUlkgPSAzMSxcbiAgICBGRVRDSF9TTElNX1RSQURFUyA9IDMyLFxuICAgIE5PVEFSWV9QUk9WRSA9IDMzLFxuICAgIEZFVENIX05PVEFSWV9NRVRBID0gMzQsXG4gICAgRkVUQ0hfTk9UQVJZX1RPS0VOID0gMzUsXG4gICAgRkVUQ0hfU1RFQU1fUE9XRVJFRF9JTlZFTlRPUlkgPSAzNixcbiAgICBGRVRDSF9SRVZFUlNBTF9TVEFUVVMgPSAzNyxcbiAgICBGRVRDSF9JTlNQRUNUX0lORk9fQkFUQ0ggPSAzOCxcbn1cbiIsImltcG9ydCB7UmVxdWVzdEhhbmRsZXJ9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4uL2hhbmRsZXJzL3R5cGVzJztcbmltcG9ydCBNZXNzYWdlU2VuZGVyID0gY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcjtcblxuLyoqXG4gKiBSZXN0cmljdHMgYSBnaXZlbiBoYW5kbGVyIHN1Y2ggdGhhdCBpdCBjYW4gb25seSBydW4gaWYgdGhlIHNlbmRlciBpc1xuICogdmVyaWZpZWQgdG8gYmUgZnJvbSB0aGUgZXh0ZW5zaW9uJ3Mgb3JpZ2luIChpZS4gY29udGVudCBzY3JpcHQpXG4gKi9cbmV4cG9ydCBjbGFzcyBQcml2aWxlZ2VkSGFuZGxlcjxSZXEsIFJlc3A+IGltcGxlbWVudHMgUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPiB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBoYW5kbGVyOiBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+KSB7fVxuXG4gICAgZ2V0VHlwZSgpOiBSZXF1ZXN0VHlwZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIuZ2V0VHlwZSgpO1xuICAgIH1cblxuICAgIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpOiBQcm9taXNlPFJlc3A+IHtcbiAgICAgICAgaWYgKHNlbmRlci5pZCAhPT0gY2hyb21lLnJ1bnRpbWUuaWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQXR0ZW1wdCB0byBhY2Nlc3MgcmVzdHJpY3RlZCBtZXRob2Qgb3V0c2lkZSBvZiBzZWN1cmUgY29udGV4dCAoaWUuIGNvbnRlbnQgc2NyaXB0KScpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlci5oYW5kbGVSZXF1ZXN0KHJlcXVlc3QsIHNlbmRlcik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtJbnRlcm5hbFJlcXVlc3RCdW5kbGUsIEludGVybmFsUmVzcG9uc2VCdW5kbGUsIFJlcXVlc3RIYW5kbGVyLCBWZXJzaW9ufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7aXNGaXJlZm94LCBydW50aW1lTmFtZXNwYWNlfSBmcm9tICcuLi91dGlscy9kZXRlY3QnO1xuaW1wb3J0IHtpblBhZ2VDb250ZXh0fSBmcm9tICcuLi91dGlscy9zbmlwcyc7XG5pbXBvcnQge2dfUG9zdE1lc3NhZ2VCdXN9IGZyb20gJy4uL2J1cy9wb3N0X21lc3NhZ2VfYnVzJztcblxuZnVuY3Rpb24gY2FuVXNlU2VuZE1lc3NhZ2UoKSB7XG4gICAgLy8gTm90IHN1cHBvcnRlZCBpbiBGaXJlZm94IFBhZ2UgQ29udGV4dFxuICAgIHJldHVybiAhKGlzRmlyZWZveCgpICYmIGluUGFnZUNvbnRleHQoKSk7XG59XG5cbi8qKlxuICogU2VuZCBhIHJlcXVlc3QgdG8gYmUgaGFuZGxlZCBieSB0aGUgYmFja2dyb3VuZCB3b3JrZXJcbiAqXG4gKiBDYW4gYmUgY2FsbGVkIGZyb20gYSBjb250ZW50IHNjcmlwdCBvciBwYWdlIGl0c2VsZlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gQ2xpZW50U2VuZDxSZXEsIFJlc3A+KGhhbmRsZXI6IFJlcXVlc3RIYW5kbGVyPFJlcSwgUmVzcD4sIGFyZ3M6IFJlcSk6IFByb21pc2U8UmVzcD4ge1xuICAgIGNvbnN0IGJ1bmRsZTogSW50ZXJuYWxSZXF1ZXN0QnVuZGxlID0ge1xuICAgICAgICB2ZXJzaW9uOiBWZXJzaW9uLlYxLFxuICAgICAgICByZXF1ZXN0X3R5cGU6IGhhbmRsZXIuZ2V0VHlwZSgpLFxuICAgICAgICByZXF1ZXN0OiBhcmdzLFxuICAgICAgICBpZDogTWF0aC5jZWlsKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMDAwMDApLFxuICAgIH07XG5cbiAgICBpZiAoY2FuVXNlU2VuZE1lc3NhZ2UoKSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBCYWQgdHlwZXNcbiAgICAgICAgICAgIHJ1bnRpbWVOYW1lc3BhY2UoKS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgICAgIHdpbmRvdy5DU0ZMT0FUX0VYVEVOU0lPTl9JRCB8fCBjaHJvbWUucnVudGltZS5pZCxcbiAgICAgICAgICAgICAgICBidW5kbGUsXG4gICAgICAgICAgICAgICAgKHJlc3A6IEludGVybmFsUmVzcG9uc2VCdW5kbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3A/LmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcC5lcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3A/LnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrIHRvIHBvc3RtZXNzYWdlIGJ1cyBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBpbXBsZW1lbnRcbiAgICAgICAgLy8gc3BlY3MgZnVsbHlcbiAgICAgICAgcmV0dXJuIGdfUG9zdE1lc3NhZ2VCdXMuc2VuZFJlcXVlc3QoYnVuZGxlKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgTWVzc2FnZVNlbmRlciA9IGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXI7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL2hhbmRsZXJzL3R5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+IHtcbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTxSZXNwPjtcbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlO1xufVxuXG5leHBvcnQgZW51bSBWZXJzaW9uIHtcbiAgICBWMSA9ICdDU0ZMT0FUX1YxJyxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbFJlcXVlc3RCdW5kbGUge1xuICAgIHZlcnNpb246IHN0cmluZztcblxuICAgIHJlcXVlc3RfdHlwZTogUmVxdWVzdFR5cGU7XG5cbiAgICAvLyBJbnB1dCByZXF1ZXN0XG4gICAgcmVxdWVzdDogYW55O1xuXG4gICAgLy8gUmFuZG9tIElEIHRvIGlkZW50aWZ5IHRoZSByZXF1ZXN0XG4gICAgaWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlIHtcbiAgICByZXF1ZXN0X3R5cGU6IFJlcXVlc3RUeXBlO1xuXG4gICAgLy8gUmVzcG9uc2VcbiAgICByZXNwb25zZTogYW55O1xuXG4gICAgZXJyb3I6IHN0cmluZztcblxuICAgIC8vIFJhbmRvbSBJRCB0byBpZGVudGlmeSB0aGUgcmVxdWVzdFxuICAgIGlkOiBudW1iZXI7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gaXNGaXJlZm94KCkge1xuICAgIHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTE7XG59XG5cbi8qKlxuICogVGhhbmtzIHRvIG91ciBicm93c2VyIG92ZXJsb3Jkcywgd2UgaGF2ZSB0d28gbmFtZXNwYWNlcyBmb3IgYHgucnVudGltZS5mbigpYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcnVudGltZU5hbWVzcGFjZSgpIHtcbiAgICBpZiAoaXNGaXJlZm94KCkpIHtcbiAgICAgICAgcmV0dXJuIGJyb3dzZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNocm9tZTtcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gaW5QYWdlQ29udGV4dCgpIHtcbiAgICByZXR1cm4gdHlwZW9mIGNocm9tZSA9PT0gJ3VuZGVmaW5lZCcgfHwgIWNocm9tZS5leHRlbnNpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3YWl0KG1zOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbiIsImltcG9ydCB7SW50ZXJuYWxSZXF1ZXN0QnVuZGxlLCBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlLCBWZXJzaW9ufSBmcm9tICcuLi9icmlkZ2UvdHlwZXMnO1xuaW1wb3J0IHtydW50aW1lTmFtZXNwYWNlfSBmcm9tICcuLi91dGlscy9kZXRlY3QnO1xuXG4vKipcbiAqIE1lc3NhZ2UgYnVzIHRoYXQgdXNlcyBgcG9zdE1lc3NhZ2VgIGluIG9yZGVyIHRvIGNvbW11bmljYXRlIHdpdGggdGhlIGJhY2tncm91bmRcbiAqIHNlcnZpY2Ugd29ya2VyL3NjcmlwdC5cbiAqXG4gKiBXaHk/IEJlY2F1c2UgdGhlIGNsaWVudCBwYWdlIChpZS4gU3RlYW0gcGFnZSkgb24gRmlyZWZveCBpcyBub3QgY2FwYWJsZSBvZlxuICogc2VuZGluZyBhIG1lc3NhZ2UgZGlyZWN0bHkgdG8gdGhlIGV4dGVuc2lvbiBiYWNrZ3JvdW5kLlxuICpcbiAqIFNvIGl0IHJlcXVpcmVzIHVzIHRvIGRvIHRoZSBmb2xsb3dpbmcgZGFuY2U6XG4gKiBwYWdlIDwtLShwb3N0bWVzc2FnZSktLT4gY29udGVudCBzY3JpcHQgPC0tKHNlbmRtZXNzYWdlKS0tPiBiYWNrZ3JvdW5kIHNjcmlwdFxuICpcbiAqIFRoaXMgZGFuY2UgaXMgYWJzdHJhY3RlZCBpbiBgQ2xpZW50U2VuZGAsIGFuZCBvbmx5IHVzZXMgdGhpcyBidXMgaWZcbiAqIGBzZW5kbWVzc2FnZWAgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGUgcGFnZS5cbiAqL1xuY2xhc3MgUG9zdE1lc3NhZ2VCdXMge1xuICAgIC8qKlxuICAgICAqIEZvciB0aGUgcmVxdWVzdGVyIChpZS4gcGFnZSksIHRvIHdhaXQgdW50aWwgaXQgZ2V0cyBhIHJlc3BvbnNlXG4gICAgICogZnJvbSB0aGUgY29udGVudCBzY3JpcHQgdmlhLiBwb3N0TWVzc2FnZSBmb3IgdGhlIGdpdmVuIHJlcXVlc3QgSURcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBSZXF1ZXN0IElEXG4gICAgICovXG4gICAgd2FpdFVudGlsUmVzcG9uc2VGb3IoaWQ6IG51bWJlcik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gKGU6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3AgPSBlLmRhdGEgYXMgSW50ZXJuYWxSZXNwb25zZUJ1bmRsZTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcC5pZCAhPT0gaWQgfHwgIXJlc3AucmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgbGVha3NcbiAgICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGhhbmRsZXIsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXNwPy5yZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3AucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXNwPy5lcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZHMgYSByZXF1ZXN0IHRvIGJlIGRvbmUgdGhyb3VnaCB0aGUgYnVzLCByZXR1cm5zIHRoZSBhcHByb3ByaWF0ZVxuICAgICAqIHJlc3BvbnNlIGZvciB0aGUgaW5wdXQgYnVuZGxlIGhhbmRsZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidW5kbGUgUmVxdWVzdCBCdW5kbGVcbiAgICAgKi9cbiAgICBzZW5kUmVxdWVzdChidW5kbGU6IEludGVybmFsUmVxdWVzdEJ1bmRsZSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShidW5kbGUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLndhaXRVbnRpbFJlc3BvbnNlRm9yKGJ1bmRsZS5pZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVxdWVzdCBoYW5kbGVyIChjb250ZW50IHNjcmlwdCkgZm9yIG5ldyByZXF1ZXN0cyBmcm9tIHRoZSBwYWdlLlxuICAgICAqXG4gICAgICogRWFjaCByZXF1ZXN0IGlzIGVmZmVjdGl2ZWx5IFwicHJveGllZFwiIHRvIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdC93b3JrZXJcbiAgICAgKiB0byBhY3R1YWxseSBleGVjdXRlIGl0J3MgaGFuZGxlci5cbiAgICAgKi9cbiAgICBoYW5kbGVSZXF1ZXN0cygpIHtcbiAgICAgICAgY29uc3QgaCA9IChlOiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChlLmRhdGEudmVyc2lvbiAhPT0gVmVyc2lvbi5WMSB8fCAhZS5kYXRhLnJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICAvLyBJZ25vcmUgbWVzc2FnZXMgdGhhdCBhcmVuJ3QgZm9yIHRoaXMgYnJpZGdlXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZW5kIHRvIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBCYWQgdHlwZXNcbiAgICAgICAgICAgIHJ1bnRpbWVOYW1lc3BhY2UoKS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLmlkLFxuICAgICAgICAgICAgICAgIGUuZGF0YSxcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlIEJhZCB0eXBlc1xuICAgICAgICAgICAgICAgIChyZXNwOiBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZShyZXNwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaCk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgZ19Qb3N0TWVzc2FnZUJ1cyA9IG5ldyBQb3N0TWVzc2FnZUJ1cygpO1xuIiwiaW1wb3J0IHtFbXB0eVJlc3BvbnNlSGFuZGxlcn0gZnJvbSAnLi9tYWluJztcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtQcml2aWxlZ2VkSGFuZGxlcn0gZnJvbSAnLi4vd3JhcHBlcnMvcHJpdmlsZWdlZCc7XG5cbmludGVyZmFjZSBFeGVjdXRlQ3NzUmVxdWVzdCB7XG4gICAgcGF0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgRXhlY3V0ZUNzc09uUGFnZSA9IG5ldyBQcml2aWxlZ2VkSGFuZGxlcihcbiAgICBuZXcgRW1wdHlSZXNwb25zZUhhbmRsZXI8RXhlY3V0ZUNzc1JlcXVlc3Q+KFJlcXVlc3RUeXBlLkVYRUNVVEVfQ1NTX09OX1BBR0UsIGFzeW5jIChyZXEsIHNlbmRlcikgPT4ge1xuICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmluc2VydENTUyh7XG4gICAgICAgICAgICB0YXJnZXQ6IHt0YWJJZDogc2VuZGVyLnRhYj8uaWQgYXMgbnVtYmVyfSxcbiAgICAgICAgICAgIGZpbGVzOiBbcmVxLnBhdGhdLFxuICAgICAgICB9KTtcbiAgICB9KVxuKTtcbiIsImltcG9ydCB7U2ltcGxlSGFuZGxlcn0gZnJvbSAnLi9tYWluJztcbmltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtQcml2aWxlZ2VkSGFuZGxlcn0gZnJvbSAnLi4vd3JhcHBlcnMvcHJpdmlsZWdlZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmV0Y2hFeHRlbnNpb25GaWxlUmVxdWVzdCB7XG4gICAgcGF0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZldGNoRXh0ZW5zaW9uRmlsZVJlc3BvbnNlIHtcbiAgICB0ZXh0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBGZXRjaEV4dGVuc2lvbkZpbGUgPSBuZXcgUHJpdmlsZWdlZEhhbmRsZXIoXG4gICAgbmV3IFNpbXBsZUhhbmRsZXI8RmV0Y2hFeHRlbnNpb25GaWxlUmVxdWVzdCwgRmV0Y2hFeHRlbnNpb25GaWxlUmVzcG9uc2U+KFxuICAgICAgICBSZXF1ZXN0VHlwZS5GRVRDSF9FWFRFTlNJT05fRklMRSxcbiAgICAgICAgYXN5bmMgKHJlcSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKHJlcS5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHIudGV4dCgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIClcbik7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsImltcG9ydCB7aW5pdH0gZnJvbSAnLi91dGlscyc7XG5cbmluaXQoJ3NyYy9saWIvcGFnZV9zY3JpcHRzL3RyYWRlX2hpc3RvcnkuanMnLCBtYWluKTtcblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHt9XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=