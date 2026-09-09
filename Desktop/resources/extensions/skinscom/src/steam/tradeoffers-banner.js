import{s as b,S as x}from"../../chunks/store-84xM5adB.js";const s="skinscom-permission-banner",c="skinscom-trade-badge",d="data-skinscom-branded",g=`<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="8" fill="#4BF364"/>
  <path d="M23.39 11.37C22.98 7.22 19.43 4 15.06 4C11.17 4 7.91 6.57 6.97 10.07C6.82 10.64 6.24 14.93 5.73 17.71C5.18 20.8 4.61 21.98 4.51 22.94C4.47 23.3 4.62 23.59 4.88 23.8C5.14 24.02 5.51 24.06 5.88 23.91C7.28 23.23 8.7 22.25 9.72 21.14C9.89 20.9 10.19 20.74 10.52 20.74C10.81 20.74 11.07 20.86 11.24 21.06C11.36 21.2 11.46 21.46 11.48 21.61C11.55 22.08 11.42 22.55 11.5 23.12C11.58 23.52 11.84 23.8 12.21 23.91C12.5 24.02 12.87 23.99 13.17 23.8C14.37 23.15 15.91 21.09 16 20.99C16.16 20.83 16.37 20.74 16.63 20.74C16.87 20.74 17.14 20.83 17.31 20.98C17.38 21.04 17.52 21.22 17.58 21.37C17.84 21.89 17.87 22.52 18.06 23.19C18.21 23.7 18.65 23.99 19.13 23.99C19.42 23.99 19.68 23.9 19.89 23.71C21.9 22.04 24.01 17.16 23.39 11.37ZM14.1 15.39C13.76 15.68 13.39 15.82 13.02 15.82C11.62 15.82 10.99 13.98 11.1 12.21C11.17 10.58 11.87 8.95 13.1 8.74C13.17 8.74 13.24 8.7 13.32 8.7C14.43 8.7 15.58 10.11 15.5 12.21C15.47 13.51 14.91 14.74 14.1 15.39ZM19.95 15.39C19.61 15.68 19.24 15.82 18.87 15.82C17.47 15.82 16.84 13.98 16.95 12.21C17.02 10.58 17.72 8.95 18.95 8.74C19.02 8.74 19.09 8.7 19.17 8.7C20.28 8.7 21.43 10.11 21.35 12.21C21.32 13.51 20.76 14.74 19.95 15.39Z" fill="#10151E"/>
</svg>`;function p(){return typeof navigator<"u"&&navigator.userAgent.includes("Firefox")}async function h(){return new Promise(e=>{let t=!1;const n=r=>{t||(t=!0,e(r))},o=window.setTimeout(()=>n(!1),1500);try{chrome.runtime.sendMessage({type:"CHECK_STEAM_PERMISSIONS"},r=>{if(window.clearTimeout(o),chrome.runtime.lastError){n(!1);return}n(r?.granted??!1)})}catch{window.clearTimeout(o),n(!1)}})}function C(){if(document.getElementById("skinscom-styles"))return;const e=document.createElement("style");e.id="skinscom-styles",e.textContent=`
    /* Permission banner */
    #${s} {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      margin: 16px 0;
      background: #1b2838;
      border: 1px solid #2a475e;
      border-radius: 4px;
      font-family: "Motiva Sans", Arial, Helvetica, sans-serif;
      box-sizing: border-box;
    }
    #${s} .skinscom-logo {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
    }
    #${s} .skinscom-text {
      flex: 1;
      min-width: 0;
    }
    #${s} .skinscom-title {
      font-size: 14px;
      font-weight: 600;
      color: #c6d4df;
      margin: 0 0 2px 0;
      line-height: 1.3;
    }
    #${s} .skinscom-desc {
      font-size: 12px;
      color: #8f98a0;
      margin: 0;
      line-height: 1.3;
    }
    #${s} .skinscom-btn {
      flex-shrink: 0;
      padding: 8px 20px;
      border: none;
      border-radius: 3px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s;
      font-family: inherit;
    }
    #${s} .skinscom-btn:hover {
      filter: brightness(1.1);
    }
    #${s} .skinscom-btn.green {
      background: #4bf364;
      color: #10151e;
    }
    #${s} .skinscom-btn.grey {
      background: #3d4450;
      color: #8f98a0;
      cursor: default;
    }
    #${s} .skinscom-btn.grey:hover {
      filter: none;
    }

    /* Trade offer branding */
    .tradeoffer[${d}] .tradeoffer_items_ctn {
      border: 1px solid rgba(75, 243, 100, 0.25) !important;
      border-top: none !important;
      border-radius: 0 0 6px 6px !important;
      overflow: hidden;
    }

    .${c} {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: linear-gradient(135deg, rgba(75, 243, 100, 0.08) 0%, rgba(16, 21, 30, 0.95) 100%);
      border: 1px solid rgba(75, 243, 100, 0.25);
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      font-family: "Motiva Sans", Arial, Helvetica, sans-serif;
    }

    .${c} .skinscom-badge-logo {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .${c} .skinscom-badge-label {
      font-size: 12px;
      font-weight: 600;
      color: #c6d4df;
      flex: 1;
    }

    .${c} .skinscom-badge-label span {
      color: #4bf364;
    }

    .${c} .skinscom-badge-verified {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #4bf364;
    }

    .${c} .skinscom-badge-verified svg {
      width: 14px;
      height: 14px;
    }

  `,document.head.appendChild(e)}function f(e){const t=new DOMParser().parseFromString(e,"image/svg+xml");return document.importNode(t.documentElement,!0)}function k(){const e=p(),t=document.createElement("div");t.id=s;const n=document.createElement("div");n.className="skinscom-logo",n.appendChild(f(g));const o=document.createElement("div");o.className="skinscom-text";const r=document.createElement("p");r.className="skinscom-title",r.textContent="Enable Trade Tracking on Skins.com";const i=document.createElement("p");i.className="skinscom-desc",i.textContent="Confirm and verify your Skins.com trades automatically.",o.append(r,i);const a=document.createElement("button");return a.id="skinscom-enable-btn",a.className=`skinscom-btn ${e?"grey":"green"}`,a.textContent=e?"Enable in Extension Popup":"Enable",t.append(n,o,a),t}function u(){const e=document.querySelector(".maincontent .profile_leftcol")||document.querySelector(".maincontent");if(!e)return;const t=k();e.insertBefore(t,e.firstChild);const n=document.getElementById("skinscom-enable-btn");n&&n.addEventListener("click",()=>{if(p()){alert("Please enable Steam permissions in the Skins.com extension popup (top-right of your browser).");return}chrome.runtime.sendMessage({type:"REQUEST_STEAM_PERMISSIONS"},o=>{o?.granted?t.remove():alert("Steam permissions are required for P2P trading to work.")})})}const v=`<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm3.54 5.35l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 111.06-1.06L7 8.77l3.47-3.47a.75.75 0 111.06 1.06z" fill="#4bf364"/>
</svg>`;async function S(){const e=new Set;try{const t=await b(x.ACTIVE_TRADES);if(t)for(const n of Object.values(t))n.steamOfferId&&e.add(n.steamOfferId)}catch{}return e}function y(e){const t=e.id;return t.startsWith("tradeofferid_")?t.slice(13):null}function E(e,t){const n=y(e);return!!(n&&t.has(n))}function m(e,t){if(e.hasAttribute(d)||!E(e,t))return;e.setAttribute(d,"");const n=e.querySelector(".tradeoffer_items_ctn");if(!n)return;const o=document.createElement("div");o.className=c;const r=document.createElement("div");r.className="skinscom-badge-logo",r.appendChild(f(g));const i=document.createElement("div");i.className="skinscom-badge-label";const a=document.createElement("span");a.textContent="Skins.com",i.append(a," Trade");const l=document.createElement("div");l.className="skinscom-badge-verified",l.append(f(v)," Verified"),o.append(r,i,l),n.parentElement.insertBefore(o,n)}function w(e){const t=document.querySelector(".profile_leftcol")||document.querySelector(".maincontent")||document.body,n=new MutationObserver(o=>{for(const r of o)for(const i of Array.from(r.addedNodes))i instanceof HTMLElement&&(i.classList.contains("tradeoffer")&&m(i,e),i.querySelectorAll?.(".tradeoffer")?.forEach(a=>m(a,e)))});n.observe(t,{childList:!0,subtree:!0}),window.addEventListener("pagehide",()=>n.disconnect(),{once:!0})}async function M(){C();const e=async()=>{const t=await S();document.querySelectorAll(`.tradeoffer:not([${d}])`).forEach(o=>m(o,t)),w(t)};h().then(t=>{t||(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u,{once:!0}):u())}).catch(()=>{}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>e()):await e()}M();
