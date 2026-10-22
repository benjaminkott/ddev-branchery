var We=globalThis,Le=We.ShadowRoot&&(We.ShadyCSS===void 0||We.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,an=Symbol(),on=new WeakMap,je=class{constructor(t,n,r){if(this._$cssResult$=!0,r!==an)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o,n=this.t;if(Le&&t===void 0){let r=n!==void 0&&n.length===1;r&&(t=on.get(n)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&on.set(n,t))}return t}toString(){return this.cssText}},ln=e=>new je(typeof e=="string"?e:e+"",void 0,an);var dn=(e,t)=>{if(Le)e.adoptedStyleSheets=t.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of t){let r=document.createElement("style"),o=We.litNonce;o!==void 0&&r.setAttribute("nonce",o),r.textContent=n.cssText,e.appendChild(r)}},wt=Le?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let n="";for(let r of t.cssRules)n+=r.cssText;return ln(n)})(e):e;var{is:hs,defineProperty:ms,getOwnPropertyDescriptor:fs,getOwnPropertyNames:gs,getOwnPropertySymbols:bs,getPrototypeOf:vs}=Object,Oe=globalThis,cn=Oe.trustedTypes,ys=cn?cn.emptyScript:"",$s=Oe.reactiveElementPolyfillSupport,$e=(e,t)=>e,_t={toAttribute(e,t){switch(t){case Boolean:e=e?ys:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},pn=(e,t)=>!hs(e,t),un={attribute:!0,type:String,converter:_t,reflect:!1,useDefault:!1,hasChanged:pn};Symbol.metadata??=Symbol("metadata"),Oe.litPropertyMetadata??=new WeakMap;var H=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=un){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){let r=Symbol(),o=this.getPropertyDescriptor(t,r,n);o!==void 0&&ms(this.prototype,t,o)}}static getPropertyDescriptor(t,n,r){let{get:o,set:i}=fs(this.prototype,t)??{get(){return this[n]},set(d){this[n]=d}};return{get:o,set(d){let u=o?.call(this);i?.call(this,d),this.requestUpdate(t,u,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??un}static _$Ei(){if(this.hasOwnProperty($e("elementProperties")))return;let t=vs(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($e("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($e("properties"))){let n=this.properties,r=[...gs(n),...bs(n)];for(let o of r)this.createProperty(o,n[o])}let t=this[Symbol.metadata];if(t!==null){let n=litPropertyMetadata.get(t);if(n!==void 0)for(let[r,o]of n)this.elementProperties.set(r,o)}this._$Eh=new Map;for(let[n,r]of this.elementProperties){let o=this._$Eu(n,r);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let n=[];if(Array.isArray(t)){let r=new Set(t.flat(1/0).reverse());for(let o of r)n.unshift(wt(o))}else t!==void 0&&n.push(wt(t));return n}static _$Eu(t,n){let r=n.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,n=this.constructor.elementProperties;for(let r of n.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return dn(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,r){this._$AK(t,r)}_$ET(t,n){let r=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,r);if(o!==void 0&&r.reflect===!0){let i=(r.converter?.toAttribute!==void 0?r.converter:_t).toAttribute(n,r.type);this._$Em=t,i==null?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(t,n){let r=this.constructor,o=r._$Eh.get(t);if(o!==void 0&&this._$Em!==o){let i=r.getPropertyOptions(o),d=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:_t;this._$Em=o;let u=d.fromAttribute(n,i.type);this[o]=u??this._$Ej?.get(o)??u,this._$Em=null}}requestUpdate(t,n,r,o=!1,i){if(t!==void 0){let d=this.constructor;if(o===!1&&(i=this[t]),r??=d.getPropertyOptions(t),!((r.hasChanged??pn)(i,n)||r.useDefault&&r.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(d._$Eu(t,r))))return;this.C(t,n,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,n,{useDefault:r,reflect:o,wrapped:i},d){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,d??n??this[t]),i!==!0||d!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(n=void 0),this._$AL.set(t,n)),o===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,i]of this._$Ep)this[o]=i;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[o,i]of r){let{wrapped:d}=i,u=this[o];d!==!0||this._$AL.has(o)||u===void 0||this.C(o,void 0,i,u)}}let t=!1,n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(n)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(t){}firstUpdated(t){}};H.elementStyles=[],H.shadowRootOptions={mode:"open"},H[$e("elementProperties")]=new Map,H[$e("finalized")]=new Map,$s?.({ReactiveElement:H}),(Oe.reactiveElementVersions??=[]).push("2.1.2");var xt=globalThis,hn=e=>e,Be=xt.trustedTypes,mn=Be?Be.createPolicy("lit-html",{createHTML:e=>e}):void 0,kt="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Tt="?"+D,ws=`<${Tt}>`,X=document,_e=()=>X.createComment(""),Se=e=>e===null||typeof e!="object"&&typeof e!="function",Ct=Array.isArray,$n=e=>Ct(e)||typeof e?.[Symbol.iterator]=="function",St=`[ 	
\f\r]`,we=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,fn=/-->/g,gn=/>/g,Z=RegExp(`>|${St}(?:([^\\s"'>=/]+)(${St}*=${St}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),bn=/'/g,vn=/"/g,wn=/^(?:script|style|textarea|title)$/i,Rt=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),a=Rt(1),ki=Rt(2),Ti=Rt(3),ee=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),yn=new WeakMap,Q=X.createTreeWalker(X,129);function _n(e,t){if(!Ct(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return mn!==void 0?mn.createHTML(t):t}var Sn=(e,t)=>{let n=e.length-1,r=[],o,i=t===2?"<svg>":t===3?"<math>":"",d=we;for(let u=0;u<n;u++){let h=e[u],g,m,p=-1,v=0;for(;v<h.length&&(d.lastIndex=v,m=d.exec(h),m!==null);)v=d.lastIndex,d===we?m[1]==="!--"?d=fn:m[1]!==void 0?d=gn:m[2]!==void 0?(wn.test(m[2])&&(o=RegExp("</"+m[2],"g")),d=Z):m[3]!==void 0&&(d=Z):d===Z?m[0]===">"?(d=o??we,p=-1):m[1]===void 0?p=-2:(p=d.lastIndex-m[2].length,g=m[1],d=m[3]===void 0?Z:m[3]==='"'?vn:bn):d===vn||d===bn?d=Z:d===fn||d===gn?d=we:(d=Z,o=void 0);let O=d===Z&&e[u+1].startsWith("/>")?" ":"";i+=d===we?h+ws:p>=0?(r.push(g),h.slice(0,p)+kt+h.slice(p)+D+O):h+D+(p===-2?u:O)}return[_n(e,i+(e[n]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]},xe=class e{constructor({strings:t,_$litType$:n},r){let o;this.parts=[];let i=0,d=0,u=t.length-1,h=this.parts,[g,m]=Sn(t,n);if(this.el=e.createElement(g,r),Q.currentNode=this.el.content,n===2||n===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(o=Q.nextNode())!==null&&h.length<u;){if(o.nodeType===1){if(o.hasAttributes())for(let p of o.getAttributeNames())if(p.endsWith(kt)){let v=m[d++],O=o.getAttribute(p).split(D),Pe=/([.?@])?(.*)/.exec(v);h.push({type:1,index:i,name:Pe[2],strings:O,ctor:Pe[1]==="."?He:Pe[1]==="?"?De:Pe[1]==="@"?Ne:ne}),o.removeAttribute(p)}else p.startsWith(D)&&(h.push({type:6,index:i}),o.removeAttribute(p));if(wn.test(o.tagName)){let p=o.textContent.split(D),v=p.length-1;if(v>0){o.textContent=Be?Be.emptyScript:"";for(let O=0;O<v;O++)o.append(p[O],_e()),Q.nextNode(),h.push({type:2,index:++i});o.append(p[v],_e())}}}else if(o.nodeType===8)if(o.data===Tt)h.push({type:2,index:i});else{let p=-1;for(;(p=o.data.indexOf(D,p+1))!==-1;)h.push({type:7,index:i}),p+=D.length-1}i++}}static createElement(t,n){let r=X.createElement("template");return r.innerHTML=t,r}};function te(e,t,n=e,r){if(t===ee)return t;let o=r!==void 0?n._$Co?.[r]:n._$Cl,i=Se(t)?void 0:t._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),i===void 0?o=void 0:(o=new i(e),o._$AT(e,n,r)),r!==void 0?(n._$Co??=[])[r]=o:n._$Cl=o),o!==void 0&&(t=te(e,o._$AS(e,t.values),o,r)),t}var Ue=class{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:n},parts:r}=this._$AD,o=(t?.creationScope??X).importNode(n,!0);Q.currentNode=o;let i=Q.nextNode(),d=0,u=0,h=r[0];for(;h!==void 0;){if(d===h.index){let g;h.type===2?g=new ae(i,i.nextSibling,this,t):h.type===1?g=new h.ctor(i,h.name,h.strings,this,t):h.type===6&&(g=new Fe(i,this,t)),this._$AV.push(g),h=r[++u]}d!==h?.index&&(i=Q.nextNode(),d++)}return Q.currentNode=X,o}p(t){let n=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,n),n+=r.strings.length-2):r._$AI(t[n])),n++}},ae=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,r,o){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=r,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,n=this._$AM;return n!==void 0&&t?.nodeType===11&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=te(this,t,n),Se(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==ee&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):$n(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&Se(this._$AH)?this._$AA.nextSibling.data=t:this.T(X.createTextNode(t)),this._$AH=t}$(t){let{values:n,_$litType$:r}=t,o=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=xe.createElement(_n(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===o)this._$AH.p(n);else{let i=new Ue(o,this),d=i.u(this.options);i.p(n),this.T(d),this._$AH=i}}_$AC(t){let n=yn.get(t.strings);return n===void 0&&yn.set(t.strings,n=new xe(t)),n}k(t){Ct(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,o=0;for(let i of t)o===n.length?n.push(r=new e(this.O(_e()),this.O(_e()),this,this.options)):r=n[o],r._$AI(i),o++;o<n.length&&(this._$AR(r&&r._$AB.nextSibling,o),n.length=o)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){let r=hn(t).nextSibling;hn(t).remove(),t=r}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},ne=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,r,o,i){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=n,this._$AM=o,this.options=i,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=c}_$AI(t,n=this,r,o){let i=this.strings,d=!1;if(i===void 0)t=te(this,t,n,0),d=!Se(t)||t!==this._$AH&&t!==ee,d&&(this._$AH=t);else{let u=t,h,g;for(t=i[0],h=0;h<i.length-1;h++)g=te(this,u[r+h],n,h),g===ee&&(g=this._$AH[h]),d||=!Se(g)||g!==this._$AH[h],g===c?t=c:t!==c&&(t+=(g??"")+i[h+1]),this._$AH[h]=g}d&&!o&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},He=class extends ne{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},De=class extends ne{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},Ne=class extends ne{constructor(t,n,r,o,i){super(t,n,r,o,i),this.type=5}_$AI(t,n=this){if((t=te(this,t,n,0)??c)===ee)return;let r=this._$AH,o=t===c&&r!==c||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,i=t!==c&&(r===c||o);o&&this.element.removeEventListener(this.name,this,r),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Fe=class{constructor(t,n,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){te(this,t)}},xn={M:kt,P:D,A:Tt,C:1,L:Sn,R:Ue,D:$n,V:te,I:ae,H:ne,N:De,U:Ne,B:He,F:Fe},_s=xt.litHtmlPolyfillSupport;_s?.(xe,ae),(xt.litHtmlVersions??=[]).push("3.3.3");var w=(e,t,n)=>{let r=n?.renderBefore??t,o=r._$litPart$;if(o===void 0){let i=n?.renderBefore??null;r._$litPart$=o=new ae(t.insertBefore(_e(),i),i,void 0,n??{})}return o._$AI(e),o};var At=globalThis,M=class extends H{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=w(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return ee}};M._$litElement$=!0,M.finalized=!0,At.litElementHydrateSupport?.({LitElement:M});var Ss=At.litElementPolyfillSupport;Ss?.({LitElement:M});(At.litElementVersions??=[]).push("4.2.2");var kn=e=>(...t)=>({_$litDirective$:e,values:t}),Je=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,r){this._$Ct=t,this._$AM=n,this._$Ci=r}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}};var{I:Fi}=xn;var xs={},Tn=(e,t=xs)=>e._$AH=t;var Cn=kn(class extends Je{constructor(){super(...arguments),this.key=c}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(Tn(e),this.key=t),n}});function y(e,t=document){let n=t.querySelector(e);if(!n)throw new Error(`Element not found: ${e}`);return n}function S(e,t=document){return t.querySelector(e)}function I(e){return ks.test(e)}var ks=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;function Me(e){return e.replace(/[A-Z]/g,t=>t.toLowerCase()).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function An(e,t){let n=e.split(".").map(Number),r=t.split(".").map(Number);for(let o=0;o<Math.max(n.length,r.length);o+=1){let i=(n[o]??0)-(r[o]??0);if(i!==0)return i}return 0}function En(e){try{return new URL(e).pathname.replace(/^\/+|\/+$/g,"")||e}catch{return e}}function re(e){return e.replace(/^https?:\/\//,"").replace(/\/$/,"")}function Ie(e){return e.map(t=>({label:t.label,state:t.state,meta:Ts(t.seconds),output:t.output}))}function Ts(e){if(e<60)return`${e}s`;let t=e%60;return t===0?`${Math.floor(e/60)}m`:`${Math.floor(e/60)}m ${t}s`}function R(e,t){let n=Math.max(0,Math.round(Date.now()/1e3)-e),[r,o]=n<60?[n,"second"]:n<3600?[Math.round(n/60),"minute"]:n<86400?[Math.round(n/3600),"hour"]:[Math.round(n/86400),"day"];try{return new Intl.RelativeTimeFormat(t,{numeric:"auto"}).format(-r,o)}catch{return`${r} ${o}`}}function ke(e){let t=Math.max(0,Math.round(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function le(e,t){let n=["B","KB","MB","GB","TB"],r=Math.max(0,e),o=0;for(;r>=1024&&o<n.length-1;)r/=1024,o++;return`${new Intl.NumberFormat(t,{maximumFractionDigits:r<10?1:0}).format(r)} ${n[o]}`}function $(e,t){return Cn(e,t)}function x(e,t,n,r){let o=document.createElement("sds-button");return o.variant=t,r&&(o.size=r),o.append(document.createTextNode(e)),o.addEventListener("click",n),o}function de(e,t){t.trim()!==""&&e.updateComplete.then(()=>{let n=document.createTreeWalker(e,NodeFilter.SHOW_TEXT).nextNode();if(n){n.nodeValue=t;return}(e.querySelector("button, a")??e).append(document.createTextNode(t))})}function N(e,t){let n=document.createElement("sds-button"),r=document.createElement("sds-icon");return r.name="actions-window-open",r.size=16,n.variant="secondary",n.href=e,n.rel="external",n.append(document.createTextNode(t),r),n}function Pn(e,t){let n=N(e,t);return n.addEventListener("click",r=>{r.preventDefault(),Cs(e)}),n}function Cs(e){let t=document.createElement("iframe");t.style.display="none",document.body.append(t),t.src=e,window.setTimeout(()=>t.remove(),2e3)}function Rs(e,t,n,r,o){let i=document.createElement("sds-select");return i.options=e.map(d=>({label:d.label,value:d.value,disabled:d.disabled===!0})),i.value=t,i.filled=t!=="",i.label=r,o===void 0?i.size="sm":i.caption=o,i.addEventListener("sds-change",d=>n(d.detail)),i}var Rn=0;function ze(e,t,n,r){if(e.length>6)return Rs(e.map(i=>({value:i.value,label:i.label})),t,n,r,r);let o=document.createElement("sds-radio");return Rn+=1,o.name=`choice-${Rn}`,o.legend=r,o.choices=e.map(i=>({label:i.label,value:i.value,...i.hint===void 0?{}:{hint:i.hint}})),o.value=t,o.addEventListener("sds-change",i=>n(i.detail)),o}async function Wn(){let e=await fetch("/translations/index.json");return e.ok?await e.json():["en"]}async function jn(e){let t=await fetch(`/translations/${e}.json`);if(!t.ok)throw new Error(`Missing translations for "${e}"`);return await t.json()}function Ln(e,t,n={}){let r=e[As(e,t,n)]??e[t]??t;for(let[o,i]of Object.entries(n))r=r.replaceAll(`{${o}}`,String(i));return r}function As(e,t,n){return Number(n.count)===1&&e[`${t}.one`]!==void 0?`${t}.one`:t}var Es="/api",se=class extends Error{constructor(n,r){super(n);this.status=r}status},Et=class extends Error{constructor(n){super(`No answer from the container, only a ${n} from in front of it.`);this.status=n}status};async function b(e,t={}){let n=t.body?{"Content-Type":"application/json"}:{},r=await fetch(`${Es}/${e}`,{...t,headers:n});if(!r.ok&&Ps(r.status,r.headers.get("Content-Type")))throw new Et(r.status);let o=await r.json().catch(()=>({}));if(!r.ok){let i=o.error;throw new se(i??`Request failed with status ${r.status}`,r.status)}return o}function Ps(e,t){return!((t??"").split(";")[0]?.trim().toLowerCase()==="application/json")&&Ws.includes(e)}var Ws=[404,502,503,504],f={state:()=>b("state"),createWorktree:e=>b("worktrees",{method:"POST",body:JSON.stringify(e)}),preview:e=>b(`worktrees/preview?${new URLSearchParams(e).toString()}`),updateWorktree:(e,t)=>b(`worktrees/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),provisionWorktree:(e,t=!1)=>b(`worktrees/${encodeURIComponent(e)}/provision`,{method:"POST",body:JSON.stringify({fresh:t})}),syncWorktree:(e,t="")=>b(`worktrees/${encodeURIComponent(e)}/sync`,{method:"POST",body:JSON.stringify(t!==""?{from:t}:{})}),pullWorktree:e=>b(`worktrees/${encodeURIComponent(e)}/pull`,{method:"POST"}),commits:(e,t=0)=>b(`worktrees/${encodeURIComponent(e)}/commits${t>0?`?skip=${t}`:""}`),branch:e=>b(`branch?branch=${encodeURIComponent(e)}`),branchCommits:(e,t=0)=>b(`branch/commits?branch=${encodeURIComponent(e)}${t>0?`&skip=${t}`:""}`),commit:(e,t)=>b(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}`),commitDiff:(e,t,n)=>b(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}/diff?path=${encodeURIComponent(n)}`),changes:e=>b(`worktrees/${encodeURIComponent(e)}/changes`),worktreeUsage:e=>b(`worktrees/${encodeURIComponent(e)}/usage`),changeDiff:(e,t)=>b(`worktrees/${encodeURIComponent(e)}/changes/diff?path=${encodeURIComponent(t)}`),discardWorktree:e=>b(`worktrees/${encodeURIComponent(e)}/discard`,{method:"POST"}),restoreWorktree:e=>b(`worktrees/${encodeURIComponent(e)}/restore`,{method:"POST"}),accountWorktree:e=>b(`worktrees/${encodeURIComponent(e)}/account`,{method:"POST"}),removeWorktree:(e,t=!1)=>b(`worktrees/${encodeURIComponent(e)}`,{method:"DELETE",body:JSON.stringify({force:t})}),fetch:e=>b("fetch",{method:"POST",body:JSON.stringify(e!==void 0?{remote:e}:{})}),job:(e,t=0)=>b(`jobs/${encodeURIComponent(e)}${t>0?`?since=${t}`:""}`),worktreeJobs:e=>b(`worktrees/${encodeURIComponent(e)}/jobs`)};function qe(e){try{return localStorage.getItem(e)}catch{return null}}function Ke(e,t){try{localStorage.setItem(e,t)}catch{}}var Pt={"worktree:add":{kind:"create",history:"history.add",doing:"job.doing.create"},"worktree:fork":{kind:"create",history:"history.fork",doing:"job.doing.create"},"worktree:provision":{kind:"create",history:"history.provision",doing:"job.doing.provision"},"worktree:remove":{kind:"remove",history:"history.remove",doing:"job.doing.remove"},"database:sync":{kind:"sync",history:"history.sync",doing:"job.doing.sync"},"worktree:pull":{kind:"pull",history:"history.pull",doing:"job.doing.pull"},"worktree:restore":{kind:"restore",history:"history.restore",doing:"job.doing.restore"},"worktree:discard":{kind:"discard",history:"history.discard",doing:"job.doing.discard"},"worktree:account":{kind:"account",history:"history.account",doing:"job.doing.account"},"git:fetch":{kind:"fetch",history:"history.fetch",doing:"job.doing.fetch"}};function On(e){return Pt[e]?.kind??"create"}function Bn(e){return Pt[e]?.history??"history.other"}function Un(e){return Pt[e]?.doing??"job.doing.create"}function Hn(e,t){return JSON.stringify(e)!==JSON.stringify(t)}function Dn(e){let t=new Set,n=!1,r=()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1;for(let i of t)i()}))};return{state:new Proxy({...e},{set(i,d,u){return Reflect.get(i,d)===u||(Reflect.set(i,d,u),r()),!0}}),subscribe(i){return t.add(i),()=>t.delete(i)}}}var Nn="branchery-language",{state:l,subscribe:ce}=Dn({tld:location.host,projectName:"",worktrees:[],project:null,branch:"",branches:[],remotes:[],repository:null,phpVersions:[],strings:{},loading:!0,language:qe(Nn)||document.documentElement.lang||"en",job:null,runningJobs:[],error:"",unreachable:!1,recipeProblem:null,unconfigured:!1,version:"",updateWaiting:!1,updateAvailable:null,exposed:null,webserver:""});function s(e,t={}){return Ln(l.strings,e,t)}async function Wt(e){l.strings=await jn(e),l.language=e,document.documentElement.lang=e,Ke(Nn,e),document.querySelectorAll("[data-i18n]").forEach(t=>{let n=t.dataset.i18n;n&&(t.textContent=s(n))})}async function A(e=!1){return Te!==null?(e||(l.loading=!0),Te):(Te=js(e).finally(()=>{Te=null}),Te)}var Te=null;async function js(e){l.loading=!e;try{let t=await Ls();return l.unreachable=!1,t}catch(t){return t instanceof se?(l.unreachable=!1,B(t.message)):l.unreachable=!0,l.runningJobs}finally{l.loading=!1}}async function Ls(){let e=await f.state();return _("worktrees",e.worktrees),_("branches",e.branches),_("remotes",e.remotes),_("repository",e.repository??null),_("branch",e.branch),_("project",e.project),_("phpVersions",e.phpVersions),_("tld",e.tld||location.host),_("projectName",e.projectName??""),_("recipeProblem",e.recipeProblem??null),_("unconfigured",e.unconfigured===!0),_("version",e.version??""),_("updateWaiting",e.updateWaiting??!1),_("updateAvailable",e.updateAvailable??null),_("exposed",e.exposed??null),_("webserver",e.webserver??""),_("runningJobs",e.runningJobs??[]),l.runningJobs}function _(e,t){Hn(l[e],t)&&(l[e]=t)}function B(e){l.error=e}function W(e){if(Os(e)){l.unreachable=!0;return}B(k(e))}function Os(e){return e instanceof Error&&!(e instanceof se)}function k(e){return e instanceof se?e.message:e instanceof Error?s("error.unreachable"):s("error.generic")}function oe(e){let t=l.runningJobs.find(n=>n.subject===e);return t===void 0?void 0:t.step?.label??jt(t.command)}function Fn(e,t=null,n="create"){let r={id:e,expected:t,kind:n,status:"running",subject:t??"",command:"",step:null,steps:[],elapsed:0,log:"",size:0,partial:!1,interrupted:!1};return l.job=r,r}function Ge(e){return s(Bn(e))}function jt(e){return s(Un(e))}function Ve(){return{running:s("step.state.running"),done:s("step.state.done"),failed:s("step.state.failed")}}var Mn="[A-Za-z0-9][A-Za-z0-9.-]*",Bs=new RegExp(`^/w/(${Mn})$`),Us=new RegExp(`^/w/(${Mn})/c/([0-9a-f]{4,40})$`);function In(e){let t=e.replace(/^#/,""),n=Us.exec(t);if(n?.[1]!==void 0&&n[2]!==void 0)return{view:"commit",name:n[1],sha:n[2],branch:""};let r=Bs.exec(t);if(r?.[1]!==void 0)return{view:"worktree",name:r[1]};let o=/^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(t),i=Jn(o?.[1]);if(i!==null&&o?.[2]!==void 0)return{view:"commit",name:"",sha:o[2],branch:i};let d=Jn(/^\/b\/(.+)$/.exec(t)?.[1]);return d!==null?{view:"branch",name:d}:{view:"overview"}}function Jn(e){if(e===void 0||e==="")return null;let t;try{t=decodeURIComponent(e)}catch{return null}return I(t)?t:null}function zn(e,t){return e.view!==t.view?!1:e.view==="worktree"&&t.view==="worktree"||e.view==="branch"&&t.view==="branch"?e.name===t.name:e.view==="commit"&&t.view==="commit"?e.name===t.name&&e.sha===t.sha&&e.branch===t.branch:!0}function Lt(e){return e.replace(/^#/,"").startsWith("new")}function qn(e){return Lt(e)?"#/":null}var Kn=[];function Ye(){return In(window.location.hash)}function Ze(e){window.location.hash!==`#${e}`&&(window.location.hash=e)}function Gn(e){Kn.push(e)}function Vn(){history.scrollRestoration="manual"}Vn();window.addEventListener("hashchange",()=>{Vn();let e=Ye();for(let t of Kn)t(e)});var Ot="branchery-operation-ended";function Yn(e){window.dispatchEvent(new CustomEvent(Ot,{detail:e}))}function Zn(e){let t=n=>e(n.detail);return window.addEventListener(Ot,t),()=>window.removeEventListener(Ot,t)}function Qn(){let e=!1;return{pending:()=>e,run(t,n=()=>{}){if(e)return!1;e=!0;let r=()=>{e=!1,n()},o;try{o=t()}catch(i){throw r(),i}return Promise.resolve(o).then(r,r),!0}}}var j=y("#wizard"),Hs=y("#wizForm"),ue=y("#wizProgress"),Xn=y("#wizTitle"),Xe=y("#wizLead"),Qe=y("#wizBody"),Ds=y("#wizFoot"),Bt=y("#wizBack"),pe=y("#wizNext"),T=null,C=0,Ce=!1,Ns=Qn(),Fs={update:()=>Ht()};function z(e){T=e,C=0,Ce=!1,er(e.tall===!0),Ut(),et()}function er(e){j.classList.toggle("sds-modal--lg",e),j.classList.toggle("sds-modal--md",!e)}function et(){j.open||j.showModal()}function U(){j.open&&j.close()}function F(){return j.open}function tt(){return j.open&&T!==null}function he(e){return j.addEventListener("close",e),()=>j.removeEventListener("close",e)}function nt(){return T===null?[]:T.steps.filter(e=>e.when===void 0||e.when())}function rt(){nt()[C]?.leave?.()}function Ut(){let e=nt(),t=e[C];t&&(Xn.textContent=t.heading,w(t.lead??c,Xe),Xe.hidden=t.lead===void 0,Js(e),w(c,Qe),t.enter(Qe,Fs),Ht(),window.setTimeout(()=>{S('input:not([type]), input[type="text"]',Qe)?.focus()},20))}function Js(e){ue.hidden=e.length<2,!(e.length<2)&&(ue.caption=e[C]?.label??"",ue.label=s("step.progress"),ue.max=e.length,ue.value=C+1)}function Ht(){let e=nt(),t=e[C];if(!t||T===null)return;let n=C===e.length-1;Dt({back:C===0?s("action.cancel"):s("action.back"),onBack:Ms,next:n?T.finishLabel():s("action.next"),onNext:tr}),pe.disabled=t.ready?.()===!1}function tr(){let e=nt(),t=e[C];if(!(!t||T===null||t.ready?.()===!1)){if(C>=e.length-1){let n=T;Ns.run(()=>n.finish(),()=>{T===n&&!Ce&&Ht()})&&(pe.disabled=!0);return}rt(),C+=1,Ut()}}function Ms(){if(C===0){U();return}rt(),C-=1,Ut()}Hs.addEventListener("submit",e=>{e.preventDefault(),T!==null&&tr()});j.addEventListener("close",()=>{rt(),T=null,Ce=!1});function Dt(e={}){Ds.hidden=e.back==null&&e.next==null,Bt.hidden=e.back==null,de(Bt,e.back??""),Bt.onclick=e.onBack??null,pe.hidden=e.next==null,de(pe,e.next??""),pe.disabled=!1,pe.onclick=e.onNext??null}function st(e,t=""){Ce||(Ce=!0,T===null&&er(!1)),rt(),T=null,ue.hidden=!0,Xn.textContent=e,w(t===""?c:t,Xe),Xe.hidden=t===""}function nr(e){w(e,Qe)}var E=class extends M{letGo=[];createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.letGo.push(ce(()=>this.requestUpdate())),this.letGo.push(he(()=>this.requestUpdate())),this.arrived()}disconnectedCallback(){for(let t of this.letGo)t();this.letGo=[],this.left(),super.disconnectedCallback()}shouldUpdate(){return!this.hasUpdated||!F()}drawNow(){this.requestUpdate(),this.performUpdate()}arrived(){}left(){}untilLeft(t){this.letGo.push(t)}};var Is=new Set(["worktree:add","worktree:fork"]);function rr(e,t){let n=new Set(t);return e.filter(r=>Is.has(r.command)&&r.subject!==""&&!n.has(r.subject))}function ot(e,t){return e.filter(n=>it([n.name,n.branch,n.database,n.url,...n.addresses.map(r=>r.url),n.php,n.base?.branch??"",n.tip?.subject??""].join(" "),t))}function sr(e,t){return e.filter(n=>it([n.name,n.tip?.subject??""].join(" "),t))}function it(e,t){let n=t.toLowerCase().split(/\s+/).filter(o=>o!==""),r=e.toLowerCase();return n.every(o=>r.includes(o))}function or(e,t){let n=r=>r.base===null?[0,""]:r.base.branch===t?[1,""]:[2,r.base.branch];return e.map((r,o)=>({worktree:r,at:o,rank:n(r)})).sort((r,o)=>r.rank[0]-o.rank[0]||r.rank[1].localeCompare(o.rank[1],void 0,{numeric:!0})||r.at-o.at).map(r=>r.worktree)}function L(){return a`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="spinner-circle" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${s("detail.loading")}</span>
        </p>`}function P(e=0,t=""){return a`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${t}"
        style="--sds-skeleton-delay: ${e%3*.12}s"></span>`}var lr=null,Ft=new Map,Nt=new Set,zs=300,Jt;function Mt(e){return e!==""&&!I(e)?s("error.branchName"):""}function dr(e){return e===l.branch||l.project?.branch===e||l.branches.some(t=>t.name===e)||l.worktrees.some(t=>t.branch===e)}function ir(e){return e!==""&&!I(e)?s("error.refName"):""}function ar(e){let t=Mt(e);return t!==""?t:e!==""&&dr(e)?s("error.branchExists",{branch:e}):""}function q(e,t=""){let n={mode:l.branches.length>0?"branch":"fork",branch:t,from:"",base:"",name:""},r=()=>n.name.trim()||Me(n.branch),o=()=>{let d=r();return d!==""&&d===l.projectName?s("preview.isProject",{name:d}):l.worktrees.some(u=>u.name===d)?s("preview.exists",{name:d}):""},i={tall:!0,steps:[qs(n),Gs(n),Ys(n,r,o)],finishLabel:()=>n.mode==="fork"?s("action.fork"):s("action.create"),finish:()=>Qs(n,r(),e)};z(i)}function qs(e){return{label:s("step.mode.label"),heading:s("step.mode.heading"),lead:s("step.mode.lead"),ready:()=>e.mode==="fork"||I(e.branch),enter(t,n){let r=l.branches.length>0;r||(e.mode="fork");let o=()=>{w(a`
                    <sds-radio
                        legend=${s("step.mode.heading")}
                        legend-said-only
                        name="createMode"
                        hint=${r?"":s("mode.branchNone")}
                        value=${e.mode}
                        .choices=${[...r?[{label:s("mode.branch"),value:"branch",hint:s("mode.branchHint")}]:[],{label:s("mode.fork"),value:"fork",hint:s("mode.forkHint")}]}
                        @sds-change=${i=>{e.mode=i.detail==="branch"?"branch":"fork",e.branch="",o()}}></sds-radio>
                    <div class="branchery-choice-detail" ?hidden=${e.mode!=="branch"}>
                        <div class="branchery-choice-find">
                            <sds-field
                                label=${s("field.branch")}
                                value=${e.branch===""?s("field.branchFilter"):e.branch}
                                ?filled=${e.branch!==""}
                                @sds-input=${i=>{e.branch=i.detail.trim(),o()}}></sds-field>
                            <span class="branchery-choice-count"
                                  >${s("overview.branches",{count:l.branches.length})}</span>
                        </div>
                        <div class="branchery-picklist">${Ks(e,o)}</div>
                        <sds-note tone="error" ?hidden=${Mt(e.branch)===""}
                                  body=${Mt(e.branch)}></sds-note>
                    </div>`,t),n.update()};o()}}}function Ks(e,t){let n=e.branch.toLowerCase(),r=l.branches.map(i=>i.name),o=r.includes(e.branch)?r:r.filter(i=>i.toLowerCase().includes(n));return o.length===0?a`<p class="branchery-picklist__empty">${s("step.branch.noMatch")}</p>`:o.map(i=>a`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(i===e.branch)}
                @click=${()=>{e.branch=i,t()}}>${i}</button>`)}function Gs(e){return{label:s("step.fork.label"),heading:s("step.fork.heading"),lead:s("step.fork.lead"),when:()=>e.mode==="fork",ready:()=>I(e.branch)&&!dr(e.branch)&&(e.base===""||I(e.base)),enter(t,n){let r=()=>{w(a`
                    ${""}
                    <sds-field
                        field-id="newBranch"
                        caption=${s("field.newBranch")}
                        value=${e.branch===""?s("field.newBranchPlaceholder"):e.branch}
                        ?filled=${e.branch!==""}
                        @sds-input=${o=>{e.branch=o.detail.trim(),r()}}></sds-field>
                    ${Vs(e)}
                    <sds-field
                        field-id="base"
                        caption=${s("field.base")}
                        hint=${s("field.baseHint")}
                        value=${e.base===""?s("field.basePlaceholder"):e.base}
                        ?filled=${e.base!==""}
                        @sds-input=${o=>{e.base=o.detail.trim(),r()}}></sds-field>
                    <sds-note tone="error" ?hidden=${ar(e.branch)===""}
                              body=${ar(e.branch)}></sds-note>
                    <sds-note tone="error" ?hidden=${ir(e.base)===""}
                              body=${ir(e.base)}></sds-note>`,t),n.update()};r()}}}function Vs(e){let t=document.createElement("sds-select");return t.caption=s("field.branchFrom"),t.options=[{label:s("field.branchFromProject",{branch:l.branch}),value:""},...l.worktrees.map(n=>({label:n.name,value:n.name}))],t.value=e.from,t.filled=!0,t.addEventListener("sds-change",n=>{e.from=n.detail}),t}function Ys(e,t,n){return{label:s("step.review.label"),heading:s("step.review.heading"),lead:s("step.review.lead"),ready:()=>t()!==""&&n()==="",enter(r,o){lr=i=>Re(e,t,n,r,o,i),ur(e,t(),()=>{S("#name")!==null&&Re(e,t,n,r,o)}),Re(e,t,n,r,o)},leave(){window.clearTimeout(Jt)}}}function cr(e,t){let n=e.mode==="fork";return JSON.stringify([e.mode,e.branch,n?e.from:"",n?e.base:"",t])}async function ur(e,t,n){let r=cr(e,t);if(Ft.get(r)!=null||Nt.has(r))return;Nt.add(r);let o=null;try{o=await f.preview({mode:e.mode,branch:e.branch,from:e.from,base:e.base,name:e.name})}catch{}finally{Nt.delete(r)}Ft.set(r,o),n()}function Zs(e,t,n,r,o){window.clearTimeout(Jt),Jt=window.setTimeout(()=>{ur(e,t(),()=>{S("#name")!==null&&Re(e,t,n,r,o)})},zs)}function Re(e,t,n,r,o,i=""){let d=e.mode==="fork"?l.worktrees.find(p=>p.name===e.from):void 0,u=s("preview.databaseCopy",{name:d?.database??l.project?.database??"db"}),h=i!==""?i:n(),g=Ft.get(cr(e,t())),m=g===void 0?P(2):g===null?d?d.php:s("preview.phpFromProject"):g.php??s("preview.phpRead",{file:g.readFrom??""});w(a`
        <div class="branchery-preview">
            <dl>
                <dt>${s("preview.branch")}</dt>
                <dd><code class="sds-mono">${e.branch}</code></dd>
                ${e.mode==="fork"&&e.base!==""?a`<dt>${s("preview.base")}</dt>
                              <dd><code class="sds-mono">${e.base}</code></dd>`:c}
                <dt>${s("preview.directory")}</dt>
                <dd><code class="sds-mono">.worktrees/${t()}</code></dd>
                <dt>${s("preview.address")}</dt>
                <dd><code class="sds-mono">https://${Me(t())}.${l.tld}</code></dd>
                <dt>${s("preview.database")}</dt>
                <dd>${u}</dd>
                <dt>${s("preview.php")}</dt>
                <dd>${m}</dd>
            </dl>
        </div>
        ${(g?.warnings??[]).map(p=>a`<sds-note tone="warn" body=${p}></sds-note>`)}
        <sds-field
            field-id="name"
            caption=${s("field.nameOverride")}
            hint=${s("field.namePlaceholder")}
            value=${e.name===""?Me(e.branch):e.name}
            ?filled=${e.name!==""}
            @sds-input=${p=>{e.name=p.detail.trim(),Re(e,t,n,r,o),Zs(e,t,n,r,o)}}></sds-field>
        ${h===""?c:a`<sds-note tone="error" body=${h}></sds-note>`}`,r),o.update()}async function Qs(e,t,n){let r=e.mode==="fork"?{mode:"fork",branch:e.branch,from:e.from,base:e.base,name:e.name}:{mode:"branch",branch:e.branch,name:e.name};try{let o=await f.createWorktree(r);n.onJob(o.job,t)}catch(o){W(o),S("#name")!==null&&lr?.(k(o))}}function at(e){return e.filter(t=>!t.isProject&&(t.merged||t.gone)&&t.changes===0)}function pr(e){return e.merged}function hr(e,t){let n=at(e),r=new Set(n.filter(pr).map(o=>o.name));z({tall:n.length>3,steps:[{label:s("tidy.step"),heading:s("tidy.heading"),lead:s("tidy.lead"),enter(o,i){w(a`
                    <sds-checkbox-group
                        legend=${s("tidy.heading")}
                        legend-said-only
                        name="tidy"
                        .choices=${n.map(d=>({label:d.name,value:d.name,hint:`${d.branch} \xB7 ${Xs(d)}`}))}
                        .values=${[...r]}
                        @sds-change=${d=>{r.clear();for(let u of d.detail)r.add(u);i.update()}}></sds-checkbox-group>`,o)},ready:()=>r.size>0}],finishLabel:()=>s("tidy.confirm",{count:r.size}),finish:()=>eo(n.filter(o=>r.has(o.name)),t)})}function Xs(e){return e.merged?s("tidy.why.merged"):s("tidy.why.gone")}async function eo(e,t){st(s("tidy.working"),s("tidy.workingLead",{count:e.length}));let n=await Promise.allSettled(e.map(i=>f.removeWorktree(i.name,i.gone))),r=[];n.forEach((i,d)=>{let u=e[d]?.name??"";i.status==="fulfilled"?r.push({job:i.value.job,name:u}):W(i.reason)});let o=r[0];if(o===void 0){U();return}t.onJob(o.job,o.name,"remove")}function mr(e){return{cells:[{value:a`<span class="branchery-list__title">${e.subject}</span>`,note:It(`${s("table.making")} \xB7 ${e.step?.label??jt(e.command)}`)},"","",""]}}function It(e){return a`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="spinner-circle"
                    aria-hidden="true"></sds-icon>${e}</span>`}function fr(e){let t=oe(e.name);return{cells:[{value:a`<a class="branchery-list__title" href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:gr(e)}`,note:t===void 0?$r(e):It(t)},io(e),e.php,to(e)]}}function to(e){return a`
        <span class="branchery-list__ways">
            ${""}
            <sds-button variant="secondary" size="sm" icon-only
                        href=${e.url} rel="external"
                        title=${s("table.openSiteAt",{host:re(e.url)})}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${$(s("table.view"),a`<sds-button variant="secondary" size="sm" href="#/w/${e.name}"
                        title=${s("table.viewOf",{name:e.name})}>${s("table.view")}</sds-button>`)}
        </span>`}function no(e){return e.split("_").map((t,n)=>n===0?a`${t}`:a`_<wbr>${t}`)}function gr(e){return a`${ro(e)}${so(e)}${e.stale?a` <sds-badge label=${s("table.staleMark")} tone="warn"></sds-badge>`:c}`}function ro(e){return e.ready?e.incomplete?a` <sds-badge label=${s("table.unfinished")} tone="warn"></sds-badge>`:c:a` <sds-badge label=${s("table.unbuilt")} tone="warn"></sds-badge>`}function so(e){return e.merged?a` <sds-badge label=${s("table.mergedMark")} tone="ok"></sds-badge>`:e.gone?a` <sds-badge label=${s("table.goneMark")} tone="warn"></sds-badge>`:c}function br(){let e=l.project;if(e===null)return l.loading?oo():c;let t=oe(e.name);return vr({name:a`<a class="branchery-checkout__name"
                      href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:gr(e)}`,meta:t===void 0?a`${$r(e)}${ao(e)}`:It(t),php:e.php,database:a`<code class="sds-mono">${no(e.database)}</code>`,address:a`<sds-link external href=${e.url} label=${re(e.url)}></sds-link>`})}function oo(){return vr({name:a`<span class="branchery-checkout__name">${P(0,"branchery-waiting__title")}</span>`,meta:P(1),php:P(0),database:P(1),address:P(2)})}function vr(e){return a`
        <div class="branchery-checkout">
            <p class="sds-label">${s("overview.checkout")}</p>
            <div class="branchery-checkout__body">
                <div class="branchery-checkout__what">
                    ${e.name}
                    <p class="branchery-checkout__meta">${e.meta}</p>
                </div>
                <dl class="sds-facts branchery-checkout__facts">
                    <dt>${s("table.php")}</dt>
                    <dd>${e.php}</dd>
                    <dt>${s("table.database")}</dt>
                    <dd>${e.database}</dd>
                    <dt>${s("table.address")}</dt>
                    <dd>${e.address}</dd>
                </dl>
            </div>
        </div>`}function yr(e){let t=!e.onRemote&&l.remotes.length>0;return a`${t?a`<span>${s("table.nowhere")}</span>`:c}${e.tip===null?c:a`<span
            class="branchery-list__tip">${e.tip.subject} · ${e.tip.sha}</span>`}`}function $r(e){return a`<span class="branchery-list__what">${e.branch}${e.tip===null?c:a` · ${e.tip.subject}`}</span>`}function io(e){let t=wr(e);return t.length===0?"":a`${t.map(n=>a`<span class="branchery-list__count">${n}</span>`)}`}function ao(e){let t=wr(e);return t.length===0?c:a`<span class="branchery-list__count">${t.join(" \xB7 ")}</span>`}function wr(e){let t=[];return e.changes>0&&t.push(s("table.changes",{count:e.changes})),e.ahead!==null&&e.ahead>0&&t.push(s("table.unpushed",{count:e.ahead})),e.behind!==null&&e.behind>0&&t.push(s("table.behind",{count:e.behind})),t}function _r(e){return xr(e)?{shown:"nothing"}:e.loading?{shown:"waiting"}:e.shown===0&&e.pending===0?{shown:"empty",because:e.filtered?"noMatch":"none"}:{shown:"rows"}}function Sr(e){return xr(e)?null:e.loading||e.total===0?{key:"nav.worktrees",params:{}}:e.filtered?{key:"overview.matching",params:{shown:e.shown,total:e.total}}:{key:"overview.worktrees",params:{count:e.total}}}function xr(e){return e.unreachable&&e.entries===0}var lo=6,kr=10,zt=class extends E{handlers;needle="";allBranches=!1;willUpdate(){l.loading||fo()}arrived(){window.addEventListener("keydown",this.reachedByKey),this.untilLeft(()=>window.removeEventListener("keydown",this.reachedByKey))}listState(t,n,r){return{unreachable:l.unreachable,loading:l.loading,entries:t.length,total:l.worktrees.length,shown:n,pending:r,filtered:this.needle.trim()!==""}}render(){let t=ho(),n=or(ot(l.worktrees,this.needle),l.project?.branch??l.branch);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${po(t)}
            ${this.tidyNote(t)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${uo()?P(0,"branchery-waiting__title"):co()}</h2>
                ${l.repository===null?c:a`<span class="sds-row sds-row__end">${N(l.repository,s("detail.repository"))}</span>`}
            </div>
            ${br()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${t.length+l.branches.length>=lo?this.field():c}
                <div class="branchery-section-actions">${this.actions()}</div>
            </div>
            ${this.listHead(t,n.length)}
            ${this.list(t,n)}
        </section>
        ${this.freeBranches()}
      </div>`}tidyNote(t){let n=at(t);return n.length===0||l.loading?c:a`
        <sds-note tone="info"
                  body=${s("tidy.note",{count:n.length,names:Tr(n)})}
                  action=${s("tidy.open")}
                  @sds-note-action=${()=>hr(t,this.handlers)}></sds-note>`}field(){return a`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${s("overview.filter")}
            value=${this.needle===""?s("overview.filterPlaceholder"):this.needle}
            ?filled=${this.needle!==""}
            @sds-input=${t=>this.narrow(t.detail)}
            @keydown=${t=>this.leaveOrOpen(t)}></sds-field>`}narrow(t){this.needle=t,this.requestUpdate()}leaveOrOpen(t){if(t.key==="Escape"){t.target instanceof HTMLElement&&t.target.blur(),this.narrow("");return}if(t.key==="Enter"){let n=ot(l.worktrees,this.needle)[0]??ot(l.project===null?[]:[l.project],this.needle)[0];n!==void 0&&(t.preventDefault(),Ze(`/w/${n.name}`))}}controls=null;actions(){let t=JSON.stringify([l.remotes,l.language]);if(this.controls?.key!==t){let n=this.buildFetch();this.controls={key:t,nodes:[...n===null?[]:[n],this.creating()]}}return this.controls.nodes}creating(){let t=x(s("nav.newWorktree"),"primary",()=>q(this.handlers));return t.title=`${s("nav.newWorktree")} (n)`,t}list(t,n){let r=rr(l.runningJobs,t.map(d=>d.name)).filter(d=>it(d.subject,this.needle)),o=_r(this.listState(t,n.length,r.length));if(o.shown==="nothing")return c;if(o.shown==="empty")return a`<p class="branchery-list__empty">${s(o.because==="noMatch"?"overview.noMatch":"table.empty")}</p>`;let i=o.shown==="waiting";return a`
        <sds-table
            ?loading=${i}
            loading-rows=${mo()}
            .columns=${[{head:s("table.worktree"),cls:"sds-td-name"},{head:s("table.outstanding"),cls:"sds-td-meta",align:"end",fit:!0},{head:s("table.php"),fit:!0},{head:"",cls:"sds-td-into"}]}
            .rows=${i?[]:[...r.map(mr),...n.map(fr)]}></sds-table>`}listHead(t,n){let r=Sr(this.listState(t,n,0));return r===null?c:a`<h2 class="sds-h3">${s(r.key,r.params)}</h2>`}freeBranches(){if(l.loading||l.branches.length===0)return c;let t=sr(l.branches,this.needle);if(t.length===0)return c;let n=t.length-kr,r=this.allBranches||n<=0?t:t.slice(0,kr);return a`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${this.needle.trim()===""?s("overview.branches",{count:l.branches.length}):s("overview.branchesMatching",{shown:t.length,total:l.branches.length})}</h2>
            <sds-table
                .columns=${[{head:s("table.branch"),cls:"sds-td-name"},{head:s("table.when"),cls:"sds-td-meta",fit:!0},{head:"",cls:"sds-td-into"}]}
                .rows=${r.map(o=>this.branchRow(o))}></sds-table>
            ${this.allBranches||n<=0?c:a`
                <p class="branchery-branches__more">
                    ${$(s("overview.showAllBranches",{count:n}),a`<sds-button variant="ghost" @click=${()=>{this.allBranches=!0,this.requestUpdate()}}
                        >${s("overview.showAllBranches",{count:n})}</sds-button>`)}
                </p>`}
        </section>`}branchRow(t){return{cells:[{value:a`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(t.name)}">${t.name}</a>`,note:yr(t)},R(t.when,l.language),a`${$(s("nav.newWorktree"),a`<sds-button variant="ghost" size="sm"
                             title=${s("table.worktreeOf",{branch:t.name})}
                             @click=${()=>q(this.handlers,t.name)}
                    >${s("nav.newWorktree")}</sds-button>`)}`]}}buildFetch(){let t=l.remotes,n=t[0];if(n===void 0)return null;if(t.length===1)return x(s("nav.fetch",{remote:n}),"ghost",()=>{this.startFetch(n)});let r=document.createElement("sds-dropdown");return r.label=s("nav.fetchFrom"),r.variant="ghost",r.align="end",r.choices=t.map(o=>({label:o})),r.addEventListener("sds-dropdown-choose",o=>{let i=t[o.detail.index];i!==void 0&&this.startFetch(i)}),r}async startFetch(t){try{let n=await f.fetch(t);B(""),this.handlers.onJob(n.job,null,"fetch")}catch(n){W(n)}}reachedByKey=t=>{if(t.altKey||t.ctrlKey||t.metaKey||t.defaultPrevented)return;let n=t.target;if(!(n instanceof Element&&n.closest("input, textarea, select, [contenteditable], dialog[open]"))){if(t.key==="/"){let r=S("#filter");r&&(t.preventDefault(),r.focus(),r.select());return}t.key==="n"&&S(".branchery-section-actions")!==null&&(t.preventDefault(),q(this.handlers))}}};customElements.define("branchery-overview",zt);function co(){return l.repository!==null?En(l.repository):l.projectName===""?s("nav.worktrees"):l.projectName}function uo(){return l.loading&&l.repository===null&&l.projectName===""}function po(e){let t=e.filter(n=>n.incomplete&&oe(n.name)===void 0);return t.length===0||l.loading?c:a`
        <sds-note tone="warn"
                  body=${s("overview.unfinished",{count:t.length,names:Tr(t)})}></sds-note>`}function Tr(e){return e.map(t=>t.name).join(", ")}function ho(){return l.project?[l.project,...l.worktrees]:l.worktrees}var Cr="branchery-rows";function mo(){let e=l.worktrees.length;if(e>0)return e;let t=Number(qe(Cr));return Number.isFinite(t)&&t>0?t:1}function fo(){Ke(Cr,String(l.worktrees.length))}function me(e,t){return async(n,r,o)=>{let i=null,d="";try{i=await n()}catch(u){d=e(u)}r()&&(o(i,d),t())}}function K(){let e="",t=null,n="",r=o=>e===o;return{about(o){return e!==o?(e=o,t=null,n="",!0):t===null&&n===""},of:o=>r(o)?t:null,stillOn:r,trouble:o=>r(o)?n:"",put(o,i){r(o)&&(t=i,n="")},failed(o,i){r(o)&&(t=null,n=i)},forget(o){r(o)&&(e="",t=null,n="")},clear(){e="",t=null,n=""}}}async function G(e,t,n,r){await r(n,()=>e.stillOn(t),(o,i)=>{if(o===null){e.failed(t,i);return}e.put(t,o)})}function J(e,t){return a`
        <div class="sds-row branchery-back">
            ${$(e,a`<sds-button variant="ghost" href=${t}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${e}</sds-button>`)}
        </div>`}var go=new Intl.Collator("en",{numeric:!0});function bo(e,t){let n=e.split("/"),r=t.split("/");for(let o=0;o<Math.min(n.length,r.length);o++){let i=o===n.length-1,d=o===r.length-1;if(i!==d)return i?1:-1;let u=go.compare(n[o]??"",r[o]??"");if(u!==0)return u}return 0}function Rr(e){return[...e].sort((t,n)=>bo(t.path,n.path))}function Er(e,t){return a`
        <div class="branchery-image">
            ${Ar(t.before,s("detail.imageBefore"),s("detail.imageBeforeAlt",{path:e}))}
            ${Ar(t.after,s("detail.imageAfter"),s("detail.imageAfterAlt",{path:e}))}
        </div>`}function Ar(e,t,n){return a`
        <figure class="branchery-image__side">
            <div class="branchery-image__frame">
                ${e===null?a`<span class="branchery-image__nothing">${s("detail.imageNothing")}</span>`:a`<img class="branchery-image__of" src=${e.source} alt=${n}>`}
            </div>
            <figcaption class="branchery-image__caption">
                ${t}
                ${e===null?"":a`<span class="branchery-image__bytes">${le(e.bytes,l.language)}</span>`}
            </figcaption>
        </figure>`}var Pr=25;function lt(e){let t=Rr(e.files),n=t.length-Pr,r=e.all||n<=0?t:t.slice(0,Pr);return a`
        <ul class="branchery-changes">
            ${r.map(o=>{let i=e.diffs.get(o.path),d=i?.open===!0;return a`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${d}
                                @click=${()=>e.press(o.path)}>
                            <sds-badge label=${s(`change.${o.status}`)}
                                       tone=${o.status==="deleted"?"warn":c}></sds-badge>
                            ${vo(o.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${d?"actions-chevron-down":"actions-chevron-end"}></sds-icon>
                        </button>
                        ${d?yo(i):c}
                    </li>`})}
        </ul>
        ${e.all||n<=0?c:a`
            <p class="branchery-changes__more">
                ${$(s("detail.showAllFiles",{count:n}),a`<sds-button variant="ghost" @click=${e.showAll}>${s("detail.showAllFiles",{count:n})}</sds-button>`)}
            </p>`}`}function vo(e){let t=e.lastIndexOf("/"),n=t<0?"":e.slice(0,t),r=t<0?e:e.slice(t);return a`<code class="sds-mono branchery-changes__path" title=${e}>${n===""?c:a`<span class="branchery-changes__dir">${n}</span>`}<span class="branchery-changes__name">${r}</span></code>`}function yo(e){return e===void 0||e.read===null&&e.trouble===""?L():e.read===null?a`<sds-note tone="warn" body=${`${s("detail.changeFailed")} ${e.trouble}`}></sds-note>`:e.read.image!==null?Er(e.read.path,e.read.image):a`
        <sds-diff path=${e.read.path} .body=${e.read.lines}></sds-diff>
        ${e.read.truncated?a`<p class="branchery-changes__more">${s("detail.changeTruncated")}</p>`:c}`}function dt(e,t,n){let r=e.get(t)??{read:null,trouble:"",open:!1};r.open=!r.open,e.set(t,r),r.open&&r.read===null&&n()}function ct(e,t,n,r){let o=e.get(t);o!==void 0&&e.set(t,{...o,read:n,trouble:r})}function Ae(e,t){return`${e}${t}`}var qt=class extends E{name="";sha="";branch="";read=K();diffs=new Map;all=!1;reading=me(k,()=>this.requestUpdate());get of(){return this.branch===""?this.name:l.projectName}willUpdate(){let t=this.of;this.read.about(Ae(t,this.sha))&&(this.diffs=new Map,this.all=!1,this.readCommit(t,this.sha))}render(){let t=this.of,n=this.read.of(Ae(t,this.sha));return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${this.branch===""?J(this.name,`#/w/${encodeURIComponent(this.name)}`):J(this.branch,`#/b/${encodeURIComponent(this.branch)}`)}
            ${n===null?this.beforeTheAnswer(t,this.sha):$o(t,n,this.branch)}
        </section>
        ${n===null?c:this.touched(t,n)}
      </div>`}beforeTheAnswer(t,n){let r=this.read.trouble(Ae(t,n));return a`
        <h1 class="sds-h2"><span class="sds-mono">${n}</span></h1>
        ${r===""?L():a`<sds-note tone="warn" body=${`${s("detail.commitFailed")} ${r}`}></sds-note>`}`}touched(t,n){return a`
        <section class="sds-band sds-band--quiet">
            ${""}
            <h2 class="sds-h3">${n.files.length===0?s("detail.touchedNothingHeading"):s("detail.touched",{count:n.files.length})}</h2>
            ${n.files.length===0?a`<p class="branchery-list__quiet">${s("detail.touchedNothing")}</p>`:lt({files:n.files,diffs:this.diffs,press:r=>this.toggleDiff(t,n.sha,r),all:this.all,showAll:()=>{this.all=!0,this.requestUpdate()}})}
        </section>`}toggleDiff(t,n,r){dt(this.diffs,r,()=>{this.readDiff(t,n,r)}),this.requestUpdate()}stillReading(t,n){return this.read.stillOn(Ae(t,n))}async readCommit(t,n){await G(this.read,Ae(t,n),()=>f.commit(t,n),this.reading)}async readDiff(t,n,r){await this.reading(()=>f.commitDiff(t,n,r),()=>this.stillReading(t,n)&&this.diffs.has(r),(o,i)=>ct(this.diffs,r,o,i))}};customElements.define("branchery-commit",qt);function $o(e,t,n){return a`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${t.subject}
                ${t.pushed?c:a`<sds-badge label=${s("detail.notPushed")} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${t.url===null?c:a`${N(t.url,s("detail.commitAtForge"))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${s("table.author")}</dt>
            <dd>${t.author}</dd>
            <dt>${s("table.when")}</dt>
            <dd>${R(t.when,l.language)}</dd>
            <dt>${s("table.commit")}</dt>
            ${""}
            <dd><sds-copy value=${t.id} label=${s("table.commit")}></sds-copy></dd>
            ${t.parents.length===0?c:a`
                <dt>${s("detail.parents")}</dt>
                ${""}
                <dd>${t.parents.map((r,o)=>a`${o===0?c:" \xB7 "}<sds-link
                    href=${n===""?`#/w/${encodeURIComponent(e)}/c/${r}`:`#/b/${encodeURIComponent(n)}/c/${r}`} label=${r}></sds-link>`)}</dd>`}
        </dl>
        ${t.body===""?c:a`<pre class="branchery-message">${t.body}</pre>`}`}function fe(e){return e.madeFor!==null&&e.madeFor!==e.branch}function Wr(e){return e.ownsBranch&&!fe(e)}function jr(e){return{doing:[...So(e),..._o],undoing:xo(e),beside:wo(e)}}function wo(e){return e.account===null?[]:[{action:"account",held:null}]}var _o=[{action:"edit",held:null},{action:"rebuild",held:null}];function So(e){return fe(e)?[{action:"restore",held:null}]:e.behind===null?[]:[{action:"pull",held:e.behind===0?"detail.pullBlocked":null}]}function xo(e){return[...(e.ahead??0)>0?[{action:"discard",held:e.changes>0?"detail.discardBlocked":null}]:[],{action:"remove",held:null}]}function Lr(e){let t={php:e.php},n=()=>{let o=[];return t.php!==e.php&&o.push({label:s("table.php"),value:t.php,note:s("edit.effect.php")}),o},r={steps:[ko(e,t),To(e,n)],finishLabel:()=>s("action.apply"),finish:()=>Co(e,t)};z(r)}function ko(e,t){return{label:s("table.php"),heading:s("edit.step.php.heading",{name:e.name}),lead:s("edit.step.php.lead"),ready:()=>t.php!==e.php,enter(n,r){let o=l.phpVersions.filter(i=>i===e.php||e.minPhp===null||An(i,e.minPhp)>=0);w(a`${ze(o.map(i=>({value:i,label:i,...i===e.php?{hint:s("edit.current")}:{}})),t.php,i=>{t.php=i,r.update()},s("table.php"))}`,n)}}}function To(e,t){return{label:s("step.review.label"),heading:s("edit.step.review.heading",{name:e.name}),lead:s("step.review.lead"),enter(n){w(a`
                <div class="branchery-preview">
                    <dl>
                        ${t().map(r=>a`
                            <dt>${r.label}</dt>
                            <dd>${r.value}<span class="branchery-preview__note">${r.note}</span></dd>`)}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,n)}}}async function Co(e,t){try{t.php!==e.php&&await f.updateWorktree(e.name,{php:t.php}),B(""),await A(),U()}catch(n){W(n);let r=S("#editError");r!==null&&(r.body=k(n),r.hidden=!1)}}var Ro=10;function Or(){return[{head:"",cls:"sds-td-graph"},{head:s("table.subject")},{head:s("table.when"),cls:"sds-td-meta",align:"end",fit:!0},{head:s("table.author"),fit:!0},{head:s("table.commit"),cls:"sds-td-name",fit:!0}]}function Ao(){return a`<sds-table scrollable loading loading-rows=${Ro} .columns=${Or()}></sds-table>`}function Eo(e,t){return e.commits.length===0?c:a`<sds-table
        scrollable
        .columns=${Or()}
        .rows=${e.commits.map((n,r)=>{let o=!n.own&&(r===0||e.commits[r-1]?.own===!0),i=a`${n.pushed?c:a`<sds-badge label=${s("detail.notPushed")} tone="warn"></sds-badge> `}${o&&e.base!==null?a`<sds-badge label=${e.base} tone="neutral"></sds-badge> `:c}<span
                    class=${n.own?"branchery-subject":"branchery-subject branchery-subject--base"}><sds-link
                    href=${t(n.sha)}
                    label=${n.subject}></sds-link></span>`;return{cells:[Po(r===0?"current":""),r===0?a`<strong>${i}</strong>`:i,R(n.when,l.language),n.author,n.url===null?a`<code class="sds-mono">${n.sha}</code>`:a`<sds-link external href=${n.url} label=${n.sha}></sds-link>`]}})}></sds-table>`}function Po(e){return a`<span class="sds-graph${e===""?"":` sds-graph--${e}`}"></span>`}function Wo(e,t,n,r){return!e.more&&t===""?c:a`
        <p class="branchery-changes__more">
            ${t===""?c:a`<sds-note tone="warn" body=${`${s("detail.commitsFailed")} ${t}`}></sds-note>`}
            ${e.more?n?$(s("detail.loading"),a`<sds-button variant="ghost" disabled>${s("detail.loading")}</sds-button>`):$(s("detail.olderCommits"),a`<sds-button variant="ghost" @click=${r}>${s("detail.olderCommits")}</sds-button>`):c}
        </p>`}function ut(e,t,n){let r=Kt("");async function o(i,d){d>0&&r.name===i&&(r={...r,reading:!0,trouble:""},n()),await t(()=>e(i,d),()=>r.name===i,(u,h)=>{let g=d>0?r.commits?.commits??[]:[];r={name:i,commits:u===null?r.commits:{...u,commits:[...g,...u.commits]},trouble:h,reading:!1}})}return{about(i){r.name!==i&&(r=Kt(i),o(i,0))},of:i=>r.name===i?r.commits:null,trouble:i=>r.name===i&&r.commits===null&&r.trouble!==""?`${s("detail.commitsFailed")} ${r.trouble}`:"",body(i,d){let u=r.name===i?r.commits:null;return u===null?Ao():a`${Eo(u,d)}
                ${Wo(u,r.trouble,r.reading,()=>{o(i,u.commits.length)})}`},forget(i){r.name===i&&(r=Kt(""))}}}function Kt(e){return{name:e,commits:null,trouble:"",reading:!1}}function pt(e){return e.facts.length===0?c:a`
        <div class="sds-facts-group">
            <p class="sds-label">${e.title}</p>
            <dl class="sds-facts">${e.facts.map(jo)}</dl>
            ${e.press??c}
        </div>`}function jo(e,t){let n=[...e.link===void 0?[]:[$(e.link.label,a`${N(e.link.href,e.link.label)}`)],...(e.opens??[]).map(r=>$(r.label,a`${Pn(r.href,r.label)}`))];return a`
        <dt>${e.label}</dt>
        <dd class=${n.length===0?c:"branchery-fact"}>${e.waiting===!0?P(t):e.copy===!0?a`<sds-copy value=${e.value} label=${e.label}></sds-copy>`:e.said===!0?e.value:a`<code class="sds-mono">${e.value}</code>`}${n.length===0?c:a`<span class="branchery-fact__ways">${n}</span>`}</dd>`}function ht(e){return[e.own>0?s("detail.ownCommits",{count:e.own}):s("detail.ownNone"),...e.moved>0?[s("table.baseMoved",{base:e.branch,count:e.moved})]:[]].join(" \xB7 ")}function Br(e,t,n=null){return[{title:s("detail.repository"),facts:[{label:s("table.branch"),value:e.branch},...fe(e)?[{label:s("detail.madeFor"),value:e.madeFor??""}]:[],...e.base!==null?[{label:s("detail.base"),value:e.forkedAt!==null&&e.forkedFrom===e.base.branch?`${e.base.branch} @ ${e.forkedAt.slice(0,11)}`:e.base.branch},{label:s("detail.sinceBase"),value:ht(e.base),said:!0}]:[],{label:s("detail.commits"),value:Oo(e),said:!0},{label:s("detail.changes"),value:e.changes>0?s("table.changes",{count:e.changes}):s("detail.clean"),said:!0},...e.builtAt===null?[]:[{label:s("detail.built"),value:R(e.builtAt,l.language),said:!0}]]},{title:s("table.address"),facts:[{label:s("detail.site"),value:re(e.url),copy:!0,link:{href:e.url,label:s("table.openSite")}},...e.entrypoints.map(r=>({label:r.name,value:re(r.url),copy:!0,link:{href:r.url,label:s("detail.openAt",{name:r.name})}})),...e.addresses.map(r=>({label:r.label,value:re(r.url),copy:!0,link:{href:r.url,label:s("detail.openAt",{name:r.label})}}))]},{title:s("detail.serving"),facts:[{label:s("table.php"),value:e.php+(e.minPhp!==null&&e.minPhp!==e.php?` (${s("detail.minPhp",{version:e.minPhp})})`:"")},...e.node===null?[]:[{label:s("table.node"),value:e.node}],{label:s("table.profile"),value:e.profile??s("table.noProfile")},{label:s("table.docroot"),value:e.docroot===""?"/":e.docroot}]},{title:s("detail.taken"),press:e.account===null?null:n,facts:[{label:s("table.directory"),value:e.path,copy:!0,opens:e.editors.map(r=>({href:r.url,label:s("detail.editor",{name:r.name})}))},{label:s("table.database"),value:e.database,copy:!0},...e.account?.made===!0?[{label:s("detail.user"),value:e.account.user,copy:!0},{label:s("detail.password"),value:e.account.password,copy:!0}]:[],...e.account!==null&&!e.account.made?[{label:s("detail.user"),value:s("detail.accountMissing"),said:!0}]:[]]},...e.isProject?[]:[Lo(t)]]}function Lo(e){return e.trouble!==""?{title:s("detail.storage"),facts:[{label:s("detail.storageTotal"),value:`${s("detail.storageFailed")} ${e.trouble}`,said:!0}]}:e.value===null?{title:s("detail.storage"),facts:[{label:s("detail.storageTotal"),value:"",waiting:!0},{label:s("detail.storageFiles"),value:"",waiting:!0},{label:s("detail.storageDatabase"),value:"",waiting:!0},{label:s("detail.storageShared"),value:s("detail.storageExcluded"),said:!0}]}:{title:s("detail.storage"),facts:[{label:s("detail.storageTotal"),value:le(e.value.total,l.language),said:!0},{label:s("detail.storageFiles"),value:le(e.value.files,l.language),said:!0},{label:s("detail.storageDatabase"),value:le(e.value.database,l.language),said:!0},{label:s("detail.storageShared"),value:s("detail.storageExcluded"),said:!0}]}}function Oo(e){if(e.gone)return s("table.gone");if(e.ahead===null||e.behind===null)return s("detail.noRemote");let t=[...e.ahead>0?[s("table.unpushed",{count:e.ahead})]:[],...e.behind>0?[s("table.behind",{count:e.behind})]:[]];return t.length===0?s("detail.inStep"):t.join(" \xB7 ")}var V=y("#changes"),Gt="";function Ur(){return Gt}function Hr(e,t,n){Gt=e,V.heading=t,V.body=n,V.actions=[a`${$(s("action.close"),a`<sds-button variant="ghost" @click=${()=>V.close()}>${s("action.close")}</sds-button>`)}`],V.show()}function Dr(){V.close()}function Nr(e){let t=()=>{Gt="",e()};return V.addEventListener("sds-dialog-cancel",t),()=>V.removeEventListener("sds-dialog-cancel",t)}var ge=y("#confirm");function Vt(e){return ge.heading=e.title,ge.body=Bo(e),ge.confirmLabel=e.confirmLabel,ge.cancelLabel=s("action.cancel"),ge.tone=e.tone??"primary",ge.ask()}function Bo(e){return a`
        <p>${e.message}</p>
        ${e.warning===void 0?c:a`<sds-note tone="warn" body=${e.warning}></sds-note>`}
        ${e.facts===void 0||e.facts.length===0?c:a`
            <div class="branchery-preview">
                <dl>${e.facts.map(t=>a`
                    <dt>${t.label}</dt>
                    <dd><code class="sds-mono">${t.value}</code></dd>`)}</dl>
            </div>`}`}async function Fr(e,t){await ie(()=>f.syncWorktree(e.name),e.name,"sync",t)}function Uo(e,t){return[...t&&e.ahead===null?[s("confirm.worktree.nowhere")]:[],...t&&e.ahead!==null&&e.ahead>0?[s("confirm.worktree.unpushed",{count:e.ahead})]:[],...e.changes>0?[s("confirm.worktree.changes",{count:e.changes})]:[]]}async function Jr(e,t,n){let r=n;if(r===null)try{r=await f.commits(e.name)}catch(u){W(u);return}let o=r.commits.filter(u=>!u.pushed),i=r.upstream??e.branch;await Vt({title:s("confirm.discard.title"),message:s("confirm.discard.body",{upstream:i}),...(e.behind??0)>0?{warning:s("confirm.discard.behind",{count:e.behind??0})}:{},facts:o.map(u=>({label:u.sha,value:u.subject})),confirmLabel:s("action.discard"),tone:"danger"})&&await ie(()=>f.discardWorktree(e.name),e.name,"discard",t)}async function Mr(e,t){await ie(()=>f.restoreWorktree(e.name),e.name,"restore",t)}async function Ir(e,t){await ie(()=>f.pullWorktree(e.name),e.name,"pull",t)}async function zr(e,t){await ie(()=>f.accountWorktree(e.name),e.name,"account",t)}async function qr(e,t,n){await ie(()=>f.provisionWorktree(e,t),e,"create",n)}async function Kr(e,t){let n=Wr(e),r=Uo(e,n);await Vt({title:s("confirm.worktree.title"),message:n?s("confirm.worktree.body"):`${s("confirm.worktree.body")} ${Ho(e)}`,...r.length>0?{warning:r.join(" ")}:{},facts:[{label:s("table.worktree"),value:e.name},...n?[{label:s("table.branch"),value:e.branch}]:[],{label:s("table.database"),value:e.database}],confirmLabel:s("action.remove"),tone:"danger"})&&await ie(()=>f.removeWorktree(e.name,r.length>0),null,"remove",t)&&Ze("/")}function Ho(e){return fe(e)?s("confirm.worktree.keptWandered",{branch:e.branch,madeFor:e.madeFor??""}):s("confirm.worktree.kept",{branch:e.branch})}async function ie(e,t,n,r){try{let o=await e();return B(""),r.onJob(o.job,t,n),!0}catch(o){return W(o),await A(),!1}}var Do=["keep","fresh","data"];function mt(e,t){let n={choice:"keep"},r={steps:[No(e,n)],finishLabel:()=>s(`rebuild.${n.choice}`),finish:()=>t(n.choice==="data"?{built:!1}:{built:!0,fresh:n.choice==="fresh"})};z(r)}function No(e,t){return{label:s("rebuild.legend"),heading:s("rebuild.heading",{name:e.name}),lead:s("rebuild.lead"),enter(n,r){w(a`${ze(Do.map(o=>({value:o,label:s(`rebuild.${o}`),hint:s(`rebuild.${o}Hint`)})),t.choice,o=>{t.choice=o,r.update()},s("rebuild.legend"))}`,n)}}}var ft={log:"",size:0,steps:[]};function gt(e,t){let n=new Map(e.steps.map(r=>[r.no,r.output]));return{log:t.partial?e.log+t.log:t.log,size:t.size,steps:t.steps.map(r=>({...r,output:r.output??n.get(r.no)??""}))}}function Vr(e){switch(e){case"running":return"job.running";case"done":return"job.done";case"failed":return"job.failed";default:return"job.unknown"}}function Yt(e){return e==="done"}function bt(e){let t=e.trim().split(`
`).reverse().find(n=>n.startsWith(Gr));return t===void 0?"":t.slice(Gr.length).trim()}var Gr="\u2717";function Yr(e,t,n,r){let o=K(),i=new Map,d=new Set;async function u(m){if(!d.has(m)){d.add(m);try{let p=await t(m),v=p.status==="unknown"&&p.steps.length===0;i.set(m,{steps:Ie(gt(ft,p).steps),trouble:v?s("detail.noLog"):"",settled:!0,stopped:Fo(p)})}catch(p){i.set(m,{steps:[],trouble:`${s("detail.logFailed")} ${k(p)}`,settled:!1,stopped:null})}finally{d.delete(m)}r()}}function h(m,p){let v=m.target;!(v instanceof Element)||!v.closest(".sds-run__head")||i.get(p)?.settled===!0||u(p)}function g(m){let p=i.get(m.id),v=`${R(m.started,l.language)} \xB7 ${ke(m.elapsed)}`;return a`
        <sds-run
            heading=${Ge(m.command)}
            verdict=${m.status}
            note=${p!==void 0&&p.trouble!==""?`${v} \xB7 ${p.trouble}`:v}
            .stateWords=${Ve()}
            .steps=${p?.steps??[]}
            @click=${O=>h(O,m.id)}></sds-run>`}return{about(m){o.about(m)&&(i.clear(),G(o,m,()=>e(m),n))},forget(m){o.stillOn(m)&&(o.forget(m),i.clear())},draw(m){let p=o.trouble(m);if(p!=="")return a`<sds-note tone="warn" body=${`${s("detail.historyFailed")} ${p}`}></sds-note>`;let v=o.of(m);return v===null?L():v.length===0?a`<p class="branchery-list__quiet">${s("detail.noHistory")}</p>`:a`<div class="branchery-history">${v.map(g)}</div>`},lastFailed:m=>o.of(m)?.find(p=>p.status==="failed")??null,stoppedIn:m=>i.get(m)?.stopped??null,holds:m=>i.has(m),read:m=>{u(m)}}}function Fo(e){let t=e.steps.find(n=>n.state==="failed");return e.status!=="failed"||t===void 0?null:{no:t.no,step:t.label,reason:bt(e.log)}}function vt(e){return{name:e,count:0,list:{read:null,trouble:"",open:!1},all:!1,diffs:new Map}}var Qt=class extends E{name="";handlers;usage=K();files=vt("");reading=me(k,()=>this.requestUpdate());log=ut((t,n)=>f.commits(t,n),this.reading,()=>this.requestUpdate());past=Yr(t=>f.worktreeJobs(t),t=>f.job(t),this.reading,()=>this.requestUpdate());bar=null;arrived(){this.untilLeft(Nr(()=>{this.files.list.open=!1,this.requestUpdate()})),this.untilLeft(Zn(t=>this.operationEnded(t)))}left(){Dr()}operationEnded(t){if(this.past.forget(t),this.log.forget(t),this.files.name===t){let n=Ur()===t;this.files=vt(n?t:""),n&&(this.files.list.open=!0,this.readChanges(t))}this.usage.forget(t),this.name===t&&this.requestUpdate()}get worktree(){return Zr(this.name)}willUpdate(){let t=this.name,n=this.worktree;this.past.about(t);let r=n?.incomplete===!0?this.past.lastFailed(t):null;r!==null&&!this.past.holds(r.id)&&this.past.read(r.id),n!==null&&(this.log.about(t),this.watchChanges(n)),n!==null&&!n.isProject&&this.usage.about(t)&&this.readUsage(t)}render(){let t=this.worktree;return t===null?Jo(this.name):this.page(t)}updated(){this.files.name===this.name&&this.files.list.open&&Hr(this.name,s("table.uncommitted"),this.changeList(this.name))}page(t){let n=oe(t.name);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${J(s("detail.back"),"#/")}
            ${""}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${t.name}</span>
                    ${t.ready?t.incomplete?a`<sds-badge label=${s("table.unfinished")} tone="warn"></sds-badge>`:c:a`<sds-badge label=${s("table.unbuilt")} tone="warn"></sds-badge>`}
                </h1>
                <span class="sds-row sds-row__end">
                    ${""}
                    ${t.isProject?Zt(l.repository,s("detail.repository")):c}
                    ${Zt(t.review,s("detail.review"))}
                    ${Zt(t.issue,t.issueId===null?s("detail.issue"):s("detail.issueNumber",{id:t.issueId}))}
                </span>
            </div>
            ${t.isProject?c:this.actionBar(t,n!==void 0)}
            ${n!==void 0?Mo(n):c}
            ${t.incomplete&&n===void 0?this.unfinishedNote(t):c}
            ${t.stale&&n===void 0?this.staleNote(t):c}
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${s("detail.settled")}</h2>
            <div class="sds-facts-set">${Br(t,{value:this.usage.of(t.name),trouble:this.usage.trouble(t.name)},this.bar?.beside[0]??null).map(pt)}</div>
        </section>

        ${this.commitList(t)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${s("detail.history")}</h2>
            ${this.past.draw(t.name)}
        </section>
      </div>`}commitList(t){let n=this.log.of(t.name),r=this.log.trouble(t.name);return r!==""?a`
            <section class="sds-band">
                <h2 class="sds-h3">${s("detail.commitsHeading")}</h2>
                <sds-note tone="warn" body=${r}></sds-note>
            </section>`:n!==null&&n.commits.length===0&&t.changes===0?c:a`
        <section class="sds-band">
            <h2 class="sds-h3">${s("detail.commitsHeading")}</h2>
            ${t.changes===0?c:a`
                <p class="branchery-uncommitted">
                    <strong>${s("table.uncommitted")}
                        <span class="sds-warn">${s("table.files",{count:t.changes})}</span></strong>
                    ${this.showFiles(t.name)}
                </p>`}
            ${this.log.body(t.name,o=>`#/w/${encodeURIComponent(t.name)}/c/${o}`)}
        </section>`}showFiles(t){return a` ${$(s("detail.showFiles"),a`<sds-button variant="ghost" @click=${()=>this.openFiles(t)}>${s("detail.showFiles")}</sds-button>`)}`}openFiles(t){this.files.name!==t&&(this.files=vt(t)),this.files.list.open=!0,this.files.list.read===null&&this.readChanges(t),this.requestUpdate()}toggleDiff(t,n){this.files.name===t&&(dt(this.files.diffs,n,()=>{this.readDiff(t,n)}),this.requestUpdate())}changeList(t){let n=this.files.list;return n.trouble!==""?a`<sds-note tone="warn" body=${`${s("detail.changesFailed")} ${n.trouble}`}></sds-note>`:n.read===null?L():n.read.length===0?a`<p class="branchery-list__quiet">${s("detail.nothingUncommitted")}</p>`:lt({files:n.read,diffs:this.files.diffs,press:r=>this.toggleDiff(t,r),all:this.files.all,showAll:()=>{this.files.all=!0,this.requestUpdate()}})}watchChanges(t){if(!(this.files.name!==t.name||this.files.count===t.changes)){if(!this.files.list.open){this.files=vt("");return}this.readChanges(t.name);for(let[n,r]of this.files.diffs)r.open&&this.readDiff(t.name,n)}}async readChanges(t){this.files.count=Zr(t)?.changes??0,await this.reading(async()=>(await f.changes(t)).changes,()=>this.files.name===t,(n,r)=>{this.files.list={...this.files.list,read:n,trouble:r}})}async readDiff(t,n){await this.reading(()=>f.changeDiff(t,n),()=>this.files.name===t&&this.files.diffs.has(n),(r,o)=>ct(this.files.diffs,n,r,o))}staleNote(t){return a`
        <sds-note
            tone="warn"
            heading=${s("detail.staleHeading")}
            body=${s("detail.stale")}
            action=${s("table.provision")}
            @sds-note-action=${()=>mt(t,n=>this.rebuild(t,n))}></sds-note>`}unfinishedNote(t){let n=this.past.lastFailed(t.name),r=n===null?null:this.past.stoppedIn(n.id);return a`
        <sds-note
            tone="warn"
            heading=${s("detail.unfinishedHeading")}
            body=${r===null?s("detail.unfinished"):s("detail.unfinishedAt",{no:r.no,step:r.step,reason:r.reason})}
            action=${s("table.provision")}
            @sds-note-action=${()=>mt(t,o=>this.rebuild(t,o))}></sds-note>`}actionBar(t,n){let r=JSON.stringify([t,l.language]);this.bar?.key!==r&&(this.bar={key:r,...this.buildBar(t)});for(let d of[...this.bar.doing,...this.bar.undoing,...this.bar.beside])d.disabled=n||this.bar.held.has(d);let{doing:o,undoing:i}=this.bar;return a`
        <section class="sds-actions">
            ${""}
            <h2 class="sds-said-only">${s("detail.actions")}</h2>
            ${o}
            ${""}
            <span class="sds-row sds-row__end">${i}</span>
        </section>`}buildBar(t){let n=new Set,r=i=>{let d=this.pressFor(i.action,t);return i.held!==null&&(n.add(d),d.title=s(i.held)),d},o=jr(t);return{doing:o.doing.map(r),undoing:o.undoing.map(r),beside:o.beside.map(r),held:n}}pressFor(t,n){let r=this.handlers;switch(t){case"restore":return x(s("table.restore",{branch:n.madeFor??""}),"secondary",()=>{Mr(n,r)});case"pull":return x(s("table.pull"),"secondary",()=>{Ir(n,r)});case"account":return x(s("table.account"),"secondary",()=>{zr(n,r)});case"edit":return x(s("table.edit"),"secondary",()=>Lr(n));case"rebuild":return x(s("table.rebuild"),"secondary",()=>mt(n,o=>this.rebuild(n,o)));case"discard":return x(s("table.discard"),"danger",()=>{Jr(n,r,this.log.of(n.name))});case"remove":return x(s("table.remove"),"danger",()=>{Kr(n,r)})}}rebuild(t,n){if(n.built){qr(t.name,n.fresh,this.handlers);return}Fr(t,this.handlers)}async readUsage(t){await G(this.usage,t,()=>f.worktreeUsage(t),this.reading)}};customElements.define("branchery-worktree",Qt);function Zr(e){return[l.project,...l.worktrees].find(t=>t?.name===e)??null}function Jo(e){return!l.loading&&!l.unreachable?a`
          <div class="sds-page">
            <sds-note tone="warn" body=${s("detail.gone",{name:e})}></sds-note>
            ${J(s("detail.back"),"#/")}
          </div>`:a`
      <div class="sds-bands">
        <section class="sds-band">
            ${J(s("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${e}</span></h1>
            </div>
            ${L()}
        </section>
      </div>`}function Zt(e,t){return e===null?c:a`${N(e,t)}`}function Mo(e){return a`
        <sds-note
            tone="info"
            heading=${s("detail.busyHeading")}
            body=${s("detail.busy",{doing:e})}></sds-note>`}var Xt=class extends E{name="";handlers;read=K();reading=me(k,()=>this.requestUpdate());log=ut((t,n)=>f.branchCommits(t,n),this.reading,()=>this.requestUpdate());willUpdate(){this.read.about(this.name)&&this.readBranch(this.name),this.log.about(this.name)}render(){let t=this.name,n=this.read.of(t);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${J(s("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${t}</span>
                    ${n===null?c:Io(n)}
                </h1>
            </div>
            ${n===null?this.beforeTheAnswer(t):this.offer(n)}
        </section>
        ${n===null?c:a`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${s("detail.settled")}</h2>
                <div class="sds-facts-set">${zo(n).map(pt)}</div>
            </section>`}
        ${n===null&&this.read.trouble(t)!==""?c:this.commits(t)}
      </div>`}beforeTheAnswer(t){let n=this.read.trouble(t);return n===""?L():a`<sds-note tone="warn" body=${n}></sds-note>`}offer(t){return t.worktree!==null?a`
            <p class="branchery-list__quiet">${s("detail.branchHasWorktree")}
                <sds-link href=${`#/w/${encodeURIComponent(t.worktree)}`}
                          label=${t.worktree}></sds-link></p>`:a`
        <div class="sds-row">
            ${$(s("nav.newWorktree"),a`<sds-button variant="primary"
                        @click=${()=>q(this.handlers,t.name)}>${s("nav.newWorktree")}</sds-button>`)}
        </div>`}commits(t){let n=this.log.trouble(t);return a`
        <section class="sds-band">
            <h2 class="sds-h3">${s("detail.commitsHeading")}</h2>
            ${n===""?this.log.body(t,r=>`#/b/${encodeURIComponent(t)}/c/${r}`):a`<sds-note tone="warn" body=${n}></sds-note>`}
        </section>`}async readBranch(t){await G(this.read,t,()=>f.branch(t),this.reading)}};customElements.define("branchery-branch",Xt);function Io(e){return e.merged?a`<sds-badge label=${s("table.merged",{branch:l.project?.branch??l.branch})}
                               tone="neutral"></sds-badge>`:e.gone?a`<sds-badge label=${s("table.gone")} tone="warn"></sds-badge>`:!e.onRemote&&l.remotes.length>0?a`<sds-badge label=${s("table.nowhere")} tone="warn"></sds-badge>`:c}function zo(e){return[{title:s("detail.repository"),facts:[...e.base===null?[]:[{label:s("detail.base"),value:e.base.branch},{label:s("detail.sinceBase"),value:ht(e.base),said:!0}],{label:s("detail.commits"),value:qo(e),said:!0},{label:s("detail.moved"),value:R(e.when,l.language),said:!0}]}]}function qo(e){if(e.gone)return s("table.gone");if(e.upstream===null)return e.onRemote?s("detail.onRemoteOnly"):s("detail.noRemote");let t=[...e.ahead!==null&&e.ahead>0?[s("table.unpushed",{count:e.ahead})]:[],...e.behind!==null&&e.behind>0?[s("table.behind",{count:e.behind})]:[]];return t.length===0?s("detail.inStep"):`${e.upstream} \xB7 ${t.join(" \xB7 ")}`}var Ko={schedule:(e,t)=>setTimeout(e,t),cancel:e=>clearTimeout(e)};function Qr(e,t,n,r=Ko){let o=!1,i=null,d=()=>{i=r.schedule(()=>{i=null,u()},n)},u=async()=>{let h;try{h=await e()}catch{o||d();return}o||(t(h)?d():o=!0)};return u(),()=>{o=!0,i!==null&&(r.cancel(i),i=null)}}var Go=1e3,en=0,Xr=null,nn=null;function rn(e,t,n,r,o=!0){let i=++en;Xr?.();let d=Fn(e,t,n??"create"),u=o,h=ft,g=()=>{u&&!tt()&&es(d)};nn=()=>{u=!0,et(),es(d)},o&&nn();let m=async()=>{await A(),i===en&&(l.job=d,g(),r(d))};Xr=Qr(()=>f.job(e,h.size),p=>i!==en?!1:(h=gt(h,p),d={...p,log:h.log,steps:h.steps,expected:t??(p.subject===""?null:p.subject),kind:n??On(p.command)},p.status==="running"?(g(),!0):(m(),!1)),Go)}var Vo={running:"job.running",done:"job.ticket.done",failed:"job.ticket.failed",unknown:"job.ticket.unknown"},Y=null,tn="";function yt(){let e=l.job!==null&&!F()?l.job.status:"",t=Vo[e];if(t===void 0){Y?.remove(),Y=null,tn="";return}Y!==null&&tn===e||(Y?.remove(),tn=e,Y=x(s(t),"secondary",()=>{(nn??et)(),yt()}),Y.className=`branchery-ticket branchery-ticket--${e}`,Y.title=s("job.show"),document.body.append(Y))}he(()=>yt());ce(()=>yt());function es(e){st(Qo(e),e.status==="running"?"":ei(e)),nr(a`
        <sds-run open
                 heading=${Zo(e)}
                 verdict=${e.status}
                 note=${Xo(e)}
                 .stateWords=${Ve()}
                 .steps=${Ie(e.steps)}></sds-run>`),Yo(e),yt()}function Yo(e){Dt(e.status==="running"?{back:s("action.leaveRunning"),onBack:()=>U()}:{back:s("action.copyLog"),onBack:()=>{ti(e)},next:s("action.close"),onNext:()=>{l.job=null,U()}})}function Zo(e){return s(Vr(e.status))}function Qo(e){return e.expected??(e.subject===""?Ge(e.command):e.subject)}function Xo(e){let t=ke(e.elapsed);return e.status==="running"?e.step===null?t:`${s("job.stepOf",{no:e.step.no,total:e.step.total})} \xB7 ${t}`:e.status==="failed"?e.interrupted?s("job.interrupted"):bt(e.log)||t:Yt(e.status)?t:""}function ei(e){if(!Yt(e.status))return"";let t=ke(e.elapsed);if(e.kind==="fetch"){let o=e.log.split(`
`).filter(i=>i.includes(" -> ")).length;return o===0?s("job.done.fetch",{time:t}):s("job.done.fetchMoved",{count:o,time:t})}let n=l.worktrees.find(o=>o.name===e.expected);if(!n||e.kind==="remove")return s(`job.done.${e.kind}`,{name:e.expected??"",time:t});let r=e.kind==="sync"?s("job.done.sync",{name:n.database}):e.kind==="pull"?s("job.done.pull",{branch:n.branch}):e.kind==="restore"?s("job.done.restore",{branch:n.branch}):e.kind==="discard"?s("job.done.discard",{branch:n.branch}):e.kind==="account"?ts(n):n.account?.made!==!0?s("job.done.built",{php:n.php}):`${s("job.done.built",{php:n.php})} ${ts(n)}`;return a`
        ${r}
        <sds-link external href=${n.url}
                  label=${s("action.openWorktree")}></sds-link>`}function ts(e){let t=e.account;return t===null?"":s("job.login",{user:t.user,password:t.password})}async function ti(e){let t=S("#wizBack");try{await navigator.clipboard.writeText(e.log.trim()),t&&(de(t,s("action.copied")),window.setTimeout(()=>de(t,s("action.copyLog")),2e3))}catch{}}var $t={onJob(e,t=null,n=null){rn(e,t,n,is)}};function is(e){let t=e.expected??e.subject;t!==""&&Yn(t)}function ye(e,t,n,r){let o=y(e);if(o.hidden=!t,!t)return;let i=o.firstElementChild;i===null&&(i=document.createElement("sds-note"),r!==void 0&&i.addEventListener("sds-note-action",r),o.append(i));for(let[d,u]of Object.entries(n()))i.setAttribute(d,u)}function ni(){ye("#offline",l.unreachable,()=>({tone:"warn",body:s("error.unreachable"),action:s("action.tryAgain")}),()=>{A()})}function ri(){ye("#update",l.updateWaiting,()=>({tone:"info",heading:s("update.waiting"),body:s("update.how")}))}var si="ddev add-on get benjaminkott/ddev-branchery && ddev restart";function oi(){let e=l.updateAvailable,t=y("#new-version");if(t.hidden=e===null,e===null)return;let n=s("update.available",{version:e}),r=s("update.fetch"),o=`${n}
${r}`;if(t.dataset.said===o)return;t.dataset.said=o;let i=document.createElement("sds-note");i.setAttribute("tone","info"),i.setAttribute("heading",n);let d=document.createElement("div");d.className="branchery-upgrade";let u=document.createElement("p");u.textContent=r;let h=document.createElement("sds-copy");h.setAttribute("value",si),h.setAttribute("label",s("update.command")),d.append(u,h),i.append(d),t.replaceChildren(i)}function ii(){let e=l.exposed;ye("#exposed",e!==null,()=>({tone:"warn",heading:s("exposed.heading"),body:s(e==="router"?"exposed.router":"exposed.container")}))}function ai(){ye("#webserver",l.webserver.startsWith("nginx"),()=>({tone:"warn",heading:s("webserver.heading"),body:s("webserver.nginx")}))}function li(){ye("#unconfigured",l.unconfigured,()=>({tone:"info",heading:s("error.unconfigured"),body:s("error.unconfiguredHow")}))}function di(){let e=l.recipeProblem;ye("#recipe",e!==null,()=>({tone:"warn",heading:s("error.recipe"),body:e??""}))}var ns=Ye();function ve(e=Ye()){if(F())return;let t=!zn(e,ns);t&&window.scrollTo(0,0),ns=e,as(),ni(),ii(),ai(),ri(),oi(),yi(),di(),li(),ci(e),t&&pi()}function ci(e){let t=y("#main");w(ui(e),t);for(let n of t.children)n instanceof E&&n.drawNow()}function ui(e){return e.view==="worktree"?a`<branchery-worktree .name=${e.name} .handlers=${$t}></branchery-worktree>`:e.view==="branch"?a`<branchery-branch .name=${e.name} .handlers=${$t}></branchery-branch>`:e.view==="commit"?a`<branchery-commit
            .name=${e.name}
            .sha=${e.sha}
            .branch=${e.branch}></branchery-commit>`:a`<branchery-overview .handlers=${$t}></branchery-overview>`}function pi(){y("#main").focus({preventScroll:!0})}var sn=null;function hi(){let e=l.version;if(e!==""){if(sn===null){sn=e;return}sn!==e&&location.reload()}}ce(()=>{hi(),ve()});Gn(e=>{B(""),ve(e)});var be=y("#bar"),Ee=[],mi="https://benjaminkott.github.io/ddev-branchery/",rs="";function as(){rs!==l.language&&(rs=l.language,be.menu={label:s("app.title"),items:[{label:s("nav.worktrees"),href:"#/",current:!0},{label:s("nav.docs"),href:mi,external:!0}]})}function ls(){be.product=s("app.title"),as()}function ds(){be.languages=Ee.map(e=>({label:fi(e),current:e===l.language,lang:e})),be.updateComplete.then(()=>{S(".sds-bar__lang",be)?.setAttribute("name",s("app.language"))})}function fi(e){try{return new Intl.DisplayNames([e],{type:"language"}).of(e)??e.toUpperCase()}catch{return e.toUpperCase()}}be.addEventListener("sds-dropdown-choose",e=>{let t=Ee[e.detail.index];!t||t===l.language||Wt(t).then(()=>{ds(),ls(),ve()})});y("#wizard").addEventListener("close",()=>{l.job?.status!=="running"&&(l.job=null)});he(()=>{let e=qn(location.hash);e!==null&&history.replaceState(null,"",e),ve(),A(!0)});var gi=5e3,ss=Date.now();async function cs(){let e=Date.now();document.visibilityState!=="visible"||l.job?.status==="running"||F()||e-ss<gi||(ss=e,us(await A(!0)))}function us(e){let t=e[0];t!==void 0&&l.job?.status!=="running"&&rn(t.id,null,null,is,!1)}var bi=2e3,vi=1e4,os=!1;function yi(){if(os)return;os=!0;let e=()=>{let t=l.runningJobs.length>0||F()||l.unreachable;window.setTimeout(()=>{if(document.visibilityState!=="visible"||F()){e();return}A(!0).then(e)},t?bi:vi)};e()}document.addEventListener("visibilitychange",()=>{cs()});window.addEventListener("focus",()=>{cs()});function ps(){if(Lt(location.hash)){q($t);return}tt()&&U()}window.addEventListener("hashchange",ps);(async()=>(Ee=await Wn(),await Wt(Ee.includes(l.language)?l.language:Ee[0]??"en"),ds(),ls(),ve(),us(await A()),ve(),ps()))();
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
