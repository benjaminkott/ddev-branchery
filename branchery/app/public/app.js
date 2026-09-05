var je=globalThis,Le=je.ShadowRoot&&(je.ShadyCSS===void 0||je.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ln=Symbol(),an=new WeakMap,We=class{constructor(t,n,r){if(this._$cssResult$=!0,r!==ln)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o,n=this.t;if(Le&&t===void 0){let r=n!==void 0&&n.length===1;r&&(t=an.get(n)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&an.set(n,t))}return t}toString(){return this.cssText}},dn=e=>new We(typeof e=="string"?e:e+"",void 0,ln);var cn=(e,t)=>{if(Le)e.adoptedStyleSheets=t.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of t){let r=document.createElement("style"),o=je.litNonce;o!==void 0&&r.setAttribute("nonce",o),r.textContent=n.cssText,e.appendChild(r)}},_t=Le?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let n="";for(let r of t.cssRules)n+=r.cssText;return dn(n)})(e):e;var{is:ns,defineProperty:rs,getOwnPropertyDescriptor:ss,getOwnPropertyNames:os,getOwnPropertySymbols:is,getPrototypeOf:as}=Object,Oe=globalThis,un=Oe.trustedTypes,ls=un?un.emptyScript:"",ds=Oe.reactiveElementPolyfillSupport,be=(e,t)=>e,xt={toAttribute(e,t){switch(t){case Boolean:e=e?ls:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},hn=(e,t)=>!ns(e,t),pn={attribute:!0,type:String,converter:xt,reflect:!1,useDefault:!1,hasChanged:hn};Symbol.metadata??=Symbol("metadata"),Oe.litPropertyMetadata??=new WeakMap;var H=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=pn){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){let r=Symbol(),o=this.getPropertyDescriptor(t,r,n);o!==void 0&&rs(this.prototype,t,o)}}static getPropertyDescriptor(t,n,r){let{get:o,set:i}=ss(this.prototype,t)??{get(){return this[n]},set(d){this[n]=d}};return{get:o,set(d){let u=o?.call(this);i?.call(this,d),this.requestUpdate(t,u,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??pn}static _$Ei(){if(this.hasOwnProperty(be("elementProperties")))return;let t=as(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(be("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(be("properties"))){let n=this.properties,r=[...os(n),...is(n)];for(let o of r)this.createProperty(o,n[o])}let t=this[Symbol.metadata];if(t!==null){let n=litPropertyMetadata.get(t);if(n!==void 0)for(let[r,o]of n)this.elementProperties.set(r,o)}this._$Eh=new Map;for(let[n,r]of this.elementProperties){let o=this._$Eu(n,r);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let n=[];if(Array.isArray(t)){let r=new Set(t.flat(1/0).reverse());for(let o of r)n.unshift(_t(o))}else t!==void 0&&n.push(_t(t));return n}static _$Eu(t,n){let r=n.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,n=this.constructor.elementProperties;for(let r of n.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return cn(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,r){this._$AK(t,r)}_$ET(t,n){let r=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,r);if(o!==void 0&&r.reflect===!0){let i=(r.converter?.toAttribute!==void 0?r.converter:xt).toAttribute(n,r.type);this._$Em=t,i==null?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(t,n){let r=this.constructor,o=r._$Eh.get(t);if(o!==void 0&&this._$Em!==o){let i=r.getPropertyOptions(o),d=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:xt;this._$Em=o;let u=d.fromAttribute(n,i.type);this[o]=u??this._$Ej?.get(o)??u,this._$Em=null}}requestUpdate(t,n,r,o=!1,i){if(t!==void 0){let d=this.constructor;if(o===!1&&(i=this[t]),r??=d.getPropertyOptions(t),!((r.hasChanged??hn)(i,n)||r.useDefault&&r.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(d._$Eu(t,r))))return;this.C(t,n,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,n,{useDefault:r,reflect:o,wrapped:i},d){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,d??n??this[t]),i!==!0||d!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(n=void 0),this._$AL.set(t,n)),o===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,i]of this._$Ep)this[o]=i;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[o,i]of r){let{wrapped:d}=i,u=this[o];d!==!0||this._$AL.has(o)||u===void 0||this.C(o,void 0,i,u)}}let t=!1,n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(n)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(t){}firstUpdated(t){}};H.elementStyles=[],H.shadowRootOptions={mode:"open"},H[be("elementProperties")]=new Map,H[be("finalized")]=new Map,ds?.({ReactiveElement:H}),(Oe.reactiveElementVersions??=[]).push("2.1.2");var Tt=globalThis,mn=e=>e,Ue=Tt.trustedTypes,fn=Ue?Ue.createPolicy("lit-html",{createHTML:e=>e}):void 0,Rt="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Ct="?"+D,cs=`<${Ct}>`,Z=document,ye=()=>Z.createComment(""),$e=e=>e===null||typeof e!="object"&&typeof e!="function",Et=Array.isArray,wn=e=>Et(e)||typeof e?.[Symbol.iterator]=="function",kt=`[ 	
\f\r]`,ve=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,gn=/-->/g,bn=/>/g,V=RegExp(`>|${kt}(?:([^\\s"'>=/]+)(${kt}*=${kt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),vn=/'/g,yn=/"/g,Sn=/^(?:script|style|textarea|title)$/i,At=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),a=At(1),si=At(2),oi=At(3),Q=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),$n=new WeakMap,Y=Z.createTreeWalker(Z,129);function _n(e,t){if(!Et(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return fn!==void 0?fn.createHTML(t):t}var xn=(e,t)=>{let n=e.length-1,r=[],o,i=t===2?"<svg>":t===3?"<math>":"",d=ve;for(let u=0;u<n;u++){let m=e[u],g,h,p=-1,b=0;for(;b<m.length&&(d.lastIndex=b,h=d.exec(m),h!==null);)b=d.lastIndex,d===ve?h[1]==="!--"?d=gn:h[1]!==void 0?d=bn:h[2]!==void 0?(Sn.test(h[2])&&(o=RegExp("</"+h[2],"g")),d=V):h[3]!==void 0&&(d=V):d===V?h[0]===">"?(d=o??ve,p=-1):h[1]===void 0?p=-2:(p=d.lastIndex-h[2].length,g=h[1],d=h[3]===void 0?V:h[3]==='"'?yn:vn):d===yn||d===vn?d=V:d===gn||d===bn?d=ve:(d=V,o=void 0);let O=d===V&&e[u+1].startsWith("/>")?" ":"";i+=d===ve?m+cs:p>=0?(r.push(g),m.slice(0,p)+Rt+m.slice(p)+D+O):m+D+(p===-2?u:O)}return[_n(e,i+(e[n]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]},we=class e{constructor({strings:t,_$litType$:n},r){let o;this.parts=[];let i=0,d=0,u=t.length-1,m=this.parts,[g,h]=xn(t,n);if(this.el=e.createElement(g,r),Y.currentNode=this.el.content,n===2||n===3){let p=this.el.content.firstChild;p.replaceWith(...p.childNodes)}for(;(o=Y.nextNode())!==null&&m.length<u;){if(o.nodeType===1){if(o.hasAttributes())for(let p of o.getAttributeNames())if(p.endsWith(Rt)){let b=h[d++],O=o.getAttribute(p).split(D),Pe=/([.?@])?(.*)/.exec(b);m.push({type:1,index:i,name:Pe[2],strings:O,ctor:Pe[1]==="."?He:Pe[1]==="?"?De:Pe[1]==="@"?Fe:ee}),o.removeAttribute(p)}else p.startsWith(D)&&(m.push({type:6,index:i}),o.removeAttribute(p));if(Sn.test(o.tagName)){let p=o.textContent.split(D),b=p.length-1;if(b>0){o.textContent=Ue?Ue.emptyScript:"";for(let O=0;O<b;O++)o.append(p[O],ye()),Y.nextNode(),m.push({type:2,index:++i});o.append(p[b],ye())}}}else if(o.nodeType===8)if(o.data===Ct)m.push({type:2,index:i});else{let p=-1;for(;(p=o.data.indexOf(D,p+1))!==-1;)m.push({type:7,index:i}),p+=D.length-1}i++}}static createElement(t,n){let r=Z.createElement("template");return r.innerHTML=t,r}};function X(e,t,n=e,r){if(t===Q)return t;let o=r!==void 0?n._$Co?.[r]:n._$Cl,i=$e(t)?void 0:t._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),i===void 0?o=void 0:(o=new i(e),o._$AT(e,n,r)),r!==void 0?(n._$Co??=[])[r]=o:n._$Cl=o),o!==void 0&&(t=X(e,o._$AS(e,t.values),o,r)),t}var Be=class{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:n},parts:r}=this._$AD,o=(t?.creationScope??Z).importNode(n,!0);Y.currentNode=o;let i=Y.nextNode(),d=0,u=0,m=r[0];for(;m!==void 0;){if(d===m.index){let g;m.type===2?g=new re(i,i.nextSibling,this,t):m.type===1?g=new m.ctor(i,m.name,m.strings,this,t):m.type===6&&(g=new Ne(i,this,t)),this._$AV.push(g),m=r[++u]}d!==m?.index&&(i=Y.nextNode(),d++)}return Y.currentNode=Z,o}p(t){let n=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,n),n+=r.strings.length-2):r._$AI(t[n])),n++}},re=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,r,o){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=r,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,n=this._$AM;return n!==void 0&&t?.nodeType===11&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=X(this,t,n),$e(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==Q&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):wn(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&$e(this._$AH)?this._$AA.nextSibling.data=t:this.T(Z.createTextNode(t)),this._$AH=t}$(t){let{values:n,_$litType$:r}=t,o=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=we.createElement(_n(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===o)this._$AH.p(n);else{let i=new Be(o,this),d=i.u(this.options);i.p(n),this.T(d),this._$AH=i}}_$AC(t){let n=$n.get(t.strings);return n===void 0&&$n.set(t.strings,n=new we(t)),n}k(t){Et(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,o=0;for(let i of t)o===n.length?n.push(r=new e(this.O(ye()),this.O(ye()),this,this.options)):r=n[o],r._$AI(i),o++;o<n.length&&(this._$AR(r&&r._$AB.nextSibling,o),n.length=o)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){let r=mn(t).nextSibling;mn(t).remove(),t=r}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},ee=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,r,o,i){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=n,this._$AM=o,this.options=i,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=c}_$AI(t,n=this,r,o){let i=this.strings,d=!1;if(i===void 0)t=X(this,t,n,0),d=!$e(t)||t!==this._$AH&&t!==Q,d&&(this._$AH=t);else{let u=t,m,g;for(t=i[0],m=0;m<i.length-1;m++)g=X(this,u[r+m],n,m),g===Q&&(g=this._$AH[m]),d||=!$e(g)||g!==this._$AH[m],g===c?t=c:t!==c&&(t+=(g??"")+i[m+1]),this._$AH[m]=g}d&&!o&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},He=class extends ee{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},De=class extends ee{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},Fe=class extends ee{constructor(t,n,r,o,i){super(t,n,r,o,i),this.type=5}_$AI(t,n=this){if((t=X(this,t,n,0)??c)===Q)return;let r=this._$AH,o=t===c&&r!==c||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,i=t!==c&&(r===c||o);o&&this.element.removeEventListener(this.name,this,r),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ne=class{constructor(t,n,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}},kn={M:Rt,P:D,A:Ct,C:1,L:xn,R:Be,D:wn,V:X,I:re,H:ee,N:De,U:Fe,B:He,F:Ne},us=Tt.litHtmlPolyfillSupport;us?.(we,re),(Tt.litHtmlVersions??=[]).push("3.3.3");var y=(e,t,n)=>{let r=n?.renderBefore??t,o=r._$litPart$;if(o===void 0){let i=n?.renderBefore??null;r._$litPart$=o=new re(t.insertBefore(ye(),i),i,void 0,n??{})}return o._$AI(e),o};var Pt=globalThis,J=class extends H{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=y(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Q}};J._$litElement$=!0,J.finalized=!0,Pt.litElementHydrateSupport?.({LitElement:J});var ps=Pt.litElementPolyfillSupport;ps?.({LitElement:J});(Pt.litElementVersions??=[]).push("4.2.2");var Tn=e=>(...t)=>({_$litDirective$:e,values:t}),Je=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,r){this._$Ct=t,this._$AM=n,this._$Ci=r}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}};var{I:$i}=kn;var hs={},Rn=(e,t=hs)=>e._$AH=t;var Cn=Tn(class extends Je{constructor(){super(...arguments),this.key=c}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(Rn(e),this.key=t),n}});function $(e,t=document){let n=t.querySelector(e);if(!n)throw new Error(`Element not found: ${e}`);return n}function S(e,t=document){return t.querySelector(e)}function se(e){return ms.test(e)}var ms=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;function Me(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function An(e,t){let n=e.split(".").map(Number),r=t.split(".").map(Number);for(let o=0;o<Math.max(n.length,r.length);o+=1){let i=(n[o]??0)-(r[o]??0);if(i!==0)return i}return 0}function Pn(e){try{return new URL(e).pathname.replace(/^\/+|\/+$/g,"")||e}catch{return e}}function oe(e){return e.replace(/^https?:\/\//,"").replace(/\/$/,"")}function Ie(e){return e.map(t=>({label:t.label,state:t.state,meta:fs(t.seconds),output:t.output}))}function fs(e){if(e<60)return`${e}s`;let t=e%60;return t===0?`${Math.floor(e/60)}m`:`${Math.floor(e/60)}m ${t}s`}function C(e,t){let n=Math.max(0,Math.round(Date.now()/1e3)-e),[r,o]=n<60?[n,"second"]:n<3600?[Math.round(n/60),"minute"]:n<86400?[Math.round(n/3600),"hour"]:[Math.round(n/86400),"day"];try{return new Intl.RelativeTimeFormat(t,{numeric:"auto"}).format(-r,o)}catch{return`${r} ${o}`}}function Se(e){let t=Math.max(0,Math.round(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function ze(e,t){let n=["B","KB","MB","GB","TB"],r=Math.max(0,e),o=0;for(;r>=1024&&o<n.length-1;)r/=1024,o++;return`${new Intl.NumberFormat(t,{maximumFractionDigits:r<10?1:0}).format(r)} ${n[o]}`}function w(e,t){return Cn(e,t)}function x(e,t,n,r){let o=document.createElement("sds-button");return o.variant=t,r&&(o.size=r),o.append(document.createTextNode(e)),o.addEventListener("click",n),o}function ie(e,t){t.trim()!==""&&e.updateComplete.then(()=>{let n=document.createTreeWalker(e,NodeFilter.SHOW_TEXT).nextNode();if(n){n.nodeValue=t;return}(e.querySelector("button, a")??e).append(document.createTextNode(t))})}function ae(e,t){let n=document.createElement("sds-button"),r=document.createElement("sds-icon");return r.name="actions-window-open",r.size=16,n.variant="secondary",n.href=e,n.rel="external",n.append(document.createTextNode(t),r),n}function gs(e,t,n,r,o){let i=document.createElement("sds-select");return i.options=e.map(d=>({label:d.label,value:d.value,disabled:d.disabled===!0})),i.value=t,i.filled=t!=="",i.label=r,o===void 0?i.size="sm":i.caption=o,i.addEventListener("sds-change",d=>n(d.detail)),i}var En=0;function qe(e,t,n,r){if(e.length>6)return gs(e.map(i=>({value:i.value,label:i.label})),t,n,r,r);let o=document.createElement("sds-radio");return En+=1,o.name=`choice-${En}`,o.legend=r,o.choices=e.map(i=>({label:i.label,value:i.value,...i.hint===void 0?{}:{hint:i.hint}})),o.value=t,o.addEventListener("sds-change",i=>n(i.detail)),o}async function jn(){let e=await fetch("/translations/index.json");return e.ok?await e.json():["en"]}async function Wn(e){let t=await fetch(`/translations/${e}.json`);if(!t.ok)throw new Error(`Missing translations for "${e}"`);return await t.json()}function Ln(e,t,n={}){let r=e[bs(e,t,n)]??e[t]??t;for(let[o,i]of Object.entries(n))r=r.replaceAll(`{${o}}`,String(i));return r}function bs(e,t,n){return Number(n.count)===1&&e[`${t}.one`]!==void 0?`${t}.one`:t}var vs="/api",te=class extends Error{constructor(n,r){super(n);this.status=r}},jt=class extends Error{constructor(n){super(`No answer from the container, only a ${n} from in front of it.`);this.status=n}};async function v(e,t={}){let n=t.body?{"Content-Type":"application/json"}:{},r=await fetch(`${vs}/${e}`,{...t,headers:n});if(!r.ok&&ys(r.status,r.headers.get("Content-Type")))throw new jt(r.status);let o=await r.json().catch(()=>({}));if(!r.ok){let i=o.error;throw new te(i??`Request failed with status ${r.status}`,r.status)}return o}function ys(e,t){return!((t??"").split(";")[0]?.trim().toLowerCase()==="application/json")&&$s.includes(e)}var $s=[404,502,503,504],f={state:()=>v("state"),createWorktree:e=>v("worktrees",{method:"POST",body:JSON.stringify(e)}),preview:e=>v(`worktrees/preview?${new URLSearchParams(e).toString()}`),updateWorktree:(e,t)=>v(`worktrees/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),provisionWorktree:(e,t=!1)=>v(`worktrees/${encodeURIComponent(e)}/provision`,{method:"POST",body:JSON.stringify({fresh:t})}),syncWorktree:(e,t="")=>v(`worktrees/${encodeURIComponent(e)}/sync`,{method:"POST",body:JSON.stringify(t!==""?{from:t}:{})}),pullWorktree:e=>v(`worktrees/${encodeURIComponent(e)}/pull`,{method:"POST"}),commits:(e,t=0)=>v(`worktrees/${encodeURIComponent(e)}/commits${t>0?`?skip=${t}`:""}`),branch:e=>v(`branch?branch=${encodeURIComponent(e)}`),branchCommits:(e,t=0)=>v(`branch/commits?branch=${encodeURIComponent(e)}${t>0?`&skip=${t}`:""}`),commit:(e,t)=>v(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}`),commitDiff:(e,t,n)=>v(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}/diff?path=${encodeURIComponent(n)}`),changes:e=>v(`worktrees/${encodeURIComponent(e)}/changes`),worktreeUsage:e=>v(`worktrees/${encodeURIComponent(e)}/usage`),changeDiff:(e,t)=>v(`worktrees/${encodeURIComponent(e)}/changes/diff?path=${encodeURIComponent(t)}`),discardWorktree:e=>v(`worktrees/${encodeURIComponent(e)}/discard`,{method:"POST"}),restoreWorktree:e=>v(`worktrees/${encodeURIComponent(e)}/restore`,{method:"POST"}),removeWorktree:e=>v(`worktrees/${encodeURIComponent(e)}`,{method:"DELETE"}),fetch:e=>v("fetch",{method:"POST",body:JSON.stringify(e!==void 0?{remote:e}:{})}),job:(e,t=0)=>v(`jobs/${encodeURIComponent(e)}${t>0?`?since=${t}`:""}`),worktreeJobs:e=>v(`worktrees/${encodeURIComponent(e)}/jobs`)};function Ke(e){try{return localStorage.getItem(e)}catch{return null}}function Ge(e,t){try{localStorage.setItem(e,t)}catch{}}function On(e,t){return JSON.stringify(e)!==JSON.stringify(t)}function Un(e){let t=new Set,n=!1,r=()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1;for(let i of t)i()}))};return{state:new Proxy({...e},{set(i,d,u){return Reflect.get(i,d)===u||(Reflect.set(i,d,u),r()),!0}}),subscribe(i){return t.add(i),()=>t.delete(i)}}}var Bn="branchery-language",{state:l,subscribe:le}=Un({tld:location.host,projectName:"",worktrees:[],project:null,branch:"",branches:[],remotes:[],repository:null,phpVersions:[],strings:{},loading:!0,language:Ke(Bn)||document.documentElement.lang||"en",job:null,runningJobs:[],error:"",unreachable:!1,recipeProblem:null,unconfigured:!1,updateWaiting:!1,exposed:null});function s(e,t={}){return Ln(l.strings,e,t)}async function Wt(e){l.strings=await Wn(e),l.language=e,document.documentElement.lang=e,Ge(Bn,e),document.querySelectorAll("[data-i18n]").forEach(t=>{let n=t.dataset.i18n;n&&(t.textContent=s(n))})}async function E(e=!1){return _e!==null?(e||(l.loading=!0),_e):(_e=ws(e).finally(()=>{_e=null}),_e)}var _e=null;async function ws(e){l.loading=!e;try{let t=await Ss();return l.unreachable=!1,t}catch(t){return t instanceof te?(l.unreachable=!1,U(t.message)):l.unreachable=!0,l.runningJobs}finally{l.loading=!1}}async function Ss(){let e=await f.state();return _("worktrees",e.worktrees),_("branches",e.branches),_("remotes",e.remotes),_("repository",e.repository??null),_("branch",e.branch),_("project",e.project),_("phpVersions",e.phpVersions),_("tld",e.tld||location.host),_("projectName",e.projectName??""),_("recipeProblem",e.recipeProblem??null),_("unconfigured",e.unconfigured===!0),_("updateWaiting",e.updateWaiting??!1),_("exposed",e.exposed??null),_("runningJobs",e.runningJobs??[]),l.runningJobs}function _(e,t){On(l[e],t)&&(l[e]=t)}function U(e){l.error=e}function j(e){if(_s(e)){l.unreachable=!0;return}U(k(e))}function _s(e){return e instanceof Error&&!(e instanceof te)}function k(e){return e instanceof te?e.message:e instanceof Error?s("error.unreachable"):s("error.generic")}function ne(e){let t=l.runningJobs.find(n=>n.subject===e);return t===void 0?void 0:t.step?.label??Ot(t.command)}function Hn(e,t=null,n="create"){let r={id:e,expected:t,kind:n,status:"running",subject:t??"",command:"",step:null,steps:[],elapsed:0,log:"",size:0,partial:!1,interrupted:!1};return l.job=r,r}var Lt={"worktree:add":{kind:"create",history:"history.add",doing:"job.doing.create"},"worktree:fork":{kind:"create",history:"history.fork",doing:"job.doing.create"},"worktree:provision":{kind:"create",history:"history.provision",doing:"job.doing.provision"},"worktree:remove":{kind:"remove",history:"history.remove",doing:"job.doing.remove"},"database:sync":{kind:"sync",history:"history.sync",doing:"job.doing.sync"},"worktree:pull":{kind:"pull",history:"history.pull",doing:"job.doing.pull"},"worktree:restore":{kind:"restore",history:"history.restore",doing:"job.doing.restore"},"worktree:discard":{kind:"discard",history:"history.discard",doing:"job.doing.discard"},"git:fetch":{kind:"fetch",history:"history.fetch",doing:"job.doing.fetch"}};function Dn(e){return Lt[e]?.kind??"create"}function Ve(e){return s(Lt[e]?.history??"history.other")}function Ot(e){return s(Lt[e]?.doing??"job.doing.create")}function Ye(){return{running:s("step.state.running"),done:s("step.state.done"),failed:s("step.state.failed")}}var Nn="[A-Za-z0-9][A-Za-z0-9.-]*",xs=new RegExp(`^/w/(${Nn})$`),ks=new RegExp(`^/w/(${Nn})/c/([0-9a-f]{4,40})$`);function Jn(e){let t=e.replace(/^#/,""),n=ks.exec(t);if(n?.[1]!==void 0&&n[2]!==void 0)return{view:"commit",name:n[1],sha:n[2],branch:""};let r=xs.exec(t);if(r?.[1]!==void 0)return{view:"worktree",name:r[1]};let o=/^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(t),i=Fn(o?.[1]);if(i!==null&&o?.[2]!==void 0)return{view:"commit",name:"",sha:o[2],branch:i};let d=Fn(/^\/b\/(.+)$/.exec(t)?.[1]);return d!==null?{view:"branch",name:d}:{view:"overview"}}function Fn(e){if(e===void 0||e==="")return null;let t;try{t=decodeURIComponent(e)}catch{return null}return se(t)?t:null}function Mn(e,t){return e.view!==t.view?!1:e.view==="worktree"&&t.view==="worktree"||e.view==="branch"&&t.view==="branch"?e.name===t.name:e.view==="commit"&&t.view==="commit"?e.name===t.name&&e.sha===t.sha&&e.branch===t.branch:!0}function Ut(e){return e.replace(/^#/,"").startsWith("new")}function In(e){return Ut(e)?"#/":null}var zn=[];function Ze(){return Jn(window.location.hash)}function Qe(e){window.location.hash!==`#${e}`&&(window.location.hash=e)}function qn(e){zn.push(e)}function Kn(){history.scrollRestoration="manual"}Kn();window.addEventListener("hashchange",()=>{Kn();let e=Ze();for(let t of zn)t(e)});var Bt="branchery-operation-ended";function Gn(e){window.dispatchEvent(new CustomEvent(Bt,{detail:e}))}function Vn(e){let t=n=>e(n.detail);return window.addEventListener(Bt,t),()=>window.removeEventListener(Bt,t)}function Yn(){let e=!1;return{pending:()=>e,run(t,n=()=>{}){if(e)return!1;e=!0;let r=()=>{e=!1,n()},o;try{o=t()}catch(i){throw r(),i}return Promise.resolve(o).then(r,r),!0}}}var W=$("#wizard"),Ts=$("#wizForm"),de=$("#wizProgress"),Zn=$("#wizTitle"),et=$("#wizLead"),Xe=$("#wizBody"),Rs=$("#wizFoot"),Ht=$("#wizBack"),ce=$("#wizNext"),T=null,R=0,xe=!1,Cs=Yn(),Es={update:()=>Ft()};function M(e){T=e,R=0,xe=!1,Qn(e.tall===!0),Dt(),tt()}function Qn(e){W.classList.toggle("sds-modal--lg",e),W.classList.toggle("sds-modal--md",!e)}function tt(){W.open||W.showModal()}function B(){W.open&&W.close()}function F(){return W.open}function nt(){return W.open&&T!==null}function ue(e){return W.addEventListener("close",e),()=>W.removeEventListener("close",e)}function rt(){return T===null?[]:T.steps.filter(e=>e.when===void 0||e.when())}function st(){rt()[R]?.leave?.()}function Dt(){let e=rt(),t=e[R];t&&(Zn.textContent=t.heading,y(t.lead??c,et),et.hidden=t.lead===void 0,As(e),y(c,Xe),t.enter(Xe,Es),Ft(),window.setTimeout(()=>{S('input:not([type]), input[type="text"]',Xe)?.focus()},20))}function As(e){de.hidden=e.length<2,!(e.length<2)&&(de.caption=e[R]?.label??"",de.label=s("step.progress"),de.max=e.length,de.value=R+1)}function Ft(){let e=rt(),t=e[R];if(!t||T===null)return;let n=R===e.length-1;Nt({back:R===0?s("action.cancel"):s("action.back"),onBack:Ps,next:n?T.finishLabel():s("action.next"),onNext:Xn}),ce.disabled=t.ready?.()===!1}function Xn(){let e=rt(),t=e[R];if(!(!t||T===null||t.ready?.()===!1)){if(R>=e.length-1){let n=T;Cs.run(()=>n.finish(),()=>{T===n&&!xe&&Ft()})&&(ce.disabled=!0);return}st(),R+=1,Dt()}}function Ps(){if(R===0){B();return}st(),R-=1,Dt()}Ts.addEventListener("submit",e=>{e.preventDefault(),T!==null&&Xn()});W.addEventListener("close",()=>{st(),T=null,xe=!1});function Nt(e={}){Rs.hidden=e.back==null&&e.next==null,Ht.hidden=e.back==null,ie(Ht,e.back??""),Ht.onclick=e.onBack??null,ce.hidden=e.next==null,ie(ce,e.next??""),ce.disabled=!1,ce.onclick=e.onNext??null}function ot(e,t=""){xe||(xe=!0,T===null&&Qn(!1)),st(),T=null,de.hidden=!0,Zn.textContent=e,y(t===""?c:t,et),et.hidden=t===""}function er(e){y(e,Xe)}var A=class extends J{letGo=[];createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.letGo.push(le(()=>this.requestUpdate())),this.letGo.push(ue(()=>this.requestUpdate())),this.arrived()}disconnectedCallback(){for(let t of this.letGo)t();this.letGo=[],this.left(),super.disconnectedCallback()}shouldUpdate(){return!this.hasUpdated||!F()}drawNow(){this.requestUpdate(),this.performUpdate()}arrived(){}left(){}untilLeft(t){this.letGo.push(t)}};var js=new Set(["worktree:add","worktree:fork"]);function tr(e,t){let n=new Set(t);return e.filter(r=>js.has(r.command)&&r.subject!==""&&!n.has(r.subject))}function it(e,t){return e.filter(n=>at([n.name,n.branch,n.database,n.url,n.php,n.base?.branch??"",n.tip?.subject??""].join(" "),t))}function nr(e,t){return e.filter(n=>at([n.name,n.tip?.subject??""].join(" "),t))}function at(e,t){let n=t.toLowerCase().split(/\s+/).filter(o=>o!==""),r=e.toLowerCase();return n.every(o=>r.includes(o))}function rr(e,t){let n=r=>r.base===null?[0,""]:r.base.branch===t?[1,""]:[2,r.base.branch];return e.map((r,o)=>({worktree:r,at:o,rank:n(r)})).sort((r,o)=>r.rank[0]-o.rank[0]||r.rank[1].localeCompare(o.rank[1],void 0,{numeric:!0})||r.at-o.at).map(r=>r.worktree)}function L(){return a`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="actions-circle-half" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${s("detail.loading")}</span>
        </p>`}function P(e=0,t=""){return a`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${t}"
        style="--sds-skeleton-delay: ${e%3*.12}s"></span>`}var or=null,Mt=new Map,Jt=new Set,Ws=300,It;function zt(e){return e!==""&&!se(e)?s("error.branchName"):""}function ir(e){return e===l.branch||l.project?.branch===e||l.branches.some(t=>t.name===e)||l.worktrees.some(t=>t.branch===e)}function sr(e){let t=zt(e);return t!==""?t:e!==""&&ir(e)?s("error.branchExists",{branch:e}):""}function I(e,t=""){let n={mode:l.branches.length>0?"branch":"fork",branch:t,from:"",name:""},r=()=>n.name.trim()||Me(n.branch),o=()=>{let d=r();return d!==""&&d===l.projectName?s("preview.isProject",{name:d}):l.worktrees.some(u=>u.name===d)?s("preview.exists",{name:d}):""},i={tall:!0,steps:[Ls(n),Us(n),Hs(n,r,o)],finishLabel:()=>n.mode==="fork"?s("action.fork"):s("action.create"),finish:()=>Fs(n,r(),e)};M(i)}function Ls(e){return{label:s("step.mode.label"),heading:s("step.mode.heading"),lead:s("step.mode.lead"),ready:()=>e.mode==="fork"||se(e.branch),enter(t,n){let r=l.branches.length>0;r||(e.mode="fork");let o=()=>{y(a`
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
                        <div class="branchery-picklist">${Os(e,o)}</div>
                        <sds-note tone="error" ?hidden=${zt(e.branch)===""}
                                  body=${zt(e.branch)}></sds-note>
                    </div>`,t),n.update()};o()}}}function Os(e,t){let n=e.branch.toLowerCase(),r=l.branches.map(i=>i.name),o=r.includes(e.branch)?r:r.filter(i=>i.toLowerCase().includes(n));return o.length===0?a`<p class="branchery-picklist__empty">${s("step.branch.noMatch")}</p>`:o.map(i=>a`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(i===e.branch)}
                @click=${()=>{e.branch=i,t()}}>${i}</button>`)}function Us(e){return{label:s("step.fork.label"),heading:s("step.fork.heading"),lead:s("step.fork.lead"),when:()=>e.mode==="fork",ready:()=>se(e.branch)&&!ir(e.branch),enter(t,n){let r=()=>{y(a`
                    ${""}
                    <sds-field
                        field-id="newBranch"
                        caption=${s("field.newBranch")}
                        value=${e.branch===""?s("field.newBranchPlaceholder"):e.branch}
                        ?filled=${e.branch!==""}
                        @sds-input=${o=>{e.branch=o.detail.trim(),r()}}></sds-field>
                    ${Bs(e)}
                    <sds-note tone="error" ?hidden=${sr(e.branch)===""}
                              body=${sr(e.branch)}></sds-note>`,t),n.update()};r()}}}function Bs(e){let t=document.createElement("sds-select");return t.caption=s("field.branchFrom"),t.options=[{label:s("field.branchFromProject",{branch:l.branch}),value:""},...l.worktrees.map(n=>({label:n.name,value:n.name}))],t.value=e.from,t.filled=!0,t.addEventListener("sds-change",n=>{e.from=n.detail}),t}function Hs(e,t,n){return{label:s("step.review.label"),heading:s("step.review.heading"),lead:s("step.review.lead"),ready:()=>t()!==""&&n()==="",enter(r,o){or=i=>ke(e,t,n,r,o,i),lr(e,t(),()=>{S("#name")!==null&&ke(e,t,n,r,o)}),ke(e,t,n,r,o)},leave(){window.clearTimeout(It)}}}function ar(e,t){return JSON.stringify([e.mode,e.branch,e.mode==="fork"?e.from:"",t])}async function lr(e,t,n){let r=ar(e,t);if(Mt.get(r)!=null||Jt.has(r))return;Jt.add(r);let o=null;try{o=await f.preview({mode:e.mode,branch:e.branch,from:e.from,name:e.name})}catch{}finally{Jt.delete(r)}Mt.set(r,o),n()}function Ds(e,t,n,r,o){window.clearTimeout(It),It=window.setTimeout(()=>{lr(e,t(),()=>{S("#name")!==null&&ke(e,t,n,r,o)})},Ws)}function ke(e,t,n,r,o,i=""){let d=e.mode==="fork"?l.worktrees.find(p=>p.name===e.from):void 0,u=s("preview.databaseCopy",{name:d?.database??l.project?.database??"db"}),m=i!==""?i:n(),g=Mt.get(ar(e,t())),h=g===void 0?P(2):g===null?d?d.php:s("preview.phpFromProject"):g.php??s("preview.phpRead",{file:g.readFrom??""});y(a`
        <div class="branchery-preview">
            <dl>
                <dt>${s("preview.branch")}</dt>
                <dd><code class="sds-mono">${e.branch}</code></dd>
                <dt>${s("preview.directory")}</dt>
                <dd><code class="sds-mono">.worktrees/${t()}</code></dd>
                <dt>${s("preview.address")}</dt>
                <dd><code class="sds-mono">https://${Me(t())}.${l.tld}</code></dd>
                <dt>${s("preview.database")}</dt>
                <dd>${u}</dd>
                <dt>${s("preview.php")}</dt>
                <dd>${h}</dd>
            </dl>
        </div>
        ${(g?.warnings??[]).map(p=>a`<sds-note tone="warn" body=${p}></sds-note>`)}
        <sds-field
            field-id="name"
            caption=${s("field.nameOverride")}
            hint=${s("field.namePlaceholder")}
            value=${e.name===""?Me(e.branch):e.name}
            ?filled=${e.name!==""}
            @sds-input=${p=>{e.name=p.detail.trim(),ke(e,t,n,r,o),Ds(e,t,n,r,o)}}></sds-field>
        ${m===""?c:a`<sds-note tone="error" body=${m}></sds-note>`}`,r),o.update()}async function Fs(e,t,n){let r=e.mode==="fork"?{mode:"fork",branch:e.branch,from:e.from,name:e.name}:{mode:"branch",branch:e.branch,name:e.name};try{let o=await f.createWorktree(r);n.onJob(o.job,t)}catch(o){j(o),S("#name")!==null&&or?.(k(o))}}function lt(e){return e.filter(t=>!t.isProject&&(t.merged||t.gone)&&t.changes===0)}function dr(e){return e.merged}function cr(e,t){let n=lt(e),r=new Set(n.filter(dr).map(o=>o.name));M({tall:n.length>3,steps:[{label:s("tidy.step"),heading:s("tidy.heading"),lead:s("tidy.lead"),enter(o,i){y(a`
                    <sds-checkbox-group
                        legend=${s("tidy.heading")}
                        legend-said-only
                        name="tidy"
                        .choices=${n.map(d=>({label:d.name,value:d.name,hint:`${d.branch} \xB7 ${Ns(d)}`}))}
                        .values=${[...r]}
                        @sds-change=${d=>{r.clear();for(let u of d.detail)r.add(u);i.update()}}></sds-checkbox-group>`,o)},ready:()=>r.size>0}],finishLabel:()=>s("tidy.confirm",{count:r.size}),finish:()=>Js(n.filter(o=>r.has(o.name)),t)})}function Ns(e){return e.merged?s("tidy.why.merged"):s("tidy.why.gone")}async function Js(e,t){ot(s("tidy.working"),s("tidy.workingLead",{count:e.length}));let n=await Promise.allSettled(e.map(i=>f.removeWorktree(i.name))),r=[];n.forEach((i,d)=>{let u=e[d]?.name??"";i.status==="fulfilled"?r.push({job:i.value.job,name:u}):j(i.reason)});let o=r[0];if(o===void 0){B();return}t.onJob(o.job,o.name,"remove")}function ur(e){return{cells:[{value:a`<span class="branchery-list__title">${e.subject}</span>`,note:qt(`${s("table.making")} \xB7 ${e.step?.label??Ot(e.command)}`)},"","",""]}}function qt(e){return a`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${e}</span>`}function pr(e){let t=ne(e.name);return{cells:[{value:a`<a class="branchery-list__title" href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:hr(e)}`,note:t===void 0?br(e):qt(t)},Gs(e),e.php,Ms(e)]}}function Ms(e){return a`
        <span class="branchery-list__ways">
            ${""}
            <sds-button variant="secondary" size="sm" icon-only
                        href=${e.url} rel="external"
                        title=${s("table.openSiteAt",{host:oe(e.url)})}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${w(s("table.view"),a`<sds-button variant="secondary" size="sm" href="#/w/${e.name}"
                        title=${s("table.viewOf",{name:e.name})}>${s("table.view")}</sds-button>`)}
        </span>`}function Is(e){return e.split("_").map((t,n)=>n===0?a`${t}`:a`_<wbr>${t}`)}function hr(e){return a`${zs(e)}${qs(e)}${e.stale?a` <sds-badge label=${s("table.staleMark")} tone="warn"></sds-badge>`:c}`}function zs(e){return e.ready?e.incomplete?a` <sds-badge label=${s("table.unfinished")} tone="warn"></sds-badge>`:c:a` <sds-badge label=${s("table.unbuilt")} tone="warn"></sds-badge>`}function qs(e){return e.merged?a` <sds-badge label=${s("table.mergedMark")} tone="ok"></sds-badge>`:e.gone?a` <sds-badge label=${s("table.goneMark")} tone="warn"></sds-badge>`:c}function mr(){let e=l.project;if(e===null)return l.loading?Ks():c;let t=ne(e.name);return fr({name:a`<a class="branchery-checkout__name"
                      href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:hr(e)}`,meta:t===void 0?a`${br(e)}${Vs(e)}`:qt(t),php:e.php,database:a`<code class="sds-mono">${Is(e.database)}</code>`,address:a`<sds-link external href=${e.url} label=${oe(e.url)}></sds-link>`})}function Ks(){return fr({name:a`<span class="branchery-checkout__name">${P(0,"branchery-waiting__title")}</span>`,meta:P(1),php:P(0),database:P(1),address:P(2)})}function fr(e){return a`
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
        </div>`}function gr(e){let t=!e.onRemote&&l.remotes.length>0;return a`${t?a`<span>${s("table.nowhere")}</span>`:c}${e.tip===null?c:a`<span
            class="branchery-list__tip">${e.tip.subject} · ${e.tip.sha}</span>`}`}function br(e){return a`<span class="branchery-list__what">${e.branch}${e.tip===null?c:a` · ${e.tip.subject}`}</span>`}function Gs(e){let t=vr(e);return t.length===0?"":a`${t.map(n=>a`<span class="branchery-list__count">${n}</span>`)}`}function Vs(e){let t=vr(e);return t.length===0?c:a`<span class="branchery-list__count">${t.join(" \xB7 ")}</span>`}function vr(e){let t=[];return e.changes>0&&t.push(s("table.changes",{count:e.changes})),e.ahead!==null&&e.ahead>0&&t.push(s("table.unpushed",{count:e.ahead})),e.behind!==null&&e.behind>0&&t.push(s("table.behind",{count:e.behind})),t}function yr(e){return wr(e)?{shown:"nothing"}:e.loading?{shown:"waiting"}:e.shown===0&&e.pending===0?{shown:"empty",because:e.filtered?"noMatch":"none"}:{shown:"rows"}}function $r(e){return wr(e)?null:e.loading||e.total===0?{key:"nav.worktrees",params:{}}:e.filtered?{key:"overview.matching",params:{shown:e.shown,total:e.total}}:{key:"overview.worktrees",params:{count:e.total}}}function wr(e){return e.unreachable&&e.entries===0}var Ys=6,Sr=10,Kt=class extends A{handlers;needle="";allBranches=!1;willUpdate(){l.loading||no()}arrived(){window.addEventListener("keydown",this.reachedByKey),this.untilLeft(()=>window.removeEventListener("keydown",this.reachedByKey))}listState(t,n,r){return{unreachable:l.unreachable,loading:l.loading,entries:t.length,total:l.worktrees.length,shown:n,pending:r,filtered:this.needle.trim()!==""}}render(){let t=eo(),n=rr(it(l.worktrees,this.needle),l.project?.branch??l.branch);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${Xs(t)}
            ${this.tidyNote(t)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${Qs()?P(0,"branchery-waiting__title"):Zs()}</h2>
                ${l.repository===null?c:a`<span class="sds-row sds-row__end">${ae(l.repository,s("detail.repository"))}</span>`}
            </div>
            ${mr()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${t.length+l.branches.length>=Ys?this.field():c}
                <div class="branchery-section-actions">${this.actions()}</div>
            </div>
            ${this.listHead(t,n.length)}
            ${this.list(t,n)}
        </section>
        ${this.freeBranches()}
      </div>`}tidyNote(t){let n=lt(t);return n.length===0||l.loading?c:a`
        <sds-note tone="info"
                  body=${s("tidy.note",{count:n.length,names:_r(n)})}
                  action=${s("tidy.open")}
                  @sds-note-action=${()=>cr(t,this.handlers)}></sds-note>`}field(){return a`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${s("overview.filter")}
            value=${this.needle===""?s("overview.filterPlaceholder"):this.needle}
            ?filled=${this.needle!==""}
            @sds-input=${t=>this.narrow(t.detail)}
            @keydown=${t=>this.leaveOrOpen(t)}></sds-field>`}narrow(t){this.needle=t,this.requestUpdate()}leaveOrOpen(t){if(t.key==="Escape"){t.target instanceof HTMLElement&&t.target.blur(),this.narrow("");return}if(t.key==="Enter"){let n=it(l.worktrees,this.needle)[0]??it(l.project===null?[]:[l.project],this.needle)[0];n!==void 0&&(t.preventDefault(),Qe(`/w/${n.name}`))}}controls=null;actions(){let t=JSON.stringify([l.remotes,l.language]);if(this.controls?.key!==t){let n=this.buildFetch();this.controls={key:t,nodes:[...n===null?[]:[n],this.creating()]}}return this.controls.nodes}creating(){let t=x(s("nav.newWorktree"),"primary",()=>I(this.handlers));return t.title=`${s("nav.newWorktree")} (n)`,t}list(t,n){let r=tr(l.runningJobs,t.map(d=>d.name)).filter(d=>at(d.subject,this.needle)),o=yr(this.listState(t,n.length,r.length));if(o.shown==="nothing")return c;if(o.shown==="empty")return a`<p class="branchery-list__empty">${s(o.because==="noMatch"?"overview.noMatch":"table.empty")}</p>`;let i=o.shown==="waiting";return a`
        <sds-table
            ?loading=${i}
            loading-rows=${to()}
            .columns=${[{head:s("table.worktree"),cls:"sds-td-name"},{head:s("table.outstanding"),cls:"sds-td-meta",align:"end",fit:!0},{head:s("table.php"),fit:!0},{head:"",cls:"sds-td-into"}]}
            .rows=${i?[]:[...r.map(ur),...n.map(pr)]}></sds-table>`}listHead(t,n){let r=$r(this.listState(t,n,0));return r===null?c:a`<h2 class="sds-h3">${s(r.key,r.params)}</h2>`}freeBranches(){if(l.loading||l.branches.length===0)return c;let t=nr(l.branches,this.needle);if(t.length===0)return c;let n=t.length-Sr,r=this.allBranches||n<=0?t:t.slice(0,Sr);return a`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${this.needle.trim()===""?s("overview.branches",{count:l.branches.length}):s("overview.branchesMatching",{shown:t.length,total:l.branches.length})}</h2>
            <sds-table
                .columns=${[{head:s("table.branch"),cls:"sds-td-name"},{head:s("table.when"),cls:"sds-td-meta",fit:!0},{head:"",cls:"sds-td-into"}]}
                .rows=${r.map(o=>this.branchRow(o))}></sds-table>
            ${this.allBranches||n<=0?c:a`
                <p class="branchery-branches__more">
                    ${w(s("overview.showAllBranches",{count:n}),a`<sds-button variant="ghost" @click=${()=>{this.allBranches=!0,this.requestUpdate()}}
                        >${s("overview.showAllBranches",{count:n})}</sds-button>`)}
                </p>`}
        </section>`}branchRow(t){return{cells:[{value:a`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(t.name)}">${t.name}</a>`,note:gr(t)},C(t.when,l.language),a`${w(s("nav.newWorktree"),a`<sds-button variant="ghost" size="sm"
                             title=${s("table.worktreeOf",{branch:t.name})}
                             @click=${()=>I(this.handlers,t.name)}
                    >${s("nav.newWorktree")}</sds-button>`)}`]}}buildFetch(){let t=l.remotes,n=t[0];if(n===void 0)return null;if(t.length===1)return x(s("nav.fetch",{remote:n}),"ghost",()=>void this.startFetch(n));let r=document.createElement("sds-dropdown");return r.label=s("nav.fetchFrom"),r.variant="ghost",r.align="end",r.choices=t.map(o=>({label:o})),r.addEventListener("sds-dropdown-choose",o=>{let i=t[o.detail.index];i!==void 0&&this.startFetch(i)}),r}async startFetch(t){try{let n=await f.fetch(t);U(""),this.handlers.onJob(n.job,null,"fetch")}catch(n){j(n)}}reachedByKey=t=>{if(t.altKey||t.ctrlKey||t.metaKey||t.defaultPrevented)return;let n=t.target;if(!(n instanceof Element&&n.closest("input, textarea, select, [contenteditable], dialog[open]"))){if(t.key==="/"){let r=S("#filter");r&&(t.preventDefault(),r.focus(),r.select());return}t.key==="n"&&S(".branchery-section-actions")!==null&&(t.preventDefault(),I(this.handlers))}}};customElements.define("branchery-overview",Kt);function Zs(){return l.repository!==null?Pn(l.repository):l.projectName===""?s("nav.worktrees"):l.projectName}function Qs(){return l.loading&&l.repository===null&&l.projectName===""}function Xs(e){let t=e.filter(n=>n.incomplete&&ne(n.name)===void 0);return t.length===0||l.loading?c:a`
        <sds-note tone="warn"
                  body=${s("overview.unfinished",{count:t.length,names:_r(t)})}></sds-note>`}function _r(e){return e.map(t=>t.name).join(", ")}function eo(){return l.project?[l.project,...l.worktrees]:l.worktrees}var xr="branchery-rows";function to(){let e=l.worktrees.length;if(e>0)return e;let t=Number(Ke(xr));return Number.isFinite(t)&&t>0?t:1}function no(){Ge(xr,String(l.worktrees.length))}function pe(e,t){return async(n,r,o)=>{let i=null,d="";try{i=await n()}catch(u){d=e(u)}r()&&(o(i,d),t())}}function z(){let e="",t=null,n="",r=o=>e===o;return{about(o){return e!==o?(e=o,t=null,n="",!0):t===null&&n===""},of:o=>r(o)?t:null,stillOn:r,trouble:o=>r(o)?n:"",put(o,i){r(o)&&(t=i,n="")},failed(o,i){r(o)&&(t=null,n=i)},forget(o){r(o)&&(e="",t=null,n="")},clear(){e="",t=null,n=""}}}async function q(e,t,n,r){await r(n,()=>e.stillOn(t),(o,i)=>{if(o===null){e.failed(t,i);return}e.put(t,o)})}function N(e,t){return a`
        <div class="sds-row branchery-back">
            ${w(e,a`<sds-button variant="ghost" href=${t}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${e}</sds-button>`)}
        </div>`}var kr=25;function dt(e){let t=e.files.length-kr,n=e.all||t<=0?e.files:e.files.slice(0,kr);return a`
        <ul class="branchery-changes">
            ${n.map(r=>{let o=e.diffs.get(r.path),i=o?.open===!0;return a`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${i}
                                @click=${()=>e.press(r.path)}>
                            <sds-badge label=${s(`change.${r.status}`)}
                                       tone=${r.status==="deleted"?"warn":c}></sds-badge>
                            ${ro(r.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${i?"actions-chevron-down":"actions-chevron-end"}></sds-icon>
                        </button>
                        ${i?so(o):c}
                    </li>`})}
        </ul>
        ${e.all||t<=0?c:a`
            <p class="branchery-changes__more">
                ${w(s("detail.showAllFiles",{count:t}),a`<sds-button variant="ghost" @click=${e.showAll}>${s("detail.showAllFiles",{count:t})}</sds-button>`)}
            </p>`}`}function ro(e){let t=e.lastIndexOf("/");return a`<code class="sds-mono branchery-changes__path">${t<0?c:a`<span class="branchery-changes__dir">${e.slice(0,t+1)}</span>`}${e.slice(t+1)}</code>`}function so(e){return e===void 0||e.read===null&&e.trouble===""?L():e.read===null?a`<sds-note tone="warn" body=${`${s("detail.changeFailed")} ${e.trouble}`}></sds-note>`:a`
        <sds-diff path=${e.read.path} .body=${e.read.lines}></sds-diff>
        ${e.read.truncated?a`<p class="branchery-changes__more">${s("detail.changeTruncated")}</p>`:c}`}function ct(e,t,n){let r=e.get(t)??{read:null,trouble:"",open:!1};r.open=!r.open,e.set(t,r),r.open&&r.read===null&&n()}function ut(e,t,n,r){let o=e.get(t);o!==void 0&&e.set(t,{...o,read:n,trouble:r})}function Te(e,t){return`${e}${t}`}var Gt=class extends A{name="";sha="";branch="";read=z();diffs=new Map;all=!1;reading=pe(k,()=>this.requestUpdate());get of(){return this.branch===""?this.name:l.projectName}willUpdate(){let t=this.of;this.read.about(Te(t,this.sha))&&(this.diffs=new Map,this.all=!1,this.readCommit(t,this.sha))}render(){let t=this.of,n=this.read.of(Te(t,this.sha));return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${this.branch===""?N(this.name,`#/w/${encodeURIComponent(this.name)}`):N(this.branch,`#/b/${encodeURIComponent(this.branch)}`)}
            ${n===null?this.beforeTheAnswer(t,this.sha):oo(t,n,this.branch)}
        </section>
        ${n===null?c:this.touched(this.name,n)}
      </div>`}beforeTheAnswer(t,n){let r=this.read.trouble(Te(t,n));return a`
        <h1 class="sds-h2"><span class="sds-mono">${n}</span></h1>
        ${r===""?L():a`<sds-note tone="warn" body=${`${s("detail.commitFailed")} ${r}`}></sds-note>`}`}touched(t,n){return a`
        <section class="sds-band sds-band--quiet">
            ${""}
            <h2 class="sds-h3">${n.files.length===0?s("detail.touchedNothingHeading"):s("detail.touched",{count:n.files.length})}</h2>
            ${n.files.length===0?a`<p class="branchery-list__quiet">${s("detail.touchedNothing")}</p>`:dt({files:n.files,diffs:this.diffs,press:r=>this.toggleDiff(t,n.sha,r),all:this.all,showAll:()=>{this.all=!0,this.requestUpdate()}})}
        </section>`}toggleDiff(t,n,r){ct(this.diffs,r,()=>void this.readDiff(t,n,r)),this.requestUpdate()}stillReading(t,n){return this.read.stillOn(Te(t,n))}async readCommit(t,n){await q(this.read,Te(t,n),()=>f.commit(t,n),this.reading)}async readDiff(t,n,r){await this.reading(()=>f.commitDiff(t,n,r),()=>this.stillReading(t,n)&&this.diffs.has(r),(o,i)=>ut(this.diffs,r,o,i))}};customElements.define("branchery-commit",Gt);function oo(e,t,n){return a`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${t.subject}
                ${t.pushed?c:a`<sds-badge label=${s("detail.notPushed")} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${t.url===null?c:a`${ae(t.url,s("detail.commitAtForge"))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${s("table.author")}</dt>
            <dd>${t.author}</dd>
            <dt>${s("table.when")}</dt>
            <dd>${C(t.when,l.language)}</dd>
            <dt>${s("table.commit")}</dt>
            ${""}
            <dd><sds-copy value=${t.id} label=${s("table.commit")}></sds-copy></dd>
            ${t.parents.length===0?c:a`
                <dt>${s("detail.parents")}</dt>
                ${""}
                <dd>${t.parents.map((r,o)=>a`${o===0?c:" \xB7 "}<sds-link
                    href=${n===""?`#/w/${encodeURIComponent(e)}/c/${r}`:`#/b/${encodeURIComponent(n)}/c/${r}`} label=${r}></sds-link>`)}</dd>`}
        </dl>
        ${t.body===""?c:a`<pre class="branchery-message">${t.body}</pre>`}`}function Vt(e){return e.madeFor!==null&&e.madeFor!==e.branch}function Tr(e){return{doing:[...ao(e),...io],undoing:lo(e)}}var io=[{action:"edit",held:null},{action:"sync",held:null},{action:"provision",held:null}];function ao(e){return Vt(e)?[{action:"restore",held:null}]:e.behind===null?[]:[{action:"pull",held:e.behind===0?"detail.pullBlocked":null}]}function lo(e){return[...(e.ahead??0)>0?[{action:"discard",held:e.changes>0?"detail.discardBlocked":null}]:[],{action:"remove",held:null}]}function Rr(e){let t={php:e.php},n=()=>{let o=[];return t.php!==e.php&&o.push({label:s("table.php"),value:t.php,note:s("edit.effect.php")}),o},r={steps:[co(e,t),uo(e,n)],finishLabel:()=>s("action.apply"),finish:()=>po(e,t)};M(r)}function co(e,t){return{label:s("table.php"),heading:s("edit.step.php.heading",{name:e.name}),lead:s("edit.step.php.lead"),ready:()=>t.php!==e.php,enter(n,r){let o=l.phpVersions.filter(i=>i===e.php||e.minPhp===null||An(i,e.minPhp)>=0);y(a`${qe(o.map(i=>({value:i,label:i,...i===e.php?{hint:s("edit.current")}:{}})),t.php,i=>{t.php=i,r.update()},s("table.php"))}`,n)}}}function uo(e,t){return{label:s("step.review.label"),heading:s("edit.step.review.heading",{name:e.name}),lead:s("step.review.lead"),enter(n){y(a`
                <div class="branchery-preview">
                    <dl>
                        ${t().map(r=>a`
                            <dt>${r.label}</dt>
                            <dd>${r.value}<span class="branchery-preview__note">${r.note}</span></dd>`)}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,n)}}}async function po(e,t){try{t.php!==e.php&&await f.updateWorktree(e.name,{php:t.php}),U(""),await E(),B()}catch(n){j(n);let r=S("#editError");r!==null&&(r.body=k(n),r.hidden=!1)}}var ho=10;function Cr(){return[{head:"",cls:"sds-td-graph"},{head:s("table.subject")},{head:s("table.when"),cls:"sds-td-meta",align:"end",fit:!0},{head:s("table.author"),fit:!0},{head:s("table.commit"),cls:"sds-td-name",fit:!0}]}function mo(){return a`<sds-table scrollable loading loading-rows=${ho} .columns=${Cr()}></sds-table>`}function fo(e,t){return e.commits.length===0?c:a`<sds-table
        scrollable
        .columns=${Cr()}
        .rows=${e.commits.map((n,r)=>{let o=!n.own&&(r===0||e.commits[r-1]?.own===!0),i=a`${n.pushed?c:a`<sds-badge label=${s("detail.notPushed")} tone="warn"></sds-badge> `}${o&&e.base!==null?a`<sds-badge label=${e.base} tone="neutral"></sds-badge> `:c}<span
                    class=${n.own?"branchery-subject":"branchery-subject branchery-subject--base"}><sds-link
                    href=${t(n.sha)}
                    label=${n.subject}></sds-link></span>`;return{cells:[go(r===0?"current":""),r===0?a`<strong>${i}</strong>`:i,C(n.when,l.language),n.author,n.url===null?a`<code class="sds-mono">${n.sha}</code>`:a`<sds-link external href=${n.url} label=${n.sha}></sds-link>`]}})}></sds-table>`}function go(e){return a`<span class="sds-graph${e===""?"":` sds-graph--${e}`}"></span>`}function bo(e,t,n,r){return!e.more&&t===""?c:a`
        <p class="branchery-changes__more">
            ${t===""?c:a`<sds-note tone="warn" body=${`${s("detail.commitsFailed")} ${t}`}></sds-note>`}
            ${e.more?n?w(s("detail.loading"),a`<sds-button variant="ghost" disabled>${s("detail.loading")}</sds-button>`):w(s("detail.olderCommits"),a`<sds-button variant="ghost" @click=${r}>${s("detail.olderCommits")}</sds-button>`):c}
        </p>`}function pt(e,t,n){let r=Yt("");async function o(i,d){d>0&&r.name===i&&(r={...r,reading:!0,trouble:""},n()),await t(()=>e(i,d),()=>r.name===i,(u,m)=>{let g=d>0?r.commits?.commits??[]:[];r={name:i,commits:u===null?r.commits:{...u,commits:[...g,...u.commits]},trouble:m,reading:!1}})}return{about(i){r.name!==i&&(r=Yt(i),o(i,0))},of:i=>r.name===i?r.commits:null,trouble:i=>r.name===i&&r.commits===null&&r.trouble!==""?`${s("detail.commitsFailed")} ${r.trouble}`:"",body(i,d){let u=r.name===i?r.commits:null;return u===null?mo():a`${fo(u,d)}
                ${bo(u,r.trouble,r.reading,()=>void o(i,u.commits.length))}`},forget(i){r.name===i&&(r=Yt(""))}}}function Yt(e){return{name:e,commits:null,trouble:"",reading:!1}}function ht(e){return e.facts.length===0?c:a`
        <div class="sds-facts-group">
            <p class="sds-label">${e.title}</p>
            <dl class="sds-facts">${e.facts.map(vo)}</dl>
        </div>`}function vo(e,t){return a`
        <dt>${e.label}</dt>
        <dd>${e.waiting===!0?P(t):e.copy===!0?a`<sds-copy value=${e.value} label=${e.label}></sds-copy>`:e.said===!0?e.value:a`<code class="sds-mono">${e.value}</code>`}</dd>`}function mt(e){return[e.own>0?s("detail.ownCommits",{count:e.own}):s("detail.ownNone"),...e.moved>0?[s("table.baseMoved",{base:e.branch,count:e.moved})]:[]].join(" \xB7 ")}var Re={user:"admin",password:"Password1!"};function Er(e,t){return[{title:s("detail.repository"),facts:[{label:s("table.branch"),value:e.branch},...Vt(e)?[{label:s("detail.madeFor"),value:e.madeFor??""}]:[],...e.base!==null?[{label:s("detail.base"),value:e.forkedAt!==null&&e.forkedFrom===e.base.branch?`${e.base.branch} @ ${e.forkedAt.slice(0,11)}`:e.base.branch},{label:s("detail.sinceBase"),value:mt(e.base),said:!0}]:[],{label:s("detail.commits"),value:$o(e),said:!0},{label:s("detail.changes"),value:e.changes>0?s("table.changes",{count:e.changes}):s("detail.clean"),said:!0},...e.builtAt===null?[]:[{label:s("detail.built"),value:C(e.builtAt,l.language),said:!0}]]},{title:s("table.address"),facts:[{label:s("detail.site"),value:oe(e.url),copy:!0},...e.backend===null?[]:[{label:s("detail.backend"),value:oe(e.backend),copy:!0}]]},{title:s("detail.serving"),facts:[{label:s("table.php"),value:e.php+(e.minPhp!==null&&e.minPhp!==e.php?` (${s("detail.minPhp",{version:e.minPhp})})`:"")},...e.node===null?[]:[{label:s("table.node"),value:e.node}],{label:s("table.profile"),value:e.profile??s("table.noProfile")},{label:s("table.docroot"),value:e.docroot===""?"/":e.docroot}]},{title:s("detail.taken"),facts:[{label:s("table.directory"),value:e.path,copy:!0},{label:s("table.database"),value:e.database,copy:!0},...e.backend===null?[]:[{label:s("detail.user"),value:Re.user,copy:!0},{label:s("detail.password"),value:Re.password,copy:!0}]]},...e.isProject?[]:[yo(t)]]}function yo(e){return e.trouble!==""?{title:s("detail.storage"),facts:[{label:s("detail.storageTotal"),value:`${s("detail.storageFailed")} ${e.trouble}`,said:!0}]}:e.value===null?{title:s("detail.storage"),facts:[{label:s("detail.storageTotal"),value:"",waiting:!0},{label:s("detail.storageFiles"),value:"",waiting:!0},{label:s("detail.storageDatabase"),value:"",waiting:!0},{label:s("detail.storageShared"),value:s("detail.storageExcluded"),said:!0}]}:{title:s("detail.storage"),facts:[{label:s("detail.storageTotal"),value:ze(e.value.total,l.language),said:!0},{label:s("detail.storageFiles"),value:ze(e.value.files,l.language),said:!0},{label:s("detail.storageDatabase"),value:ze(e.value.database,l.language),said:!0},{label:s("detail.storageShared"),value:s("detail.storageExcluded"),said:!0}]}}function $o(e){if(e.gone)return s("table.gone");if(e.ahead===null||e.behind===null)return s("detail.noRemote");let t=[...e.ahead>0?[s("table.unpushed",{count:e.ahead})]:[],...e.behind>0?[s("table.behind",{count:e.behind})]:[]];return t.length===0?s("detail.inStep"):t.join(" \xB7 ")}var K=$("#changes"),Zt="";function Ar(){return Zt}function Pr(e,t,n){Zt=e,K.heading=t,K.body=n,K.actions=[a`${w(s("action.close"),a`<sds-button variant="ghost" @click=${()=>K.close()}>${s("action.close")}</sds-button>`)}`],K.show()}function jr(){K.close()}function Wr(e){let t=()=>{Zt="",e()};return K.addEventListener("sds-dialog-cancel",t),()=>K.removeEventListener("sds-dialog-cancel",t)}var he=$("#confirm");function ft(e){return he.heading=e.title,he.body=wo(e),he.confirmLabel=e.confirmLabel,he.cancelLabel=s("action.cancel"),he.tone=e.tone??"primary",he.ask()}function wo(e){return a`
        <p>${e.message}</p>
        ${e.warning===void 0?c:a`<sds-note tone="warn" body=${e.warning}></sds-note>`}
        ${e.facts===void 0||e.facts.length===0?c:a`
            <div class="branchery-preview">
                <dl>${e.facts.map(t=>a`
                    <dt>${t.label}</dt>
                    <dd><code class="sds-mono">${t.value}</code></dd>`)}</dl>
            </div>`}`}async function Lr(e,t){await ft({title:s("confirm.sync.title"),message:s("confirm.sync.body"),facts:[{label:s("table.worktree"),value:e.name},{label:s("table.database"),value:e.database},{label:s("confirm.source"),value:s("field.branchFromProject",{branch:l.project?.branch??l.branch})}],confirmLabel:s("action.sync")})&&await me(()=>f.syncWorktree(e.name),e.name,"sync",t)}function So(e){return[...e.ahead===null?[s("confirm.worktree.nowhere")]:[],...e.ahead!==null&&e.ahead>0?[s("confirm.worktree.unpushed",{count:e.ahead})]:[],...e.changes>0?[s("confirm.worktree.changes",{count:e.changes})]:[]]}async function Or(e,t,n){let r=n;if(r===null)try{r=await f.commits(e.name)}catch(u){j(u);return}let o=r.commits.filter(u=>!u.pushed),i=r.upstream??e.branch;await ft({title:s("confirm.discard.title"),message:s("confirm.discard.body",{upstream:i}),...(e.behind??0)>0?{warning:s("confirm.discard.behind",{count:e.behind??0})}:{},facts:o.map(u=>({label:u.sha,value:u.subject})),confirmLabel:s("action.discard"),tone:"danger"})&&await me(()=>f.discardWorktree(e.name),e.name,"discard",t)}async function Ur(e,t){await me(()=>f.restoreWorktree(e.name),e.name,"restore",t)}async function Br(e,t){await me(()=>f.pullWorktree(e.name),e.name,"pull",t)}async function gt(e,t,n){await me(()=>f.provisionWorktree(e,t),e,"create",n)}async function Hr(e,t){let n=So(e);await ft({title:s("confirm.worktree.title"),message:s("confirm.worktree.body"),...n.length>0?{warning:n.join(" ")}:{},facts:[{label:s("table.worktree"),value:e.name},{label:s("table.branch"),value:e.branch},{label:s("table.database"),value:e.database}],confirmLabel:s("action.remove"),tone:"danger"})&&await me(()=>f.removeWorktree(e.name),null,"remove",t)&&Qe("/")}async function me(e,t,n,r){try{let o=await e();return U(""),r.onJob(o.job,t,n),!0}catch(o){return j(o),await E(),!1}}function bt(e,t){let n={fresh:!1},r={steps:[_o(e,n)],finishLabel:()=>n.fresh?s("provision.fresh"):s("table.provision"),finish:()=>t(n.fresh)};M(r)}function _o(e,t){return{label:s("table.database"),heading:s("provision.heading",{name:e.name}),lead:s("provision.lead"),enter(n,r){y(a`${qe([{value:"keep",label:s("provision.keep"),hint:s("provision.keepHint")},{value:"fresh",label:s("provision.fresh"),hint:s("provision.freshHint")}],t.fresh?"fresh":"keep",o=>{t.fresh=o==="fresh",r.update()},s("table.database"))}`,n)}}}var vt={log:"",size:0,steps:[]};function yt(e,t){let n=new Map(e.steps.map(r=>[r.no,r.output]));return{log:t.partial?e.log+t.log:t.log,size:t.size,steps:t.steps.map(r=>({...r,output:r.output??n.get(r.no)??""}))}}function Fr(e){switch(e){case"running":return"job.running";case"done":return"job.done";case"failed":return"job.failed";default:return"job.unknown"}}function Qt(e){return e==="done"}function $t(e){let t=e.trim().split(`
`).reverse().find(n=>n.startsWith(Dr));return t===void 0?"":t.slice(Dr.length).trim()}var Dr="\u2717";function Nr(e,t,n,r){let o=z(),i=new Map,d=new Set;async function u(h){if(!d.has(h)){d.add(h);try{let p=await t(h),b=p.status==="unknown"&&p.steps.length===0;i.set(h,{steps:Ie(yt(vt,p).steps),trouble:b?s("detail.noLog"):"",settled:!0,stopped:xo(p)})}catch(p){i.set(h,{steps:[],trouble:`${s("detail.logFailed")} ${k(p)}`,settled:!1,stopped:null})}finally{d.delete(h)}r()}}function m(h,p){let b=h.target;!(b instanceof Element)||!b.closest(".sds-run__head")||i.get(p)?.settled===!0||u(p)}function g(h){let p=i.get(h.id),b=`${C(h.started,l.language)} \xB7 ${Se(h.elapsed)}`;return a`
        <sds-run
            heading=${Ve(h.command)}
            verdict=${h.status}
            note=${p!==void 0&&p.trouble!==""?`${b} \xB7 ${p.trouble}`:b}
            .stateWords=${Ye()}
            .steps=${p?.steps??[]}
            @click=${O=>m(O,h.id)}></sds-run>`}return{about(h){o.about(h)&&(i.clear(),q(o,h,()=>e(h),n))},forget(h){o.stillOn(h)&&(o.forget(h),i.clear())},draw(h){let p=o.trouble(h);if(p!=="")return a`<sds-note tone="warn" body=${`${s("detail.historyFailed")} ${p}`}></sds-note>`;let b=o.of(h);return b===null?L():b.length===0?a`<p class="branchery-list__quiet">${s("detail.noHistory")}</p>`:a`<div class="branchery-history">${b.map(g)}</div>`},lastFailed:h=>o.of(h)?.find(p=>p.status==="failed")??null,stoppedIn:h=>i.get(h)?.stopped??null,holds:h=>i.has(h),read:h=>void u(h)}}function xo(e){let t=e.steps.find(n=>n.state==="failed");return e.status!=="failed"||t===void 0?null:{no:t.no,step:t.label,reason:$t(e.log)}}function Xt(e){return{name:e,list:{read:null,trouble:"",open:!1},all:!1,diffs:new Map}}var en=class extends A{name="";handlers;usage=z();files=Xt("");reading=pe(k,()=>this.requestUpdate());log=pt((t,n)=>f.commits(t,n),this.reading,()=>this.requestUpdate());past=Nr(t=>f.worktreeJobs(t),t=>f.job(t),this.reading,()=>this.requestUpdate());bar=null;arrived(){this.untilLeft(Wr(()=>{this.files.list.open=!1,this.requestUpdate()})),this.untilLeft(Vn(t=>this.operationEnded(t)))}left(){jr()}operationEnded(t){if(this.past.forget(t),this.log.forget(t),this.files.name===t){let n=Ar()===t;this.files=Xt(n?t:""),n&&(this.files.list.open=!0,this.readChanges(t))}this.usage.forget(t),this.name===t&&this.requestUpdate()}get worktree(){return[l.project,...l.worktrees].find(t=>t?.name===this.name)??null}willUpdate(){let t=this.name,n=this.worktree;this.past.about(t);let r=n?.incomplete===!0?this.past.lastFailed(t):null;r!==null&&!this.past.holds(r.id)&&this.past.read(r.id),n!==null&&this.log.about(t),n!==null&&!n.isProject&&this.usage.about(t)&&this.readUsage(t)}render(){let t=this.worktree;return t===null?ko(this.name):this.page(t)}updated(){this.files.name===this.name&&this.files.list.open&&Pr(this.name,s("table.uncommitted"),this.changeList(this.name))}page(t){let n=ne(t.name);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${N(s("detail.back"),"#/")}
            ${""}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${t.name}</span>
                    ${t.ready?t.incomplete?a`<sds-badge label=${s("table.unfinished")} tone="warn"></sds-badge>`:c:a`<sds-badge label=${s("table.unbuilt")} tone="warn"></sds-badge>`}
                </h1>
                <span class="sds-row sds-row__end">
                    ${Ce(t.url,s("table.openSite"))}
                    ${Ce(t.backend,s("detail.backend"))}
                    ${t.isProject?Ce(l.repository,s("detail.repository")):c}
                    ${Ce(t.review,s("detail.review"))}
                    ${Ce(t.issue,t.issueId===null?s("detail.issue"):s("detail.issueNumber",{id:t.issueId}))}
                </span>
            </div>
            ${t.isProject?c:this.actionBar(t,n!==void 0)}
            ${n!==void 0?To(n):c}
            ${t.incomplete&&n===void 0?this.unfinishedNote(t):c}
            ${t.stale&&n===void 0?this.staleNote(t):c}
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${s("detail.settled")}</h2>
            <div class="sds-facts-set">${Er(t,{value:this.usage.of(t.name),trouble:this.usage.trouble(t.name)}).map(ht)}</div>
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
        </section>`}showFiles(t){return a` ${w(s("detail.showFiles"),a`<sds-button variant="ghost" @click=${()=>this.openFiles(t)}>${s("detail.showFiles")}</sds-button>`)}`}openFiles(t){this.files.name!==t&&(this.files=Xt(t)),this.files.list.open=!0,this.files.list.read===null&&this.readChanges(t),this.requestUpdate()}toggleDiff(t,n){this.files.name===t&&(ct(this.files.diffs,n,()=>void this.readDiff(t,n)),this.requestUpdate())}changeList(t){let n=this.files.list;return n.trouble!==""?a`<sds-note tone="warn" body=${`${s("detail.changesFailed")} ${n.trouble}`}></sds-note>`:n.read===null?L():dt({files:n.read,diffs:this.files.diffs,press:r=>this.toggleDiff(t,r),all:this.files.all,showAll:()=>{this.files.all=!0,this.requestUpdate()}})}async readChanges(t){await this.reading(async()=>(await f.changes(t)).changes,()=>this.files.name===t,(n,r)=>{this.files.list={...this.files.list,read:n,trouble:r}})}async readDiff(t,n){await this.reading(()=>f.changeDiff(t,n),()=>this.files.name===t&&this.files.diffs.has(n),(r,o)=>ut(this.files.diffs,n,r,o))}staleNote(t){return a`
        <sds-note
            tone="warn"
            heading=${s("detail.staleHeading")}
            body=${s("detail.stale")}
            action=${s("table.provision")}
            @sds-note-action=${()=>bt(t,n=>gt(t.name,n,this.handlers))}></sds-note>`}unfinishedNote(t){let n=this.past.lastFailed(t.name),r=n===null?null:this.past.stoppedIn(n.id);return a`
        <sds-note
            tone="warn"
            heading=${s("detail.unfinishedHeading")}
            body=${r===null?s("detail.unfinished"):s("detail.unfinishedAt",{no:r.no,step:r.step,reason:r.reason})}
            action=${s("table.provision")}
            @sds-note-action=${()=>bt(t,o=>gt(t.name,o,this.handlers))}></sds-note>`}actionBar(t,n){let r=JSON.stringify([t,l.language]);this.bar?.key!==r&&(this.bar={key:r,...this.buildBar(t)});for(let d of[...this.bar.doing,...this.bar.undoing])d.disabled=n||this.bar.held.has(d);let{doing:o,undoing:i}=this.bar;return a`
        <section class="sds-actions">
            ${""}
            <h2 class="sds-said-only">${s("detail.actions")}</h2>
            ${o}
            ${""}
            <span class="sds-row sds-row__end">${i}</span>
        </section>`}buildBar(t){let n=new Set,r=i=>{let d=this.pressFor(i.action,t);return i.held!==null&&(n.add(d),d.title=s(i.held)),d},o=Tr(t);return{doing:o.doing.map(r),undoing:o.undoing.map(r),held:n}}pressFor(t,n){let r=this.handlers;switch(t){case"restore":return x(s("table.restore",{branch:n.madeFor??""}),"secondary",()=>void Ur(n,r));case"pull":return x(s("table.pull"),"secondary",()=>void Br(n,r));case"edit":return x(s("table.edit"),"secondary",()=>Rr(n));case"sync":return x(s("table.sync"),"secondary",()=>void Lr(n,r));case"provision":return x(s("table.provision"),"secondary",()=>bt(n,o=>gt(n.name,o,r)));case"discard":return x(s("table.discard"),"danger",()=>void Or(n,r,this.log.of(n.name)));case"remove":return x(s("table.remove"),"danger",()=>void Hr(n,r))}}async readUsage(t){await q(this.usage,t,()=>f.worktreeUsage(t),this.reading)}};customElements.define("branchery-worktree",en);function ko(e){return!l.loading&&!l.unreachable?a`
          <div class="sds-page">
            <sds-note tone="warn" body=${s("detail.gone",{name:e})}></sds-note>
            ${N(s("detail.back"),"#/")}
          </div>`:a`
      <div class="sds-bands">
        <section class="sds-band">
            ${N(s("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${e}</span></h1>
            </div>
            ${L()}
        </section>
      </div>`}function Ce(e,t){return e===null?c:a`${ae(e,t)}`}function To(e){return a`
        <sds-note
            tone="info"
            heading=${s("detail.busyHeading")}
            body=${s("detail.busy",{doing:e})}></sds-note>`}var tn=class extends A{name="";handlers;read=z();reading=pe(k,()=>this.requestUpdate());log=pt((t,n)=>f.branchCommits(t,n),this.reading,()=>this.requestUpdate());willUpdate(){this.read.about(this.name)&&this.readBranch(this.name),this.log.about(this.name)}render(){let t=this.name,n=this.read.of(t);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${N(s("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${t}</span>
                    ${n===null?c:Ro(n)}
                </h1>
            </div>
            ${n===null?this.beforeTheAnswer(t):this.offer(n)}
        </section>
        ${n===null?c:a`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${s("detail.settled")}</h2>
                <div class="sds-facts-set">${Co(n).map(ht)}</div>
            </section>`}
        ${n===null&&this.read.trouble(t)!==""?c:this.commits(t)}
      </div>`}beforeTheAnswer(t){let n=this.read.trouble(t);return n===""?L():a`<sds-note tone="warn" body=${n}></sds-note>`}offer(t){return t.worktree!==null?a`
            <p class="branchery-list__quiet">${s("detail.branchHasWorktree")}
                <sds-link href=${`#/w/${encodeURIComponent(t.worktree)}`}
                          label=${t.worktree}></sds-link></p>`:a`
        <div class="sds-row">
            ${w(s("nav.newWorktree"),a`<sds-button variant="primary"
                        @click=${()=>I(this.handlers,t.name)}>${s("nav.newWorktree")}</sds-button>`)}
        </div>`}commits(t){let n=this.log.trouble(t);return a`
        <section class="sds-band">
            <h2 class="sds-h3">${s("detail.commitsHeading")}</h2>
            ${n===""?this.log.body(t,r=>`#/b/${encodeURIComponent(t)}/c/${r}`):a`<sds-note tone="warn" body=${n}></sds-note>`}
        </section>`}async readBranch(t){await q(this.read,t,()=>f.branch(t),this.reading)}};customElements.define("branchery-branch",tn);function Ro(e){return e.merged?a`<sds-badge label=${s("table.merged",{branch:l.project?.branch??l.branch})}
                               tone="neutral"></sds-badge>`:e.gone?a`<sds-badge label=${s("table.gone")} tone="warn"></sds-badge>`:!e.onRemote&&l.remotes.length>0?a`<sds-badge label=${s("table.nowhere")} tone="warn"></sds-badge>`:c}function Co(e){return[{title:s("detail.repository"),facts:[...e.base===null?[]:[{label:s("detail.base"),value:e.base.branch},{label:s("detail.sinceBase"),value:mt(e.base),said:!0}],{label:s("detail.commits"),value:Eo(e),said:!0},{label:s("detail.moved"),value:C(e.when,l.language),said:!0}]}]}function Eo(e){if(e.gone)return s("table.gone");if(e.upstream===null)return e.onRemote?s("detail.onRemoteOnly"):s("detail.noRemote");let t=[...e.ahead!==null&&e.ahead>0?[s("table.unpushed",{count:e.ahead})]:[],...e.behind!==null&&e.behind>0?[s("table.behind",{count:e.behind})]:[]];return t.length===0?s("detail.inStep"):`${e.upstream} \xB7 ${t.join(" \xB7 ")}`}var Ao={schedule:(e,t)=>setTimeout(e,t),cancel:e=>clearTimeout(e)};function Jr(e,t,n,r=Ao){let o=!1,i=null,d=()=>{i=r.schedule(()=>{i=null,u()},n)},u=async()=>{let m;try{m=await e()}catch{o||d();return}o||(t(m)?d():o=!0)};return u(),()=>{o=!0,i!==null&&(r.cancel(i),i=null)}}var Po=1e3,nn=0,Mr=null,sn=null;function on(e,t,n,r,o=!0){let i=++nn;Mr?.();let d=Hn(e,t,n??"create"),u=o,m=vt,g=()=>{u&&!nt()&&Ir(d)};sn=()=>{u=!0,tt(),Ir(d)},o&&sn();let h=async()=>{await E(),i===nn&&(l.job=d,g(),r(d))};Mr=Jr(()=>f.job(e,m.size),p=>i!==nn?!1:(m=yt(m,p),d={...p,log:m.log,steps:m.steps,expected:t??(p.subject===""?null:p.subject),kind:n??Dn(p.command)},p.status==="running"?(g(),!0):(h(),!1)),Po)}var jo={running:"job.running",done:"job.ticket.done",failed:"job.ticket.failed",unknown:"job.ticket.unknown"},G=null,rn="";function wt(){let e=l.job!==null&&!F()?l.job.status:"",t=jo[e];if(t===void 0){G?.remove(),G=null,rn="";return}G!==null&&rn===e||(G?.remove(),rn=e,G=x(s(t),"secondary",()=>{(sn??tt)(),wt()}),G.className=`branchery-ticket branchery-ticket--${e}`,G.title=s("job.show"),document.body.append(G))}ue(()=>wt());le(()=>wt());function Ir(e){ot(Oo(e),e.status==="running"?"":Bo(e)),er(a`
        <sds-run open
                 heading=${Lo(e)}
                 verdict=${e.status}
                 note=${Uo(e)}
                 .stateWords=${Ye()}
                 .steps=${Ie(e.steps)}></sds-run>`),Wo(e),wt()}function Wo(e){Nt(e.status==="running"?{back:s("action.leaveRunning"),onBack:()=>B()}:{back:s("action.copyLog"),onBack:()=>void Ho(e),next:s("action.close"),onNext:()=>{l.job=null,B()}})}function Lo(e){return s(Fr(e.status))}function Oo(e){return e.expected??(e.subject===""?Ve(e.command):e.subject)}function Uo(e){let t=Se(e.elapsed);return e.status==="running"?e.step===null?t:`${s("job.stepOf",{no:e.step.no,total:e.step.total})} \xB7 ${t}`:e.status==="failed"?e.interrupted?s("job.interrupted"):$t(e.log)||t:Qt(e.status)?t:""}function Bo(e){if(!Qt(e.status))return"";let t=Se(e.elapsed);if(e.kind==="fetch"){let o=e.log.split(`
`).filter(i=>i.includes(" -> ")).length;return o===0?s("job.done.fetch",{time:t}):s("job.done.fetchMoved",{count:o,time:t})}let n=l.worktrees.find(o=>o.name===e.expected);if(!n||e.kind==="remove")return s(`job.done.${e.kind}`,{name:e.expected??"",time:t});let r=e.kind==="sync"?s("job.done.sync",{name:n.database}):e.kind==="pull"?s("job.done.pull",{branch:n.branch}):e.kind==="restore"?s("job.done.restore",{branch:n.branch}):e.kind==="discard"?s("job.done.discard",{branch:n.branch}):n.backend===null?s("job.done.built",{php:n.php}):`${s("job.done.built",{php:n.php})} ${s("job.login",Re)}`;return a`
        ${r}
        <sds-link external href=${n.url}
                  label=${s("action.openWorktree")}></sds-link>`}async function Ho(e){let t=S("#wizBack");try{await navigator.clipboard.writeText(e.log.trim()),t&&(ie(t,s("action.copied")),window.setTimeout(()=>ie(t,s("action.copyLog")),2e3))}catch{}}var St={onJob(e,t=null,n=null){on(e,t,n,Vr)}};function Vr(e){let t=e.expected??e.subject;t!==""&&Gn(t)}function Ae(e,t,n,r){let o=$(e);if(o.hidden=!t,!t)return;let i=o.firstElementChild;i===null&&(i=document.createElement("sds-note"),r!==void 0&&i.addEventListener("sds-note-action",r),o.append(i));for(let[d,u]of Object.entries(n()))i.setAttribute(d,u)}function Do(){Ae("#offline",l.unreachable,()=>({tone:"warn",body:s("error.unreachable"),action:s("action.tryAgain")}),()=>void E())}function Fo(){Ae("#update",l.updateWaiting,()=>({tone:"info",heading:s("update.waiting"),body:s("update.how")}))}function No(){let e=l.exposed;Ae("#exposed",e!==null,()=>({tone:"warn",heading:s("exposed.heading"),body:s(e==="router"?"exposed.router":"exposed.container")}))}function Jo(){Ae("#unconfigured",l.unconfigured,()=>({tone:"info",heading:s("error.unconfigured"),body:s("error.unconfiguredHow")}))}function Mo(){let e=l.recipeProblem;Ae("#recipe",e!==null,()=>({tone:"warn",heading:s("error.recipe"),body:e??""}))}var zr=Ze();function ge(e=Ze()){if(F())return;let t=!Mn(e,zr);t&&window.scrollTo(0,0),zr=e,Yr(),Do(),No(),Fo(),Qo(),Mo(),Jo(),Io(e),t&&qo()}function Io(e){let t=$("#main");y(zo(e),t);for(let n of t.children)n instanceof A&&n.drawNow()}function zo(e){return e.view==="worktree"?a`<branchery-worktree .name=${e.name} .handlers=${St}></branchery-worktree>`:e.view==="branch"?a`<branchery-branch .name=${e.name} .handlers=${St}></branchery-branch>`:e.view==="commit"?a`<branchery-commit
            .name=${e.name}
            .sha=${e.sha}
            .branch=${e.branch}></branchery-commit>`:a`<branchery-overview .handlers=${St}></branchery-overview>`}function qo(){$("#main").focus({preventScroll:!0})}le(()=>ge());qn(e=>{U(""),ge(e)});var fe=$("#bar"),Ee=[],Ko="https://benjaminkott.github.io/ddev-branchery/",qr="";function Yr(){qr!==l.language&&(qr=l.language,fe.menu={label:s("app.title"),items:[{label:s("nav.worktrees"),href:"#/",current:!0},{label:s("nav.docs"),href:Ko,external:!0}]})}function Zr(){fe.product=s("app.title"),Yr()}function Qr(){fe.languages=Ee.map(e=>({label:Go(e),current:e===l.language,lang:e})),fe.updateComplete.then(()=>{S(".sds-bar__lang",fe)?.setAttribute("name",s("app.language"))})}function Go(e){try{return new Intl.DisplayNames([e],{type:"language"}).of(e)??e.toUpperCase()}catch{return e.toUpperCase()}}fe.addEventListener("sds-dropdown-choose",e=>{let t=Ee[e.detail.index];!t||t===l.language||Wt(t).then(()=>{Qr(),Zr(),ge()})});$("#wizard").addEventListener("close",()=>{l.job?.status!=="running"&&(l.job=null)});ue(()=>{let e=In(location.hash);e!==null&&history.replaceState(null,"",e),ge(),E(!0)});var Vo=5e3,Kr=Date.now();async function Xr(){let e=Date.now();document.visibilityState!=="visible"||l.job?.status==="running"||F()||e-Kr<Vo||(Kr=e,es(await E(!0)))}function es(e){let t=e[0];t!==void 0&&l.job?.status!=="running"&&on(t.id,null,null,Vr,!1)}var Yo=2e3,Zo=1e4,Gr=!1;function Qo(){if(Gr)return;Gr=!0;let e=()=>{let t=l.runningJobs.length>0||F()||l.unreachable;window.setTimeout(()=>{if(document.visibilityState!=="visible"||F()){e();return}E(!0).then(e)},t?Yo:Zo)};e()}document.addEventListener("visibilitychange",()=>void Xr());window.addEventListener("focus",()=>void Xr());function ts(){if(Ut(location.hash)){I(St);return}nt()&&B()}window.addEventListener("hashchange",ts);(async()=>(Ee=await jn(),await Wt(Ee.includes(l.language)?l.language:Ee[0]??"en"),Qr(),Zr(),ge(),es(await E()),ge(),ts()))();
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
