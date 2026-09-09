import{S as T,s as ut,a as yt}from"../../chunks/store-84xM5adB.js";import{e as $,g as et}from"../../chunks/errors-C3inwX-h.js";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const L=globalThis,F=L.ShadowRoot&&(L.ShadyCSS===void 0||L.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,J=Symbol(),st=new WeakMap;let gt=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==J)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(F&&t===void 0){const s=e!==void 0&&e.length===1;s&&(t=st.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&st.set(e,t))}return t}toString(){return this.cssText}};const _t=i=>new gt(typeof i=="string"?i:i+"",void 0,J),W=(i,...t)=>{const e=i.length===1?i[0]:t.reduce((s,o,n)=>s+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+i[n+1],i[0]);return new gt(e,i,J)},Ct=(i,t)=>{if(F)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const e of t){const s=document.createElement("style"),o=L.litNonce;o!==void 0&&s.setAttribute("nonce",o),s.textContent=e.cssText,i.appendChild(s)}},it=F?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return _t(e)})(i):i;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:xt,defineProperty:At,getOwnPropertyDescriptor:wt,getOwnPropertyNames:St,getOwnPropertySymbols:Tt,getPrototypeOf:Et}=Object,G=globalThis,ot=G.trustedTypes,kt=ot?ot.emptyScript:"",Pt=G.reactiveElementPolyfillSupport,O=(i,t)=>i,z={toAttribute(i,t){switch(t){case Boolean:i=i?kt:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},Q=(i,t)=>!xt(i,t),nt={attribute:!0,type:String,converter:z,reflect:!1,useDefault:!1,hasChanged:Q};Symbol.metadata??=Symbol("metadata"),G.litPropertyMetadata??=new WeakMap;let S=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=nt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),o=this.getPropertyDescriptor(t,s,e);o!==void 0&&At(this.prototype,t,o)}}static getPropertyDescriptor(t,e,s){const{get:o,set:n}=wt(this.prototype,t)??{get(){return this[e]},set(r){this[e]=r}};return{get:o,set(r){const l=o?.call(this);n?.call(this,r),this.requestUpdate(t,l,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??nt}static _$Ei(){if(this.hasOwnProperty(O("elementProperties")))return;const t=Et(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(O("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(O("properties"))){const e=this.properties,s=[...St(e),...Tt(e)];for(const o of s)this.createProperty(o,e[o])}const t=this[Symbol.metadata];if(t!==null){const e=litPropertyMetadata.get(t);if(e!==void 0)for(const[s,o]of e)this.elementProperties.set(s,o)}this._$Eh=new Map;for(const[e,s]of this.elementProperties){const o=this._$Eu(e,s);o!==void 0&&this._$Eh.set(o,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const o of s)e.unshift(it(o))}else t!==void 0&&e.push(it(t));return e}static _$Eu(t,e){const s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ct(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,s);if(o!==void 0&&s.reflect===!0){const n=(s.converter?.toAttribute!==void 0?s.converter:z).toAttribute(e,s.type);this._$Em=t,n==null?this.removeAttribute(o):this.setAttribute(o,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,o=s._$Eh.get(t);if(o!==void 0&&this._$Em!==o){const n=s.getPropertyOptions(o),r=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:z;this._$Em=o;const l=r.fromAttribute(e,n.type);this[o]=l??this._$Ej?.get(o)??l,this._$Em=null}}requestUpdate(t,e,s,o=!1,n){if(t!==void 0){const r=this.constructor;if(o===!1&&(n=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??Q)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:o,wrapped:n},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),n!==!0||r!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),o===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[o,n]of this._$Ep)this[o]=n;this._$Ep=void 0}const s=this.constructor.elementProperties;if(s.size>0)for(const[o,n]of s){const{wrapped:r}=n,l=this[o];r!==!0||this._$AL.has(o)||l===void 0||this.C(o,void 0,n,l)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};S.elementStyles=[],S.shadowRootOptions={mode:"open"},S[O("elementProperties")]=new Map,S[O("finalized")]=new Map,Pt?.({ReactiveElement:S}),(G.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const X=globalThis,rt=i=>i,j=X.trustedTypes,at=j?j.createPolicy("lit-html",{createHTML:i=>i}):void 0,ft="$lit$",y=`lit$${Math.random().toFixed(9).slice(2)}$`,mt="?"+y,Ot=`<${mt}>`,A=document,R=()=>A.createComment(""),U=i=>i===null||typeof i!="object"&&typeof i!="function",Y=Array.isArray,Rt=i=>Y(i)||typeof i?.[Symbol.iterator]=="function",K=`[ 	
\f\r]`,P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,lt=/-->/g,ct=/>/g,C=RegExp(`>|${K}(?:([^\\s"'>=/]+)(${K}*=${K}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),dt=/'/g,ht=/"/g,bt=/^(?:script|style|textarea|title)$/i,Ut=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),g=Ut(1),E=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),pt=new WeakMap,x=A.createTreeWalker(A,129);function $t(i,t){if(!Y(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return at!==void 0?at.createHTML(t):t}const Mt=(i,t)=>{const e=i.length-1,s=[];let o,n=t===2?"<svg>":t===3?"<math>":"",r=P;for(let l=0;l<e;l++){const a=i[l];let d,u,c=-1,b=0;for(;b<a.length&&(r.lastIndex=b,u=r.exec(a),u!==null);)b=r.lastIndex,r===P?u[1]==="!--"?r=lt:u[1]!==void 0?r=ct:u[2]!==void 0?(bt.test(u[2])&&(o=RegExp("</"+u[2],"g")),r=C):u[3]!==void 0&&(r=C):r===C?u[0]===">"?(r=o??P,c=-1):u[1]===void 0?c=-2:(c=r.lastIndex-u[2].length,d=u[1],r=u[3]===void 0?C:u[3]==='"'?ht:dt):r===ht||r===dt?r=C:r===lt||r===ct?r=P:(r=C,o=void 0);const v=r===C&&i[l+1].startsWith("/>")?" ":"";n+=r===P?a+Ot:c>=0?(s.push(d),a.slice(0,c)+ft+a.slice(c)+y+v):a+y+(c===-2?l:v)}return[$t(i,n+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]};class M{constructor({strings:t,_$litType$:e},s){let o;this.parts=[];let n=0,r=0;const l=t.length-1,a=this.parts,[d,u]=Mt(t,e);if(this.el=M.createElement(d,s),x.currentNode=this.el.content,e===2||e===3){const c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(o=x.nextNode())!==null&&a.length<l;){if(o.nodeType===1){if(o.hasAttributes())for(const c of o.getAttributeNames())if(c.endsWith(ft)){const b=u[r++],v=o.getAttribute(c).split(y),D=/([.?@])?(.*)/.exec(b);a.push({type:1,index:n,name:D[2],strings:v,ctor:D[1]==="."?Nt:D[1]==="?"?Ht:D[1]==="@"?Dt:V}),o.removeAttribute(c)}else c.startsWith(y)&&(a.push({type:6,index:n}),o.removeAttribute(c));if(bt.test(o.tagName)){const c=o.textContent.split(y),b=c.length-1;if(b>0){o.textContent=j?j.emptyScript:"";for(let v=0;v<b;v++)o.append(c[v],R()),x.nextNode(),a.push({type:2,index:++n});o.append(c[b],R())}}}else if(o.nodeType===8)if(o.data===mt)a.push({type:2,index:n});else{let c=-1;for(;(c=o.data.indexOf(y,c+1))!==-1;)a.push({type:7,index:n}),c+=y.length-1}n++}}static createElement(t,e){const s=A.createElement("template");return s.innerHTML=t,s}}function k(i,t,e=i,s){if(t===E)return t;let o=s!==void 0?e._$Co?.[s]:e._$Cl;const n=U(t)?void 0:t._$litDirective$;return o?.constructor!==n&&(o?._$AO?.(!1),n===void 0?o=void 0:(o=new n(i),o._$AT(i,e,s)),s!==void 0?(e._$Co??=[])[s]=o:e._$Cl=o),o!==void 0&&(t=k(i,o._$AS(i,t.values),o,s)),t}class It{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,o=(t?.creationScope??A).importNode(e,!0);x.currentNode=o;let n=x.nextNode(),r=0,l=0,a=s[0];for(;a!==void 0;){if(r===a.index){let d;a.type===2?d=new I(n,n.nextSibling,this,t):a.type===1?d=new a.ctor(n,a.name,a.strings,this,t):a.type===6&&(d=new Lt(n,this,t)),this._$AV.push(d),a=s[++l]}r!==a?.index&&(n=x.nextNode(),r++)}return x.currentNode=A,o}p(t){let e=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class I{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,o){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=k(this,t,e),U(t)?t===h||t==null||t===""?(this._$AH!==h&&this._$AR(),this._$AH=h):t!==this._$AH&&t!==E&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Rt(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==h&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(A.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,o=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=M.createElement($t(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(e);else{const n=new It(o,this),r=n.u(this.options);n.p(e),this.T(r),this._$AH=n}}_$AC(t){let e=pt.get(t.strings);return e===void 0&&pt.set(t.strings,e=new M(t)),e}k(t){Y(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,o=0;for(const n of t)o===e.length?e.push(s=new I(this.O(R()),this.O(R()),this,this.options)):s=e[o],s._$AI(n),o++;o<e.length&&(this._$AR(s&&s._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const s=rt(t).nextSibling;rt(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class V{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,o,n){this.type=1,this._$AH=h,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=h}_$AI(t,e=this,s,o){const n=this.strings;let r=!1;if(n===void 0)t=k(this,t,e,0),r=!U(t)||t!==this._$AH&&t!==E,r&&(this._$AH=t);else{const l=t;let a,d;for(t=n[0],a=0;a<n.length-1;a++)d=k(this,l[s+a],e,a),d===E&&(d=this._$AH[a]),r||=!U(d)||d!==this._$AH[a],d===h?t=h:t!==h&&(t+=(d??"")+n[a+1]),this._$AH[a]=d}r&&!o&&this.j(t)}j(t){t===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Nt extends V{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===h?void 0:t}}class Ht extends V{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==h)}}class Dt extends V{constructor(t,e,s,o,n){super(t,e,s,o,n),this.type=5}_$AI(t,e=this){if((t=k(this,t,e,0)??h)===E)return;const s=this._$AH,o=t===h&&s!==h||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==h&&(s===h||o);o&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class Lt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){k(this,t)}}const zt=X.litHtmlPolyfillSupport;zt?.(M,I),(X.litHtmlVersions??=[]).push("3.3.2");const jt=(i,t,e)=>{const s=e?.renderBefore??t;let o=s._$litPart$;if(o===void 0){const n=e?.renderBefore??null;s._$litPart$=o=new I(t.insertBefore(R(),n),n,void 0,e??{})}return o._$AI(i),o};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const tt=globalThis;class _ extends S{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=jt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return E}}_._$litElement$=!0,_.finalized=!0,tt.litElementHydrateSupport?.({LitElement:_});const Bt=tt.litElementPolyfillSupport;Bt?.({LitElement:_});(tt.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const q=i=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(i,t)}):customElements.define(i,t)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Wt={attribute:!0,type:String,converter:z,reflect:!1,hasChanged:Q},Gt=(i=Wt,t,e)=>{const{kind:s,metadata:o}=e;let n=globalThis.litPropertyMetadata.get(o);if(n===void 0&&globalThis.litPropertyMetadata.set(o,n=new Map),s==="setter"&&((i=Object.create(i)).wrapped=!0),n.set(e.name,i),s==="accessor"){const{name:r}=e;return{set(l){const a=t.get.call(this);t.set.call(this,l),this.requestUpdate(r,a,i,!0,l)},init(l){return l!==void 0&&this.C(r,void 0,i,l),l}}}if(s==="setter"){const{name:r}=e;return function(l){const a=this[r];t.call(this,l),this.requestUpdate(r,a,i,!0,l)}}throw Error("Unsupported decorator location: "+s)};function N(i){return(t,e)=>typeof e=="object"?Gt(i,t,e):((s,o,n)=>{const r=o.hasOwnProperty(n);return o.constructor.createProperty(n,s),r?Object.getOwnPropertyDescriptor(o,n):void 0})(i,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function f(i){return N({...i,state:!0,attribute:!1})}var Vt=Object.defineProperty,qt=Object.getOwnPropertyDescriptor,m=(i,t,e,s)=>{for(var o=s>1?void 0:s?qt(t,e):t,n=i.length-1,r;n>=0;n--)(r=i[n])&&(o=(s?r(t,e,o):r(o))||o);return s&&o&&Vt(t,e,o),o};let p=class extends _{constructor(){super(...arguments),this.showDebug=$.extensionVersion.includes("-dev"),this.connected=!1,this.socketId=null,this.hasToken=!1,this.debugState="",this.debugWsUrl="",this.debugHasToken=!1,this.steamConnected=!1,this.steamPermissionsGranted=!1,this.steamId=null,this.steamTokenAge=null,this.steamTestResult="",this.steamTesting=!1,this.apiTestResult="",this.apiTesting=!1,this.reconnecting=!1,this.storageListener=i=>{T.JWT_TOKEN in i&&(this.hasToken=!!i[T.JWT_TOKEN].newValue,this.loadConnectionState())}}connectedCallback(){super.connectedCallback(),this.loadState(),chrome.storage.local.onChanged.addListener(this.storageListener)}disconnectedCallback(){super.disconnectedCallback(),chrome.storage.local.onChanged.removeListener(this.storageListener)}async loadState(){await Promise.all([this.loadConnectionState(),this.loadSteamPermissions(),this.loadSteamState()])}async loadSteamPermissions(){try{const i=await chrome.runtime.sendMessage({type:"CHECK_STEAM_PERMISSIONS"});this.steamPermissionsGranted=i?.granted||!1}catch{this.steamPermissionsGranted=!1}}async loadConnectionState(){try{const i=await chrome.runtime.sendMessage({type:"GET_CONNECTION_STATE"});this.connected=i?.connected||!1,this.socketId=i?.socketId||null,this.debugState=i?.state||"unknown",this.debugWsUrl=i?.wsUrl||"unknown",this.debugHasToken=i?.hasToken||!1}catch{this.connected=!1}try{this.hasToken=!!await ut(T.JWT_TOKEN)}catch{this.hasToken=!1}}async loadSteamState(){try{const i=await chrome.runtime.sendMessage({type:"GET_STEAM_STATUS"});if(this.steamConnected=i?.hasCachedToken||!1,this.steamId=i?.steamId||null,this.steamTokenAge=i?.tokenAge??null,this.steamPermissionsGranted&&!this.steamConnected){const t=await chrome.runtime.sendMessage({type:"GET_STEAM_STATUS",refresh:!0});this.steamConnected=t?.hasCachedToken||!1,this.steamId=t?.steamId||null,this.steamTokenAge=t?.tokenAge??null}}catch{}}async testSteam(){this.steamTesting=!0,this.steamTestResult="testing...";try{const i=await chrome.runtime.sendMessage({type:"TEST_STEAM"});i?.success?(this.steamTestResult=`OK | ID: ${i.steamId} | token: ${i.hasAccessToken?"yes":"no"} | session: ${i.hasSessionId?"yes":"no"} | matched: ${i.matchedPattern} | snippet: ${i.steamIdSnippet}`,this.steamConnected=!!i.hasAccessToken,this.steamId=i.steamId,this.steamTokenAge=0):this.steamTestResult=`FAIL: ${i?.error||"unknown"}`}catch(i){this.steamTestResult=`ERROR: ${et(i)}`}this.steamTesting=!1}async testApi(){this.apiTesting=!0,this.apiTestResult="testing...";try{const i=Date.now(),t=await fetch($.apiBaseUrl),e=Date.now()-i,s=await t.text();this.apiTestResult=`${t.status} ${t.statusText} (${e}ms) — ${s.slice(0,100)}`}catch(i){this.apiTestResult=`ERROR: ${et(i)}`}this.apiTesting=!1}async forceReconnect(){this.reconnecting=!0;try{await chrome.runtime.sendMessage({type:"FORCE_RECONNECT"}),await this.loadConnectionState(),this.connected||setTimeout(()=>this.loadConnectionState(),1500)}catch{}this.reconnecting=!1}async clearStoredToken(){await yt(T.JWT_TOKEN),this.hasToken=!1,await this.loadConnectionState()}render(){return g`
      <div class="header">
        <div class="logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="8" fill="#4BF364"/>
            <path d="M23.39 11.37C22.98 7.22 19.43 4 15.06 4C11.17 4 7.91 6.57 6.97 10.07C6.82 10.64 6.24 14.93 5.73 17.71C5.18 20.8 4.61 21.98 4.51 22.94C4.47 23.3 4.62 23.59 4.88 23.8C5.14 24.02 5.51 24.06 5.88 23.91C7.28 23.23 8.7 22.25 9.72 21.14C9.89 20.9 10.19 20.74 10.52 20.74C10.81 20.74 11.07 20.86 11.24 21.06C11.36 21.2 11.46 21.46 11.48 21.61C11.55 22.08 11.42 22.55 11.5 23.12C11.58 23.52 11.84 23.8 12.21 23.91C12.5 24.02 12.87 23.99 13.17 23.8C14.37 23.15 15.91 21.09 16 20.99C16.16 20.83 16.37 20.74 16.63 20.74C16.87 20.74 17.14 20.83 17.31 20.98C17.38 21.04 17.52 21.22 17.58 21.37C17.84 21.89 17.87 22.52 18.06 23.19C18.21 23.7 18.65 23.99 19.13 23.99C19.42 23.99 19.68 23.9 19.89 23.71C21.9 22.04 24.01 17.16 23.39 11.37ZM14.1 15.39C13.76 15.68 13.39 15.82 13.02 15.82C11.62 15.82 10.99 13.98 11.1 12.21C11.17 10.58 11.87 8.95 13.1 8.74C13.17 8.74 13.24 8.7 13.32 8.7C14.43 8.7 15.58 10.11 15.5 12.21C15.47 13.51 14.91 14.74 14.1 15.39ZM19.95 15.39C19.61 15.68 19.24 15.82 18.87 15.82C17.47 15.82 16.84 13.98 16.95 12.21C17.02 10.58 17.72 8.95 18.95 8.74C19.02 8.74 19.09 8.7 19.17 8.7C20.28 8.7 21.43 10.11 21.35 12.21C21.32 13.51 20.76 14.74 19.95 15.39Z" fill="#10151E"/>
          </svg>
          Skins.com
        </div>
        <span class="version">v${$.extensionVersion}</span>
      </div>
      <div class="content">
        <connection-status
          .hasToken=${this.hasToken}
          .wsConnected=${this.connected}
          .steamConnected=${this.steamConnected}
          .steamPermissionsGranted=${this.steamPermissionsGranted}
        ></connection-status>
        ${this.hasToken?g`<trade-activity></trade-activity>`:""}
        ${this.showDebug?g`
            <div class="debug">
              <div class="debug-title">Debug — Skins.com</div>
              <div class="debug-row"><span>WS State</span><span class="debug-val">${this.debugState}</span></div>
              <div class="debug-row"><span>WS URL</span><span class="debug-val">${this.debugWsUrl}</span></div>
              <div class="debug-row"><span>BG Token</span><span class="debug-val">${this.debugHasToken?"yes":"no"}</span></div>
              <div class="debug-row"><span>Storage Token</span><span class="debug-val">${this.hasToken?"yes":"no"}</span></div>
              <div class="debug-row"><span>Socket ID</span><span class="debug-val">${this.socketId||"none"}</span></div>
              <div class="debug-row"><span>API URL</span><span class="debug-val">${$.apiBaseUrl}</span></div>

              <button
                class="debug-btn"
                ?disabled=${this.apiTesting}
                @click=${this.testApi}
              >
                ${this.apiTesting?"Testing...":"Test API"}
              </button>
              ${this.apiTestResult?g`<div class="debug-result">${this.apiTestResult}</div>`:""}

              <div class="debug-btn-row">
                <button
                  class="debug-btn"
                  ?disabled=${this.reconnecting}
                  @click=${this.forceReconnect}
                >
                  ${this.reconnecting?"Reconnecting...":"Reconnect WS"}
                </button>
                <button
                  class="debug-btn red"
                  @click=${this.clearStoredToken}
                >
                  Clear Token
                </button>
              </div>

              <hr class="debug-sep">
              <div class="debug-title">Debug — Steam</div>
              <div class="debug-row"><span>Steam ID</span><span class="debug-val">${this.steamId||"none"}</span></div>
              <div class="debug-row"><span>Token Age</span><span class="debug-val">${this.steamTokenAge!==null?`${this.steamTokenAge}s ago`:"no token"}</span></div>
              <button
                class="debug-btn"
                ?disabled=${this.steamTesting}
                @click=${this.testSteam}
              >
                ${this.steamTesting?"Testing...":"Test Steam Connection"}
              </button>
              ${this.steamTestResult?g`<div class="debug-result">${this.steamTestResult}</div>`:""}
            </div>
          `:""}
      </div>
    `}};p.styles=W`
    :host {
      display: block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: var(--color-base-800, #141925);
      border-bottom: 1px solid var(--color-base-500, #232e43);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 14px;
      color: var(--color-base-0, #fff);
    }

    .logo svg {
      flex-shrink: 0;
    }

    .version {
      font-size: 11px;
      color: var(--color-base-300, #6d7790);
      font-weight: 400;
    }

    .content {
      padding: 16px;
    }

    .debug {
      margin-top: 12px;
      padding: 10px;
      background: var(--color-base-950, #0c1017);
      border: 1px solid var(--color-base-500, #232e43);
      border-radius: 6px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      line-height: 1.6;
      color: var(--color-base-300, #6d7790);
    }

    .debug-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-base-300, #6d7790);
      margin-bottom: 6px;
      font-weight: 600;
    }

    .debug-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .debug-val {
      color: var(--color-base-200, #cfd4de);
      text-align: right;
      word-break: break-all;
    }

    .debug-sep {
      border: none;
      border-top: 1px solid var(--color-base-500, #232e43);
      margin: 6px 0;
    }

    .debug-btn {
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 5px 0;
      background: var(--color-base-700, #171d2b);
      border: 1px solid var(--color-base-500, #232e43);
      border-radius: 4px;
      color: var(--color-base-200, #cfd4de);
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .debug-btn:hover {
      background: var(--color-base-600, #1e2739);
    }

    .debug-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .debug-result {
      margin-top: 4px;
      font-size: 9px;
      word-break: break-all;
      color: var(--color-base-200, #cfd4de);
    }

    .debug-btn-row {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .debug-btn-row .debug-btn {
      margin-top: 0;
      flex: 1;
    }

    .debug-btn.red {
      background: rgba(243, 167, 189, 0.1);
      border-color: rgba(243, 167, 189, 0.25);
      color: #f3a7bd;
    }

    .debug-btn.red:hover {
      background: rgba(243, 167, 189, 0.2);
    }
  `;m([f()],p.prototype,"connected",2);m([f()],p.prototype,"socketId",2);m([f()],p.prototype,"hasToken",2);m([f()],p.prototype,"debugState",2);m([f()],p.prototype,"debugWsUrl",2);m([f()],p.prototype,"debugHasToken",2);m([f()],p.prototype,"steamConnected",2);m([f()],p.prototype,"steamPermissionsGranted",2);m([f()],p.prototype,"steamId",2);m([f()],p.prototype,"steamTokenAge",2);m([f()],p.prototype,"steamTestResult",2);m([f()],p.prototype,"steamTesting",2);m([f()],p.prototype,"apiTestResult",2);m([f()],p.prototype,"apiTesting",2);m([f()],p.prototype,"reconnecting",2);p=m([q("skinscom-popup")],p);var Kt=Object.defineProperty,Zt=Object.getOwnPropertyDescriptor,H=(i,t,e,s)=>{for(var o=s>1?void 0:s?Zt(t,e):t,n=i.length-1,r;n>=0;n--)(r=i[n])&&(o=(s?r(t,e,o):r(o))||o);return s&&o&&Kt(t,e,o),o};let w=class extends _{constructor(){super(...arguments),this.hasToken=!1,this.wsConnected=!1,this.steamConnected=!1,this.steamPermissionsGranted=!1}get steamIconUrl(){return chrome.runtime.getURL("icons/steam.png")}openUrl(i){chrome.tabs.create({url:i})}async requestSteamPermissions(){try{((await chrome.runtime.sendMessage({type:"REQUEST_STEAM_PERMISSIONS"}))?.granted||!1)&&(this.steamPermissionsGranted=!0)}catch(i){console.error("Failed to request Steam permissions:",i)}}renderSkinscomStatus(){return this.hasToken?this.wsConnected?g`
        <span class="status-text">Connected</span>
        <div class="dot on"></div>
      `:g`
      <span class="status-text">Logged in</span>
      <div class="dot warn"></div>
    `:g`
        <button class="login-btn" @click=${()=>this.openUrl($.appBaseUrl)}>Log in</button>
        <div class="dot off"></div>
      `}renderSteamStatus(){return this.steamPermissionsGranted?this.steamConnected?g`
        <span class="status-text">Connected</span>
        <div class="dot on"></div>
      `:g`
      <button class="login-btn" @click=${()=>this.openUrl("https://steamcommunity.com/login/home/?goto=")}>Log in</button>
      <div class="dot off"></div>
    `:g`
        <button class="login-btn" @click=${this.requestSteamPermissions}>Enable</button>
        <div class="dot off"></div>
      `}render(){return g`
      <div class="indicators">
        <div class="row">
          <div class="icon">
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="8" fill="#4BF364"/>
              <path d="M23.39 11.37C22.98 7.22 19.43 4 15.06 4C11.17 4 7.91 6.57 6.97 10.07C6.82 10.64 6.24 14.93 5.73 17.71C5.18 20.8 4.61 21.98 4.51 22.94C4.47 23.3 4.62 23.59 4.88 23.8C5.14 24.02 5.51 24.06 5.88 23.91C7.28 23.23 8.7 22.25 9.72 21.14C9.89 20.9 10.19 20.74 10.52 20.74C10.81 20.74 11.07 20.86 11.24 21.06C11.36 21.2 11.46 21.46 11.48 21.61C11.55 22.08 11.42 22.55 11.5 23.12C11.58 23.52 11.84 23.8 12.21 23.91C12.5 24.02 12.87 23.99 13.17 23.8C14.37 23.15 15.91 21.09 16 20.99C16.16 20.83 16.37 20.74 16.63 20.74C16.87 20.74 17.14 20.83 17.31 20.98C17.38 21.04 17.52 21.22 17.58 21.37C17.84 21.89 17.87 22.52 18.06 23.19C18.21 23.7 18.65 23.99 19.13 23.99C19.42 23.99 19.68 23.9 19.89 23.71C21.9 22.04 24.01 17.16 23.39 11.37ZM14.1 15.39C13.76 15.68 13.39 15.82 13.02 15.82C11.62 15.82 10.99 13.98 11.1 12.21C11.17 10.58 11.87 8.95 13.1 8.74C13.17 8.74 13.24 8.7 13.32 8.7C14.43 8.7 15.58 10.11 15.5 12.21C15.47 13.51 14.91 14.74 14.1 15.39ZM19.95 15.39C19.61 15.68 19.24 15.82 18.87 15.82C17.47 15.82 16.84 13.98 16.95 12.21C17.02 10.58 17.72 8.95 18.95 8.74C19.02 8.74 19.09 8.7 19.17 8.7C20.28 8.7 21.43 10.11 21.35 12.21C21.32 13.51 20.76 14.74 19.95 15.39Z" fill="#10151E"/>
            </svg>
          </div>
          <span class="label">${$.siteDisplayName}</span>
          <div class="status">
            ${this.renderSkinscomStatus()}
          </div>
        </div>
        <div class="row">
          <div class="icon">
            <img src=${this.steamIconUrl} alt="Steam">
          </div>
          <span class="label">Steam</span>
          <div class="status">
            ${this.renderSteamStatus()}
          </div>
        </div>
      </div>
    `}};w.styles=W`
    :host {
      display: block;
      margin-bottom: 12px;
    }

    .indicators {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--color-base-800, #141925);
      border-radius: 8px;
      border: 1px solid var(--color-base-500, #232e43);
    }

    .icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon img {
      width: 18px;
      height: 18px;
      border-radius: 4px;
    }

    .icon svg {
      width: 18px;
      height: 18px;
    }

    .label {
      font-size: 12px;
      color: var(--color-base-200, #cfd4de);
      font-weight: 500;
    }

    .status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-text {
      font-size: 11px;
      color: var(--color-base-300, #6d7790);
    }

    .login-btn {
      font-size: 11px;
      font-weight: 500;
      color: var(--color-base-900, #10151e);
      background: var(--color-brand-100, #4bf364);
      border: none;
      border-radius: 4px;
      padding: 3px 10px;
      cursor: pointer;
      transition: opacity 0.15s;
      font-family: inherit;
    }

    .login-btn:hover {
      opacity: 0.85;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot.on {
      background: var(--color-brand-100, #4bf364);
      box-shadow: 0 0 6px var(--color-brand-100, #4bf364);
    }

    .dot.warn {
      background: var(--color-warning, #f3c087);
      box-shadow: 0 0 6px var(--color-warning, #f3c087);
    }

    .dot.off {
      background: var(--color-danger, #f3a7bd);
      box-shadow: 0 0 6px var(--color-danger, #f3a7bd);
    }
  `;H([N({type:Boolean})],w.prototype,"hasToken",2);H([N({type:Boolean})],w.prototype,"wsConnected",2);H([N({type:Boolean})],w.prototype,"steamConnected",2);H([N({type:Boolean})],w.prototype,"steamPermissionsGranted",2);w=H([q("connection-status")],w);var Ft=Object.defineProperty,Jt=Object.getOwnPropertyDescriptor,vt=(i,t,e,s)=>{for(var o=s>1?void 0:s?Jt(t,e):t,n=i.length-1,r;n>=0;n--)(r=i[n])&&(o=(s?r(t,e,o):r(o))||o);return s&&o&&Ft(t,e,o),o};let B=class extends _{constructor(){super(...arguments),this.trades=[],this.storageListener=i=>{T.ACTIVE_TRADES in i&&this.loadTrades()}}connectedCallback(){super.connectedCallback(),this.loadTrades(),chrome.storage.local.onChanged.addListener(this.storageListener)}disconnectedCallback(){super.disconnectedCallback(),chrome.storage.local.onChanged.removeListener(this.storageListener)}async loadTrades(){try{const i=await ut(T.ACTIVE_TRADES);this.trades=i?Object.values(i):[]}catch{this.trades=[]}}render(){return g`
      <div class="section-title">Active Trades</div>
      ${this.trades.length===0?g`<div class="empty">No active trades</div>`:this.trades.map(i=>g`
              <div class="trade">
                <div class="trade-header">
                  <span class="trade-type ${i.type.toLowerCase()}">${i.type}</span>
                  <span class="trade-status">${i.status}</span>
                </div>
                <div class="trade-price">${i.price}</div>
                <div class="trade-id">${i.tradeId.slice(0,12)}...</div>
              </div>
            `)}
    `}};B.styles=W`
    :host {
      display: block;
    }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-base-300, #6d7790);
      margin-bottom: 8px;
      font-weight: 600;
    }

    .empty {
      text-align: center;
      color: var(--color-base-300, #6d7790);
      padding: 16px 0;
      font-size: 12px;
    }

    .trade {
      padding: 10px 12px;
      background: var(--color-base-800, #141925);
      border-radius: 8px;
      border: 1px solid var(--color-base-500, #232e43);
      margin-bottom: 6px;
    }

    .trade-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .trade-type {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .trade-type.buy {
      color: var(--color-brand-100, #4bf364);
    }

    .trade-type.sell {
      color: var(--color-warning, #f3c087);
    }

    .trade-status {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(75, 243, 100, 0.1);
      color: var(--color-brand-100, #4bf364);
      font-weight: 500;
    }

    .trade-price {
      font-size: 12px;
      color: var(--color-base-0, #fff);
      font-weight: 500;
    }

    .trade-id {
      font-size: 10px;
      color: var(--color-base-300, #6d7790);
      font-family: 'IBM Plex Mono', monospace;
    }
  `;vt([f()],B.prototype,"trades",2);B=vt([q("trade-activity")],B);var Qt=Object.getOwnPropertyDescriptor,Xt=(i,t,e,s)=>{for(var o=s>1?void 0:s?Qt(t,e):t,n=i.length-1,r;n>=0;n--)(r=i[n])&&(o=r(o)||o);return o};let Z=class extends _{handleLogin(){chrome.tabs.create({url:$.appBaseUrl})}render(){return g`
      <div class="prompt">
        <div class="title">Not Connected</div>
        <div class="description">
          Log in to ${$.siteDisplayName} to enable P2P trading.
          The extension will automatically detect your session.
        </div>
        <button class="login-btn" @click=${this.handleLogin}>
          Open ${$.siteDisplayName}
        </button>
      </div>
    `}};Z.styles=W`
    :host {
      display: block;
    }

    .prompt {
      text-align: center;
      padding: 24px 16px;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-base-0, #fff);
      margin-bottom: 8px;
    }

    .description {
      font-size: 12px;
      color: var(--color-base-300, #6d7790);
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .login-btn {
      display: inline-block;
      padding: 9px 24px;
      background: var(--color-brand-100, #4bf364);
      color: var(--color-base-900, #10151e);
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.15s;
    }

    .login-btn:hover {
      opacity: 0.85;
    }
  `;Z=Xt([q("login-prompt")],Z);
