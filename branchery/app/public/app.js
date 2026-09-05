var je=globalThis,Le=je.ShadowRoot&&(je.ShadyCSS===void 0||je.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ln=Symbol(),an=new WeakMap,We=class{constructor(t,n,s){if(this._$cssResult$=!0,s!==ln)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o,n=this.t;if(Le&&t===void 0){let s=n!==void 0&&n.length===1;s&&(t=an.get(n)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&an.set(n,t))}return t}toString(){return this.cssText}},dn=e=>new We(typeof e=="string"?e:e+"",void 0,ln);var cn=(e,t)=>{if(Le)e.adoptedStyleSheets=t.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of t){let s=document.createElement("style"),o=je.litNonce;o!==void 0&&s.setAttribute("nonce",o),s.textContent=n.cssText,e.appendChild(s)}},_t=Le?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let n="";for(let s of t.cssRules)n+=s.cssText;return dn(n)})(e):e;var{is:tr,defineProperty:nr,getOwnPropertyDescriptor:sr,getOwnPropertyNames:rr,getOwnPropertySymbols:or,getPrototypeOf:ir}=Object,Ue=globalThis,un=Ue.trustedTypes,ar=un?un.emptyScript:"",lr=Ue.reactiveElementPolyfillSupport,be=(e,t)=>e,kt={toAttribute(e,t){switch(t){case Boolean:e=e?ar:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},hn=(e,t)=>!tr(e,t),pn={attribute:!0,type:String,converter:kt,reflect:!1,useDefault:!1,hasChanged:hn};Symbol.metadata??=Symbol("metadata"),Ue.litPropertyMetadata??=new WeakMap;var O=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=pn){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){let s=Symbol(),o=this.getPropertyDescriptor(t,s,n);o!==void 0&&nr(this.prototype,t,o)}}static getPropertyDescriptor(t,n,s){let{get:o,set:i}=sr(this.prototype,t)??{get(){return this[n]},set(d){this[n]=d}};return{get:o,set(d){let u=o?.call(this);i?.call(this,d),this.requestUpdate(t,u,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??pn}static _$Ei(){if(this.hasOwnProperty(be("elementProperties")))return;let t=ir(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(be("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(be("properties"))){let n=this.properties,s=[...rr(n),...or(n)];for(let o of s)this.createProperty(o,n[o])}let t=this[Symbol.metadata];if(t!==null){let n=litPropertyMetadata.get(t);if(n!==void 0)for(let[s,o]of n)this.elementProperties.set(s,o)}this._$Eh=new Map;for(let[n,s]of this.elementProperties){let o=this._$Eu(n,s);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let n=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let o of s)n.unshift(_t(o))}else t!==void 0&&n.push(_t(t));return n}static _$Eu(t,n){let s=n.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,n=this.constructor.elementProperties;for(let s of n.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return cn(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,s){this._$AK(t,s)}_$ET(t,n){let s=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,s);if(o!==void 0&&s.reflect===!0){let i=(s.converter?.toAttribute!==void 0?s.converter:kt).toAttribute(n,s.type);this._$Em=t,i==null?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(t,n){let s=this.constructor,o=s._$Eh.get(t);if(o!==void 0&&this._$Em!==o){let i=s.getPropertyOptions(o),d=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:kt;this._$Em=o;let u=d.fromAttribute(n,i.type);this[o]=u??this._$Ej?.get(o)??u,this._$Em=null}}requestUpdate(t,n,s,o=!1,i){if(t!==void 0){let d=this.constructor;if(o===!1&&(i=this[t]),s??=d.getPropertyOptions(t),!((s.hasChanged??hn)(i,n)||s.useDefault&&s.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(d._$Eu(t,s))))return;this.C(t,n,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,n,{useDefault:s,reflect:o,wrapped:i},d){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,d??n??this[t]),i!==!0||d!==void 0)||(this._$AL.has(t)||(this.hasUpdated||s||(n=void 0),this._$AL.set(t,n)),o===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,i]of this._$Ep)this[o]=i;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[o,i]of s){let{wrapped:d}=i,u=this[o];d!==!0||this._$AL.has(o)||u===void 0||this.C(o,void 0,i,u)}}let t=!1,n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(t){}firstUpdated(t){}};O.elementStyles=[],O.shadowRootOptions={mode:"open"},O[be("elementProperties")]=new Map,O[be("finalized")]=new Map,lr?.({ReactiveElement:O}),(Ue.reactiveElementVersions??=[]).push("2.1.2");var Tt=globalThis,mn=e=>e,Be=Tt.trustedTypes,fn=Be?Be.createPolicy("lit-html",{createHTML:e=>e}):void 0,Rt="$lit$",H=`lit$${Math.random().toFixed(9).slice(2)}$`,Ct="?"+H,dr=`<${Ct}>`,V=document,ye=()=>V.createComment(""),$e=e=>e===null||typeof e!="object"&&typeof e!="function",Et=Array.isArray,wn=e=>Et(e)||typeof e?.[Symbol.iterator]=="function",xt=`[ 	
\f\r]`,ve=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,gn=/-->/g,bn=/>/g,K=RegExp(`>|${xt}(?:([^\\s"'>=/]+)(${xt}*=${xt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),vn=/'/g,yn=/"/g,Sn=/^(?:script|style|textarea|title)$/i,At=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),a=At(1),si=At(2),ri=At(3),Y=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),$n=new WeakMap,G=V.createTreeWalker(V,129);function _n(e,t){if(!Et(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return fn!==void 0?fn.createHTML(t):t}var kn=(e,t)=>{let n=e.length-1,s=[],o,i=t===2?"<svg>":t===3?"<math>":"",d=ve;for(let u=0;u<n;u++){let p=e[u],f,b,h=-1,B=0;for(;B<p.length&&(d.lastIndex=B,b=d.exec(p),b!==null);)B=d.lastIndex,d===ve?b[1]==="!--"?d=gn:b[1]!==void 0?d=bn:b[2]!==void 0?(Sn.test(b[2])&&(o=RegExp("</"+b[2],"g")),d=K):b[3]!==void 0&&(d=K):d===K?b[0]===">"?(d=o??ve,h=-1):b[1]===void 0?h=-2:(h=d.lastIndex-b[2].length,f=b[1],d=b[3]===void 0?K:b[3]==='"'?yn:vn):d===yn||d===vn?d=K:d===gn||d===bn?d=ve:(d=K,o=void 0);let N=d===K&&e[u+1].startsWith("/>")?" ":"";i+=d===ve?p+dr:h>=0?(s.push(f),p.slice(0,h)+Rt+p.slice(h)+H+N):p+H+(h===-2?u:N)}return[_n(e,i+(e[n]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},we=class e{constructor({strings:t,_$litType$:n},s){let o;this.parts=[];let i=0,d=0,u=t.length-1,p=this.parts,[f,b]=kn(t,n);if(this.el=e.createElement(f,s),G.currentNode=this.el.content,n===2||n===3){let h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(o=G.nextNode())!==null&&p.length<u;){if(o.nodeType===1){if(o.hasAttributes())for(let h of o.getAttributeNames())if(h.endsWith(Rt)){let B=b[d++],N=o.getAttribute(h).split(H),Pe=/([.?@])?(.*)/.exec(B);p.push({type:1,index:i,name:Pe[2],strings:N,ctor:Pe[1]==="."?He:Pe[1]==="?"?De:Pe[1]==="@"?Fe:Q}),o.removeAttribute(h)}else h.startsWith(H)&&(p.push({type:6,index:i}),o.removeAttribute(h));if(Sn.test(o.tagName)){let h=o.textContent.split(H),B=h.length-1;if(B>0){o.textContent=Be?Be.emptyScript:"";for(let N=0;N<B;N++)o.append(h[N],ye()),G.nextNode(),p.push({type:2,index:++i});o.append(h[B],ye())}}}else if(o.nodeType===8)if(o.data===Ct)p.push({type:2,index:i});else{let h=-1;for(;(h=o.data.indexOf(H,h+1))!==-1;)p.push({type:7,index:i}),h+=H.length-1}i++}}static createElement(t,n){let s=V.createElement("template");return s.innerHTML=t,s}};function Z(e,t,n=e,s){if(t===Y)return t;let o=s!==void 0?n._$Co?.[s]:n._$Cl,i=$e(t)?void 0:t._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),i===void 0?o=void 0:(o=new i(e),o._$AT(e,n,s)),s!==void 0?(n._$Co??=[])[s]=o:n._$Cl=o),o!==void 0&&(t=Z(e,o._$AS(e,t.values),o,s)),t}var Oe=class{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:n},parts:s}=this._$AD,o=(t?.creationScope??V).importNode(n,!0);G.currentNode=o;let i=G.nextNode(),d=0,u=0,p=s[0];for(;p!==void 0;){if(d===p.index){let f;p.type===2?f=new se(i,i.nextSibling,this,t):p.type===1?f=new p.ctor(i,p.name,p.strings,this,t):p.type===6&&(f=new Ne(i,this,t)),this._$AV.push(f),p=s[++u]}d!==p?.index&&(i=G.nextNode(),d++)}return G.currentNode=V,o}p(t){let n=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,n),n+=s.strings.length-2):s._$AI(t[n])),n++}},se=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,s,o){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,n=this._$AM;return n!==void 0&&t?.nodeType===11&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=Z(this,t,n),$e(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==Y&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):wn(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&$e(this._$AH)?this._$AA.nextSibling.data=t:this.T(V.createTextNode(t)),this._$AH=t}$(t){let{values:n,_$litType$:s}=t,o=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=we.createElement(_n(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(n);else{let i=new Oe(o,this),d=i.u(this.options);i.p(n),this.T(d),this._$AH=i}}_$AC(t){let n=$n.get(t.strings);return n===void 0&&$n.set(t.strings,n=new we(t)),n}k(t){Et(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,s,o=0;for(let i of t)o===n.length?n.push(s=new e(this.O(ye()),this.O(ye()),this,this.options)):s=n[o],s._$AI(i),o++;o<n.length&&(this._$AR(s&&s._$AB.nextSibling,o),n.length=o)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){let s=mn(t).nextSibling;mn(t).remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},Q=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,s,o,i){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=n,this._$AM=o,this.options=i,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=c}_$AI(t,n=this,s,o){let i=this.strings,d=!1;if(i===void 0)t=Z(this,t,n,0),d=!$e(t)||t!==this._$AH&&t!==Y,d&&(this._$AH=t);else{let u=t,p,f;for(t=i[0],p=0;p<i.length-1;p++)f=Z(this,u[s+p],n,p),f===Y&&(f=this._$AH[p]),d||=!$e(f)||f!==this._$AH[p],f===c?t=c:t!==c&&(t+=(f??"")+i[p+1]),this._$AH[p]=f}d&&!o&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},He=class extends Q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},De=class extends Q{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},Fe=class extends Q{constructor(t,n,s,o,i){super(t,n,s,o,i),this.type=5}_$AI(t,n=this){if((t=Z(this,t,n,0)??c)===Y)return;let s=this._$AH,o=t===c&&s!==c||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,i=t!==c&&(s===c||o);o&&this.element.removeEventListener(this.name,this,s),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ne=class{constructor(t,n,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}},xn={M:Rt,P:H,A:Ct,C:1,L:kn,R:Oe,D:wn,V:Z,I:se,H:Q,N:De,U:Fe,B:He,F:Ne},cr=Tt.litHtmlPolyfillSupport;cr?.(we,se),(Tt.litHtmlVersions??=[]).push("3.3.3");var v=(e,t,n)=>{let s=n?.renderBefore??t,o=s._$litPart$;if(o===void 0){let i=n?.renderBefore??null;s._$litPart$=o=new se(t.insertBefore(ye(),i),i,void 0,n??{})}return o._$AI(e),o};var Pt=globalThis,J=class extends O{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=v(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Y}};J._$litElement$=!0,J.finalized=!0,Pt.litElementHydrateSupport?.({LitElement:J});var ur=Pt.litElementPolyfillSupport;ur?.({LitElement:J});(Pt.litElementVersions??=[]).push("4.2.2");var Tn=e=>(...t)=>({_$litDirective$:e,values:t}),Je=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,s){this._$Ct=t,this._$AM=n,this._$Ci=s}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}};var{I:yi}=xn;var pr={},Rn=(e,t=pr)=>e._$AH=t;var Cn=Tn(class extends Je{constructor(){super(...arguments),this.key=c}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(Rn(e),this.key=t),n}});function y(e,t=document){let n=t.querySelector(e);if(!n)throw new Error(`Element not found: ${e}`);return n}function w(e,t=document){return t.querySelector(e)}function re(e){return hr.test(e)}var hr=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;function Me(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function An(e,t){let n=e.split(".").map(Number),s=t.split(".").map(Number);for(let o=0;o<Math.max(n.length,s.length);o+=1){let i=(n[o]??0)-(s[o]??0);if(i!==0)return i}return 0}function Pn(e){try{return new URL(e).pathname.replace(/^\/+|\/+$/g,"")||e}catch{return e}}function oe(e){return e.replace(/^https?:\/\//,"").replace(/\/$/,"")}function Ie(e){return e.map(t=>({label:t.label,state:t.state,meta:mr(t.seconds),output:t.output}))}function mr(e){if(e<60)return`${e}s`;let t=e%60;return t===0?`${Math.floor(e/60)}m`:`${Math.floor(e/60)}m ${t}s`}function T(e,t){let n=Math.max(0,Math.round(Date.now()/1e3)-e),[s,o]=n<60?[n,"second"]:n<3600?[Math.round(n/60),"minute"]:n<86400?[Math.round(n/3600),"hour"]:[Math.round(n/86400),"day"];try{return new Intl.RelativeTimeFormat(t,{numeric:"auto"}).format(-s,o)}catch{return`${s} ${o}`}}function Se(e){let t=Math.max(0,Math.round(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function ze(e,t){let n=["B","KB","MB","GB","TB"],s=Math.max(0,e),o=0;for(;s>=1024&&o<n.length-1;)s/=1024,o++;return`${new Intl.NumberFormat(t,{maximumFractionDigits:s<10?1:0}).format(s)} ${n[o]}`}function $(e,t){return Cn(e,t)}function _(e,t,n,s){let o=document.createElement("sds-button");return o.variant=t,s&&(o.size=s),o.append(document.createTextNode(e)),o.addEventListener("click",n),o}function ie(e,t){t.trim()!==""&&e.updateComplete.then(()=>{let n=document.createTreeWalker(e,NodeFilter.SHOW_TEXT).nextNode();if(n){n.nodeValue=t;return}(e.querySelector("button, a")??e).append(document.createTextNode(t))})}function ae(e,t){let n=document.createElement("sds-button"),s=document.createElement("sds-icon");return s.name="actions-window-open",s.size=16,n.variant="secondary",n.href=e,n.rel="external",n.append(document.createTextNode(t),s),n}function fr(e,t,n,s,o){let i=document.createElement("sds-select");return i.options=e.map(d=>({label:d.label,value:d.value,disabled:d.disabled===!0})),i.value=t,i.filled=t!=="",i.label=s,o===void 0?i.size="sm":i.caption=o,i.addEventListener("sds-change",d=>n(d.detail)),i}var En=0;function qe(e,t,n,s){if(e.length>6)return fr(e.map(i=>({value:i.value,label:i.label})),t,n,s,s);let o=document.createElement("sds-radio");return En+=1,o.name=`choice-${En}`,o.legend=s,o.choices=e.map(i=>({label:i.label,value:i.value,...i.hint===void 0?{}:{hint:i.hint}})),o.value=t,o.addEventListener("sds-change",i=>n(i.detail)),o}async function jn(){let e=await fetch("/translations/index.json");return e.ok?await e.json():["en"]}async function Wn(e){let t=await fetch(`/translations/${e}.json`);if(!t.ok)throw new Error(`Missing translations for "${e}"`);return await t.json()}function Ln(e,t,n={}){let s=e[gr(e,t,n)]??e[t]??t;for(let[o,i]of Object.entries(n))s=s.replaceAll(`{${o}}`,String(i));return s}function gr(e,t,n){return Number(n.count)===1&&e[`${t}.one`]!==void 0?`${t}.one`:t}var br="/api",X=class extends Error{constructor(n,s){super(n);this.status=s}},jt=class extends Error{constructor(n){super(`No answer from the container, only a ${n} from in front of it.`);this.status=n}};async function g(e,t={}){let n=t.body?{"Content-Type":"application/json"}:{},s=await fetch(`${br}/${e}`,{...t,headers:n});if(!s.ok&&vr(s.status,s.headers.get("Content-Type")))throw new jt(s.status);let o=await s.json().catch(()=>({}));if(!s.ok){let i=o.error;throw new X(i??`Request failed with status ${s.status}`,s.status)}return o}function vr(e,t){return!((t??"").split(";")[0]?.trim().toLowerCase()==="application/json")&&yr.includes(e)}var yr=[404,502,503,504],m={state:()=>g("state"),createWorktree:e=>g("worktrees",{method:"POST",body:JSON.stringify(e)}),preview:e=>g(`worktrees/preview?${new URLSearchParams(e).toString()}`),updateWorktree:(e,t)=>g(`worktrees/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),provisionWorktree:(e,t=!1)=>g(`worktrees/${encodeURIComponent(e)}/provision`,{method:"POST",body:JSON.stringify({fresh:t})}),syncWorktree:(e,t="")=>g(`worktrees/${encodeURIComponent(e)}/sync`,{method:"POST",body:JSON.stringify(t!==""?{from:t}:{})}),pullWorktree:e=>g(`worktrees/${encodeURIComponent(e)}/pull`,{method:"POST"}),commits:(e,t=0)=>g(`worktrees/${encodeURIComponent(e)}/commits${t>0?`?skip=${t}`:""}`),branch:e=>g(`branch?branch=${encodeURIComponent(e)}`),branchCommits:(e,t=0)=>g(`branch/commits?branch=${encodeURIComponent(e)}${t>0?`&skip=${t}`:""}`),commit:(e,t)=>g(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}`),commitDiff:(e,t,n)=>g(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}/diff?path=${encodeURIComponent(n)}`),changes:e=>g(`worktrees/${encodeURIComponent(e)}/changes`),worktreeUsage:e=>g(`worktrees/${encodeURIComponent(e)}/usage`),changeDiff:(e,t)=>g(`worktrees/${encodeURIComponent(e)}/changes/diff?path=${encodeURIComponent(t)}`),discardWorktree:e=>g(`worktrees/${encodeURIComponent(e)}/discard`,{method:"POST"}),restoreWorktree:e=>g(`worktrees/${encodeURIComponent(e)}/restore`,{method:"POST"}),removeWorktree:e=>g(`worktrees/${encodeURIComponent(e)}`,{method:"DELETE"}),fetch:e=>g("fetch",{method:"POST",body:JSON.stringify(e!==void 0?{remote:e}:{})}),job:(e,t=0)=>g(`jobs/${encodeURIComponent(e)}${t>0?`?since=${t}`:""}`),worktreeJobs:e=>g(`worktrees/${encodeURIComponent(e)}/jobs`)};function Ke(e){try{return localStorage.getItem(e)}catch{return null}}function Ge(e,t){try{localStorage.setItem(e,t)}catch{}}function Un(e,t){return JSON.stringify(e)!==JSON.stringify(t)}function Bn(e){let t=new Set,n=!1,s=()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1;for(let i of t)i()}))};return{state:new Proxy({...e},{set(i,d,u){return Reflect.get(i,d)===u||(Reflect.set(i,d,u),s()),!0}}),subscribe(i){return t.add(i),()=>t.delete(i)}}}var On="branchery-language",{state:l,subscribe:le}=Bn({tld:location.host,projectName:"",worktrees:[],project:null,branch:"",branches:[],remotes:[],repository:null,phpVersions:[],strings:{},loading:!0,language:Ke(On)||document.documentElement.lang||"en",job:null,runningJobs:[],error:"",unreachable:!1,recipeProblem:null,unconfigured:!1,updateWaiting:!1,exposed:null});function r(e,t={}){return Ln(l.strings,e,t)}async function Wt(e){l.strings=await Wn(e),l.language=e,document.documentElement.lang=e,Ge(On,e),document.querySelectorAll("[data-i18n]").forEach(t=>{let n=t.dataset.i18n;n&&(t.textContent=r(n))})}async function R(e=!1){return _e!==null?(e||(l.loading=!0),_e):(_e=$r(e).finally(()=>{_e=null}),_e)}var _e=null;async function $r(e){l.loading=!e;try{let t=await wr();return l.unreachable=!1,t}catch(t){return t instanceof X?(l.unreachable=!1,W(t.message)):l.unreachable=!0,l.runningJobs}finally{l.loading=!1}}async function wr(){let e=await m.state();return S("worktrees",e.worktrees),S("branches",e.branches),S("remotes",e.remotes),S("repository",e.repository??null),S("branch",e.branch),S("project",e.project),S("phpVersions",e.phpVersions),S("tld",e.tld||location.host),S("projectName",e.projectName??""),S("recipeProblem",e.recipeProblem??null),S("unconfigured",e.unconfigured===!0),S("updateWaiting",e.updateWaiting??!1),S("exposed",e.exposed??null),S("runningJobs",e.runningJobs??[]),l.runningJobs}function S(e,t){Un(l[e],t)&&(l[e]=t)}function W(e){l.error=e}function P(e){if(Sr(e)){l.unreachable=!0;return}W(C(e))}function Sr(e){return e instanceof Error&&!(e instanceof X)}function C(e){return e instanceof X?e.message:e instanceof Error?r("error.unreachable"):r("error.generic")}function ee(e){let t=l.runningJobs.find(n=>n.subject===e);return t===void 0?void 0:t.step?.label??Ut(t.command)}function Hn(e,t=null,n="create"){let s={id:e,expected:t,kind:n,status:"running",subject:t??"",command:"",step:null,steps:[],elapsed:0,log:"",size:0,partial:!1,interrupted:!1};return l.job=s,s}var Lt={"worktree:add":{kind:"create",history:"history.add",doing:"job.doing.create"},"worktree:fork":{kind:"create",history:"history.fork",doing:"job.doing.create"},"worktree:provision":{kind:"create",history:"history.provision",doing:"job.doing.provision"},"worktree:remove":{kind:"remove",history:"history.remove",doing:"job.doing.remove"},"database:sync":{kind:"sync",history:"history.sync",doing:"job.doing.sync"},"worktree:pull":{kind:"pull",history:"history.pull",doing:"job.doing.pull"},"worktree:restore":{kind:"restore",history:"history.restore",doing:"job.doing.restore"},"worktree:discard":{kind:"discard",history:"history.discard",doing:"job.doing.discard"},"git:fetch":{kind:"fetch",history:"history.fetch",doing:"job.doing.fetch"}};function Dn(e){return Lt[e]?.kind??"create"}function Ve(e){return r(Lt[e]?.history??"history.other")}function Ut(e){return r(Lt[e]?.doing??"job.doing.create")}function Ye(){return{running:r("step.state.running"),done:r("step.state.done"),failed:r("step.state.failed")}}var Nn="[A-Za-z0-9][A-Za-z0-9.-]*",_r=new RegExp(`^/w/(${Nn})$`),kr=new RegExp(`^/w/(${Nn})/c/([0-9a-f]{4,40})$`);function Jn(e){let t=e.replace(/^#/,""),n=kr.exec(t);if(n?.[1]!==void 0&&n[2]!==void 0)return{view:"commit",name:n[1],sha:n[2],branch:""};let s=_r.exec(t);if(s?.[1]!==void 0)return{view:"worktree",name:s[1]};let o=/^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(t),i=Fn(o?.[1]);if(i!==null&&o?.[2]!==void 0)return{view:"commit",name:"",sha:o[2],branch:i};let d=Fn(/^\/b\/(.+)$/.exec(t)?.[1]);return d!==null?{view:"branch",name:d}:{view:"overview"}}function Fn(e){if(e===void 0||e==="")return null;let t;try{t=decodeURIComponent(e)}catch{return null}return re(t)?t:null}function Mn(e,t){return e.view!==t.view?!1:e.view==="worktree"&&t.view==="worktree"||e.view==="branch"&&t.view==="branch"?e.name===t.name:e.view==="commit"&&t.view==="commit"?e.name===t.name&&e.sha===t.sha&&e.branch===t.branch:!0}function Bt(e){return e.replace(/^#/,"").startsWith("new")}function In(e){return Bt(e)?"#/":null}var zn=[];function Ze(){return Jn(window.location.hash)}function Qe(e){window.location.hash!==`#${e}`&&(window.location.hash=e)}function qn(e){zn.push(e)}function Kn(){history.scrollRestoration="manual"}Kn();window.addEventListener("hashchange",()=>{Kn();let e=Ze();for(let t of zn)t(e)});var Ot="branchery-operation-ended";function Gn(e){window.dispatchEvent(new CustomEvent(Ot,{detail:e}))}function Vn(e){let t=n=>e(n.detail);return window.addEventListener(Ot,t),()=>window.removeEventListener(Ot,t)}function Yn(){let e=!1;return{pending:()=>e,run(t,n=()=>{}){if(e)return!1;e=!0;let s=()=>{e=!1,n()},o;try{o=t()}catch(i){throw s(),i}return Promise.resolve(o).then(s,s),!0}}}var j=y("#wizard"),xr=y("#wizForm"),de=y("#wizProgress"),Zn=y("#wizTitle"),et=y("#wizLead"),Xe=y("#wizBody"),Tr=y("#wizFoot"),Ht=y("#wizBack"),ce=y("#wizNext"),k=null,x=0,ke=!1,Rr=Yn(),Cr={update:()=>Ft()};function M(e){k=e,x=0,ke=!1,Qn(e.tall===!0),Dt(),tt()}function Qn(e){j.classList.toggle("sds-modal--lg",e),j.classList.toggle("sds-modal--md",!e)}function tt(){j.open||j.showModal()}function L(){j.open&&j.close()}function D(){return j.open}function nt(){return j.open&&k!==null}function ue(e){return j.addEventListener("close",e),()=>j.removeEventListener("close",e)}function st(){return k===null?[]:k.steps.filter(e=>e.when===void 0||e.when())}function rt(){st()[x]?.leave?.()}function Dt(){let e=st(),t=e[x];t&&(Zn.textContent=t.heading,v(t.lead??c,et),et.hidden=t.lead===void 0,Er(e),v(c,Xe),t.enter(Xe,Cr),Ft(),window.setTimeout(()=>{w('input:not([type]), input[type="text"]',Xe)?.focus()},20))}function Er(e){de.hidden=e.length<2,!(e.length<2)&&(de.caption=e[x]?.label??"",de.label=r("step.progress"),de.max=e.length,de.value=x+1)}function Ft(){let e=st(),t=e[x];if(!t||k===null)return;let n=x===e.length-1;Nt({back:x===0?r("action.cancel"):r("action.back"),onBack:Ar,next:n?k.finishLabel():r("action.next"),onNext:Xn}),ce.disabled=t.ready?.()===!1}function Xn(){let e=st(),t=e[x];if(!(!t||k===null||t.ready?.()===!1)){if(x>=e.length-1){let n=k;Rr.run(()=>n.finish(),()=>{k===n&&!ke&&Ft()})&&(ce.disabled=!0);return}rt(),x+=1,Dt()}}function Ar(){if(x===0){L();return}rt(),x-=1,Dt()}xr.addEventListener("submit",e=>{e.preventDefault(),k!==null&&Xn()});j.addEventListener("close",()=>{rt(),k=null,ke=!1});function Nt(e={}){Tr.hidden=e.back==null&&e.next==null,Ht.hidden=e.back==null,ie(Ht,e.back??""),Ht.onclick=e.onBack??null,ce.hidden=e.next==null,ie(ce,e.next??""),ce.disabled=!1,ce.onclick=e.onNext??null}function ot(e,t=""){ke||(ke=!0,k===null&&Qn(!1)),rt(),k=null,de.hidden=!0,Zn.textContent=e,v(t===""?c:t,et),et.hidden=t===""}function es(e){v(e,Xe)}var E=class extends J{letGo=[];createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.letGo.push(le(()=>this.requestUpdate())),this.letGo.push(ue(()=>this.requestUpdate())),this.arrived()}disconnectedCallback(){for(let t of this.letGo)t();this.letGo=[],this.left(),super.disconnectedCallback()}shouldUpdate(){return!this.hasUpdated||!D()}drawNow(){this.requestUpdate(),this.performUpdate()}arrived(){}left(){}untilLeft(t){this.letGo.push(t)}};var Pr=new Set(["worktree:add","worktree:fork"]);function ts(e,t){let n=new Set(t);return e.filter(s=>Pr.has(s.command)&&s.subject!==""&&!n.has(s.subject))}function it(e,t){return e.filter(n=>at([n.name,n.branch,n.database,n.url,n.php,n.base?.branch??"",n.tip?.subject??""].join(" "),t))}function ns(e,t){return e.filter(n=>at([n.name,n.tip?.subject??""].join(" "),t))}function at(e,t){let n=t.toLowerCase().split(/\s+/).filter(o=>o!==""),s=e.toLowerCase();return n.every(o=>s.includes(o))}function ss(e,t){let n=s=>s.base===null?[0,""]:s.base.branch===t?[1,""]:[2,s.base.branch];return e.map((s,o)=>({worktree:s,at:o,rank:n(s)})).sort((s,o)=>s.rank[0]-o.rank[0]||s.rank[1].localeCompare(o.rank[1],void 0,{numeric:!0})||s.at-o.at).map(s=>s.worktree)}function U(){return a`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="actions-circle-half" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${r("detail.loading")}</span>
        </p>`}function A(e=0,t=""){return a`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${t}"
        style="--sds-skeleton-delay: ${e%3*.12}s"></span>`}var os=null,Mt=new Map,Jt=new Set,jr=300,It;function zt(e){return e!==""&&!re(e)?r("error.branchName"):""}function is(e){return e===l.branch||l.project?.branch===e||l.branches.some(t=>t.name===e)||l.worktrees.some(t=>t.branch===e)}function rs(e){let t=zt(e);return t!==""?t:e!==""&&is(e)?r("error.branchExists",{branch:e}):""}function I(e,t=""){let n={mode:l.branches.length>0?"branch":"fork",branch:t,from:"",name:""},s=()=>n.name.trim()||Me(n.branch),o=()=>{let d=s();return d!==""&&d===l.projectName?r("preview.isProject",{name:d}):l.worktrees.some(u=>u.name===d)?r("preview.exists",{name:d}):""},i={tall:!0,steps:[Wr(n),Ur(n),Or(n,s,o)],finishLabel:()=>n.mode==="fork"?r("action.fork"):r("action.create"),finish:()=>Dr(n,s(),e)};M(i)}function Wr(e){return{label:r("step.mode.label"),heading:r("step.mode.heading"),lead:r("step.mode.lead"),ready:()=>e.mode==="fork"||re(e.branch),enter(t,n){let s=l.branches.length>0;s||(e.mode="fork");let o=()=>{v(a`
                    <sds-radio
                        legend=${r("step.mode.heading")}
                        legend-said-only
                        name="createMode"
                        hint=${s?"":r("mode.branchNone")}
                        value=${e.mode}
                        .choices=${[...s?[{label:r("mode.branch"),value:"branch",hint:r("mode.branchHint")}]:[],{label:r("mode.fork"),value:"fork",hint:r("mode.forkHint")}]}
                        @sds-change=${i=>{e.mode=i.detail==="branch"?"branch":"fork",e.branch="",o()}}></sds-radio>
                    <div class="branchery-choice-detail" ?hidden=${e.mode!=="branch"}>
                        <div class="branchery-choice-find">
                            <sds-field
                                label=${r("field.branch")}
                                value=${e.branch===""?r("field.branchFilter"):e.branch}
                                ?filled=${e.branch!==""}
                                @sds-input=${i=>{e.branch=i.detail.trim(),o()}}></sds-field>
                            <span class="branchery-choice-count"
                                  >${r("overview.branches",{count:l.branches.length})}</span>
                        </div>
                        <div class="branchery-picklist">${Lr(e,o)}</div>
                        <sds-note tone="error" ?hidden=${zt(e.branch)===""}
                                  body=${zt(e.branch)}></sds-note>
                    </div>`,t),n.update()};o()}}}function Lr(e,t){let n=e.branch.toLowerCase(),s=l.branches.map(i=>i.name),o=s.includes(e.branch)?s:s.filter(i=>i.toLowerCase().includes(n));return o.length===0?a`<p class="branchery-picklist__empty">${r("step.branch.noMatch")}</p>`:o.map(i=>a`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(i===e.branch)}
                @click=${()=>{e.branch=i,t()}}>${i}</button>`)}function Ur(e){return{label:r("step.fork.label"),heading:r("step.fork.heading"),lead:r("step.fork.lead"),when:()=>e.mode==="fork",ready:()=>re(e.branch)&&!is(e.branch),enter(t,n){let s=()=>{v(a`
                    ${""}
                    <sds-field
                        field-id="newBranch"
                        caption=${r("field.newBranch")}
                        value=${e.branch===""?r("field.newBranchPlaceholder"):e.branch}
                        ?filled=${e.branch!==""}
                        @sds-input=${o=>{e.branch=o.detail.trim(),s()}}></sds-field>
                    ${Br(e)}
                    <sds-note tone="error" ?hidden=${rs(e.branch)===""}
                              body=${rs(e.branch)}></sds-note>`,t),n.update()};s()}}}function Br(e){let t=document.createElement("sds-select");return t.caption=r("field.branchFrom"),t.options=[{label:r("field.branchFromProject",{branch:l.branch}),value:""},...l.worktrees.map(n=>({label:n.name,value:n.name}))],t.value=e.from,t.filled=!0,t.addEventListener("sds-change",n=>{e.from=n.detail}),t}function Or(e,t,n){return{label:r("step.review.label"),heading:r("step.review.heading"),lead:r("step.review.lead"),ready:()=>t()!==""&&n()==="",enter(s,o){os=i=>xe(e,t,n,s,o,i),ls(e,t(),()=>{w("#name")!==null&&xe(e,t,n,s,o)}),xe(e,t,n,s,o)},leave(){window.clearTimeout(It)}}}function as(e,t){return JSON.stringify([e.mode,e.branch,e.mode==="fork"?e.from:"",t])}async function ls(e,t,n){let s=as(e,t);if(Mt.get(s)!=null||Jt.has(s))return;Jt.add(s);let o=null;try{o=await m.preview({mode:e.mode,branch:e.branch,from:e.from,name:e.name})}catch{}finally{Jt.delete(s)}Mt.set(s,o),n()}function Hr(e,t,n,s,o){window.clearTimeout(It),It=window.setTimeout(()=>{ls(e,t(),()=>{w("#name")!==null&&xe(e,t,n,s,o)})},jr)}function xe(e,t,n,s,o,i=""){let d=e.mode==="fork"?l.worktrees.find(h=>h.name===e.from):void 0,u=r("preview.databaseCopy",{name:d?.database??l.project?.database??"db"}),p=i!==""?i:n(),f=Mt.get(as(e,t())),b=f===void 0?A(2):f===null?d?d.php:r("preview.phpFromProject"):f.php??r("preview.phpRead",{file:f.readFrom??""});v(a`
        <div class="branchery-preview">
            <dl>
                <dt>${r("preview.branch")}</dt>
                <dd><code class="sds-mono">${e.branch}</code></dd>
                <dt>${r("preview.directory")}</dt>
                <dd><code class="sds-mono">.worktrees/${t()}</code></dd>
                <dt>${r("preview.address")}</dt>
                <dd><code class="sds-mono">https://${Me(t())}.${l.tld}</code></dd>
                <dt>${r("preview.database")}</dt>
                <dd>${u}</dd>
                <dt>${r("preview.php")}</dt>
                <dd>${b}</dd>
            </dl>
        </div>
        ${(f?.warnings??[]).map(h=>a`<sds-note tone="warn" body=${h}></sds-note>`)}
        <sds-field
            field-id="name"
            caption=${r("field.nameOverride")}
            hint=${r("field.namePlaceholder")}
            value=${e.name===""?Me(e.branch):e.name}
            ?filled=${e.name!==""}
            @sds-input=${h=>{e.name=h.detail.trim(),xe(e,t,n,s,o),Hr(e,t,n,s,o)}}></sds-field>
        ${p===""?c:a`<sds-note tone="error" body=${p}></sds-note>`}`,s),o.update()}async function Dr(e,t,n){let s=e.mode==="fork"?{mode:"fork",branch:e.branch,from:e.from,name:e.name}:{mode:"branch",branch:e.branch,name:e.name};try{let o=await m.createWorktree(s);n.onJob(o.job,t)}catch(o){P(o),w("#name")!==null&&os?.(C(o))}}function lt(e){return e.filter(t=>!t.isProject&&(t.merged||t.gone)&&t.changes===0)}function ds(e){return e.merged}function cs(e,t){let n=lt(e),s=new Set(n.filter(ds).map(o=>o.name));M({tall:n.length>3,steps:[{label:r("tidy.step"),heading:r("tidy.heading"),lead:r("tidy.lead"),enter(o,i){v(a`
                    <sds-checkbox-group
                        legend=${r("tidy.heading")}
                        legend-said-only
                        name="tidy"
                        .choices=${n.map(d=>({label:d.name,value:d.name,hint:`${d.branch} \xB7 ${Fr(d)}`}))}
                        .values=${[...s]}
                        @sds-change=${d=>{s.clear();for(let u of d.detail)s.add(u);i.update()}}></sds-checkbox-group>`,o)},ready:()=>s.size>0}],finishLabel:()=>r("tidy.confirm",{count:s.size}),finish:()=>Nr(n.filter(o=>s.has(o.name)),t)})}function Fr(e){return e.merged?r("tidy.why.merged"):r("tidy.why.gone")}async function Nr(e,t){ot(r("tidy.working"),r("tidy.workingLead",{count:e.length}));let n=await Promise.allSettled(e.map(i=>m.removeWorktree(i.name))),s=[];n.forEach((i,d)=>{let u=e[d]?.name??"";i.status==="fulfilled"?s.push({job:i.value.job,name:u}):P(i.reason)});let o=s[0];if(o===void 0){L();return}t.onJob(o.job,o.name,"remove")}function us(e){return{cells:[{value:a`<span class="branchery-list__title">${e.subject}</span>`,note:qt(`${r("table.making")} \xB7 ${e.step?.label??Ut(e.command)}`)},"","",""]}}function qt(e){return a`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${e}</span>`}function ps(e){let t=ee(e.name);return{cells:[{value:a`<a class="branchery-list__title" href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:hs(e)}`,note:t===void 0?bs(e):qt(t)},Kr(e),e.php,Jr(e)]}}function Jr(e){return a`
        <span class="branchery-list__ways">
            ${""}
            <sds-button variant="secondary" size="sm" icon-only
                        href=${e.url} rel="external"
                        title=${r("table.openSiteAt",{host:oe(e.url)})}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${$(r("table.view"),a`<sds-button variant="secondary" size="sm" href="#/w/${e.name}"
                        title=${r("table.viewOf",{name:e.name})}>${r("table.view")}</sds-button>`)}
        </span>`}function Mr(e){return e.split("_").map((t,n)=>n===0?a`${t}`:a`_<wbr>${t}`)}function hs(e){return a`${Ir(e)}${zr(e)}${e.stale?a` <sds-badge label=${r("table.staleMark")} tone="warn"></sds-badge>`:c}`}function Ir(e){return e.ready?e.incomplete?a` <sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a` <sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}function zr(e){return e.merged?a` <sds-badge label=${r("table.mergedMark")} tone="ok"></sds-badge>`:e.gone?a` <sds-badge label=${r("table.goneMark")} tone="warn"></sds-badge>`:c}function ms(){let e=l.project;if(e===null)return l.loading?qr():c;let t=ee(e.name);return fs({name:a`<a class="branchery-checkout__name"
                      href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:hs(e)}`,meta:t===void 0?a`${bs(e)}${Gr(e)}`:qt(t),php:e.php,database:a`<code class="sds-mono">${Mr(e.database)}</code>`,address:a`<sds-link external href=${e.url} label=${oe(e.url)}></sds-link>`})}function qr(){return fs({name:a`<span class="branchery-checkout__name">${A(0,"branchery-waiting__title")}</span>`,meta:A(1),php:A(0),database:A(1),address:A(2)})}function fs(e){return a`
        <div class="branchery-checkout">
            <p class="sds-label">${r("overview.checkout")}</p>
            <div class="branchery-checkout__body">
                <div class="branchery-checkout__what">
                    ${e.name}
                    <p class="branchery-checkout__meta">${e.meta}</p>
                </div>
                <dl class="sds-facts branchery-checkout__facts">
                    <dt>${r("table.php")}</dt>
                    <dd>${e.php}</dd>
                    <dt>${r("table.database")}</dt>
                    <dd>${e.database}</dd>
                    <dt>${r("table.address")}</dt>
                    <dd>${e.address}</dd>
                </dl>
            </div>
        </div>`}function gs(e){let t=!e.onRemote&&l.remotes.length>0;return a`${t?a`<span>${r("table.nowhere")}</span>`:c}${e.tip===null?c:a`<span
            class="branchery-list__tip">${e.tip.subject} · ${e.tip.sha}</span>`}`}function bs(e){return a`<span class="branchery-list__what">${e.branch}${e.tip===null?c:a` · ${e.tip.subject}`}</span>`}function Kr(e){let t=vs(e);return t.length===0?"":a`${t.map(n=>a`<span class="branchery-list__count">${n}</span>`)}`}function Gr(e){let t=vs(e);return t.length===0?c:a`<span class="branchery-list__count">${t.join(" \xB7 ")}</span>`}function vs(e){let t=[];return e.changes>0&&t.push(r("table.changes",{count:e.changes})),e.ahead!==null&&e.ahead>0&&t.push(r("table.unpushed",{count:e.ahead})),e.behind!==null&&e.behind>0&&t.push(r("table.behind",{count:e.behind})),t}function ys(e){return ws(e)?{shown:"nothing"}:e.loading?{shown:"waiting"}:e.shown===0&&e.pending===0?{shown:"empty",because:e.filtered?"noMatch":"none"}:{shown:"rows"}}function $s(e){return ws(e)?null:e.loading||e.total===0?{key:"nav.worktrees",params:{}}:e.filtered?{key:"overview.matching",params:{shown:e.shown,total:e.total}}:{key:"overview.worktrees",params:{count:e.total}}}function ws(e){return e.unreachable&&e.entries===0}var Vr=6,Ss=10,Kt=class extends E{handlers;needle="";allBranches=!1;willUpdate(){l.loading||to()}arrived(){window.addEventListener("keydown",this.reachedByKey),this.untilLeft(()=>window.removeEventListener("keydown",this.reachedByKey))}listState(t,n,s){return{unreachable:l.unreachable,loading:l.loading,entries:t.length,total:l.worktrees.length,shown:n,pending:s,filtered:this.needle.trim()!==""}}render(){let t=Xr(),n=ss(it(l.worktrees,this.needle),l.project?.branch??l.branch);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${Qr(t)}
            ${this.tidyNote(t)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${Zr()?A(0,"branchery-waiting__title"):Yr()}</h2>
                ${l.repository===null?c:a`<span class="sds-row sds-row__end">${ae(l.repository,r("detail.repository"))}</span>`}
            </div>
            ${ms()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${t.length+l.branches.length>=Vr?this.field():c}
                <div class="branchery-section-actions">${this.actions()}</div>
            </div>
            ${this.listHead(t,n.length)}
            ${this.list(t,n)}
        </section>
        ${this.freeBranches()}
      </div>`}tidyNote(t){let n=lt(t);return n.length===0||l.loading?c:a`
        <sds-note tone="info"
                  body=${r("tidy.note",{count:n.length,names:_s(n)})}
                  action=${r("tidy.open")}
                  @sds-note-action=${()=>cs(t,this.handlers)}></sds-note>`}field(){return a`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${r("overview.filter")}
            value=${this.needle===""?r("overview.filterPlaceholder"):this.needle}
            ?filled=${this.needle!==""}
            @sds-input=${t=>this.narrow(t.detail)}
            @keydown=${t=>this.leaveOrOpen(t)}></sds-field>`}narrow(t){this.needle=t,this.requestUpdate()}leaveOrOpen(t){if(t.key==="Escape"){t.target instanceof HTMLElement&&t.target.blur(),this.narrow("");return}if(t.key==="Enter"){let n=it(l.worktrees,this.needle)[0]??it(l.project===null?[]:[l.project],this.needle)[0];n!==void 0&&(t.preventDefault(),Qe(`/w/${n.name}`))}}controls=null;actions(){let t=JSON.stringify([l.remotes,l.language]);if(this.controls?.key!==t){let n=this.buildFetch();this.controls={key:t,nodes:[...n===null?[]:[n],this.creating()]}}return this.controls.nodes}creating(){let t=_(r("nav.newWorktree"),"primary",()=>I(this.handlers));return t.title=`${r("nav.newWorktree")} (n)`,t}list(t,n){let s=ts(l.runningJobs,t.map(d=>d.name)).filter(d=>at(d.subject,this.needle)),o=ys(this.listState(t,n.length,s.length));if(o.shown==="nothing")return c;if(o.shown==="empty")return a`<p class="branchery-list__empty">${r(o.because==="noMatch"?"overview.noMatch":"table.empty")}</p>`;let i=o.shown==="waiting";return a`
        <sds-table
            ?loading=${i}
            loading-rows=${eo()}
            .columns=${[{head:r("table.worktree"),cls:"sds-td-name"},{head:r("table.outstanding"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.php"),fit:!0},{head:"",cls:"sds-td-into"}]}
            .rows=${i?[]:[...s.map(us),...n.map(ps)]}></sds-table>`}listHead(t,n){let s=$s(this.listState(t,n,0));return s===null?c:a`<h2 class="sds-h3">${r(s.key,s.params)}</h2>`}freeBranches(){if(l.loading||l.branches.length===0)return c;let t=ns(l.branches,this.needle);if(t.length===0)return c;let n=t.length-Ss,s=this.allBranches||n<=0?t:t.slice(0,Ss);return a`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${this.needle.trim()===""?r("overview.branches",{count:l.branches.length}):r("overview.branchesMatching",{shown:t.length,total:l.branches.length})}</h2>
            <sds-table
                .columns=${[{head:r("table.branch"),cls:"sds-td-name"},{head:r("table.when"),cls:"sds-td-meta",fit:!0},{head:"",cls:"sds-td-into"}]}
                .rows=${s.map(o=>this.branchRow(o))}></sds-table>
            ${this.allBranches||n<=0?c:a`
                <p class="branchery-branches__more">
                    ${$(r("overview.showAllBranches",{count:n}),a`<sds-button variant="ghost" @click=${()=>{this.allBranches=!0,this.requestUpdate()}}
                        >${r("overview.showAllBranches",{count:n})}</sds-button>`)}
                </p>`}
        </section>`}branchRow(t){return{cells:[{value:a`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(t.name)}">${t.name}</a>`,note:gs(t)},T(t.when,l.language),a`${$(r("nav.newWorktree"),a`<sds-button variant="ghost" size="sm"
                             title=${r("table.worktreeOf",{branch:t.name})}
                             @click=${()=>I(this.handlers,t.name)}
                    >${r("nav.newWorktree")}</sds-button>`)}`]}}buildFetch(){let t=l.remotes,n=t[0];if(n===void 0)return null;if(t.length===1)return _(r("nav.fetch",{remote:n}),"ghost",()=>void this.startFetch(n));let s=document.createElement("sds-dropdown");return s.label=r("nav.fetchFrom"),s.variant="ghost",s.align="end",s.choices=t.map(o=>({label:o})),s.addEventListener("sds-dropdown-choose",o=>{let i=t[o.detail.index];i!==void 0&&this.startFetch(i)}),s}async startFetch(t){try{let n=await m.fetch(t);W(""),this.handlers.onJob(n.job,null,"fetch")}catch(n){P(n)}}reachedByKey=t=>{if(t.altKey||t.ctrlKey||t.metaKey||t.defaultPrevented)return;let n=t.target;if(!(n instanceof Element&&n.closest("input, textarea, select, [contenteditable], dialog[open]"))){if(t.key==="/"){let s=w("#filter");s&&(t.preventDefault(),s.focus(),s.select());return}t.key==="n"&&w(".branchery-section-actions")!==null&&(t.preventDefault(),I(this.handlers))}}};customElements.define("branchery-overview",Kt);function Yr(){return l.repository!==null?Pn(l.repository):l.projectName===""?r("nav.worktrees"):l.projectName}function Zr(){return l.loading&&l.repository===null&&l.projectName===""}function Qr(e){let t=e.filter(n=>n.incomplete&&ee(n.name)===void 0);return t.length===0||l.loading?c:a`
        <sds-note tone="warn"
                  body=${r("overview.unfinished",{count:t.length,names:_s(t)})}></sds-note>`}function _s(e){return e.map(t=>t.name).join(", ")}function Xr(){return l.project?[l.project,...l.worktrees]:l.worktrees}var ks="branchery-rows";function eo(){let e=l.worktrees.length;if(e>0)return e;let t=Number(Ke(ks));return Number.isFinite(t)&&t>0?t:1}function to(){Ge(ks,String(l.worktrees.length))}function pe(e,t){return async(n,s,o)=>{let i=null,d="";try{i=await n()}catch(u){d=e(u)}s()&&(o(i,d),t())}}function te(){let e="",t=null,n="",s=o=>e===o;return{about(o){return e!==o?(e=o,t=null,n="",!0):t===null&&n===""},of:o=>s(o)?t:null,stillOn:s,trouble:o=>s(o)?n:"",put(o,i){s(o)&&(t=i,n="")},failed(o,i){s(o)&&(t=null,n=i)},forget(o){s(o)&&(e="",t=null,n="")},clear(){e="",t=null,n=""}}}async function ne(e,t,n,s){await s(n,()=>e.stillOn(t),(o,i)=>{if(o===null){e.failed(t,i);return}e.put(t,o)})}function F(e,t){return a`
        <div class="sds-row branchery-back">
            ${$(e,a`<sds-button variant="ghost" href=${t}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${e}</sds-button>`)}
        </div>`}var xs=25;function dt(e){let t=e.files.length-xs,n=e.all||t<=0?e.files:e.files.slice(0,xs);return a`
        <ul class="branchery-changes">
            ${n.map(s=>{let o=e.diffs.get(s.path),i=o?.open===!0;return a`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${i}
                                @click=${()=>e.press(s.path)}>
                            <sds-badge label=${r(`change.${s.status}`)}
                                       tone=${s.status==="deleted"?"warn":c}></sds-badge>
                            ${no(s.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${i?"actions-chevron-down":"actions-chevron-end"}></sds-icon>
                        </button>
                        ${i?so(o):c}
                    </li>`})}
        </ul>
        ${e.all||t<=0?c:a`
            <p class="branchery-changes__more">
                ${$(r("detail.showAllFiles",{count:t}),a`<sds-button variant="ghost" @click=${e.showAll}>${r("detail.showAllFiles",{count:t})}</sds-button>`)}
            </p>`}`}function no(e){let t=e.lastIndexOf("/");return a`<code class="sds-mono branchery-changes__path">${t<0?c:a`<span class="branchery-changes__dir">${e.slice(0,t+1)}</span>`}${e.slice(t+1)}</code>`}function so(e){return e===void 0||e.read===null&&e.trouble===""?U():e.read===null?a`<sds-note tone="warn" body=${`${r("detail.changeFailed")} ${e.trouble}`}></sds-note>`:a`
        <sds-diff path=${e.read.path} .body=${e.read.lines}></sds-diff>
        ${e.read.truncated?a`<p class="branchery-changes__more">${r("detail.changeTruncated")}</p>`:c}`}function ct(e,t,n){let s=e.get(t)??{read:null,trouble:"",open:!1};s.open=!s.open,e.set(t,s),s.open&&s.read===null&&n()}function ut(e,t,n,s){let o=e.get(t);o!==void 0&&e.set(t,{...o,read:n,trouble:s})}function Te(e,t){return`${e}${t}`}var Gt=class extends E{name="";sha="";branch="";read=te();diffs=new Map;all=!1;reading=pe(C,()=>this.requestUpdate());get of(){return this.branch===""?this.name:l.projectName}willUpdate(){let t=this.of;this.read.about(Te(t,this.sha))&&(this.diffs=new Map,this.all=!1,this.readCommit(t,this.sha))}render(){let t=this.of,n=this.read.of(Te(t,this.sha));return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${this.branch===""?F(this.name,`#/w/${encodeURIComponent(this.name)}`):F(this.branch,`#/b/${encodeURIComponent(this.branch)}`)}
            ${n===null?this.beforeTheAnswer(t,this.sha):ro(t,n,this.branch)}
        </section>
        ${n===null?c:this.touched(this.name,n)}
      </div>`}beforeTheAnswer(t,n){let s=this.read.trouble(Te(t,n));return a`
        <h1 class="sds-h2"><span class="sds-mono">${n}</span></h1>
        ${s===""?U():a`<sds-note tone="warn" body=${`${r("detail.commitFailed")} ${s}`}></sds-note>`}`}touched(t,n){return a`
        <section class="sds-band sds-band--quiet">
            ${""}
            <h2 class="sds-h3">${n.files.length===0?r("detail.touchedNothingHeading"):r("detail.touched",{count:n.files.length})}</h2>
            ${n.files.length===0?a`<p class="branchery-list__quiet">${r("detail.touchedNothing")}</p>`:dt({files:n.files,diffs:this.diffs,press:s=>this.toggleDiff(t,n.sha,s),all:this.all,showAll:()=>{this.all=!0,this.requestUpdate()}})}
        </section>`}toggleDiff(t,n,s){ct(this.diffs,s,()=>void this.readDiff(t,n,s)),this.requestUpdate()}stillReading(t,n){return this.read.stillOn(Te(t,n))}async readCommit(t,n){await ne(this.read,Te(t,n),()=>m.commit(t,n),this.reading)}async readDiff(t,n,s){await this.reading(()=>m.commitDiff(t,n,s),()=>this.stillReading(t,n)&&this.diffs.has(s),(o,i)=>ut(this.diffs,s,o,i))}};customElements.define("branchery-commit",Gt);function ro(e,t,n){return a`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${t.subject}
                ${t.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${t.url===null?c:a`${ae(t.url,r("detail.commitAtForge"))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${r("table.author")}</dt>
            <dd>${t.author}</dd>
            <dt>${r("table.when")}</dt>
            <dd>${T(t.when,l.language)}</dd>
            <dt>${r("table.commit")}</dt>
            ${""}
            <dd><sds-copy value=${t.id} label=${r("table.commit")}></sds-copy></dd>
            ${t.parents.length===0?c:a`
                <dt>${r("detail.parents")}</dt>
                ${""}
                <dd>${t.parents.map((s,o)=>a`${o===0?c:" \xB7 "}<sds-link
                    href=${n===""?`#/w/${encodeURIComponent(e)}/c/${s}`:`#/b/${encodeURIComponent(n)}/c/${s}`} label=${s}></sds-link>`)}</dd>`}
        </dl>
        ${t.body===""?c:a`<pre class="branchery-message">${t.body}</pre>`}`}var pt={log:"",size:0,steps:[]};function ht(e,t){let n=new Map(e.steps.map(s=>[s.no,s.output]));return{log:t.partial?e.log+t.log:t.log,size:t.size,steps:t.steps.map(s=>({...s,output:s.output??n.get(s.no)??""}))}}function Rs(e){switch(e){case"running":return"job.running";case"done":return"job.done";case"failed":return"job.failed";default:return"job.unknown"}}function Vt(e){return e==="done"}function mt(e){let t=e.trim().split(`
`).reverse().find(n=>n.startsWith(Ts));return t===void 0?"":t.slice(Ts.length).trim()}var Ts="\u2717";function Yt(e){return e.madeFor!==null&&e.madeFor!==e.branch}function Cs(e){return{doing:[...io(e),...oo],undoing:ao(e)}}var oo=[{action:"edit",held:null},{action:"sync",held:null},{action:"provision",held:null}];function io(e){return Yt(e)?[{action:"restore",held:null}]:e.behind===null?[]:[{action:"pull",held:e.behind===0?"detail.pullBlocked":null}]}function ao(e){return[...(e.ahead??0)>0?[{action:"discard",held:e.changes>0?"detail.discardBlocked":null}]:[],{action:"remove",held:null}]}function Es(e){let t={php:e.php},n=()=>{let o=[];return t.php!==e.php&&o.push({label:r("table.php"),value:t.php,note:r("edit.effect.php")}),o},s={steps:[lo(e,t),co(e,n)],finishLabel:()=>r("action.apply"),finish:()=>uo(e,t)};M(s)}function lo(e,t){return{label:r("table.php"),heading:r("edit.step.php.heading",{name:e.name}),lead:r("edit.step.php.lead"),ready:()=>t.php!==e.php,enter(n,s){let o=l.phpVersions.filter(i=>i===e.php||e.minPhp===null||An(i,e.minPhp)>=0);v(a`${qe(o.map(i=>({value:i,label:i,...i===e.php?{hint:r("edit.current")}:{}})),t.php,i=>{t.php=i,s.update()},r("table.php"))}`,n)}}}function co(e,t){return{label:r("step.review.label"),heading:r("edit.step.review.heading",{name:e.name}),lead:r("step.review.lead"),enter(n){v(a`
                <div class="branchery-preview">
                    <dl>
                        ${t().map(s=>a`
                            <dt>${s.label}</dt>
                            <dd>${s.value}<span class="branchery-preview__note">${s.note}</span></dd>`)}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,n)}}}async function uo(e,t){try{t.php!==e.php&&await m.updateWorktree(e.name,{php:t.php}),W(""),await R(),L()}catch(n){P(n);let s=w("#editError");s!==null&&(s.body=C(n),s.hidden=!1)}}var po=10;function As(){return[{head:"",cls:"sds-td-graph"},{head:r("table.subject")},{head:r("table.when"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.author"),fit:!0},{head:r("table.commit"),cls:"sds-td-name",fit:!0}]}function ho(){return a`<sds-table scrollable loading loading-rows=${po} .columns=${As()}></sds-table>`}function mo(e,t){return e.commits.length===0?c:a`<sds-table
        scrollable
        .columns=${As()}
        .rows=${e.commits.map((n,s)=>{let o=!n.own&&(s===0||e.commits[s-1]?.own===!0),i=a`${n.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge> `}${o&&e.base!==null?a`<sds-badge label=${e.base} tone="neutral"></sds-badge> `:c}<span
                    class=${n.own?"branchery-subject":"branchery-subject branchery-subject--base"}><sds-link
                    href=${t(n.sha)}
                    label=${n.subject}></sds-link></span>`;return{cells:[fo(s===0?"current":""),s===0?a`<strong>${i}</strong>`:i,T(n.when,l.language),n.author,n.url===null?a`<code class="sds-mono">${n.sha}</code>`:a`<sds-link external href=${n.url} label=${n.sha}></sds-link>`]}})}></sds-table>`}function fo(e){return a`<span class="sds-graph${e===""?"":` sds-graph--${e}`}"></span>`}function go(e,t,n,s){return!e.more&&t===""?c:a`
        <p class="branchery-changes__more">
            ${t===""?c:a`<sds-note tone="warn" body=${`${r("detail.commitsFailed")} ${t}`}></sds-note>`}
            ${e.more?n?$(r("detail.loading"),a`<sds-button variant="ghost" disabled>${r("detail.loading")}</sds-button>`):$(r("detail.olderCommits"),a`<sds-button variant="ghost" @click=${s}>${r("detail.olderCommits")}</sds-button>`):c}
        </p>`}function ft(e,t,n){let s=Zt("");async function o(i,d){d>0&&s.name===i&&(s={...s,reading:!0,trouble:""},n()),await t(()=>e(i,d),()=>s.name===i,(u,p)=>{let f=d>0?s.commits?.commits??[]:[];s={name:i,commits:u===null?s.commits:{...u,commits:[...f,...u.commits]},trouble:p,reading:!1}})}return{about(i){s.name!==i&&(s=Zt(i),o(i,0))},of:i=>s.name===i?s.commits:null,trouble:i=>s.name===i&&s.commits===null&&s.trouble!==""?`${r("detail.commitsFailed")} ${s.trouble}`:"",body(i,d){let u=s.name===i?s.commits:null;return u===null?ho():a`${mo(u,d)}
                ${go(u,s.trouble,s.reading,()=>void o(i,u.commits.length))}`},forget(i){s.name===i&&(s=Zt(""))}}}function Zt(e){return{name:e,commits:null,trouble:"",reading:!1}}function gt(e){return e.facts.length===0?c:a`
        <div class="sds-facts-group">
            <p class="sds-label">${e.title}</p>
            <dl class="sds-facts">${e.facts.map(bo)}</dl>
        </div>`}function bo(e,t){return a`
        <dt>${e.label}</dt>
        <dd>${e.waiting===!0?A(t):e.copy===!0?a`<sds-copy value=${e.value} label=${e.label}></sds-copy>`:e.said===!0?e.value:a`<code class="sds-mono">${e.value}</code>`}</dd>`}function bt(e){return[e.own>0?r("detail.ownCommits",{count:e.own}):r("detail.ownNone"),...e.moved>0?[r("table.baseMoved",{base:e.branch,count:e.moved})]:[]].join(" \xB7 ")}var Re={user:"admin",password:"Password1!"};function Ps(e,t){return[{title:r("detail.repository"),facts:[{label:r("table.branch"),value:e.branch},...Yt(e)?[{label:r("detail.madeFor"),value:e.madeFor??""}]:[],...e.base!==null?[{label:r("detail.base"),value:e.forkedAt!==null&&e.forkedFrom===e.base.branch?`${e.base.branch} @ ${e.forkedAt.slice(0,11)}`:e.base.branch},{label:r("detail.sinceBase"),value:bt(e.base),said:!0}]:[],{label:r("detail.commits"),value:yo(e),said:!0},{label:r("detail.changes"),value:e.changes>0?r("table.changes",{count:e.changes}):r("detail.clean"),said:!0},...e.builtAt===null?[]:[{label:r("detail.built"),value:T(e.builtAt,l.language),said:!0}]]},{title:r("table.address"),facts:[{label:r("detail.site"),value:oe(e.url),copy:!0},...e.backend===null?[]:[{label:r("detail.backend"),value:oe(e.backend),copy:!0}]]},{title:r("detail.serving"),facts:[{label:r("table.php"),value:e.php+(e.minPhp!==null&&e.minPhp!==e.php?` (${r("detail.minPhp",{version:e.minPhp})})`:"")},...e.node===null?[]:[{label:r("table.node"),value:e.node}],{label:r("table.profile"),value:e.profile??r("table.noProfile")},{label:r("table.docroot"),value:e.docroot===""?"/":e.docroot}]},{title:r("detail.taken"),facts:[{label:r("table.directory"),value:e.path,copy:!0},{label:r("table.database"),value:e.database,copy:!0},...e.backend===null?[]:[{label:r("detail.user"),value:Re.user,copy:!0},{label:r("detail.password"),value:Re.password,copy:!0}]]},...e.isProject?[]:[vo(t)]]}function vo(e){return e.trouble!==""?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:`${r("detail.storageFailed")} ${e.trouble}`,said:!0}]}:e.value===null?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:"",waiting:!0},{label:r("detail.storageFiles"),value:"",waiting:!0},{label:r("detail.storageDatabase"),value:"",waiting:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}:{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:ze(e.value.total,l.language),said:!0},{label:r("detail.storageFiles"),value:ze(e.value.files,l.language),said:!0},{label:r("detail.storageDatabase"),value:ze(e.value.database,l.language),said:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}}function yo(e){if(e.gone)return r("table.gone");if(e.ahead===null||e.behind===null)return r("detail.noRemote");let t=[...e.ahead>0?[r("table.unpushed",{count:e.ahead})]:[],...e.behind>0?[r("table.behind",{count:e.behind})]:[]];return t.length===0?r("detail.inStep"):t.join(" \xB7 ")}var z=y("#changes"),Qt="";function js(){return Qt}function Ws(e,t,n){Qt=e,z.heading=t,z.body=n,z.actions=[a`${$(r("action.close"),a`<sds-button variant="ghost" @click=${()=>z.close()}>${r("action.close")}</sds-button>`)}`],z.show()}function Ls(){z.close()}function Us(e){let t=()=>{Qt="",e()};return z.addEventListener("sds-dialog-cancel",t),()=>z.removeEventListener("sds-dialog-cancel",t)}var he=y("#confirm");function vt(e){return he.heading=e.title,he.body=$o(e),he.confirmLabel=e.confirmLabel,he.cancelLabel=r("action.cancel"),he.tone=e.tone??"primary",he.ask()}function $o(e){return a`
        <p>${e.message}</p>
        ${e.warning===void 0?c:a`<sds-note tone="warn" body=${e.warning}></sds-note>`}
        ${e.facts===void 0||e.facts.length===0?c:a`
            <div class="branchery-preview">
                <dl>${e.facts.map(t=>a`
                    <dt>${t.label}</dt>
                    <dd><code class="sds-mono">${t.value}</code></dd>`)}</dl>
            </div>`}`}async function Bs(e,t){await vt({title:r("confirm.sync.title"),message:r("confirm.sync.body"),facts:[{label:r("table.worktree"),value:e.name},{label:r("table.database"),value:e.database},{label:r("confirm.source"),value:r("field.branchFromProject",{branch:l.project?.branch??l.branch})}],confirmLabel:r("action.sync")})&&await me(()=>m.syncWorktree(e.name),e.name,"sync",t)}function wo(e){return[...e.ahead===null?[r("confirm.worktree.nowhere")]:[],...e.ahead!==null&&e.ahead>0?[r("confirm.worktree.unpushed",{count:e.ahead})]:[],...e.changes>0?[r("confirm.worktree.changes",{count:e.changes})]:[]]}async function Os(e,t,n){let s=n;if(s===null)try{s=await m.commits(e.name)}catch(u){P(u);return}let o=s.commits.filter(u=>!u.pushed),i=s.upstream??e.branch;await vt({title:r("confirm.discard.title"),message:r("confirm.discard.body",{upstream:i}),...(e.behind??0)>0?{warning:r("confirm.discard.behind",{count:e.behind??0})}:{},facts:o.map(u=>({label:u.sha,value:u.subject})),confirmLabel:r("action.discard"),tone:"danger"})&&await me(()=>m.discardWorktree(e.name),e.name,"discard",t)}async function Hs(e,t){await me(()=>m.restoreWorktree(e.name),e.name,"restore",t)}async function Ds(e,t){await me(()=>m.pullWorktree(e.name),e.name,"pull",t)}async function yt(e,t,n){await me(()=>m.provisionWorktree(e,t),e,"create",n)}async function Fs(e,t){let n=wo(e);await vt({title:r("confirm.worktree.title"),message:r("confirm.worktree.body"),...n.length>0?{warning:n.join(" ")}:{},facts:[{label:r("table.worktree"),value:e.name},{label:r("table.branch"),value:e.branch},{label:r("table.database"),value:e.database}],confirmLabel:r("action.remove"),tone:"danger"})&&await me(()=>m.removeWorktree(e.name),null,"remove",t)&&Qe("/")}async function me(e,t,n,s){try{let o=await e();return W(""),s.onJob(o.job,t,n),!0}catch(o){return P(o),await R(),!1}}function $t(e,t){let n={fresh:!1},s={steps:[So(e,n)],finishLabel:()=>n.fresh?r("provision.fresh"):r("table.provision"),finish:()=>t(n.fresh)};M(s)}function So(e,t){return{label:r("table.database"),heading:r("provision.heading",{name:e.name}),lead:r("provision.lead"),enter(n,s){v(a`${qe([{value:"keep",label:r("provision.keep"),hint:r("provision.keepHint")},{value:"fresh",label:r("provision.fresh"),hint:r("provision.freshHint")}],t.fresh?"fresh":"keep",o=>{t.fresh=o==="fresh",s.update()},r("table.database"))}`,n)}}}function Xt(e){return{name:e,list:{read:null,trouble:"",open:!1},all:!1,diffs:new Map}}var en=class extends E{name="";handlers;past=te();opened=new Map;askingFor=new Set;usage=te();files=Xt("");reading=pe(C,()=>this.requestUpdate());log=ft((t,n)=>m.commits(t,n),this.reading,()=>this.requestUpdate());bar=null;arrived(){this.untilLeft(Us(()=>{this.files.list.open=!1,this.requestUpdate()})),this.untilLeft(Vn(t=>this.operationEnded(t)))}left(){Ls()}operationEnded(t){if(this.past.stillOn(t)&&(this.past.forget(t),this.opened.clear()),this.log.forget(t),this.files.name===t){let n=js()===t;this.files=Xt(n?t:""),n&&(this.files.list.open=!0,this.readChanges(t))}this.usage.forget(t),this.name===t&&this.requestUpdate()}get worktree(){return[l.project,...l.worktrees].find(t=>t?.name===this.name)??null}willUpdate(){let t=this.name,n=this.worktree;this.past.about(t)&&(this.opened.clear(),this.readHistory(t));let s=n?.incomplete===!0?this.lastFailed():null;s!==null&&!this.opened.has(s.id)&&this.readJob(s.id),n!==null&&this.log.about(t),n!==null&&!n.isProject&&this.usage.about(t)&&this.readUsage(t)}render(){let t=this.worktree;return t===null?_o(this.name):this.page(t)}updated(){this.files.name===this.name&&this.files.list.open&&Ws(this.name,r("table.uncommitted"),this.changeList(this.name))}page(t){let n=ee(t.name);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${F(r("detail.back"),"#/")}
            ${""}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${t.name}</span>
                    ${t.ready?t.incomplete?a`<sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a`<sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}
                </h1>
                <span class="sds-row sds-row__end">
                    ${Ce(t.url,r("table.openSite"))}
                    ${Ce(t.backend,r("detail.backend"))}
                    ${t.isProject?Ce(l.repository,r("detail.repository")):c}
                    ${Ce(t.review,r("detail.review"))}
                    ${Ce(t.issue,t.issueId===null?r("detail.issue"):r("detail.issueNumber",{id:t.issueId}))}
                </span>
            </div>
            ${t.isProject?c:this.actionBar(t,n!==void 0)}
            ${n!==void 0?ko(n):c}
            ${t.incomplete&&n===void 0?this.unfinishedNote(t):c}
            ${t.stale&&n===void 0?this.staleNote(t):c}
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.settled")}</h2>
            <div class="sds-facts-set">${Ps(t,{value:this.usage.of(t.name),trouble:this.usage.trouble(t.name)}).map(gt)}</div>
        </section>

        ${this.commitList(t)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.history")}</h2>
            ${this.history(t.name)}
        </section>
      </div>`}commitList(t){let n=this.log.of(t.name),s=this.log.trouble(t.name);return s!==""?a`
            <section class="sds-band">
                <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
                <sds-note tone="warn" body=${s}></sds-note>
            </section>`:n!==null&&n.commits.length===0&&t.changes===0?c:a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${t.changes===0?c:a`
                <p class="branchery-uncommitted">
                    <strong>${r("table.uncommitted")}
                        <span class="sds-warn">${r("table.files",{count:t.changes})}</span></strong>
                    ${this.showFiles(t.name)}
                </p>`}
            ${this.log.body(t.name,o=>`#/w/${encodeURIComponent(t.name)}/c/${o}`)}
        </section>`}showFiles(t){return a` ${$(r("detail.showFiles"),a`<sds-button variant="ghost" @click=${()=>this.openFiles(t)}>${r("detail.showFiles")}</sds-button>`)}`}openFiles(t){this.files.name!==t&&(this.files=Xt(t)),this.files.list.open=!0,this.files.list.read===null&&this.readChanges(t),this.requestUpdate()}toggleDiff(t,n){this.files.name===t&&(ct(this.files.diffs,n,()=>void this.readDiff(t,n)),this.requestUpdate())}changeList(t){let n=this.files.list;return n.trouble!==""?a`<sds-note tone="warn" body=${`${r("detail.changesFailed")} ${n.trouble}`}></sds-note>`:n.read===null?U():dt({files:n.read,diffs:this.files.diffs,press:s=>this.toggleDiff(t,s),all:this.files.all,showAll:()=>{this.files.all=!0,this.requestUpdate()}})}async readChanges(t){await this.reading(async()=>(await m.changes(t)).changes,()=>this.files.name===t,(n,s)=>{this.files.list={...this.files.list,read:n,trouble:s}})}async readDiff(t,n){await this.reading(()=>m.changeDiff(t,n),()=>this.files.name===t&&this.files.diffs.has(n),(s,o)=>ut(this.files.diffs,n,s,o))}staleNote(t){return a`
        <sds-note
            tone="warn"
            heading=${r("detail.staleHeading")}
            body=${r("detail.stale")}
            action=${r("table.provision")}
            @sds-note-action=${()=>$t(t,n=>yt(t.name,n,this.handlers))}></sds-note>`}unfinishedNote(t){let n=this.lastFailed(),s=n===null?null:this.opened.get(n.id)?.stopped??null;return a`
        <sds-note
            tone="warn"
            heading=${r("detail.unfinishedHeading")}
            body=${s===null?r("detail.unfinished"):r("detail.unfinishedAt",{no:s.no,step:s.step,reason:s.reason})}
            action=${r("table.provision")}
            @sds-note-action=${()=>$t(t,o=>yt(t.name,o,this.handlers))}></sds-note>`}lastFailed(){return this.past.of(this.name)?.find(t=>t.status==="failed")??null}actionBar(t,n){let s=JSON.stringify([t,l.language]);this.bar?.key!==s&&(this.bar={key:s,...this.buildBar(t)});for(let d of[...this.bar.doing,...this.bar.undoing])d.disabled=n||this.bar.held.has(d);let{doing:o,undoing:i}=this.bar;return a`
        <section class="sds-actions">
            ${""}
            <h2 class="sds-said-only">${r("detail.actions")}</h2>
            ${o}
            ${""}
            <span class="sds-row sds-row__end">${i}</span>
        </section>`}buildBar(t){let n=new Set,s=i=>{let d=this.pressFor(i.action,t);return i.held!==null&&(n.add(d),d.title=r(i.held)),d},o=Cs(t);return{doing:o.doing.map(s),undoing:o.undoing.map(s),held:n}}pressFor(t,n){let s=this.handlers;switch(t){case"restore":return _(r("table.restore",{branch:n.madeFor??""}),"secondary",()=>void Hs(n,s));case"pull":return _(r("table.pull"),"secondary",()=>void Ds(n,s));case"edit":return _(r("table.edit"),"secondary",()=>Es(n));case"sync":return _(r("table.sync"),"secondary",()=>void Bs(n,s));case"provision":return _(r("table.provision"),"secondary",()=>$t(n,o=>yt(n.name,o,s)));case"discard":return _(r("table.discard"),"danger",()=>void Os(n,s,this.log.of(n.name)));case"remove":return _(r("table.remove"),"danger",()=>void Fs(n,s))}}history(t){let n=this.past.trouble(t);if(n!=="")return a`<sds-note tone="warn" body=${`${r("detail.historyFailed")} ${n}`}></sds-note>`;let s=this.past.of(t);return s===null?U():s.length===0?a`<p class="branchery-list__quiet">${r("detail.noHistory")}</p>`:a`<div class="branchery-history">${s.map(o=>this.entry(o))}</div>`}entry(t){let n=this.opened.get(t.id),s=`${T(t.started,l.language)} \xB7 ${Se(t.elapsed)}`;return a`
        <sds-run
            heading=${Ve(t.command)}
            verdict=${t.status}
            note=${n!==void 0&&n.trouble!==""?`${s} \xB7 ${n.trouble}`:s}
            .stateWords=${Ye()}
            .steps=${n?.steps??[]}
            @click=${o=>this.open(o,t.id)}></sds-run>`}open(t,n){let s=t.target;!(s instanceof Element)||!s.closest(".sds-run__head")||this.opened.get(n)?.settled===!0||this.readJob(n)}async readHistory(t){await ne(this.past,t,()=>m.worktreeJobs(t),this.reading)}async readUsage(t){await ne(this.usage,t,()=>m.worktreeUsage(t),this.reading)}async readJob(t){if(!this.askingFor.has(t)){this.askingFor.add(t);try{let n=await m.job(t),s=n.status==="unknown"&&n.steps.length===0;this.opened.set(t,{steps:Ie(ht(pt,n).steps),trouble:s?r("detail.noLog"):"",settled:!0,stopped:xo(n)})}catch(n){this.opened.set(t,{steps:[],trouble:`${r("detail.logFailed")} ${C(n)}`,settled:!1,stopped:null})}finally{this.askingFor.delete(t)}this.requestUpdate()}}};customElements.define("branchery-worktree",en);function _o(e){return!l.loading&&!l.unreachable?a`
          <div class="sds-page">
            <sds-note tone="warn" body=${r("detail.gone",{name:e})}></sds-note>
            ${F(r("detail.back"),"#/")}
          </div>`:a`
      <div class="sds-bands">
        <section class="sds-band">
            ${F(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${e}</span></h1>
            </div>
            ${U()}
        </section>
      </div>`}function Ce(e,t){return e===null?c:a`${ae(e,t)}`}function ko(e){return a`
        <sds-note
            tone="info"
            heading=${r("detail.busyHeading")}
            body=${r("detail.busy",{doing:e})}></sds-note>`}function xo(e){let t=e.steps.find(n=>n.state==="failed");return e.status!=="failed"||t===void 0?null:{no:t.no,step:t.label,reason:mt(e.log)}}var tn=class extends E{name="";handlers;read=te();reading=pe(C,()=>this.requestUpdate());log=ft((t,n)=>m.branchCommits(t,n),this.reading,()=>this.requestUpdate());willUpdate(){this.read.about(this.name)&&this.readBranch(this.name),this.log.about(this.name)}render(){let t=this.name,n=this.read.of(t);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${F(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${t}</span>
                    ${n===null?c:To(n)}
                </h1>
            </div>
            ${n===null?this.beforeTheAnswer(t):this.offer(n)}
        </section>
        ${n===null?c:a`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${r("detail.settled")}</h2>
                <div class="sds-facts-set">${Ro(n).map(gt)}</div>
            </section>`}
        ${n===null&&this.read.trouble(t)!==""?c:this.commits(t)}
      </div>`}beforeTheAnswer(t){let n=this.read.trouble(t);return n===""?U():a`<sds-note tone="warn" body=${n}></sds-note>`}offer(t){return t.worktree!==null?a`
            <p class="branchery-list__quiet">${r("detail.branchHasWorktree")}
                <sds-link href=${`#/w/${encodeURIComponent(t.worktree)}`}
                          label=${t.worktree}></sds-link></p>`:a`
        <div class="sds-row">
            ${$(r("nav.newWorktree"),a`<sds-button variant="primary"
                        @click=${()=>I(this.handlers,t.name)}>${r("nav.newWorktree")}</sds-button>`)}
        </div>`}commits(t){let n=this.log.trouble(t);return a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${n===""?this.log.body(t,s=>`#/b/${encodeURIComponent(t)}/c/${s}`):a`<sds-note tone="warn" body=${n}></sds-note>`}
        </section>`}async readBranch(t){await ne(this.read,t,()=>m.branch(t),this.reading)}};customElements.define("branchery-branch",tn);function To(e){return e.merged?a`<sds-badge label=${r("table.merged",{branch:l.project?.branch??l.branch})}
                               tone="neutral"></sds-badge>`:e.gone?a`<sds-badge label=${r("table.gone")} tone="warn"></sds-badge>`:!e.onRemote&&l.remotes.length>0?a`<sds-badge label=${r("table.nowhere")} tone="warn"></sds-badge>`:c}function Ro(e){return[{title:r("detail.repository"),facts:[...e.base===null?[]:[{label:r("detail.base"),value:e.base.branch},{label:r("detail.sinceBase"),value:bt(e.base),said:!0}],{label:r("detail.commits"),value:Co(e),said:!0},{label:r("detail.moved"),value:T(e.when,l.language),said:!0}]}]}function Co(e){if(e.gone)return r("table.gone");if(e.upstream===null)return e.onRemote?r("detail.onRemoteOnly"):r("detail.noRemote");let t=[...e.ahead!==null&&e.ahead>0?[r("table.unpushed",{count:e.ahead})]:[],...e.behind!==null&&e.behind>0?[r("table.behind",{count:e.behind})]:[]];return t.length===0?r("detail.inStep"):`${e.upstream} \xB7 ${t.join(" \xB7 ")}`}var Eo={schedule:(e,t)=>setTimeout(e,t),cancel:e=>clearTimeout(e)};function Ns(e,t,n,s=Eo){let o=!1,i=null,d=()=>{i=s.schedule(()=>{i=null,u()},n)},u=async()=>{let p;try{p=await e()}catch{o||d();return}o||(t(p)?d():o=!0)};return u(),()=>{o=!0,i!==null&&(s.cancel(i),i=null)}}var Ao=1e3,nn=0,Js=null,rn=null;function on(e,t,n,s,o=!0){let i=++nn;Js?.();let d=Hn(e,t,n??"create"),u=o,p=pt,f=()=>{u&&!nt()&&Ms(d)};rn=()=>{u=!0,tt(),Ms(d)},o&&rn();let b=async()=>{await R(),i===nn&&(l.job=d,f(),s(d))};Js=Ns(()=>m.job(e,p.size),h=>i!==nn?!1:(p=ht(p,h),d={...h,log:p.log,steps:p.steps,expected:t??(h.subject===""?null:h.subject),kind:n??Dn(h.command)},h.status==="running"?(f(),!0):(b(),!1)),Ao)}var Po={running:"job.running",done:"job.ticket.done",failed:"job.ticket.failed",unknown:"job.ticket.unknown"},q=null,sn="";function wt(){let e=l.job!==null&&!D()?l.job.status:"",t=Po[e];if(t===void 0){q?.remove(),q=null,sn="";return}q!==null&&sn===e||(q?.remove(),sn=e,q=_(r(t),"secondary",()=>{(rn??tt)(),wt()}),q.className=`branchery-ticket branchery-ticket--${e}`,q.title=r("job.show"),document.body.append(q))}ue(()=>wt());le(()=>wt());function Ms(e){ot(Lo(e),e.status==="running"?"":Bo(e)),es(a`
        <sds-run open
                 heading=${Wo(e)}
                 verdict=${e.status}
                 note=${Uo(e)}
                 .stateWords=${Ye()}
                 .steps=${Ie(e.steps)}></sds-run>`),jo(e),wt()}function jo(e){Nt(e.status==="running"?{back:r("action.leaveRunning"),onBack:()=>L()}:{back:r("action.copyLog"),onBack:()=>void Oo(e),next:r("action.close"),onNext:()=>{l.job=null,L()}})}function Wo(e){return r(Rs(e.status))}function Lo(e){return e.expected??(e.subject===""?Ve(e.command):e.subject)}function Uo(e){let t=Se(e.elapsed);return e.status==="running"?e.step===null?t:`${r("job.stepOf",{no:e.step.no,total:e.step.total})} \xB7 ${t}`:e.status==="failed"?e.interrupted?r("job.interrupted"):mt(e.log)||t:Vt(e.status)?t:""}function Bo(e){if(!Vt(e.status))return"";let t=Se(e.elapsed);if(e.kind==="fetch"){let o=e.log.split(`
`).filter(i=>i.includes(" -> ")).length;return o===0?r("job.done.fetch",{time:t}):r("job.done.fetchMoved",{count:o,time:t})}let n=l.worktrees.find(o=>o.name===e.expected);if(!n||e.kind==="remove")return r(`job.done.${e.kind}`,{name:e.expected??"",time:t});let s=e.kind==="sync"?r("job.done.sync",{name:n.database}):e.kind==="pull"?r("job.done.pull",{branch:n.branch}):e.kind==="restore"?r("job.done.restore",{branch:n.branch}):e.kind==="discard"?r("job.done.discard",{branch:n.branch}):n.backend===null?r("job.done.built",{php:n.php}):`${r("job.done.built",{php:n.php})} ${r("job.login",Re)}`;return a`
        ${s}
        <sds-link external href=${n.url}
                  label=${r("action.openWorktree")}></sds-link>`}async function Oo(e){let t=w("#wizBack");try{await navigator.clipboard.writeText(e.log.trim()),t&&(ie(t,r("action.copied")),window.setTimeout(()=>ie(t,r("action.copyLog")),2e3))}catch{}}var St={onJob(e,t=null,n=null){on(e,t,n,Gs)}};function Gs(e){let t=e.expected??e.subject;t!==""&&Gn(t)}function Ae(e,t,n,s){let o=y(e);if(o.hidden=!t,!t)return;let i=o.firstElementChild;i===null&&(i=document.createElement("sds-note"),s!==void 0&&i.addEventListener("sds-note-action",s),o.append(i));for(let[d,u]of Object.entries(n()))i.setAttribute(d,u)}function Ho(){Ae("#offline",l.unreachable,()=>({tone:"warn",body:r("error.unreachable"),action:r("action.tryAgain")}),()=>void R())}function Do(){Ae("#update",l.updateWaiting,()=>({tone:"info",heading:r("update.waiting"),body:r("update.how")}))}function Fo(){let e=l.exposed;Ae("#exposed",e!==null,()=>({tone:"warn",heading:r("exposed.heading"),body:r(e==="router"?"exposed.router":"exposed.container")}))}function No(){Ae("#unconfigured",l.unconfigured,()=>({tone:"info",heading:r("error.unconfigured"),body:r("error.unconfiguredHow")}))}function Jo(){let e=l.recipeProblem;Ae("#recipe",e!==null,()=>({tone:"warn",heading:r("error.recipe"),body:e??""}))}var Is=Ze();function ge(e=Ze()){if(D())return;let t=!Mn(e,Is);t&&window.scrollTo(0,0),Is=e,Vs(),Ho(),Fo(),Do(),Zo(),Jo(),No(),Mo(e),t&&zo()}function Mo(e){let t=y("#main");v(Io(e),t);for(let n of t.children)n instanceof E&&n.drawNow()}function Io(e){return e.view==="worktree"?a`<branchery-worktree .name=${e.name} .handlers=${St}></branchery-worktree>`:e.view==="branch"?a`<branchery-branch .name=${e.name} .handlers=${St}></branchery-branch>`:e.view==="commit"?a`<branchery-commit
            .name=${e.name}
            .sha=${e.sha}
            .branch=${e.branch}></branchery-commit>`:a`<branchery-overview .handlers=${St}></branchery-overview>`}function zo(){y("#main").focus({preventScroll:!0})}le(()=>ge());qn(e=>{W(""),ge(e)});var fe=y("#bar"),Ee=[],qo="https://benjaminkott.github.io/ddev-branchery/",zs="";function Vs(){zs!==l.language&&(zs=l.language,fe.menu={label:r("app.title"),items:[{label:r("nav.worktrees"),href:"#/",current:!0},{label:r("nav.docs"),href:qo,external:!0}]})}function Ys(){fe.product=r("app.title"),Vs()}function Zs(){fe.languages=Ee.map(e=>({label:Ko(e),current:e===l.language,lang:e})),fe.updateComplete.then(()=>{w(".sds-bar__lang",fe)?.setAttribute("name",r("app.language"))})}function Ko(e){try{return new Intl.DisplayNames([e],{type:"language"}).of(e)??e.toUpperCase()}catch{return e.toUpperCase()}}fe.addEventListener("sds-dropdown-choose",e=>{let t=Ee[e.detail.index];!t||t===l.language||Wt(t).then(()=>{Zs(),Ys(),ge()})});y("#wizard").addEventListener("close",()=>{l.job?.status!=="running"&&(l.job=null)});ue(()=>{let e=In(location.hash);e!==null&&history.replaceState(null,"",e),ge(),R(!0)});var Go=5e3,qs=Date.now();async function Qs(){let e=Date.now();document.visibilityState!=="visible"||l.job?.status==="running"||D()||e-qs<Go||(qs=e,Xs(await R(!0)))}function Xs(e){let t=e[0];t!==void 0&&l.job?.status!=="running"&&on(t.id,null,null,Gs,!1)}var Vo=2e3,Yo=1e4,Ks=!1;function Zo(){if(Ks)return;Ks=!0;let e=()=>{let t=l.runningJobs.length>0||D()||l.unreachable;window.setTimeout(()=>{if(document.visibilityState!=="visible"||D()){e();return}R(!0).then(e)},t?Vo:Yo)};e()}document.addEventListener("visibilitychange",()=>void Qs());window.addEventListener("focus",()=>void Qs());function er(){if(Bt(location.hash)){I(St);return}nt()&&L()}window.addEventListener("hashchange",er);(async()=>(Ee=await jn(),await Wt(Ee.includes(l.language)?l.language:Ee[0]??"en"),Zs(),Ys(),ge(),Xs(await R()),ge(),er()))();
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
