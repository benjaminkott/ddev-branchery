var Pe=globalThis,We=Pe.ShadowRoot&&(Pe.ShadyCSS===void 0||Pe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,an=Symbol(),on=new WeakMap,je=class{constructor(e,n,s){if(this._$cssResult$=!0,s!==an)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(We&&e===void 0){let s=n!==void 0&&n.length===1;s&&(e=on.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&on.set(n,e))}return e}toString(){return this.cssText}},ln=t=>new je(typeof t=="string"?t:t+"",void 0,an);var dn=(t,e)=>{if(We)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let s=document.createElement("style"),o=Pe.litNonce;o!==void 0&&s.setAttribute("nonce",o),s.textContent=n.cssText,t.appendChild(s)}},_t=We?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let s of e.cssRules)n+=s.cssText;return ln(n)})(t):t;var{is:qs,defineProperty:Ks,getOwnPropertyDescriptor:Gs,getOwnPropertyNames:Vs,getOwnPropertySymbols:Ys,getPrototypeOf:Zs}=Object,Le=globalThis,cn=Le.trustedTypes,Qs=cn?cn.emptyScript:"",Xs=Le.reactiveElementPolyfillSupport,be=(t,e)=>t,St={toAttribute(t,e){switch(e){case Boolean:t=t?Qs:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},pn=(t,e)=>!qs(t,e),un={attribute:!0,type:String,converter:St,reflect:!1,useDefault:!1,hasChanged:pn};Symbol.metadata??=Symbol("metadata"),Le.litPropertyMetadata??=new WeakMap;var H=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=un){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let s=Symbol(),o=this.getPropertyDescriptor(e,s,n);o!==void 0&&Ks(this.prototype,e,o)}}static getPropertyDescriptor(e,n,s){let{get:o,set:i}=Gs(this.prototype,e)??{get(){return this[n]},set(d){this[n]=d}};return{get:o,set(d){let u=o?.call(this);i?.call(this,d),this.requestUpdate(e,u,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??un}static _$Ei(){if(this.hasOwnProperty(be("elementProperties")))return;let e=Zs(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(be("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(be("properties"))){let n=this.properties,s=[...Vs(n),...Ys(n)];for(let o of s)this.createProperty(o,n[o])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[s,o]of n)this.elementProperties.set(s,o)}this._$Eh=new Map;for(let[n,s]of this.elementProperties){let o=this._$Eu(n,s);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let s=new Set(e.flat(1/0).reverse());for(let o of s)n.unshift(_t(o))}else e!==void 0&&n.push(_t(e));return n}static _$Eu(e,n){let s=n.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let s of n.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return dn(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,s){this._$AK(e,s)}_$ET(e,n){let s=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,s);if(o!==void 0&&s.reflect===!0){let i=(s.converter?.toAttribute!==void 0?s.converter:St).toAttribute(n,s.type);this._$Em=e,i==null?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(e,n){let s=this.constructor,o=s._$Eh.get(e);if(o!==void 0&&this._$Em!==o){let i=s.getPropertyOptions(o),d=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:St;this._$Em=o;let u=d.fromAttribute(n,i.type);this[o]=u??this._$Ej?.get(o)??u,this._$Em=null}}requestUpdate(e,n,s,o=!1,i){if(e!==void 0){let d=this.constructor;if(o===!1&&(i=this[e]),s??=d.getPropertyOptions(e),!((s.hasChanged??pn)(i,n)||s.useDefault&&s.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(d._$Eu(e,s))))return;this.C(e,n,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:s,reflect:o,wrapped:i},d){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,d??n??this[e]),i!==!0||d!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(n=void 0),this._$AL.set(e,n)),o===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,i]of this._$Ep)this[o]=i;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[o,i]of s){let{wrapped:d}=i,u=this[o];d!==!0||this._$AL.has(o)||u===void 0||this.C(o,void 0,i,u)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw e=!1,this._$EM(),s}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};H.elementStyles=[],H.shadowRootOptions={mode:"open"},H[be("elementProperties")]=new Map,H[be("finalized")]=new Map,Xs?.({ReactiveElement:H}),(Le.reactiveElementVersions??=[]).push("2.1.2");var xt=globalThis,hn=t=>t,Ue=xt.trustedTypes,mn=Ue?Ue.createPolicy("lit-html",{createHTML:t=>t}):void 0,Tt="$lit$",O=`lit$${Math.random().toFixed(9).slice(2)}$`,Rt="?"+O,er=`<${Rt}>`,V=document,ye=()=>V.createComment(""),$e=t=>t===null||typeof t!="object"&&typeof t!="function",Ct=Array.isArray,$n=t=>Ct(t)||typeof t?.[Symbol.iterator]=="function",kt=`[ 	
\f\r]`,ve=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,fn=/-->/g,gn=/>/g,K=RegExp(`>|${kt}(?:([^\\s"'>=/]+)(${kt}*=${kt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),bn=/'/g,vn=/"/g,wn=/^(?:script|style|textarea|title)$/i,Et=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),a=Et(1),Vo=Et(2),Yo=Et(3),Y=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),yn=new WeakMap,G=V.createTreeWalker(V,129);function _n(t,e){if(!Ct(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return mn!==void 0?mn.createHTML(e):e}var Sn=(t,e)=>{let n=t.length-1,s=[],o,i=e===2?"<svg>":e===3?"<math>":"",d=ve;for(let u=0;u<n;u++){let p=t[u],f,g,h=-1,B=0;for(;B<p.length&&(d.lastIndex=B,g=d.exec(p),g!==null);)B=d.lastIndex,d===ve?g[1]==="!--"?d=fn:g[1]!==void 0?d=gn:g[2]!==void 0?(wn.test(g[2])&&(o=RegExp("</"+g[2],"g")),d=K):g[3]!==void 0&&(d=K):d===K?g[0]===">"?(d=o??ve,h=-1):g[1]===void 0?h=-2:(h=d.lastIndex-g[2].length,f=g[1],d=g[3]===void 0?K:g[3]==='"'?vn:bn):d===vn||d===bn?d=K:d===fn||d===gn?d=ve:(d=K,o=void 0);let N=d===K&&t[u+1].startsWith("/>")?" ":"";i+=d===ve?p+er:h>=0?(s.push(f),p.slice(0,h)+Tt+p.slice(h)+O+N):p+O+(h===-2?u:N)}return[_n(t,i+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]},we=class t{constructor({strings:e,_$litType$:n},s){let o;this.parts=[];let i=0,d=0,u=e.length-1,p=this.parts,[f,g]=Sn(e,n);if(this.el=t.createElement(f,s),G.currentNode=this.el.content,n===2||n===3){let h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(o=G.nextNode())!==null&&p.length<u;){if(o.nodeType===1){if(o.hasAttributes())for(let h of o.getAttributeNames())if(h.endsWith(Tt)){let B=g[d++],N=o.getAttribute(h).split(O),Ae=/([.?@])?(.*)/.exec(B);p.push({type:1,index:i,name:Ae[2],strings:N,ctor:Ae[1]==="."?He:Ae[1]==="?"?Oe:Ae[1]==="@"?De:Q}),o.removeAttribute(h)}else h.startsWith(O)&&(p.push({type:6,index:i}),o.removeAttribute(h));if(wn.test(o.tagName)){let h=o.textContent.split(O),B=h.length-1;if(B>0){o.textContent=Ue?Ue.emptyScript:"";for(let N=0;N<B;N++)o.append(h[N],ye()),G.nextNode(),p.push({type:2,index:++i});o.append(h[B],ye())}}}else if(o.nodeType===8)if(o.data===Rt)p.push({type:2,index:i});else{let h=-1;for(;(h=o.data.indexOf(O,h+1))!==-1;)p.push({type:7,index:i}),h+=O.length-1}i++}}static createElement(e,n){let s=V.createElement("template");return s.innerHTML=e,s}};function Z(t,e,n=t,s){if(e===Y)return e;let o=s!==void 0?n._$Co?.[s]:n._$Cl,i=$e(e)?void 0:e._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),i===void 0?o=void 0:(o=new i(t),o._$AT(t,n,s)),s!==void 0?(n._$Co??=[])[s]=o:n._$Cl=o),o!==void 0&&(e=Z(t,o._$AS(t,e.values),o,s)),e}var Be=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:s}=this._$AD,o=(e?.creationScope??V).importNode(n,!0);G.currentNode=o;let i=G.nextNode(),d=0,u=0,p=s[0];for(;p!==void 0;){if(d===p.index){let f;p.type===2?f=new te(i,i.nextSibling,this,e):p.type===1?f=new p.ctor(i,p.name,p.strings,this,e):p.type===6&&(f=new Fe(i,this,e)),this._$AV.push(f),p=s[++u]}d!==p?.index&&(i=G.nextNode(),d++)}return G.currentNode=V,o}p(e){let n=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,n),n+=s.strings.length-2):s._$AI(e[n])),n++}},te=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,s,o){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=Z(this,e,n),$e(e)?e===c||e==null||e===""?(this._$AH!==c&&this._$AR(),this._$AH=c):e!==this._$AH&&e!==Y&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):$n(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==c&&$e(this._$AH)?this._$AA.nextSibling.data=e:this.T(V.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:s}=e,o=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=we.createElement(_n(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(n);else{let i=new Be(o,this),d=i.u(this.options);i.p(n),this.T(d),this._$AH=i}}_$AC(e){let n=yn.get(e.strings);return n===void 0&&yn.set(e.strings,n=new we(e)),n}k(e){Ct(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,s,o=0;for(let i of e)o===n.length?n.push(s=new t(this.O(ye()),this.O(ye()),this,this.options)):s=n[o],s._$AI(i),o++;o<n.length&&(this._$AR(s&&s._$AB.nextSibling,o),n.length=o)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let s=hn(e).nextSibling;hn(e).remove(),e=s}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Q=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,s,o,i){this.type=1,this._$AH=c,this._$AN=void 0,this.element=e,this.name=n,this._$AM=o,this.options=i,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=c}_$AI(e,n=this,s,o){let i=this.strings,d=!1;if(i===void 0)e=Z(this,e,n,0),d=!$e(e)||e!==this._$AH&&e!==Y,d&&(this._$AH=e);else{let u=e,p,f;for(e=i[0],p=0;p<i.length-1;p++)f=Z(this,u[s+p],n,p),f===Y&&(f=this._$AH[p]),d||=!$e(f)||f!==this._$AH[p],f===c?e=c:e!==c&&(e+=(f??"")+i[p+1]),this._$AH[p]=f}d&&!o&&this.j(e)}j(e){e===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},He=class extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===c?void 0:e}},Oe=class extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==c)}},De=class extends Q{constructor(e,n,s,o,i){super(e,n,s,o,i),this.type=5}_$AI(e,n=this){if((e=Z(this,e,n,0)??c)===Y)return;let s=this._$AH,o=e===c&&s!==c||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,i=e!==c&&(s===c||o);o&&this.element.removeEventListener(this.name,this,s),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Fe=class{constructor(e,n,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}},kn={M:Tt,P:O,A:Rt,C:1,L:Sn,R:Be,D:$n,V:Z,I:te,H:Q,N:Oe,U:De,B:He,F:Fe},tr=xt.litHtmlPolyfillSupport;tr?.(we,te),(xt.litHtmlVersions??=[]).push("3.3.3");var v=(t,e,n)=>{let s=n?.renderBefore??e,o=s._$litPart$;if(o===void 0){let i=n?.renderBefore??null;s._$litPart$=o=new te(e.insertBefore(ye(),i),i,void 0,n??{})}return o._$AI(t),o};var At=globalThis,J=class extends H{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=v(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Y}};J._$litElement$=!0,J.finalized=!0,At.litElementHydrateSupport?.({LitElement:J});var nr=At.litElementPolyfillSupport;nr?.({LitElement:J});(At.litElementVersions??=[]).push("4.2.2");var xn=t=>(...e)=>({_$litDirective$:t,values:e}),Ne=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,n,s){this._$Ct=e,this._$AM=n,this._$Ci=s}_$AS(e,n){return this.update(e,n)}update(e,n){return this.render(...n)}};var{I:ui}=kn;var sr={},Tn=(t,e=sr)=>t._$AH=e;var Rn=xn(class extends Ne{constructor(){super(...arguments),this.key=c}render(t,e){return this.key=t,e}update(t,[e,n]){return e!==this.key&&(Tn(t),this.key=e),n}});function y(t,e=document){let n=e.querySelector(t);if(!n)throw new Error(`Element not found: ${t}`);return n}function w(t,e=document){return e.querySelector(t)}function ne(t){return rr.test(t)}var rr=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;function Je(t){return t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function En(t,e){let n=t.split(".").map(Number),s=e.split(".").map(Number);for(let o=0;o<Math.max(n.length,s.length);o+=1){let i=(n[o]??0)-(s[o]??0);if(i!==0)return i}return 0}function An(t){try{return new URL(t).pathname.replace(/^\/+|\/+$/g,"")||t}catch{return t}}function se(t){return t.replace(/^https?:\/\//,"").replace(/\/$/,"")}function Me(t){return t.map(e=>({label:e.label,state:e.state,meta:or(e.seconds),output:e.output}))}function or(t){if(t<60)return`${t}s`;let e=t%60;return e===0?`${Math.floor(t/60)}m`:`${Math.floor(t/60)}m ${e}s`}function T(t,e){let n=Math.max(0,Math.round(Date.now()/1e3)-t),[s,o]=n<60?[n,"second"]:n<3600?[Math.round(n/60),"minute"]:n<86400?[Math.round(n/3600),"hour"]:[Math.round(n/86400),"day"];try{return new Intl.RelativeTimeFormat(e,{numeric:"auto"}).format(-s,o)}catch{return`${s} ${o}`}}function _e(t){let e=Math.max(0,Math.round(t));return`${Math.floor(e/60)}:${String(e%60).padStart(2,"0")}`}function Ie(t,e){let n=["B","KB","MB","GB","TB"],s=Math.max(0,t),o=0;for(;s>=1024&&o<n.length-1;)s/=1024,o++;return`${new Intl.NumberFormat(e,{maximumFractionDigits:s<10?1:0}).format(s)} ${n[o]}`}function $(t,e){return Rn(t,e)}function S(t,e,n,s){let o=document.createElement("sds-button");return o.variant=e,s&&(o.size=s),o.append(document.createTextNode(t)),o.addEventListener("click",n),o}function re(t,e){e.trim()!==""&&t.updateComplete.then(()=>{let n=document.createTreeWalker(t,NodeFilter.SHOW_TEXT).nextNode();if(n){n.nodeValue=e;return}(t.querySelector("button, a")??t).append(document.createTextNode(e))})}function oe(t,e){let n=document.createElement("sds-button"),s=document.createElement("sds-icon");return s.name="actions-window-open",s.size=16,n.variant="secondary",n.href=t,n.rel="external",n.append(document.createTextNode(e),s),n}function ir(t,e,n,s,o){let i=document.createElement("sds-select");return i.options=t.map(d=>({label:d.label,value:d.value,disabled:d.disabled===!0})),i.value=e,i.filled=e!=="",i.label=s,o===void 0?i.size="sm":i.caption=o,i.addEventListener("sds-change",d=>n(d.detail)),i}var Cn=0;function ze(t,e,n,s){if(t.length>6)return ir(t.map(i=>({value:i.value,label:i.label})),e,n,s,s);let o=document.createElement("sds-radio");return Cn+=1,o.name=`choice-${Cn}`,o.legend=s,o.choices=t.map(i=>({label:i.label,value:i.value,...i.hint===void 0?{}:{hint:i.hint}})),o.value=e,o.addEventListener("sds-change",i=>n(i.detail)),o}async function Pn(){let t=await fetch("/translations/index.json");return t.ok?await t.json():["en"]}async function jn(t){let e=await fetch(`/translations/${t}.json`);if(!e.ok)throw new Error(`Missing translations for "${t}"`);return await e.json()}function Wn(t,e,n={}){let s=t[ar(t,e,n)]??t[e]??e;for(let[o,i]of Object.entries(n))s=s.replaceAll(`{${o}}`,String(i));return s}function ar(t,e,n){return Number(n.count)===1&&t[`${e}.one`]!==void 0?`${e}.one`:e}var lr="/api",X=class extends Error{constructor(n,s){super(n);this.status=s}},Pt=class extends Error{constructor(n){super(`No answer from the container, only a ${n} from in front of it.`);this.status=n}};async function b(t,e={}){let n=e.body?{"Content-Type":"application/json"}:{},s=await fetch(`${lr}/${t}`,{...e,headers:n});if(!s.ok&&dr(s.status,s.headers.get("Content-Type")))throw new Pt(s.status);let o=await s.json().catch(()=>({}));if(!s.ok){let i=o.error;throw new X(i??`Request failed with status ${s.status}`,s.status)}return o}function dr(t,e){return!((e??"").split(";")[0]?.trim().toLowerCase()==="application/json")&&cr.includes(t)}var cr=[404,502,503,504],m={state:()=>b("state"),createWorktree:t=>b("worktrees",{method:"POST",body:JSON.stringify(t)}),preview:t=>b(`worktrees/preview?${new URLSearchParams(t).toString()}`),updateWorktree:(t,e)=>b(`worktrees/${encodeURIComponent(t)}`,{method:"PATCH",body:JSON.stringify(e)}),provisionWorktree:(t,e=!1)=>b(`worktrees/${encodeURIComponent(t)}/provision`,{method:"POST",body:JSON.stringify({fresh:e})}),syncWorktree:(t,e="")=>b(`worktrees/${encodeURIComponent(t)}/sync`,{method:"POST",body:JSON.stringify(e!==""?{from:e}:{})}),pullWorktree:t=>b(`worktrees/${encodeURIComponent(t)}/pull`,{method:"POST"}),commits:(t,e=0)=>b(`worktrees/${encodeURIComponent(t)}/commits${e>0?`?skip=${e}`:""}`),branch:t=>b(`branch?branch=${encodeURIComponent(t)}`),branchCommits:(t,e=0)=>b(`branch/commits?branch=${encodeURIComponent(t)}${e>0?`&skip=${e}`:""}`),commit:(t,e)=>b(`worktrees/${encodeURIComponent(t)}/commits/${encodeURIComponent(e)}`),commitDiff:(t,e,n)=>b(`worktrees/${encodeURIComponent(t)}/commits/${encodeURIComponent(e)}/diff?path=${encodeURIComponent(n)}`),changes:t=>b(`worktrees/${encodeURIComponent(t)}/changes`),worktreeUsage:t=>b(`worktrees/${encodeURIComponent(t)}/usage`),changeDiff:(t,e)=>b(`worktrees/${encodeURIComponent(t)}/changes/diff?path=${encodeURIComponent(e)}`),discardWorktree:t=>b(`worktrees/${encodeURIComponent(t)}/discard`,{method:"POST"}),restoreWorktree:t=>b(`worktrees/${encodeURIComponent(t)}/restore`,{method:"POST"}),removeWorktree:t=>b(`worktrees/${encodeURIComponent(t)}`,{method:"DELETE"}),fetch:t=>b("fetch",{method:"POST",body:JSON.stringify(t!==void 0?{remote:t}:{})}),job:(t,e=0)=>b(`jobs/${encodeURIComponent(t)}${e>0?`?since=${e}`:""}`),worktreeJobs:t=>b(`worktrees/${encodeURIComponent(t)}/jobs`)};function qe(t){try{return localStorage.getItem(t)}catch{return null}}function Ke(t,e){try{localStorage.setItem(t,e)}catch{}}function Ln(t,e){return JSON.stringify(t)!==JSON.stringify(e)}function Un(t){let e=new Set,n=!1,s=()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1;for(let i of e)i()}))};return{state:new Proxy({...t},{set(i,d,u){return Reflect.get(i,d)===u||(Reflect.set(i,d,u),s()),!0}}),subscribe(i){return e.add(i),()=>e.delete(i)}}}var Bn="branchery-language",{state:l,subscribe:ie}=Un({tld:location.host,projectName:"",worktrees:[],project:null,branch:"",branches:[],remotes:[],repository:null,phpVersions:[],strings:{},loading:!0,language:qe(Bn)||document.documentElement.lang||"en",job:null,runningJobs:[],error:"",unreachable:!1,recipeProblem:null,unconfigured:!1,updateWaiting:!1,exposed:null});function r(t,e={}){return Wn(l.strings,t,e)}async function jt(t){l.strings=await jn(t),l.language=t,document.documentElement.lang=t,Ke(Bn,t),document.querySelectorAll("[data-i18n]").forEach(e=>{let n=e.dataset.i18n;n&&(e.textContent=r(n))})}async function R(t=!1){return Se!==null?(t||(l.loading=!0),Se):(Se=ur(t).finally(()=>{Se=null}),Se)}var Se=null;async function ur(t){l.loading=!t;try{let e=await pr();return l.unreachable=!1,e}catch(e){return e instanceof X?(l.unreachable=!1,W(e.message)):l.unreachable=!0,l.runningJobs}finally{l.loading=!1}}async function pr(){let t=await m.state();return _("worktrees",t.worktrees),_("branches",t.branches),_("remotes",t.remotes),_("repository",t.repository??null),_("branch",t.branch),_("project",t.project),_("phpVersions",t.phpVersions),_("tld",t.tld||location.host),_("projectName",t.projectName??""),_("recipeProblem",t.recipeProblem??null),_("unconfigured",t.unconfigured===!0),_("updateWaiting",t.updateWaiting??!1),_("exposed",t.exposed??null),_("runningJobs",t.runningJobs??[]),l.runningJobs}function _(t,e){Ln(l[t],e)&&(l[t]=e)}function W(t){l.error=t}function A(t){if(hr(t)){l.unreachable=!0;return}W(C(t))}function hr(t){return t instanceof Error&&!(t instanceof X)}function C(t){return t instanceof X?t.message:t instanceof Error?r("error.unreachable"):r("error.generic")}function ae(t){let e=l.runningJobs.find(n=>n.subject===t);return e===void 0?void 0:e.step?.label??Lt(e.command)}function Hn(t,e=null,n="create"){let s={id:t,expected:e,kind:n,status:"running",subject:e??"",command:"",step:null,steps:[],elapsed:0,log:"",size:0,partial:!1,interrupted:!1};return l.job=s,s}var Wt={"worktree:add":{kind:"create",history:"history.add",doing:"job.doing.create"},"worktree:fork":{kind:"create",history:"history.fork",doing:"job.doing.create"},"worktree:provision":{kind:"create",history:"history.provision",doing:"job.doing.provision"},"worktree:remove":{kind:"remove",history:"history.remove",doing:"job.doing.remove"},"database:sync":{kind:"sync",history:"history.sync",doing:"job.doing.sync"},"worktree:pull":{kind:"pull",history:"history.pull",doing:"job.doing.pull"},"worktree:restore":{kind:"restore",history:"history.restore",doing:"job.doing.restore"},"worktree:discard":{kind:"discard",history:"history.discard",doing:"job.doing.discard"},"git:fetch":{kind:"fetch",history:"history.fetch",doing:"job.doing.fetch"}};function On(t){return Wt[t]?.kind??"create"}function Ge(t){return r(Wt[t]?.history??"history.other")}function Lt(t){return r(Wt[t]?.doing??"job.doing.create")}function Ve(){return{running:r("step.state.running"),done:r("step.state.done"),failed:r("step.state.failed")}}var Fn="[A-Za-z0-9][A-Za-z0-9.-]*",mr=new RegExp(`^/w/(${Fn})$`),fr=new RegExp(`^/w/(${Fn})/c/([0-9a-f]{4,40})$`);function Nn(t){let e=t.replace(/^#/,""),n=fr.exec(e);if(n?.[1]!==void 0&&n[2]!==void 0)return{view:"commit",name:n[1],sha:n[2],branch:""};let s=mr.exec(e);if(s?.[1]!==void 0)return{view:"worktree",name:s[1]};let o=/^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(e),i=Dn(o?.[1]);if(i!==null&&o?.[2]!==void 0)return{view:"commit",name:"",sha:o[2],branch:i};let d=Dn(/^\/b\/(.+)$/.exec(e)?.[1]);return d!==null?{view:"branch",name:d}:{view:"overview"}}function Dn(t){if(t===void 0||t==="")return null;let e;try{e=decodeURIComponent(t)}catch{return null}return ne(e)?e:null}function Jn(t,e){return t.view!==e.view?!1:t.view==="worktree"&&e.view==="worktree"||t.view==="branch"&&e.view==="branch"?t.name===e.name:t.view==="commit"&&e.view==="commit"?t.name===e.name&&t.sha===e.sha&&t.branch===e.branch:!0}function Ut(t){return t.replace(/^#/,"").startsWith("new")}function Mn(t){return Ut(t)?"#/":null}var In=[];function Ye(){return Nn(window.location.hash)}function Ze(t){window.location.hash!==`#${t}`&&(window.location.hash=t)}function zn(t){In.push(t)}function qn(){history.scrollRestoration="manual"}qn();window.addEventListener("hashchange",()=>{qn();let t=Ye();for(let e of In)e(t)});var Bt="branchery-operation-ended";function Kn(t){window.dispatchEvent(new CustomEvent(Bt,{detail:t}))}function Gn(t){let e=n=>t(n.detail);return window.addEventListener(Bt,e),()=>window.removeEventListener(Bt,e)}function Vn(){let t=!1;return{pending:()=>t,run(e,n=()=>{}){if(t)return!1;t=!0;let s=()=>{t=!1,n()},o;try{o=e()}catch(i){throw s(),i}return Promise.resolve(o).then(s,s),!0}}}var P=y("#wizard"),gr=y("#wizForm"),le=y("#wizProgress"),Yn=y("#wizTitle"),Xe=y("#wizLead"),Qe=y("#wizBody"),br=y("#wizFoot"),Ht=y("#wizBack"),de=y("#wizNext"),k=null,x=0,ke=!1,vr=Vn(),yr={update:()=>Dt()};function M(t){k=t,x=0,ke=!1,Zn(t.tall===!0),Ot(),et()}function Zn(t){P.classList.toggle("sds-modal--lg",t),P.classList.toggle("sds-modal--md",!t)}function et(){P.open||P.showModal()}function L(){P.open&&P.close()}function D(){return P.open}function tt(){return P.open&&k!==null}function ce(t){return P.addEventListener("close",t),()=>P.removeEventListener("close",t)}function nt(){return k===null?[]:k.steps.filter(t=>t.when===void 0||t.when())}function st(){nt()[x]?.leave?.()}function Ot(){let t=nt(),e=t[x];e&&(Yn.textContent=e.heading,v(e.lead??c,Xe),Xe.hidden=e.lead===void 0,$r(t),v(c,Qe),e.enter(Qe,yr),Dt(),window.setTimeout(()=>{w('input:not([type]), input[type="text"]',Qe)?.focus()},20))}function $r(t){le.hidden=t.length<2,!(t.length<2)&&(le.caption=t[x]?.label??"",le.label=r("step.progress"),le.max=t.length,le.value=x+1)}function Dt(){let t=nt(),e=t[x];if(!e||k===null)return;let n=x===t.length-1;Ft({back:x===0?r("action.cancel"):r("action.back"),onBack:wr,next:n?k.finishLabel():r("action.next"),onNext:Qn}),de.disabled=e.ready?.()===!1}function Qn(){let t=nt(),e=t[x];if(!(!e||k===null||e.ready?.()===!1)){if(x>=t.length-1){let n=k;vr.run(()=>n.finish(),()=>{k===n&&!ke&&Dt()})&&(de.disabled=!0);return}st(),x+=1,Ot()}}function wr(){if(x===0){L();return}st(),x-=1,Ot()}gr.addEventListener("submit",t=>{t.preventDefault(),k!==null&&Qn()});P.addEventListener("close",()=>{st(),k=null,ke=!1});function Ft(t={}){br.hidden=t.back==null&&t.next==null,Ht.hidden=t.back==null,re(Ht,t.back??""),Ht.onclick=t.onBack??null,de.hidden=t.next==null,re(de,t.next??""),de.disabled=!1,de.onclick=t.onNext??null}function rt(t,e=""){ke||(ke=!0,k===null&&Zn(!1)),st(),k=null,le.hidden=!0,Yn.textContent=t,v(e===""?c:e,Xe),Xe.hidden=e===""}function Xn(t){v(t,Qe)}var E=class extends J{letGo=[];createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.letGo.push(ie(()=>this.requestUpdate())),this.letGo.push(ce(()=>this.requestUpdate())),this.arrived()}disconnectedCallback(){for(let e of this.letGo)e();this.letGo=[],this.left(),super.disconnectedCallback()}shouldUpdate(){return!this.hasUpdated||!D()}drawNow(){this.requestUpdate(),this.performUpdate()}arrived(){}left(){}untilLeft(e){this.letGo.push(e)}};var _r=new Set(["worktree:add","worktree:fork"]);function es(t,e){let n=new Set(e);return t.filter(s=>_r.has(s.command)&&s.subject!==""&&!n.has(s.subject))}function ot(t,e){return t.filter(n=>it([n.name,n.branch,n.database,n.url,n.php,n.base?.branch??"",n.tip?.subject??""].join(" "),e))}function ts(t,e){return t.filter(n=>it([n.name,n.tip?.subject??""].join(" "),e))}function it(t,e){let n=e.toLowerCase().split(/\s+/).filter(o=>o!==""),s=t.toLowerCase();return n.every(o=>s.includes(o))}function ns(t,e){let n=s=>s.base===null?[0,""]:s.base.branch===e?[1,""]:[2,s.base.branch];return t.map((s,o)=>({worktree:s,at:o,rank:n(s)})).sort((s,o)=>s.rank[0]-o.rank[0]||s.rank[1].localeCompare(o.rank[1],void 0,{numeric:!0})||s.at-o.at).map(s=>s.worktree)}function U(){return a`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="actions-circle-half" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${r("detail.loading")}</span>
        </p>`}function j(t=0,e=""){return a`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${e}"
        style="--sds-skeleton-delay: ${t%3*.12}s"></span>`}var rs=null,Jt=new Map,Nt=new Set,Sr=300,Mt;function It(t){return t!==""&&!ne(t)?r("error.branchName"):""}function os(t){return t===l.branch||l.project?.branch===t||l.branches.some(e=>e.name===t)||l.worktrees.some(e=>e.branch===t)}function ss(t){let e=It(t);return e!==""?e:t!==""&&os(t)?r("error.branchExists",{branch:t}):""}function I(t,e=""){let n={mode:l.branches.length>0?"branch":"fork",branch:e,from:"",name:""},s=()=>n.name.trim()||Je(n.branch),o=()=>{let d=s();return d!==""&&d===l.projectName?r("preview.isProject",{name:d}):l.worktrees.some(u=>u.name===d)?r("preview.exists",{name:d}):""},i={tall:!0,steps:[kr(n),Tr(n),Cr(n,s,o)],finishLabel:()=>n.mode==="fork"?r("action.fork"):r("action.create"),finish:()=>Ar(n,s(),t)};M(i)}function kr(t){return{label:r("step.mode.label"),heading:r("step.mode.heading"),lead:r("step.mode.lead"),ready:()=>t.mode==="fork"||ne(t.branch),enter(e,n){let s=l.branches.length>0;s||(t.mode="fork");let o=()=>{v(a`
                    <sds-radio
                        legend=${r("step.mode.heading")}
                        legend-said-only
                        name="createMode"
                        hint=${s?"":r("mode.branchNone")}
                        value=${t.mode}
                        .choices=${[...s?[{label:r("mode.branch"),value:"branch",hint:r("mode.branchHint")}]:[],{label:r("mode.fork"),value:"fork",hint:r("mode.forkHint")}]}
                        @sds-change=${i=>{t.mode=i.detail==="branch"?"branch":"fork",t.branch="",o()}}></sds-radio>
                    <div class="branchery-choice-detail" ?hidden=${t.mode!=="branch"}>
                        <div class="branchery-choice-find">
                            <sds-field
                                label=${r("field.branch")}
                                value=${t.branch===""?r("field.branchFilter"):t.branch}
                                ?filled=${t.branch!==""}
                                @sds-input=${i=>{t.branch=i.detail.trim(),o()}}></sds-field>
                            <span class="branchery-choice-count"
                                  >${r("overview.branches",{count:l.branches.length})}</span>
                        </div>
                        <div class="branchery-picklist">${xr(t,o)}</div>
                        <sds-note tone="error" ?hidden=${It(t.branch)===""}
                                  body=${It(t.branch)}></sds-note>
                    </div>`,e),n.update()};o()}}}function xr(t,e){let n=t.branch.toLowerCase(),s=l.branches.map(i=>i.name),o=s.includes(t.branch)?s:s.filter(i=>i.toLowerCase().includes(n));return o.length===0?a`<p class="branchery-picklist__empty">${r("step.branch.noMatch")}</p>`:o.map(i=>a`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(i===t.branch)}
                @click=${()=>{t.branch=i,e()}}>${i}</button>`)}function Tr(t){return{label:r("step.fork.label"),heading:r("step.fork.heading"),lead:r("step.fork.lead"),when:()=>t.mode==="fork",ready:()=>ne(t.branch)&&!os(t.branch),enter(e,n){let s=()=>{v(a`
                    ${""}
                    <sds-field
                        field-id="newBranch"
                        caption=${r("field.newBranch")}
                        value=${t.branch===""?r("field.newBranchPlaceholder"):t.branch}
                        ?filled=${t.branch!==""}
                        @sds-input=${o=>{t.branch=o.detail.trim(),s()}}></sds-field>
                    ${Rr(t)}
                    <sds-note tone="error" ?hidden=${ss(t.branch)===""}
                              body=${ss(t.branch)}></sds-note>`,e),n.update()};s()}}}function Rr(t){let e=document.createElement("sds-select");return e.caption=r("field.branchFrom"),e.options=[{label:r("field.branchFromProject",{branch:l.branch}),value:""},...l.worktrees.map(n=>({label:n.name,value:n.name}))],e.value=t.from,e.filled=!0,e.addEventListener("sds-change",n=>{t.from=n.detail}),e}function Cr(t,e,n){return{label:r("step.review.label"),heading:r("step.review.heading"),lead:r("step.review.lead"),ready:()=>e()!==""&&n()==="",enter(s,o){rs=i=>xe(t,e,n,s,o,i),as(t,e(),()=>{w("#name")!==null&&xe(t,e,n,s,o)}),xe(t,e,n,s,o)},leave(){window.clearTimeout(Mt)}}}function is(t,e){return JSON.stringify([t.mode,t.branch,t.mode==="fork"?t.from:"",e])}async function as(t,e,n){let s=is(t,e);if(Jt.get(s)!=null||Nt.has(s))return;Nt.add(s);let o=null;try{o=await m.preview({mode:t.mode,branch:t.branch,from:t.from,name:t.name})}catch{}finally{Nt.delete(s)}Jt.set(s,o),n()}function Er(t,e,n,s,o){window.clearTimeout(Mt),Mt=window.setTimeout(()=>{as(t,e(),()=>{w("#name")!==null&&xe(t,e,n,s,o)})},Sr)}function xe(t,e,n,s,o,i=""){let d=t.mode==="fork"?l.worktrees.find(h=>h.name===t.from):void 0,u=r("preview.databaseCopy",{name:d?.database??l.project?.database??"db"}),p=i!==""?i:n(),f=Jt.get(is(t,e())),g=f===void 0?j(2):f===null?d?d.php:r("preview.phpFromProject"):f.php??r("preview.phpRead",{file:f.readFrom??""});v(a`
        <div class="branchery-preview">
            <dl>
                <dt>${r("preview.branch")}</dt>
                <dd><code class="sds-mono">${t.branch}</code></dd>
                <dt>${r("preview.directory")}</dt>
                <dd><code class="sds-mono">.worktrees/${e()}</code></dd>
                <dt>${r("preview.address")}</dt>
                <dd><code class="sds-mono">https://${Je(e())}.${l.tld}</code></dd>
                <dt>${r("preview.database")}</dt>
                <dd>${u}</dd>
                <dt>${r("preview.php")}</dt>
                <dd>${g}</dd>
            </dl>
        </div>
        ${(f?.warnings??[]).map(h=>a`<sds-note tone="warn" body=${h}></sds-note>`)}
        <sds-field
            field-id="name"
            caption=${r("field.nameOverride")}
            hint=${r("field.namePlaceholder")}
            value=${t.name===""?Je(t.branch):t.name}
            ?filled=${t.name!==""}
            @sds-input=${h=>{t.name=h.detail.trim(),xe(t,e,n,s,o),Er(t,e,n,s,o)}}></sds-field>
        ${p===""?c:a`<sds-note tone="error" body=${p}></sds-note>`}`,s),o.update()}async function Ar(t,e,n){let s=t.mode==="fork"?{mode:"fork",branch:t.branch,from:t.from,name:t.name}:{mode:"branch",branch:t.branch,name:t.name};try{let o=await m.createWorktree(s);n.onJob(o.job,e)}catch(o){A(o),w("#name")!==null&&rs?.(C(o))}}function at(t){return t.filter(e=>!e.isProject&&(e.merged||e.gone)&&e.changes===0)}function ls(t){return t.merged}function ds(t,e){let n=at(t),s=new Set(n.filter(ls).map(o=>o.name));M({tall:n.length>3,steps:[{label:r("tidy.step"),heading:r("tidy.heading"),lead:r("tidy.lead"),enter(o,i){v(a`
                    <sds-checkbox-group
                        legend=${r("tidy.heading")}
                        legend-said-only
                        name="tidy"
                        .choices=${n.map(d=>({label:d.name,value:d.name,hint:`${d.branch} \xB7 ${Pr(d)}`}))}
                        .values=${[...s]}
                        @sds-change=${d=>{s.clear();for(let u of d.detail)s.add(u);i.update()}}></sds-checkbox-group>`,o)},ready:()=>s.size>0}],finishLabel:()=>r("tidy.confirm",{count:s.size}),finish:()=>jr(n.filter(o=>s.has(o.name)),e)})}function Pr(t){return t.merged?r("tidy.why.merged"):r("tidy.why.gone")}async function jr(t,e){rt(r("tidy.working"),r("tidy.workingLead",{count:t.length}));let n=await Promise.allSettled(t.map(i=>m.removeWorktree(i.name))),s=[];n.forEach((i,d)=>{let u=t[d]?.name??"";i.status==="fulfilled"?s.push({job:i.value.job,name:u}):A(i.reason)});let o=s[0];if(o===void 0){L();return}e.onJob(o.job,o.name,"remove")}var Wr=6,cs=10,zt=class extends E{handlers;needle="";allBranches=!1;willUpdate(){l.loading||Dr()}arrived(){window.addEventListener("keydown",this.reachedByKey),this.untilLeft(()=>window.removeEventListener("keydown",this.reachedByKey))}render(){let e=Hr(),n=ns(ot(l.worktrees,this.needle),l.project?.branch??l.branch);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${Br(e)}
            ${this.tidyNote(e)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${Ur()?j(0,"branchery-waiting__title"):Lr()}</h2>
                ${l.repository===null?c:a`<span class="sds-row sds-row__end">${oe(l.repository,r("detail.repository"))}</span>`}
            </div>
            ${qr()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${e.length+l.branches.length>=Wr?this.field():c}
                <div class="branchery-section-actions">${this.actions()}</div>
            </div>
            ${this.listHead(e,n.length)}
            ${this.list(e,n)}
        </section>
        ${this.freeBranches()}
      </div>`}tidyNote(e){let n=at(e);return n.length===0||l.loading?c:a`
        <sds-note tone="info"
                  body=${r("tidy.note",{count:n.length,names:us(n)})}
                  action=${r("tidy.open")}
                  @sds-note-action=${()=>ds(e,this.handlers)}></sds-note>`}field(){return a`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${r("overview.filter")}
            value=${this.needle===""?r("overview.filterPlaceholder"):this.needle}
            ?filled=${this.needle!==""}
            @sds-input=${e=>this.narrow(e.detail)}
            @keydown=${e=>this.leaveOrOpen(e)}></sds-field>`}narrow(e){this.needle=e,this.requestUpdate()}leaveOrOpen(e){if(e.key==="Escape"){e.target instanceof HTMLElement&&e.target.blur(),this.narrow("");return}if(e.key==="Enter"){let n=ot(l.worktrees,this.needle)[0]??ot(l.project===null?[]:[l.project],this.needle)[0];n!==void 0&&(e.preventDefault(),Ze(`/w/${n.name}`))}}controls=null;actions(){let e=JSON.stringify([l.remotes,l.language]);if(this.controls?.key!==e){let n=this.buildFetch();this.controls={key:e,nodes:[...n===null?[]:[n],this.creating()]}}return this.controls.nodes}creating(){let e=S(r("nav.newWorktree"),"primary",()=>I(this.handlers));return e.title=`${r("nav.newWorktree")} (n)`,e}list(e,n){if(l.unreachable&&e.length===0)return c;let s=es(l.runningJobs,e.map(i=>i.name)).filter(i=>it(i.subject,this.needle)),o=this.needle.trim()===""?r("table.empty"):r("overview.noMatch");return!l.loading&&n.length===0&&s.length===0?a`<p class="branchery-list__empty">${o}</p>`:a`
        <sds-table
            ?loading=${l.loading}
            loading-rows=${Or()}
            .columns=${[{head:r("table.worktree"),cls:"sds-td-name"},{head:r("table.outstanding"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.php"),fit:!0},{head:"",cls:"sds-td-into"}]}
            .rows=${l.loading?[]:[...s.map(Fr),...n.map(Nr)]}></sds-table>`}listHead(e,n){if(l.unreachable&&e.length===0)return c;let s=l.worktrees.length;return a`<h2 class="sds-h3">${l.loading||s===0?r("nav.worktrees"):this.needle.trim()===""?r("overview.worktrees",{count:s}):r("overview.matching",{shown:n,total:s})}</h2>`}freeBranches(){if(l.loading||l.branches.length===0)return c;let e=ts(l.branches,this.needle);if(e.length===0)return c;let n=e.length-cs,s=this.allBranches||n<=0?e:e.slice(0,cs);return a`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${this.needle.trim()===""?r("overview.branches",{count:l.branches.length}):r("overview.branchesMatching",{shown:e.length,total:l.branches.length})}</h2>
            <sds-table
                .columns=${[{head:r("table.branch"),cls:"sds-td-name"},{head:r("table.when"),cls:"sds-td-meta",fit:!0},{head:"",cls:"sds-td-into"}]}
                .rows=${s.map(o=>this.branchRow(o))}></sds-table>
            ${this.allBranches||n<=0?c:a`
                <p class="branchery-branches__more">
                    ${$(r("overview.showAllBranches",{count:n}),a`<sds-button variant="ghost" @click=${()=>{this.allBranches=!0,this.requestUpdate()}}
                        >${r("overview.showAllBranches",{count:n})}</sds-button>`)}
                </p>`}
        </section>`}branchRow(e){return{cells:[{value:a`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(e.name)}">${e.name}</a>`,note:Gr(e)},T(e.when,l.language),a`${$(r("nav.newWorktree"),a`<sds-button variant="ghost" size="sm"
                             title=${r("table.worktreeOf",{branch:e.name})}
                             @click=${()=>I(this.handlers,e.name)}
                    >${r("nav.newWorktree")}</sds-button>`)}`]}}buildFetch(){let e=l.remotes,n=e[0];if(n===void 0)return null;if(e.length===1)return S(r("nav.fetch",{remote:n}),"ghost",()=>void this.startFetch(n));let s=document.createElement("sds-dropdown");return s.label=r("nav.fetchFrom"),s.variant="ghost",s.align="end",s.choices=e.map(o=>({label:o})),s.addEventListener("sds-dropdown-choose",o=>{let i=e[o.detail.index];i!==void 0&&this.startFetch(i)}),s}async startFetch(e){try{let n=await m.fetch(e);W(""),this.handlers.onJob(n.job,null,"fetch")}catch(n){A(n)}}reachedByKey=e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;let n=e.target;if(!(n instanceof Element&&n.closest("input, textarea, select, [contenteditable], dialog[open]"))){if(e.key==="/"){let s=w("#filter");s&&(e.preventDefault(),s.focus(),s.select());return}e.key==="n"&&w(".branchery-section-actions")!==null&&(e.preventDefault(),I(this.handlers))}}};customElements.define("branchery-overview",zt);function Lr(){return l.repository!==null?An(l.repository):l.projectName===""?r("nav.worktrees"):l.projectName}function Ur(){return l.loading&&l.repository===null&&l.projectName===""}function Br(t){let e=t.filter(n=>n.incomplete&&ae(n.name)===void 0);return e.length===0||l.loading?c:a`
        <sds-note tone="warn"
                  body=${r("overview.unfinished",{count:e.length,names:us(e)})}></sds-note>`}function us(t){return t.map(e=>e.name).join(", ")}function Hr(){return l.project?[l.project,...l.worktrees]:l.worktrees}var ps="branchery-rows";function Or(){let t=l.worktrees.length;if(t>0)return t;let e=Number(qe(ps));return Number.isFinite(e)&&e>0?e:1}function Dr(){Ke(ps,String(l.worktrees.length))}function Fr(t){return{cells:[{value:a`<span class="branchery-list__title">${t.subject}</span>`,note:qt(`${r("table.making")} \xB7 ${t.step?.label??Lt(t.command)}`)},"","",""]}}function qt(t){return a`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${t}</span>`}function Nr(t){let e=ae(t.name);return{cells:[{value:a`<a class="branchery-list__title" href="#/w/${t.name}">${t.name}</a>${e!==void 0?c:hs(t)}`,note:e===void 0?fs(t):qt(e)},Vr(t),t.php,Jr(t)]}}function Jr(t){return a`
        <span class="branchery-list__ways">
            ${""}
            <sds-button variant="secondary" size="sm" icon-only
                        href=${t.url} rel="external"
                        title=${r("table.openSiteAt",{host:se(t.url)})}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${$(r("table.view"),a`<sds-button variant="secondary" size="sm" href="#/w/${t.name}"
                        title=${r("table.viewOf",{name:t.name})}>${r("table.view")}</sds-button>`)}
        </span>`}function Mr(t){return t.split("_").map((e,n)=>n===0?a`${e}`:a`_<wbr>${e}`)}function hs(t){return a`${Ir(t)}${zr(t)}${t.stale?a` <sds-badge label=${r("table.staleMark")} tone="warn"></sds-badge>`:c}`}function Ir(t){return t.ready?t.incomplete?a` <sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a` <sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}function zr(t){return t.merged?a` <sds-badge label=${r("table.mergedMark")} tone="ok"></sds-badge>`:t.gone?a` <sds-badge label=${r("table.goneMark")} tone="warn"></sds-badge>`:c}function qr(){let t=l.project;if(t===null)return l.loading?Kr():c;let e=ae(t.name);return ms({name:a`<a class="branchery-checkout__name"
                      href="#/w/${t.name}">${t.name}</a>${e!==void 0?c:hs(t)}`,meta:e===void 0?a`${fs(t)}${Yr(t)}`:qt(e),php:t.php,database:a`<code class="sds-mono">${Mr(t.database)}</code>`,address:a`<sds-link external href=${t.url} label=${se(t.url)}></sds-link>`})}function Kr(){return ms({name:a`<span class="branchery-checkout__name">${j(0,"branchery-waiting__title")}</span>`,meta:j(1),php:j(0),database:j(1),address:j(2)})}function ms(t){return a`
        <div class="branchery-checkout">
            <p class="sds-label">${r("overview.checkout")}</p>
            <div class="branchery-checkout__body">
                <div class="branchery-checkout__what">
                    ${t.name}
                    <p class="branchery-checkout__meta">${t.meta}</p>
                </div>
                <dl class="sds-facts branchery-checkout__facts">
                    <dt>${r("table.php")}</dt>
                    <dd>${t.php}</dd>
                    <dt>${r("table.database")}</dt>
                    <dd>${t.database}</dd>
                    <dt>${r("table.address")}</dt>
                    <dd>${t.address}</dd>
                </dl>
            </div>
        </div>`}function Gr(t){let e=!t.onRemote&&l.remotes.length>0;return a`${e?a`<span>${r("table.nowhere")}</span>`:c}${t.tip===null?c:a`<span
            class="branchery-list__tip">${t.tip.subject} · ${t.tip.sha}</span>`}`}function fs(t){return a`<span class="branchery-list__what">${t.branch}${t.tip===null?c:a` · ${t.tip.subject}`}</span>`}function Vr(t){let e=gs(t);return e.length===0?"":a`${e.map(n=>a`<span class="branchery-list__count">${n}</span>`)}`}function Yr(t){let e=gs(t);return e.length===0?c:a`<span class="branchery-list__count">${e.join(" \xB7 ")}</span>`}function gs(t){let e=[];return t.changes>0&&e.push(r("table.changes",{count:t.changes})),t.ahead!==null&&t.ahead>0&&e.push(r("table.unpushed",{count:t.ahead})),t.behind!==null&&t.behind>0&&e.push(r("table.behind",{count:t.behind})),e}function ue(t,e){return async(n,s,o)=>{let i=null,d="";try{i=await n()}catch(u){d=t(u)}s()&&(o(i,d),e())}}function ee(){let t="",e=null,n="",s=o=>t===o;return{about(o){return t!==o?(t=o,e=null,n="",!0):e===null&&n===""},of:o=>s(o)?e:null,stillOn:s,trouble:o=>s(o)?n:"",put(o,i){s(o)&&(e=i,n="")},failed(o,i){s(o)&&(e=null,n=i)},forget(o){s(o)&&(t="",e=null,n="")},clear(){t="",e=null,n=""}}}function F(t,e){return a`
        <div class="sds-row branchery-back">
            ${$(t,a`<sds-button variant="ghost" href=${e}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${t}</sds-button>`)}
        </div>`}var bs=25;function lt(t){let e=t.files.length-bs,n=t.all||e<=0?t.files:t.files.slice(0,bs);return a`
        <ul class="branchery-changes">
            ${n.map(s=>{let o=t.diffs.get(s.path),i=o?.open===!0;return a`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${i}
                                @click=${()=>t.press(s.path)}>
                            <sds-badge label=${r(`change.${s.status}`)}
                                       tone=${s.status==="deleted"?"warn":c}></sds-badge>
                            ${Zr(s.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${i?"actions-chevron-down":"actions-chevron-end"}></sds-icon>
                        </button>
                        ${i?Qr(o):c}
                    </li>`})}
        </ul>
        ${t.all||e<=0?c:a`
            <p class="branchery-changes__more">
                ${$(r("detail.showAllFiles",{count:e}),a`<sds-button variant="ghost" @click=${t.showAll}>${r("detail.showAllFiles",{count:e})}</sds-button>`)}
            </p>`}`}function Zr(t){let e=t.lastIndexOf("/");return a`<code class="sds-mono branchery-changes__path">${e<0?c:a`<span class="branchery-changes__dir">${t.slice(0,e+1)}</span>`}${t.slice(e+1)}</code>`}function Qr(t){return t===void 0||t.read===null&&t.trouble===""?U():t.read===null?a`<sds-note tone="warn" body=${`${r("detail.changeFailed")} ${t.trouble}`}></sds-note>`:a`
        <sds-diff path=${t.read.path} .body=${t.read.lines}></sds-diff>
        ${t.read.truncated?a`<p class="branchery-changes__more">${r("detail.changeTruncated")}</p>`:c}`}function dt(t,e,n){let s=t.get(e)??{read:null,trouble:"",open:!1};s.open=!s.open,t.set(e,s),s.open&&s.read===null&&n()}function ct(t,e,n,s){let o=t.get(e);o!==void 0&&t.set(e,{...o,read:n,trouble:s})}function pe(t,e){return`${t}${e}`}var Kt=class extends E{name="";sha="";branch="";read=ee();diffs=new Map;all=!1;reading=ue(C,()=>this.requestUpdate());get of(){return this.branch===""?this.name:l.projectName}willUpdate(){let e=this.of;this.read.about(pe(e,this.sha))&&(this.diffs=new Map,this.all=!1,this.readCommit(e,this.sha))}render(){let e=this.of,n=this.read.of(pe(e,this.sha));return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${this.branch===""?F(this.name,`#/w/${encodeURIComponent(this.name)}`):F(this.branch,`#/b/${encodeURIComponent(this.branch)}`)}
            ${n===null?this.beforeTheAnswer(e,this.sha):Xr(e,n,this.branch)}
        </section>
        ${n===null?c:this.touched(this.name,n)}
      </div>`}beforeTheAnswer(e,n){let s=this.read.trouble(pe(e,n));return a`
        <h1 class="sds-h2"><span class="sds-mono">${n}</span></h1>
        ${s===""?U():a`<sds-note tone="warn" body=${`${r("detail.commitFailed")} ${s}`}></sds-note>`}`}touched(e,n){return a`
        <section class="sds-band sds-band--quiet">
            ${""}
            <h2 class="sds-h3">${n.files.length===0?r("detail.touchedNothingHeading"):r("detail.touched",{count:n.files.length})}</h2>
            ${n.files.length===0?a`<p class="branchery-list__quiet">${r("detail.touchedNothing")}</p>`:lt({files:n.files,diffs:this.diffs,press:s=>this.toggleDiff(e,n.sha,s),all:this.all,showAll:()=>{this.all=!0,this.requestUpdate()}})}
        </section>`}toggleDiff(e,n,s){dt(this.diffs,s,()=>void this.readDiff(e,n,s)),this.requestUpdate()}stillReading(e,n){return this.read.stillOn(pe(e,n))}async readCommit(e,n){await this.reading(()=>m.commit(e,n),()=>this.stillReading(e,n),(s,o)=>{if(s===null){this.read.failed(pe(e,n),o);return}this.read.put(pe(e,n),s)})}async readDiff(e,n,s){await this.reading(()=>m.commitDiff(e,n,s),()=>this.stillReading(e,n)&&this.diffs.has(s),(o,i)=>ct(this.diffs,s,o,i))}};customElements.define("branchery-commit",Kt);function Xr(t,e,n){return a`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${e.subject}
                ${e.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${e.url===null?c:a`${oe(e.url,r("detail.commitAtForge"))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${r("table.author")}</dt>
            <dd>${e.author}</dd>
            <dt>${r("table.when")}</dt>
            <dd>${T(e.when,l.language)}</dd>
            <dt>${r("table.commit")}</dt>
            ${""}
            <dd><sds-copy value=${e.id} label=${r("table.commit")}></sds-copy></dd>
            ${e.parents.length===0?c:a`
                <dt>${r("detail.parents")}</dt>
                ${""}
                <dd>${e.parents.map((s,o)=>a`${o===0?c:" \xB7 "}<sds-link
                    href=${n===""?`#/w/${encodeURIComponent(t)}/c/${s}`:`#/b/${encodeURIComponent(n)}/c/${s}`} label=${s}></sds-link>`)}</dd>`}
        </dl>
        ${e.body===""?c:a`<pre class="branchery-message">${e.body}</pre>`}`}var ut={log:"",size:0,steps:[]};function pt(t,e){let n=new Map(t.steps.map(s=>[s.no,s.output]));return{log:e.partial?t.log+e.log:e.log,size:e.size,steps:e.steps.map(s=>({...s,output:s.output??n.get(s.no)??""}))}}function ys(t){switch(t){case"running":return"job.running";case"done":return"job.done";case"failed":return"job.failed";default:return"job.unknown"}}function Gt(t){return t==="done"}function ht(t){let e=t.trim().split(`
`).reverse().find(n=>n.startsWith(vs));return e===void 0?"":e.slice(vs.length).trim()}var vs="\u2717";function $s(t){let e={php:t.php},n=()=>{let o=[];return e.php!==t.php&&o.push({label:r("table.php"),value:e.php,note:r("edit.effect.php")}),o},s={steps:[eo(t,e),to(t,n)],finishLabel:()=>r("action.apply"),finish:()=>no(t,e)};M(s)}function eo(t,e){return{label:r("table.php"),heading:r("edit.step.php.heading",{name:t.name}),lead:r("edit.step.php.lead"),ready:()=>e.php!==t.php,enter(n,s){let o=l.phpVersions.filter(i=>i===t.php||t.minPhp===null||En(i,t.minPhp)>=0);v(a`${ze(o.map(i=>({value:i,label:i,...i===t.php?{hint:r("edit.current")}:{}})),e.php,i=>{e.php=i,s.update()},r("table.php"))}`,n)}}}function to(t,e){return{label:r("step.review.label"),heading:r("edit.step.review.heading",{name:t.name}),lead:r("step.review.lead"),enter(n){v(a`
                <div class="branchery-preview">
                    <dl>
                        ${e().map(s=>a`
                            <dt>${s.label}</dt>
                            <dd>${s.value}<span class="branchery-preview__note">${s.note}</span></dd>`)}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,n)}}}async function no(t,e){try{e.php!==t.php&&await m.updateWorktree(t.name,{php:e.php}),W(""),await R(),L()}catch(n){A(n);let s=w("#editError");s!==null&&(s.body=C(n),s.hidden=!1)}}var so=10;function ws(){return[{head:"",cls:"sds-td-graph"},{head:r("table.subject")},{head:r("table.when"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.author"),fit:!0},{head:r("table.commit"),cls:"sds-td-name",fit:!0}]}function ro(){return a`<sds-table scrollable loading loading-rows=${so} .columns=${ws()}></sds-table>`}function oo(t,e){return t.commits.length===0?c:a`<sds-table
        scrollable
        .columns=${ws()}
        .rows=${t.commits.map((n,s)=>{let o=!n.own&&(s===0||t.commits[s-1]?.own===!0),i=a`${n.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge> `}${o&&t.base!==null?a`<sds-badge label=${t.base} tone="neutral"></sds-badge> `:c}<span
                    class=${n.own?"branchery-subject":"branchery-subject branchery-subject--base"}><sds-link
                    href=${e(n.sha)}
                    label=${n.subject}></sds-link></span>`;return{cells:[io(s===0?"current":""),s===0?a`<strong>${i}</strong>`:i,T(n.when,l.language),n.author,n.url===null?a`<code class="sds-mono">${n.sha}</code>`:a`<sds-link external href=${n.url} label=${n.sha}></sds-link>`]}})}></sds-table>`}function io(t){return a`<span class="sds-graph${t===""?"":` sds-graph--${t}`}"></span>`}function ao(t,e,n,s){return!t.more&&e===""?c:a`
        <p class="branchery-changes__more">
            ${e===""?c:a`<sds-note tone="warn" body=${`${r("detail.commitsFailed")} ${e}`}></sds-note>`}
            ${t.more?n?$(r("detail.loading"),a`<sds-button variant="ghost" disabled>${r("detail.loading")}</sds-button>`):$(r("detail.olderCommits"),a`<sds-button variant="ghost" @click=${s}>${r("detail.olderCommits")}</sds-button>`):c}
        </p>`}function mt(t,e,n){let s=Vt("");async function o(i,d){d>0&&s.name===i&&(s={...s,reading:!0,trouble:""},n()),await e(()=>t(i,d),()=>s.name===i,(u,p)=>{let f=d>0?s.commits?.commits??[]:[];s={name:i,commits:u===null?s.commits:{...u,commits:[...f,...u.commits]},trouble:p,reading:!1}})}return{about(i){s.name!==i&&(s=Vt(i),o(i,0))},of:i=>s.name===i?s.commits:null,trouble:i=>s.name===i&&s.commits===null&&s.trouble!==""?`${r("detail.commitsFailed")} ${s.trouble}`:"",body(i,d){let u=s.name===i?s.commits:null;return u===null?ro():a`${oo(u,d)}
                ${ao(u,s.trouble,s.reading,()=>void o(i,u.commits.length))}`},forget(i){s.name===i&&(s=Vt(""))}}}function Vt(t){return{name:t,commits:null,trouble:"",reading:!1}}function ft(t){return t.facts.length===0?c:a`
        <div class="sds-facts-group">
            <p class="sds-label">${t.title}</p>
            <dl class="sds-facts">${t.facts.map(lo)}</dl>
        </div>`}function lo(t,e){return a`
        <dt>${t.label}</dt>
        <dd>${t.waiting===!0?j(e):t.copy===!0?a`<sds-copy value=${t.value} label=${t.label}></sds-copy>`:t.said===!0?t.value:a`<code class="sds-mono">${t.value}</code>`}</dd>`}function gt(t){return[t.own>0?r("detail.ownCommits",{count:t.own}):r("detail.ownNone"),...t.moved>0?[r("table.baseMoved",{base:t.branch,count:t.moved})]:[]].join(" \xB7 ")}var Te={user:"admin",password:"Password1!"};function _s(t,e){return[{title:r("detail.repository"),facts:[{label:r("table.branch"),value:t.branch},...Yt(t)?[{label:r("detail.madeFor"),value:t.madeFor??""}]:[],...t.base!==null?[{label:r("detail.base"),value:t.forkedAt!==null&&t.forkedFrom===t.base.branch?`${t.base.branch} @ ${t.forkedAt.slice(0,11)}`:t.base.branch},{label:r("detail.sinceBase"),value:gt(t.base),said:!0}]:[],{label:r("detail.commits"),value:uo(t),said:!0},{label:r("detail.changes"),value:t.changes>0?r("table.changes",{count:t.changes}):r("detail.clean"),said:!0},...t.builtAt===null?[]:[{label:r("detail.built"),value:T(t.builtAt,l.language),said:!0}]]},{title:r("table.address"),facts:[{label:r("detail.site"),value:se(t.url),copy:!0},...t.backend===null?[]:[{label:r("detail.backend"),value:se(t.backend),copy:!0}]]},{title:r("detail.serving"),facts:[{label:r("table.php"),value:t.php+(t.minPhp!==null&&t.minPhp!==t.php?` (${r("detail.minPhp",{version:t.minPhp})})`:"")},...t.node===null?[]:[{label:r("table.node"),value:t.node}],{label:r("table.profile"),value:t.profile??r("table.noProfile")},{label:r("table.docroot"),value:t.docroot===""?"/":t.docroot}]},{title:r("detail.taken"),facts:[{label:r("table.directory"),value:t.path,copy:!0},{label:r("table.database"),value:t.database,copy:!0},...t.backend===null?[]:[{label:r("detail.user"),value:Te.user,copy:!0},{label:r("detail.password"),value:Te.password,copy:!0}]]},...t.isProject?[]:[co(e)]]}function co(t){return t.trouble!==""?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:`${r("detail.storageFailed")} ${t.trouble}`,said:!0}]}:t.value===null?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:"",waiting:!0},{label:r("detail.storageFiles"),value:"",waiting:!0},{label:r("detail.storageDatabase"),value:"",waiting:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}:{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:Ie(t.value.total,l.language),said:!0},{label:r("detail.storageFiles"),value:Ie(t.value.files,l.language),said:!0},{label:r("detail.storageDatabase"),value:Ie(t.value.database,l.language),said:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}}function uo(t){if(t.gone)return r("table.gone");if(t.ahead===null||t.behind===null)return r("detail.noRemote");let e=[...t.ahead>0?[r("table.unpushed",{count:t.ahead})]:[],...t.behind>0?[r("table.behind",{count:t.behind})]:[]];return e.length===0?r("detail.inStep"):e.join(" \xB7 ")}function Yt(t){return t.madeFor!==null&&t.madeFor!==t.branch}var z=y("#changes"),Zt="";function Ss(){return Zt}function ks(t,e,n){Zt=t,z.heading=e,z.body=n,z.actions=[a`${$(r("action.close"),a`<sds-button variant="ghost" @click=${()=>z.close()}>${r("action.close")}</sds-button>`)}`],z.show()}function xs(){z.close()}function Ts(t){let e=()=>{Zt="",t()};return z.addEventListener("sds-dialog-cancel",e),()=>z.removeEventListener("sds-dialog-cancel",e)}var he=y("#confirm");function bt(t){return he.heading=t.title,he.body=po(t),he.confirmLabel=t.confirmLabel,he.cancelLabel=r("action.cancel"),he.tone=t.tone??"primary",he.ask()}function po(t){return a`
        <p>${t.message}</p>
        ${t.warning===void 0?c:a`<sds-note tone="warn" body=${t.warning}></sds-note>`}
        ${t.facts===void 0||t.facts.length===0?c:a`
            <div class="branchery-preview">
                <dl>${t.facts.map(e=>a`
                    <dt>${e.label}</dt>
                    <dd><code class="sds-mono">${e.value}</code></dd>`)}</dl>
            </div>`}`}async function Rs(t,e){await bt({title:r("confirm.sync.title"),message:r("confirm.sync.body"),facts:[{label:r("table.worktree"),value:t.name},{label:r("table.database"),value:t.database},{label:r("confirm.source"),value:r("field.branchFromProject",{branch:l.project?.branch??l.branch})}],confirmLabel:r("action.sync")})&&await me(()=>m.syncWorktree(t.name),t.name,"sync",e)}function ho(t){return[...t.ahead===null?[r("confirm.worktree.nowhere")]:[],...t.ahead!==null&&t.ahead>0?[r("confirm.worktree.unpushed",{count:t.ahead})]:[],...t.changes>0?[r("confirm.worktree.changes",{count:t.changes})]:[]]}async function Cs(t,e,n){let s=n;if(s===null)try{s=await m.commits(t.name)}catch(u){A(u);return}let o=s.commits.filter(u=>!u.pushed),i=s.upstream??t.branch;await bt({title:r("confirm.discard.title"),message:r("confirm.discard.body",{upstream:i}),...(t.behind??0)>0?{warning:r("confirm.discard.behind",{count:t.behind??0})}:{},facts:o.map(u=>({label:u.sha,value:u.subject})),confirmLabel:r("action.discard"),tone:"danger"})&&await me(()=>m.discardWorktree(t.name),t.name,"discard",e)}async function Es(t,e){await me(()=>m.restoreWorktree(t.name),t.name,"restore",e)}async function As(t,e){await me(()=>m.pullWorktree(t.name),t.name,"pull",e)}async function vt(t,e,n){await me(()=>m.provisionWorktree(t,e),t,"create",n)}async function Ps(t,e){let n=ho(t);await bt({title:r("confirm.worktree.title"),message:r("confirm.worktree.body"),...n.length>0?{warning:n.join(" ")}:{},facts:[{label:r("table.worktree"),value:t.name},{label:r("table.branch"),value:t.branch},{label:r("table.database"),value:t.database}],confirmLabel:r("action.remove"),tone:"danger"})&&await me(()=>m.removeWorktree(t.name),null,"remove",e)&&Ze("/")}async function me(t,e,n,s){try{let o=await t();return W(""),s.onJob(o.job,e,n),!0}catch(o){return A(o),await R(),!1}}function yt(t,e){let n={fresh:!1},s={steps:[mo(t,n)],finishLabel:()=>n.fresh?r("provision.fresh"):r("table.provision"),finish:()=>e(n.fresh)};M(s)}function mo(t,e){return{label:r("table.database"),heading:r("provision.heading",{name:t.name}),lead:r("provision.lead"),enter(n,s){v(a`${ze([{value:"keep",label:r("provision.keep"),hint:r("provision.keepHint")},{value:"fresh",label:r("provision.fresh"),hint:r("provision.freshHint")}],e.fresh?"fresh":"keep",o=>{e.fresh=o==="fresh",s.update()},r("table.database"))}`,n)}}}function Qt(t){return{name:t,list:{read:null,trouble:"",open:!1},all:!1,diffs:new Map}}var Xt=class extends E{name="";handlers;past=ee();opened=new Map;askingFor=new Set;usage=ee();files=Qt("");reading=ue(C,()=>this.requestUpdate());log=mt((e,n)=>m.commits(e,n),this.reading,()=>this.requestUpdate());bar=null;arrived(){this.untilLeft(Ts(()=>{this.files.list.open=!1,this.requestUpdate()})),this.untilLeft(Gn(e=>this.operationEnded(e)))}left(){xs()}operationEnded(e){if(this.past.stillOn(e)&&(this.past.forget(e),this.opened.clear()),this.log.forget(e),this.files.name===e){let n=Ss()===e;this.files=Qt(n?e:""),n&&(this.files.list.open=!0,this.readChanges(e))}this.usage.forget(e),this.name===e&&this.requestUpdate()}get worktree(){return[l.project,...l.worktrees].find(e=>e?.name===this.name)??null}willUpdate(){let e=this.name,n=this.worktree;this.past.about(e)&&(this.opened.clear(),this.readHistory(e));let s=n?.incomplete===!0?this.lastFailed():null;s!==null&&!this.opened.has(s.id)&&this.readJob(s.id),n!==null&&this.log.about(e),n!==null&&!n.isProject&&this.usage.about(e)&&this.readUsage(e)}render(){let e=this.worktree;return e===null?fo(this.name):this.page(e)}updated(){this.files.name===this.name&&this.files.list.open&&ks(this.name,r("table.uncommitted"),this.changeList(this.name))}page(e){let n=ae(e.name);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${F(r("detail.back"),"#/")}
            ${""}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${e.name}</span>
                    ${e.ready?e.incomplete?a`<sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a`<sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}
                </h1>
                <span class="sds-row sds-row__end">
                    ${Re(e.url,r("table.openSite"))}
                    ${Re(e.backend,r("detail.backend"))}
                    ${e.isProject?Re(l.repository,r("detail.repository")):c}
                    ${Re(e.review,r("detail.review"))}
                    ${Re(e.issue,e.issueId===null?r("detail.issue"):r("detail.issueNumber",{id:e.issueId}))}
                </span>
            </div>
            ${e.isProject?c:this.actionBar(e,n!==void 0)}
            ${n!==void 0?go(n):c}
            ${e.incomplete&&n===void 0?this.unfinishedNote(e):c}
            ${e.stale&&n===void 0?this.staleNote(e):c}
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.settled")}</h2>
            <div class="sds-facts-set">${_s(e,{value:this.usage.of(e.name),trouble:this.usage.trouble(e.name)}).map(ft)}</div>
        </section>

        ${this.commitList(e)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.history")}</h2>
            ${this.history(e.name)}
        </section>
      </div>`}commitList(e){let n=this.log.of(e.name),s=this.log.trouble(e.name);return s!==""?a`
            <section class="sds-band">
                <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
                <sds-note tone="warn" body=${s}></sds-note>
            </section>`:n!==null&&n.commits.length===0&&e.changes===0?c:a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${e.changes===0?c:a`
                <p class="branchery-uncommitted">
                    <strong>${r("table.uncommitted")}
                        <span class="sds-warn">${r("table.files",{count:e.changes})}</span></strong>
                    ${this.showFiles(e.name)}
                </p>`}
            ${this.log.body(e.name,o=>`#/w/${encodeURIComponent(e.name)}/c/${o}`)}
        </section>`}showFiles(e){return a` ${$(r("detail.showFiles"),a`<sds-button variant="ghost" @click=${()=>this.openFiles(e)}>${r("detail.showFiles")}</sds-button>`)}`}openFiles(e){this.files.name!==e&&(this.files=Qt(e)),this.files.list.open=!0,this.files.list.read===null&&this.readChanges(e),this.requestUpdate()}toggleDiff(e,n){this.files.name===e&&(dt(this.files.diffs,n,()=>void this.readDiff(e,n)),this.requestUpdate())}changeList(e){let n=this.files.list;return n.trouble!==""?a`<sds-note tone="warn" body=${`${r("detail.changesFailed")} ${n.trouble}`}></sds-note>`:n.read===null?U():lt({files:n.read,diffs:this.files.diffs,press:s=>this.toggleDiff(e,s),all:this.files.all,showAll:()=>{this.files.all=!0,this.requestUpdate()}})}async readChanges(e){await this.reading(async()=>(await m.changes(e)).changes,()=>this.files.name===e,(n,s)=>{this.files.list={...this.files.list,read:n,trouble:s}})}async readDiff(e,n){await this.reading(()=>m.changeDiff(e,n),()=>this.files.name===e&&this.files.diffs.has(n),(s,o)=>ct(this.files.diffs,n,s,o))}staleNote(e){return a`
        <sds-note
            tone="warn"
            heading=${r("detail.staleHeading")}
            body=${r("detail.stale")}
            action=${r("table.provision")}
            @sds-note-action=${()=>yt(e,n=>vt(e.name,n,this.handlers))}></sds-note>`}unfinishedNote(e){let n=this.lastFailed(),s=n===null?null:this.opened.get(n.id)?.stopped??null;return a`
        <sds-note
            tone="warn"
            heading=${r("detail.unfinishedHeading")}
            body=${s===null?r("detail.unfinished"):r("detail.unfinishedAt",{no:s.no,step:s.step,reason:s.reason})}
            action=${r("table.provision")}
            @sds-note-action=${()=>yt(e,o=>vt(e.name,o,this.handlers))}></sds-note>`}lastFailed(){return this.past.of(this.name)?.find(e=>e.status==="failed")??null}actionBar(e,n){let s=JSON.stringify([e,l.language]);this.bar?.key!==s&&(this.bar={key:s,...this.buildBar(e)});for(let d of[...this.bar.doing,...this.bar.undoing])d.disabled=n||this.bar.held.has(d);let{doing:o,undoing:i}=this.bar;return a`
        <section class="sds-actions">
            ${""}
            <h2 class="sds-said-only">${r("detail.actions")}</h2>
            ${o}
            ${""}
            <span class="sds-row sds-row__end">${i}</span>
        </section>`}buildBar(e){let n=this.handlers,s=S(r("table.discard"),"danger",()=>void Cs(e,n,this.log.of(e.name))),o=S(r("table.remove"),"danger",()=>void Ps(e,n)),i=new Set;e.changes>0&&(i.add(s),s.title=r("detail.discardBlocked"));let d=S(r("table.pull"),"secondary",()=>void As(e,n));e.behind===0&&(i.add(d),d.title=r("detail.pullBlocked"));let p=[...Yt(e)?[S(r("table.restore",{branch:e.madeFor??""}),"secondary",()=>void Es(e,n))]:e.behind===null?[]:[d],S(r("table.edit"),"secondary",()=>$s(e)),S(r("table.sync"),"secondary",()=>void Rs(e,n)),S(r("table.provision"),"secondary",()=>yt(e,g=>vt(e.name,g,n)))],f=[...(e.ahead??0)>0?[s]:[],o];return{doing:p,undoing:f,held:i}}history(e){let n=this.past.trouble(e);if(n!=="")return a`<sds-note tone="warn" body=${`${r("detail.historyFailed")} ${n}`}></sds-note>`;let s=this.past.of(e);return s===null?U():s.length===0?a`<p class="branchery-list__quiet">${r("detail.noHistory")}</p>`:a`<div class="branchery-history">${s.map(o=>this.entry(o))}</div>`}entry(e){let n=this.opened.get(e.id),s=`${T(e.started,l.language)} \xB7 ${_e(e.elapsed)}`;return a`
        <sds-run
            heading=${Ge(e.command)}
            verdict=${e.status}
            note=${n!==void 0&&n.trouble!==""?`${s} \xB7 ${n.trouble}`:s}
            .stateWords=${Ve()}
            .steps=${n?.steps??[]}
            @click=${o=>this.open(o,e.id)}></sds-run>`}open(e,n){let s=e.target;!(s instanceof Element)||!s.closest(".sds-run__head")||this.opened.get(n)?.settled===!0||this.readJob(n)}async readHistory(e){await this.reading(()=>m.worktreeJobs(e),()=>this.past.stillOn(e),(n,s)=>{if(n===null){this.past.failed(e,s);return}this.past.put(e,n)})}async readUsage(e){await this.reading(()=>m.worktreeUsage(e),()=>this.usage.stillOn(e),(n,s)=>{if(n===null){this.usage.failed(e,s);return}this.usage.put(e,n)})}async readJob(e){if(!this.askingFor.has(e)){this.askingFor.add(e);try{let n=await m.job(e),s=n.status==="unknown"&&n.steps.length===0;this.opened.set(e,{steps:Me(pt(ut,n).steps),trouble:s?r("detail.noLog"):"",settled:!0,stopped:bo(n)})}catch(n){this.opened.set(e,{steps:[],trouble:`${r("detail.logFailed")} ${C(n)}`,settled:!1,stopped:null})}finally{this.askingFor.delete(e)}this.requestUpdate()}}};customElements.define("branchery-worktree",Xt);function fo(t){return!l.loading&&!l.unreachable?a`
          <div class="sds-page">
            <sds-note tone="warn" body=${r("detail.gone",{name:t})}></sds-note>
            ${F(r("detail.back"),"#/")}
          </div>`:a`
      <div class="sds-bands">
        <section class="sds-band">
            ${F(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${t}</span></h1>
            </div>
            ${U()}
        </section>
      </div>`}function Re(t,e){return t===null?c:a`${oe(t,e)}`}function go(t){return a`
        <sds-note
            tone="info"
            heading=${r("detail.busyHeading")}
            body=${r("detail.busy",{doing:t})}></sds-note>`}function bo(t){let e=t.steps.find(n=>n.state==="failed");return t.status!=="failed"||e===void 0?null:{no:e.no,step:e.label,reason:ht(t.log)}}var en=class extends E{name="";handlers;read=ee();reading=ue(C,()=>this.requestUpdate());log=mt((e,n)=>m.branchCommits(e,n),this.reading,()=>this.requestUpdate());willUpdate(){this.read.about(this.name)&&this.readBranch(this.name),this.log.about(this.name)}render(){let e=this.name,n=this.read.of(e);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${F(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${e}</span>
                    ${n===null?c:vo(n)}
                </h1>
            </div>
            ${n===null?this.beforeTheAnswer(e):this.offer(n)}
        </section>
        ${n===null?c:a`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${r("detail.settled")}</h2>
                <div class="sds-facts-set">${yo(n).map(ft)}</div>
            </section>`}
        ${n===null&&this.read.trouble(e)!==""?c:this.commits(e)}
      </div>`}beforeTheAnswer(e){let n=this.read.trouble(e);return n===""?U():a`<sds-note tone="warn" body=${n}></sds-note>`}offer(e){return e.worktree!==null?a`
            <p class="branchery-list__quiet">${r("detail.branchHasWorktree")}
                <sds-link href=${`#/w/${encodeURIComponent(e.worktree)}`}
                          label=${e.worktree}></sds-link></p>`:a`
        <div class="sds-row">
            ${$(r("nav.newWorktree"),a`<sds-button variant="primary"
                        @click=${()=>I(this.handlers,e.name)}>${r("nav.newWorktree")}</sds-button>`)}
        </div>`}commits(e){let n=this.log.trouble(e);return a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${n===""?this.log.body(e,s=>`#/b/${encodeURIComponent(e)}/c/${s}`):a`<sds-note tone="warn" body=${n}></sds-note>`}
        </section>`}async readBranch(e){await this.reading(()=>m.branch(e),()=>this.read.stillOn(e),(n,s)=>{if(n===null){this.read.failed(e,s);return}this.read.put(e,n)})}};customElements.define("branchery-branch",en);function vo(t){return t.merged?a`<sds-badge label=${r("table.merged",{branch:l.project?.branch??l.branch})}
                               tone="neutral"></sds-badge>`:t.gone?a`<sds-badge label=${r("table.gone")} tone="warn"></sds-badge>`:!t.onRemote&&l.remotes.length>0?a`<sds-badge label=${r("table.nowhere")} tone="warn"></sds-badge>`:c}function yo(t){return[{title:r("detail.repository"),facts:[...t.base===null?[]:[{label:r("detail.base"),value:t.base.branch},{label:r("detail.sinceBase"),value:gt(t.base),said:!0}],{label:r("detail.commits"),value:$o(t),said:!0},{label:r("detail.moved"),value:T(t.when,l.language),said:!0}]}]}function $o(t){if(t.gone)return r("table.gone");if(t.upstream===null)return t.onRemote?r("detail.onRemoteOnly"):r("detail.noRemote");let e=[...t.ahead!==null&&t.ahead>0?[r("table.unpushed",{count:t.ahead})]:[],...t.behind!==null&&t.behind>0?[r("table.behind",{count:t.behind})]:[]];return e.length===0?r("detail.inStep"):`${t.upstream} \xB7 ${e.join(" \xB7 ")}`}var wo={schedule:(t,e)=>setTimeout(t,e),cancel:t=>clearTimeout(t)};function js(t,e,n,s=wo){let o=!1,i=null,d=()=>{i=s.schedule(()=>{i=null,u()},n)},u=async()=>{let p;try{p=await t()}catch{o||d();return}o||(e(p)?d():o=!0)};return u(),()=>{o=!0,i!==null&&(s.cancel(i),i=null)}}var _o=1e3,tn=0,Ws=null,sn=null;function rn(t,e,n,s,o=!0){let i=++tn;Ws?.();let d=Hn(t,e,n??"create"),u=o,p=ut,f=()=>{u&&!tt()&&Ls(d)};sn=()=>{u=!0,et(),Ls(d)},o&&sn();let g=async()=>{await R(),i===tn&&(l.job=d,f(),s(d))};Ws=js(()=>m.job(t,p.size),h=>i!==tn?!1:(p=pt(p,h),d={...h,log:p.log,steps:p.steps,expected:e??(h.subject===""?null:h.subject),kind:n??On(h.command)},h.status==="running"?(f(),!0):(g(),!1)),_o)}var So={running:"job.running",done:"job.ticket.done",failed:"job.ticket.failed",unknown:"job.ticket.unknown"},q=null,nn="";function $t(){let t=l.job!==null&&!D()?l.job.status:"",e=So[t];if(e===void 0){q?.remove(),q=null,nn="";return}q!==null&&nn===t||(q?.remove(),nn=t,q=S(r(e),"secondary",()=>{(sn??et)(),$t()}),q.className=`branchery-ticket branchery-ticket--${t}`,q.title=r("job.show"),document.body.append(q))}ce(()=>$t());ie(()=>$t());function Ls(t){rt(To(t),t.status==="running"?"":Co(t)),Xn(a`
        <sds-run open
                 heading=${xo(t)}
                 verdict=${t.status}
                 note=${Ro(t)}
                 .stateWords=${Ve()}
                 .steps=${Me(t.steps)}></sds-run>`),ko(t),$t()}function ko(t){Ft(t.status==="running"?{back:r("action.leaveRunning"),onBack:()=>L()}:{back:r("action.copyLog"),onBack:()=>void Eo(t),next:r("action.close"),onNext:()=>{l.job=null,L()}})}function xo(t){return r(ys(t.status))}function To(t){return t.expected??(t.subject===""?Ge(t.command):t.subject)}function Ro(t){let e=_e(t.elapsed);return t.status==="running"?t.step===null?e:`${r("job.stepOf",{no:t.step.no,total:t.step.total})} \xB7 ${e}`:t.status==="failed"?t.interrupted?r("job.interrupted"):ht(t.log)||e:Gt(t.status)?e:""}function Co(t){if(!Gt(t.status))return"";let e=_e(t.elapsed);if(t.kind==="fetch"){let o=t.log.split(`
`).filter(i=>i.includes(" -> ")).length;return o===0?r("job.done.fetch",{time:e}):r("job.done.fetchMoved",{count:o,time:e})}let n=l.worktrees.find(o=>o.name===t.expected);if(!n||t.kind==="remove")return r(`job.done.${t.kind}`,{name:t.expected??"",time:e});let s=t.kind==="sync"?r("job.done.sync",{name:n.database}):t.kind==="pull"?r("job.done.pull",{branch:n.branch}):t.kind==="restore"?r("job.done.restore",{branch:n.branch}):t.kind==="discard"?r("job.done.discard",{branch:n.branch}):n.backend===null?r("job.done.built",{php:n.php}):`${r("job.done.built",{php:n.php})} ${r("job.login",Te)}`;return a`
        ${s}
        <sds-link external href=${n.url}
                  label=${r("action.openWorktree")}></sds-link>`}async function Eo(t){let e=w("#wizBack");try{await navigator.clipboard.writeText(t.log.trim()),e&&(re(e,r("action.copied")),window.setTimeout(()=>re(e,r("action.copyLog")),2e3))}catch{}}var wt={onJob(t,e=null,n=null){rn(t,e,n,Ds)}};function Ds(t){let e=t.expected??t.subject;e!==""&&Kn(e)}function Ee(t,e,n,s){let o=y(t);if(o.hidden=!e,!e)return;let i=o.firstElementChild;i===null&&(i=document.createElement("sds-note"),s!==void 0&&i.addEventListener("sds-note-action",s),o.append(i));for(let[d,u]of Object.entries(n()))i.setAttribute(d,u)}function Ao(){Ee("#offline",l.unreachable,()=>({tone:"warn",body:r("error.unreachable"),action:r("action.tryAgain")}),()=>void R())}function Po(){Ee("#update",l.updateWaiting,()=>({tone:"info",heading:r("update.waiting"),body:r("update.how")}))}function jo(){let t=l.exposed;Ee("#exposed",t!==null,()=>({tone:"warn",heading:r("exposed.heading"),body:r(t==="router"?"exposed.router":"exposed.container")}))}function Wo(){Ee("#unconfigured",l.unconfigured,()=>({tone:"info",heading:r("error.unconfigured"),body:r("error.unconfiguredHow")}))}function Lo(){let t=l.recipeProblem;Ee("#recipe",t!==null,()=>({tone:"warn",heading:r("error.recipe"),body:t??""}))}var Us=Ye();function ge(t=Ye()){if(D())return;let e=!Jn(t,Us);e&&window.scrollTo(0,0),Us=t,Fs(),Ao(),jo(),Po(),Mo(),Lo(),Wo(),Uo(t),e&&Ho()}function Uo(t){let e=y("#main");v(Bo(t),e);for(let n of e.children)n instanceof E&&n.drawNow()}function Bo(t){return t.view==="worktree"?a`<branchery-worktree .name=${t.name} .handlers=${wt}></branchery-worktree>`:t.view==="branch"?a`<branchery-branch .name=${t.name} .handlers=${wt}></branchery-branch>`:t.view==="commit"?a`<branchery-commit
            .name=${t.name}
            .sha=${t.sha}
            .branch=${t.branch}></branchery-commit>`:a`<branchery-overview .handlers=${wt}></branchery-overview>`}function Ho(){y("#main").focus({preventScroll:!0})}ie(()=>ge());zn(t=>{W(""),ge(t)});var fe=y("#bar"),Ce=[],Oo="https://benjaminkott.github.io/ddev-branchery/",Bs="";function Fs(){Bs!==l.language&&(Bs=l.language,fe.menu={label:r("app.title"),items:[{label:r("nav.worktrees"),href:"#/",current:!0},{label:r("nav.docs"),href:Oo,external:!0}]})}function Ns(){fe.product=r("app.title"),Fs()}function Js(){fe.languages=Ce.map(t=>({label:Do(t),current:t===l.language,lang:t})),fe.updateComplete.then(()=>{w(".sds-bar__lang",fe)?.setAttribute("name",r("app.language"))})}function Do(t){try{return new Intl.DisplayNames([t],{type:"language"}).of(t)??t.toUpperCase()}catch{return t.toUpperCase()}}fe.addEventListener("sds-dropdown-choose",t=>{let e=Ce[t.detail.index];!e||e===l.language||jt(e).then(()=>{Js(),Ns(),ge()})});y("#wizard").addEventListener("close",()=>{l.job?.status!=="running"&&(l.job=null)});ce(()=>{let t=Mn(location.hash);t!==null&&history.replaceState(null,"",t),ge(),R(!0)});var Fo=5e3,Hs=Date.now();async function Ms(){let t=Date.now();document.visibilityState!=="visible"||l.job?.status==="running"||D()||t-Hs<Fo||(Hs=t,Is(await R(!0)))}function Is(t){let e=t[0];e!==void 0&&l.job?.status!=="running"&&rn(e.id,null,null,Ds,!1)}var No=2e3,Jo=1e4,Os=!1;function Mo(){if(Os)return;Os=!0;let t=()=>{let e=l.runningJobs.length>0||D()||l.unreachable;window.setTimeout(()=>{if(document.visibilityState!=="visible"||D()){t();return}R(!0).then(t)},e?No:Jo)};t()}document.addEventListener("visibilitychange",()=>void Ms());window.addEventListener("focus",()=>void Ms());function zs(){if(Ut(location.hash)){I(wt);return}tt()&&L()}window.addEventListener("hashchange",zs);(async()=>(Ce=await Pn(),await jt(Ce.includes(l.language)?l.language:Ce[0]??"en"),Js(),Ns(),ge(),Is(await R()),ge(),zs()))();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/keyed.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=app.js.map
