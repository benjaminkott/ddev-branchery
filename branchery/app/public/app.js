var Jt=globalThis,Cn=e=>e,Ie=Jt.trustedTypes,An=Ie?Ie.createPolicy("lit-html",{createHTML:e=>e}):void 0,Mt="$lit$",U=`lit$${Math.random().toFixed(9).slice(2)}$`,Nt="?"+U,Tr=`<${Nt}>`,ne=document,Ae=()=>ne.createComment(""),Ee=e=>e===null||typeof e!="object"&&typeof e!="function",Ut=Array.isArray,Ln=e=>Ut(e)||typeof e?.[Symbol.iterator]=="function",Dt=`[ 	
\f\r]`,Ce=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,En=/-->/g,Pn=/>/g,ee=RegExp(`>|${Dt}(?:([^\\s"'>=/]+)(${Dt}*=${Dt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),jn=/'/g,Wn=/"/g,Bn=/^(?:script|style|textarea|title)$/i,Ft=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),a=Ft(1),sa=Ft(2),ia=Ft(3),oe=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),Hn=new WeakMap,te=ne.createTreeWalker(ne,129);function On(e,t){if(!Ut(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return An!==void 0?An.createHTML(t):t}var Dn=(e,t)=>{let n=e.length-1,o=[],s,i=t===2?"<svg>":t===3?"<math>":"",d=Ce;for(let u=0;u<n;u++){let p=e[u],f,v,m=-1,N=0;for(;N<p.length&&(d.lastIndex=N,v=d.exec(p),v!==null);)N=d.lastIndex,d===Ce?v[1]==="!--"?d=En:v[1]!==void 0?d=Pn:v[2]!==void 0?(Bn.test(v[2])&&(s=RegExp("</"+v[2],"g")),d=ee):v[3]!==void 0&&(d=ee):d===ee?v[0]===">"?(d=s??Ce,m=-1):v[1]===void 0?m=-2:(m=d.lastIndex-v[2].length,f=v[1],d=v[3]===void 0?ee:v[3]==='"'?Wn:jn):d===Wn||d===jn?d=ee:d===En||d===Pn?d=Ce:(d=ee,s=void 0);let z=d===ee&&e[u+1].startsWith("/>")?" ":"";i+=d===Ce?p+Tr:m>=0?(o.push(f),p.slice(0,m)+Mt+p.slice(m)+U+z):p+U+(m===-2?u:z)}return[On(e,i+(e[n]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),o]},Pe=class e{constructor({strings:t,_$litType$:n},o){let s;this.parts=[];let i=0,d=0,u=t.length-1,p=this.parts,[f,v]=Dn(t,n);if(this.el=e.createElement(f,o),te.currentNode=this.el.content,n===2||n===3){let m=this.el.content.firstChild;m.replaceWith(...m.childNodes)}for(;(s=te.nextNode())!==null&&p.length<u;){if(s.nodeType===1){if(s.hasAttributes())for(let m of s.getAttributeNames())if(m.endsWith(Mt)){let N=v[d++],z=s.getAttribute(m).split(U),Fe=/([.?@])?(.*)/.exec(N);p.push({type:1,index:i,name:Fe[2],strings:z,ctor:Fe[1]==="."?qe:Fe[1]==="?"?Ke:Fe[1]==="@"?Ge:se}),s.removeAttribute(m)}else m.startsWith(U)&&(p.push({type:6,index:i}),s.removeAttribute(m));if(Bn.test(s.tagName)){let m=s.textContent.split(U),N=m.length-1;if(N>0){s.textContent=Ie?Ie.emptyScript:"";for(let z=0;z<N;z++)s.append(m[z],Ae()),te.nextNode(),p.push({type:2,index:++i});s.append(m[N],Ae())}}}else if(s.nodeType===8)if(s.data===Nt)p.push({type:2,index:i});else{let m=-1;for(;(m=s.data.indexOf(U,m+1))!==-1;)p.push({type:7,index:i}),m+=U.length-1}i++}}static createElement(t,n){let o=ne.createElement("template");return o.innerHTML=t,o}};function re(e,t,n=e,o){if(t===oe)return t;let s=o!==void 0?n._$Co?.[o]:n._$Cl,i=Ee(t)?void 0:t._$litDirective$;return s?.constructor!==i&&(s?._$AO?.(!1),i===void 0?s=void 0:(s=new i(e),s._$AT(e,n,o)),o!==void 0?(n._$Co??=[])[o]=s:n._$Cl=s),s!==void 0&&(t=re(e,s._$AS(e,t.values),s,o)),t}var ze=class{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:n},parts:o}=this._$AD,s=(t?.creationScope??ne).importNode(n,!0);te.currentNode=s;let i=te.nextNode(),d=0,u=0,p=o[0];for(;p!==void 0;){if(d===p.index){let f;p.type===2?f=new ue(i,i.nextSibling,this,t):p.type===1?f=new p.ctor(i,p.name,p.strings,this,t):p.type===6&&(f=new Ve(i,this,t)),this._$AV.push(f),p=o[++u]}d!==p?.index&&(i=te.nextNode(),d++)}return te.currentNode=ne,s}p(t){let n=0;for(let o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(t,o,n),n+=o.strings.length-2):o._$AI(t[n])),n++}},ue=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,o,s){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=o,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,n=this._$AM;return n!==void 0&&t?.nodeType===11&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=re(this,t,n),Ee(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==oe&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Ln(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&Ee(this._$AH)?this._$AA.nextSibling.data=t:this.T(ne.createTextNode(t)),this._$AH=t}$(t){let{values:n,_$litType$:o}=t,s=typeof o=="number"?this._$AC(t):(o.el===void 0&&(o.el=Pe.createElement(On(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===s)this._$AH.p(n);else{let i=new ze(s,this),d=i.u(this.options);i.p(n),this.T(d),this._$AH=i}}_$AC(t){let n=Hn.get(t.strings);return n===void 0&&Hn.set(t.strings,n=new Pe(t)),n}k(t){Ut(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,o,s=0;for(let i of t)s===n.length?n.push(o=new e(this.O(Ae()),this.O(Ae()),this,this.options)):o=n[s],o._$AI(i),s++;s<n.length&&(this._$AR(o&&o._$AB.nextSibling,s),n.length=s)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){let o=Cn(t).nextSibling;Cn(t).remove(),t=o}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},se=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,o,s,i){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=n,this._$AM=s,this.options=i,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=c}_$AI(t,n=this,o,s){let i=this.strings,d=!1;if(i===void 0)t=re(this,t,n,0),d=!Ee(t)||t!==this._$AH&&t!==oe,d&&(this._$AH=t);else{let u=t,p,f;for(t=i[0],p=0;p<i.length-1;p++)f=re(this,u[o+p],n,p),f===oe&&(f=this._$AH[p]),d||=!Ee(f)||f!==this._$AH[p],f===c?t=c:t!==c&&(t+=(f??"")+i[p+1]),this._$AH[p]=f}d&&!s&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},qe=class extends se{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},Ke=class extends se{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},Ge=class extends se{constructor(t,n,o,s,i){super(t,n,o,s,i),this.type=5}_$AI(t,n=this){if((t=re(this,t,n,0)??c)===oe)return;let o=this._$AH,s=t===c&&o!==c||t.capture!==o.capture||t.once!==o.once||t.passive!==o.passive,i=t!==c&&(o===c||s);s&&this.element.removeEventListener(this.name,this,o),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ve=class{constructor(t,n,o){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(t){re(this,t)}},Jn={M:Mt,P:U,A:Nt,C:1,L:Dn,R:ze,D:Ln,V:re,I:ue,H:se,N:Ke,U:Ge,B:qe,F:Ve},xr=Jt.litHtmlPolyfillSupport;xr?.(Pe,ue),(Jt.litHtmlVersions??=[]).push("3.3.3");var b=(e,t,n)=>{let o=n?.renderBefore??t,s=o._$litPart$;if(s===void 0){let i=n?.renderBefore??null;o._$litPart$=s=new ue(t.insertBefore(Ae(),i),i,void 0,n??{})}return s._$AI(e),s};var Mn=e=>(...t)=>({_$litDirective$:e,values:t}),Ye=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,o){this._$Ct=t,this._$AM=n,this._$Ci=o}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}};var{I:ca}=Jn;var Rr={},Nn=(e,t=Rr)=>e._$AH=t;var Un=Mn(class extends Ye{constructor(){super(...arguments),this.key=c}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(Nn(e),this.key=t),n}});function g(e,t=document){let n=t.querySelector(e);if(!n)throw new Error(`Element not found: ${e}`);return n}function _(e,t=document){return t.querySelector(e)}function pe(e){return Cr.test(e)}var Cr=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;function Ze(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function In(e,t){let n=e.split(".").map(Number),o=t.split(".").map(Number);for(let s=0;s<Math.max(n.length,o.length);s+=1){let i=(n[s]??0)-(o[s]??0);if(i!==0)return i}return 0}function zn(e){try{return new URL(e).pathname.replace(/^\/+|\/+$/g,"")||e}catch{return e}}function me(e){return e.replace(/^https?:\/\//,"").replace(/\/$/,"")}function Qe(e){return e.map(t=>({label:t.label,state:t.state,meta:Ar(t.seconds),output:t.output}))}function Ar(e){if(e<60)return`${e}s`;let t=e%60;return t===0?`${Math.floor(e/60)}m`:`${Math.floor(e/60)}m ${t}s`}function R(e,t){let n=Math.max(0,Math.round(Date.now()/1e3)-e),[o,s]=n<60?[n,"second"]:n<3600?[Math.round(n/60),"minute"]:n<86400?[Math.round(n/3600),"hour"]:[Math.round(n/86400),"day"];try{return new Intl.RelativeTimeFormat(t,{numeric:"auto"}).format(-o,s)}catch{return`${o} ${s}`}}function je(e){let t=Math.max(0,Math.round(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function Xe(e,t){let n=["B","KB","MB","GB","TB"],o=Math.max(0,e),s=0;for(;o>=1024&&s<n.length-1;)o/=1024,s++;return`${new Intl.NumberFormat(t,{maximumFractionDigits:o<10?1:0}).format(o)} ${n[s]}`}function w(e,t){return Un(e,t)}function S(e,t,n,o){let s=document.createElement("sds-button");return s.variant=t,o&&(s.size=o),s.append(document.createTextNode(e)),s.addEventListener("click",n),s}function he(e,t){t.trim()!==""&&e.updateComplete.then(()=>{let n=document.createTreeWalker(e,NodeFilter.SHOW_TEXT).nextNode();if(n){n.nodeValue=t;return}(e.querySelector("button, a")??e).append(document.createTextNode(t))})}function fe(e,t){let n=document.createElement("sds-button"),o=document.createElement("sds-icon");return o.name="actions-window-open",o.size=16,n.variant="secondary",n.href=e,n.rel="external",n.append(document.createTextNode(t),o),n}function Er(e,t,n,o,s){let i=document.createElement("sds-select");return i.options=e.map(d=>({label:d.label,value:d.value,disabled:d.disabled===!0})),i.value=t,i.filled=t!=="",i.label=o,s===void 0?i.size="sm":i.caption=s,i.addEventListener("sds-change",d=>n(d.detail)),i}var Fn=0;function et(e,t,n,o){if(e.length>6)return Er(e.map(i=>({value:i.value,label:i.label})),t,n,o,o);let s=document.createElement("sds-radio");return Fn+=1,s.name=`choice-${Fn}`,s.legend=o,s.choices=e.map(i=>({label:i.label,value:i.value,...i.hint===void 0?{}:{hint:i.hint}})),s.value=t,s.addEventListener("sds-change",i=>n(i.detail)),s}async function qn(){let e=await fetch("/translations/index.json");return e.ok?await e.json():["en"]}async function Kn(e){let t=await fetch(`/translations/${e}.json`);if(!t.ok)throw new Error(`Missing translations for "${e}"`);return await t.json()}function Gn(e,t,n={}){let o=e[Pr(e,t,n)]??e[t]??t;for(let[s,i]of Object.entries(n))o=o.replaceAll(`{${s}}`,String(i));return o}function Pr(e,t,n){return Number(n.count)===1&&e[`${t}.one`]!==void 0?`${t}.one`:t}var jr="/api",ie=class extends Error{constructor(n,o){super(n);this.status=o}},It=class extends Error{constructor(n){super(`No answer from the container, only a ${n} from in front of it.`);this.status=n}};async function y(e,t={}){let n=t.body?{"Content-Type":"application/json"}:{},o=await fetch(`${jr}/${e}`,{...t,headers:n});if(!o.ok&&Wr(o.status,o.headers.get("Content-Type")))throw new It(o.status);let s=await o.json().catch(()=>({}));if(!o.ok){let i=s.error;throw new ie(i??`Request failed with status ${o.status}`,o.status)}return s}function Wr(e,t){return!((t??"").split(";")[0]?.trim().toLowerCase()==="application/json")&&Hr.includes(e)}var Hr=[404,502,503,504],h={state:()=>y("state"),createWorktree:e=>y("worktrees",{method:"POST",body:JSON.stringify(e)}),preview:e=>y(`worktrees/preview?${new URLSearchParams(e).toString()}`),updateWorktree:(e,t)=>y(`worktrees/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),provisionWorktree:(e,t=!1)=>y(`worktrees/${encodeURIComponent(e)}/provision`,{method:"POST",body:JSON.stringify({fresh:t})}),syncWorktree:(e,t="")=>y(`worktrees/${encodeURIComponent(e)}/sync`,{method:"POST",body:JSON.stringify(t!==""?{from:t}:{})}),pullWorktree:e=>y(`worktrees/${encodeURIComponent(e)}/pull`,{method:"POST"}),commits:(e,t=0)=>y(`worktrees/${encodeURIComponent(e)}/commits${t>0?`?skip=${t}`:""}`),branch:e=>y(`branch?branch=${encodeURIComponent(e)}`),branchCommits:(e,t=0)=>y(`branch/commits?branch=${encodeURIComponent(e)}${t>0?`&skip=${t}`:""}`),commit:(e,t)=>y(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}`),commitDiff:(e,t,n)=>y(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}/diff?path=${encodeURIComponent(n)}`),changes:e=>y(`worktrees/${encodeURIComponent(e)}/changes`),worktreeUsage:e=>y(`worktrees/${encodeURIComponent(e)}/usage`),changeDiff:(e,t)=>y(`worktrees/${encodeURIComponent(e)}/changes/diff?path=${encodeURIComponent(t)}`),discardWorktree:e=>y(`worktrees/${encodeURIComponent(e)}/discard`,{method:"POST"}),restoreWorktree:e=>y(`worktrees/${encodeURIComponent(e)}/restore`,{method:"POST"}),removeWorktree:e=>y(`worktrees/${encodeURIComponent(e)}`,{method:"DELETE"}),fetch:e=>y("fetch",{method:"POST",body:JSON.stringify(e!==void 0?{remote:e}:{})}),job:(e,t=0)=>y(`jobs/${encodeURIComponent(e)}${t>0?`?since=${t}`:""}`),worktreeJobs:e=>y(`worktrees/${encodeURIComponent(e)}/jobs`)};function tt(e){try{return localStorage.getItem(e)}catch{return null}}function nt(e,t){try{localStorage.setItem(e,t)}catch{}}function Vn(e,t){return JSON.stringify(e)!==JSON.stringify(t)}function Yn(e){let t=new Set,n=!1,o=()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1;for(let i of t)i()}))};return{state:new Proxy({...e},{set(i,d,u){return Reflect.get(i,d)===u||(Reflect.set(i,d,u),o()),!0}}),subscribe(i){return t.add(i),()=>t.delete(i)}}}var Zn="branchery-language",{state:l,subscribe:ot}=Yn({tld:location.host,projectName:"",worktrees:[],project:null,branch:"",branches:[],remotes:[],repository:null,phpVersions:[],strings:{},loading:!0,language:tt(Zn)||document.documentElement.lang||"en",job:null,runningJobs:[],error:"",unreachable:!1,recipeProblem:null,unconfigured:!1,updateWaiting:!1});function r(e,t={}){return Gn(l.strings,e,t)}async function zt(e){l.strings=await Kn(e),l.language=e,document.documentElement.lang=e,nt(Zn,e),document.querySelectorAll("[data-i18n]").forEach(t=>{let n=t.dataset.i18n;n&&(t.textContent=r(n))})}async function C(e=!1){return We!==null?(e||(l.loading=!0),We):(We=Lr(e).finally(()=>{We=null}),We)}var We=null;async function Lr(e){l.loading=!e;try{let t=await Br();return l.unreachable=!1,t}catch(t){return t instanceof ie?(l.unreachable=!1,L(t.message)):l.unreachable=!0,l.runningJobs}finally{l.loading=!1}}async function Br(){let e=await h.state();return k("worktrees",e.worktrees),k("branches",e.branches),k("remotes",e.remotes),k("repository",e.repository??null),k("branch",e.branch),k("project",e.project),k("phpVersions",e.phpVersions),k("tld",e.tld||location.host),k("projectName",e.projectName??""),k("recipeProblem",e.recipeProblem??null),k("unconfigured",e.unconfigured===!0),k("updateWaiting",e.updateWaiting??!1),k("runningJobs",e.runningJobs??[]),l.runningJobs}function k(e,t){Vn(l[e],t)&&(l[e]=t)}function L(e){l.error=e}function j(e){if(Or(e)){l.unreachable=!0;return}L(A(e))}function Or(e){return e instanceof Error&&!(e instanceof ie)}function A(e){return e instanceof ie?e.message:e instanceof Error?r("error.unreachable"):r("error.generic")}function ge(e){let t=l.runningJobs.find(n=>n.subject===e);return t===void 0?void 0:t.step?.label??Kt(t.command)}function Qn(e,t=null,n="create"){let o={id:e,expected:t,kind:n,status:"running",subject:t??"",command:"",step:null,steps:[],elapsed:0,log:"",size:0,partial:!1,interrupted:!1};return l.job=o,o}var qt={"worktree:add":{kind:"create",history:"history.add",doing:"job.doing.create"},"worktree:fork":{kind:"create",history:"history.fork",doing:"job.doing.create"},"worktree:provision":{kind:"create",history:"history.provision",doing:"job.doing.provision"},"worktree:remove":{kind:"remove",history:"history.remove",doing:"job.doing.remove"},"database:sync":{kind:"sync",history:"history.sync",doing:"job.doing.sync"},"worktree:pull":{kind:"pull",history:"history.pull",doing:"job.doing.pull"},"worktree:restore":{kind:"restore",history:"history.restore",doing:"job.doing.restore"},"worktree:discard":{kind:"discard",history:"history.discard",doing:"job.doing.discard"},"git:fetch":{kind:"fetch",history:"history.fetch",doing:"job.doing.fetch"}};function Xn(e){return qt[e]?.kind??"create"}function rt(e){return r(qt[e]?.history??"history.other")}function Kt(e){return r(qt[e]?.doing??"job.doing.create")}function st(){return{running:r("step.state.running"),done:r("step.state.done"),failed:r("step.state.failed")}}var to="[A-Za-z0-9][A-Za-z0-9.-]*",Dr=new RegExp(`^/w/(${to})$`),Jr=new RegExp(`^/w/(${to})/c/([0-9a-f]{4,40})$`);function no(e){let t=e.replace(/^#/,""),n=Jr.exec(t);if(n?.[1]!==void 0&&n[2]!==void 0)return{view:"commit",name:n[1],sha:n[2],branch:""};let o=Dr.exec(t);if(o?.[1]!==void 0)return{view:"worktree",name:o[1]};let s=/^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(t),i=eo(s?.[1]);if(i!==null&&s?.[2]!==void 0)return{view:"commit",name:"",sha:s[2],branch:i};let d=eo(/^\/b\/(.+)$/.exec(t)?.[1]);return d!==null?{view:"branch",name:d}:{view:"overview"}}function eo(e){if(e===void 0||e==="")return null;let t;try{t=decodeURIComponent(e)}catch{return null}return pe(t)?t:null}function q(e,t){return e.view!==t.view?!1:e.view==="worktree"&&t.view==="worktree"||e.view==="branch"&&t.view==="branch"?e.name===t.name:e.view==="commit"&&t.view==="commit"?e.name===t.name&&e.sha===t.sha&&e.branch===t.branch:!0}function Gt(e){return e.replace(/^#/,"").startsWith("new")}function oo(e){return Gt(e)?"#/":null}var ro=[];function B(){return no(window.location.hash)}function it(e){window.location.hash!==`#${e}`&&(window.location.hash=e)}function so(e){ro.push(e)}function io(){history.scrollRestoration="manual"}io();window.addEventListener("hashchange",()=>{io();let e=B();for(let t of ro)t(e)});var at=globalThis,dt=at.ShadowRoot&&(at.ShadyCSS===void 0||at.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,lo=Symbol(),ao=new WeakMap,lt=class{constructor(t,n,o){if(this._$cssResult$=!0,o!==lo)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o,n=this.t;if(dt&&t===void 0){let o=n!==void 0&&n.length===1;o&&(t=ao.get(n)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),o&&ao.set(n,t))}return t}toString(){return this.cssText}},co=e=>new lt(typeof e=="string"?e:e+"",void 0,lo);var uo=(e,t)=>{if(dt)e.adoptedStyleSheets=t.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of t){let o=document.createElement("style"),s=at.litNonce;s!==void 0&&o.setAttribute("nonce",s),o.textContent=n.cssText,e.appendChild(o)}},Vt=dt?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let n="";for(let o of t.cssRules)n+=o.cssText;return co(n)})(e):e;var{is:Mr,defineProperty:Nr,getOwnPropertyDescriptor:Ur,getOwnPropertyNames:Fr,getOwnPropertySymbols:Ir,getPrototypeOf:zr}=Object,ct=globalThis,po=ct.trustedTypes,qr=po?po.emptyScript:"",Kr=ct.reactiveElementPolyfillSupport,He=(e,t)=>e,Yt={toAttribute(e,t){switch(t){case Boolean:e=e?qr:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},ho=(e,t)=>!Mr(e,t),mo={attribute:!0,type:String,converter:Yt,reflect:!1,useDefault:!1,hasChanged:ho};Symbol.metadata??=Symbol("metadata"),ct.litPropertyMetadata??=new WeakMap;var F=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=mo){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){let o=Symbol(),s=this.getPropertyDescriptor(t,o,n);s!==void 0&&Nr(this.prototype,t,s)}}static getPropertyDescriptor(t,n,o){let{get:s,set:i}=Ur(this.prototype,t)??{get(){return this[n]},set(d){this[n]=d}};return{get:s,set(d){let u=s?.call(this);i?.call(this,d),this.requestUpdate(t,u,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??mo}static _$Ei(){if(this.hasOwnProperty(He("elementProperties")))return;let t=zr(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(He("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(He("properties"))){let n=this.properties,o=[...Fr(n),...Ir(n)];for(let s of o)this.createProperty(s,n[s])}let t=this[Symbol.metadata];if(t!==null){let n=litPropertyMetadata.get(t);if(n!==void 0)for(let[o,s]of n)this.elementProperties.set(o,s)}this._$Eh=new Map;for(let[n,o]of this.elementProperties){let s=this._$Eu(n,o);s!==void 0&&this._$Eh.set(s,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let n=[];if(Array.isArray(t)){let o=new Set(t.flat(1/0).reverse());for(let s of o)n.unshift(Vt(s))}else t!==void 0&&n.push(Vt(t));return n}static _$Eu(t,n){let o=n.attribute;return o===!1?void 0:typeof o=="string"?o:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,n=this.constructor.elementProperties;for(let o of n.keys())this.hasOwnProperty(o)&&(t.set(o,this[o]),delete this[o]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return uo(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,o){this._$AK(t,o)}_$ET(t,n){let o=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,o);if(s!==void 0&&o.reflect===!0){let i=(o.converter?.toAttribute!==void 0?o.converter:Yt).toAttribute(n,o.type);this._$Em=t,i==null?this.removeAttribute(s):this.setAttribute(s,i),this._$Em=null}}_$AK(t,n){let o=this.constructor,s=o._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let i=o.getPropertyOptions(s),d=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:Yt;this._$Em=s;let u=d.fromAttribute(n,i.type);this[s]=u??this._$Ej?.get(s)??u,this._$Em=null}}requestUpdate(t,n,o,s=!1,i){if(t!==void 0){let d=this.constructor;if(s===!1&&(i=this[t]),o??=d.getPropertyOptions(t),!((o.hasChanged??ho)(i,n)||o.useDefault&&o.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(d._$Eu(t,o))))return;this.C(t,n,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,n,{useDefault:o,reflect:s,wrapped:i},d){o&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,d??n??this[t]),i!==!0||d!==void 0)||(this._$AL.has(t)||(this.hasUpdated||o||(n=void 0),this._$AL.set(t,n)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,i]of this._$Ep)this[s]=i;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[s,i]of o){let{wrapped:d}=i,u=this[s];d!==!0||this._$AL.has(s)||u===void 0||this.C(s,void 0,i,u)}}let t=!1,n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(o=>o.hostUpdate?.()),this.update(n)):this._$EM()}catch(o){throw t=!1,this._$EM(),o}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(t){}firstUpdated(t){}};F.elementStyles=[],F.shadowRootOptions={mode:"open"},F[He("elementProperties")]=new Map,F[He("finalized")]=new Map,Kr?.({ReactiveElement:F}),(ct.reactiveElementVersions??=[]).push("2.1.2");var Zt=globalThis,be=class extends F{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=b(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return oe}};be._$litElement$=!0,be.finalized=!0,Zt.litElementHydrateSupport?.({LitElement:be});var Gr=Zt.litElementPolyfillSupport;Gr?.({LitElement:be});(Zt.litElementVersions??=[]).push("4.2.2");var Vr=new Set(["worktree:add","worktree:fork"]);function fo(e,t){let n=new Set(t);return e.filter(o=>Vr.has(o.command)&&o.subject!==""&&!n.has(o.subject))}function ut(e,t){return e.filter(n=>pt([n.name,n.branch,n.database,n.url,n.php,n.base?.branch??"",n.tip?.subject??""].join(" "),t))}function go(e,t){return e.filter(n=>pt([n.name,n.tip?.subject??""].join(" "),t))}function pt(e,t){let n=t.toLowerCase().split(/\s+/).filter(s=>s!==""),o=e.toLowerCase();return n.every(s=>o.includes(s))}function bo(e,t){let n=o=>o.base===null?[0,""]:o.base.branch===t?[1,""]:[2,o.base.branch];return e.map((o,s)=>({worktree:o,at:s,rank:n(o)})).sort((o,s)=>o.rank[0]-s.rank[0]||o.rank[1].localeCompare(s.rank[1],void 0,{numeric:!0})||o.at-s.at).map(o=>o.worktree)}function $o(){let e=!1;return{pending:()=>e,run(t,n=()=>{}){if(e)return!1;e=!0;let o=()=>{e=!1,n()},s;try{s=t()}catch(i){throw o(),i}return Promise.resolve(s).then(o,o),!0}}}var O=g("#wizard"),Yr=g("#wizForm"),$e=g("#wizProgress"),yo=g("#wizTitle"),ht=g("#wizLead"),mt=g("#wizBody"),Zr=g("#wizFoot"),Qt=g("#wizBack"),ye=g("#wizNext"),T=null,x=0,Le=!1,Qr=$o(),Xr={update:()=>en()};function K(e){T=e,x=0,Le=!1,vo(e.tall===!0),Xt(),ft()}function vo(e){O.classList.toggle("sds-modal--lg",e),O.classList.toggle("sds-modal--md",!e)}function ft(){O.open||O.showModal()}function D(){O.open&&O.close()}function ae(){return O.open}function gt(){return O.open&&T!==null}function bt(e){O.addEventListener("close",e)}function $t(){return T===null?[]:T.steps.filter(e=>e.when===void 0||e.when())}function yt(){$t()[x]?.leave?.()}function Xt(){let e=$t(),t=e[x];t&&(yo.textContent=t.heading,b(t.lead??c,ht),ht.hidden=t.lead===void 0,es(e),b(c,mt),t.enter(mt,Xr),en(),window.setTimeout(()=>{_('input:not([type]), input[type="text"]',mt)?.focus()},20))}function es(e){$e.hidden=e.length<2,!(e.length<2)&&($e.caption=e[x]?.label??"",$e.label=r("step.progress"),$e.max=e.length,$e.value=x+1)}function en(){let e=$t(),t=e[x];if(!t||T===null)return;let n=x===e.length-1;tn({back:x===0?r("action.cancel"):r("action.back"),onBack:ts,next:n?T.finishLabel():r("action.next"),onNext:wo}),ye.disabled=t.ready?.()===!1}function wo(){let e=$t(),t=e[x];if(!(!t||T===null||t.ready?.()===!1)){if(x>=e.length-1){let n=T;Qr.run(()=>n.finish(),()=>{T===n&&!Le&&en()})&&(ye.disabled=!0);return}yt(),x+=1,Xt()}}function ts(){if(x===0){D();return}yt(),x-=1,Xt()}Yr.addEventListener("submit",e=>{e.preventDefault(),T!==null&&wo()});O.addEventListener("close",()=>{yt(),T=null,Le=!1});function tn(e={}){Zr.hidden=e.back==null&&e.next==null,Qt.hidden=e.back==null,he(Qt,e.back??""),Qt.onclick=e.onBack??null,ye.hidden=e.next==null,he(ye,e.next??""),ye.disabled=!1,ye.onclick=e.onNext??null}function vt(e,t=""){Le||(Le=!0,T===null&&vo(!1)),yt(),T=null,$e.hidden=!0,yo.textContent=e,b(t===""?c:t,ht),ht.hidden=t===""}function _o(e){b(e,mt)}function J(){return a`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="actions-circle-half" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${r("detail.loading")}</span>
        </p>`}function W(e=0,t=""){return a`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${t}"
        style="--sds-skeleton-delay: ${e%3*.12}s"></span>`}var ko=null,on=new Map,nn=new Set,ns=300,rn;function sn(e){return e!==""&&!pe(e)?r("error.branchName"):""}function To(e){return e===l.branch||l.project?.branch===e||l.branches.some(t=>t.name===e)||l.worktrees.some(t=>t.branch===e)}function So(e){let t=sn(e);return t!==""?t:e!==""&&To(e)?r("error.branchExists",{branch:e}):""}function G(e,t=""){let n={mode:l.branches.length>0?"branch":"fork",branch:t,from:"",name:""},o=()=>n.name.trim()||Ze(n.branch),s=()=>{let d=o();return d!==""&&d===l.projectName?r("preview.isProject",{name:d}):l.worktrees.some(u=>u.name===d)?r("preview.exists",{name:d}):""},i={tall:!0,steps:[os(n),ss(n),as(n,o,s)],finishLabel:()=>n.mode==="fork"?r("action.fork"):r("action.create"),finish:()=>ds(n,o(),e)};K(i)}function os(e){return{label:r("step.mode.label"),heading:r("step.mode.heading"),lead:r("step.mode.lead"),ready:()=>e.mode==="fork"||pe(e.branch),enter(t,n){let o=l.branches.length>0;o||(e.mode="fork");let s=()=>{b(a`
                    <sds-radio
                        legend=${r("step.mode.heading")}
                        legend-said-only
                        name="createMode"
                        hint=${o?"":r("mode.branchNone")}
                        value=${e.mode}
                        .choices=${[...o?[{label:r("mode.branch"),value:"branch",hint:r("mode.branchHint")}]:[],{label:r("mode.fork"),value:"fork",hint:r("mode.forkHint")}]}
                        @sds-change=${i=>{e.mode=i.detail==="branch"?"branch":"fork",e.branch="",s()}}></sds-radio>
                    <div class="branchery-choice-detail" ?hidden=${e.mode!=="branch"}>
                        <div class="branchery-choice-find">
                            <sds-field
                                label=${r("field.branch")}
                                value=${e.branch===""?r("field.branchFilter"):e.branch}
                                ?filled=${e.branch!==""}
                                @sds-input=${i=>{e.branch=i.detail.trim(),s()}}></sds-field>
                            <span class="branchery-choice-count"
                                  >${r("overview.branches",{count:l.branches.length})}</span>
                        </div>
                        <div class="branchery-picklist">${rs(e,s)}</div>
                        <sds-note tone="error" ?hidden=${sn(e.branch)===""}
                                  body=${sn(e.branch)}></sds-note>
                    </div>`,t),n.update()};s()}}}function rs(e,t){let n=e.branch.toLowerCase(),o=l.branches.map(i=>i.name),s=o.includes(e.branch)?o:o.filter(i=>i.toLowerCase().includes(n));return s.length===0?a`<p class="branchery-picklist__empty">${r("step.branch.noMatch")}</p>`:s.map(i=>a`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(i===e.branch)}
                @click=${()=>{e.branch=i,t()}}>${i}</button>`)}function ss(e){return{label:r("step.fork.label"),heading:r("step.fork.heading"),lead:r("step.fork.lead"),when:()=>e.mode==="fork",ready:()=>pe(e.branch)&&!To(e.branch),enter(t,n){let o=()=>{b(a`
                    ${""}
                    <sds-field
                        field-id="newBranch"
                        caption=${r("field.newBranch")}
                        value=${e.branch===""?r("field.newBranchPlaceholder"):e.branch}
                        ?filled=${e.branch!==""}
                        @sds-input=${s=>{e.branch=s.detail.trim(),o()}}></sds-field>
                    ${is(e)}
                    <sds-note tone="error" ?hidden=${So(e.branch)===""}
                              body=${So(e.branch)}></sds-note>`,t),n.update()};o()}}}function is(e){let t=document.createElement("sds-select");return t.caption=r("field.branchFrom"),t.options=[{label:r("field.branchFromProject",{branch:l.branch}),value:""},...l.worktrees.map(n=>({label:n.name,value:n.name}))],t.value=e.from,t.filled=!0,t.addEventListener("sds-change",n=>{e.from=n.detail}),t}function as(e,t,n){return{label:r("step.review.label"),heading:r("step.review.heading"),lead:r("step.review.lead"),ready:()=>t()!==""&&n()==="",enter(o,s){ko=i=>Be(e,t,n,o,s,i),Ro(e,t(),()=>{_("#name")!==null&&Be(e,t,n,o,s)}),Be(e,t,n,o,s)},leave(){window.clearTimeout(rn)}}}function xo(e,t){return JSON.stringify([e.mode,e.branch,e.mode==="fork"?e.from:"",t])}async function Ro(e,t,n){let o=xo(e,t);if(on.get(o)!=null||nn.has(o))return;nn.add(o);let s=null;try{s=await h.preview({mode:e.mode,branch:e.branch,from:e.from,name:e.name})}catch{}finally{nn.delete(o)}on.set(o,s),n()}function ls(e,t,n,o,s){window.clearTimeout(rn),rn=window.setTimeout(()=>{Ro(e,t(),()=>{_("#name")!==null&&Be(e,t,n,o,s)})},ns)}function Be(e,t,n,o,s,i=""){let d=e.mode==="fork"?l.worktrees.find(m=>m.name===e.from):void 0,u=r("preview.databaseCopy",{name:d?.database??l.project?.database??"db"}),p=i!==""?i:n(),f=on.get(xo(e,t())),v=f===void 0?W(2):f===null?d?d.php:r("preview.phpFromProject"):f.php??r("preview.phpRead",{file:f.readFrom??""});b(a`
        <div class="branchery-preview">
            <dl>
                <dt>${r("preview.branch")}</dt>
                <dd><code class="sds-mono">${e.branch}</code></dd>
                <dt>${r("preview.directory")}</dt>
                <dd><code class="sds-mono">.worktrees/${t()}</code></dd>
                <dt>${r("preview.address")}</dt>
                <dd><code class="sds-mono">https://${Ze(t())}.${l.tld}</code></dd>
                <dt>${r("preview.database")}</dt>
                <dd>${u}</dd>
                <dt>${r("preview.php")}</dt>
                <dd>${v}</dd>
            </dl>
        </div>
        ${(f?.warnings??[]).map(m=>a`<sds-note tone="warn" body=${m}></sds-note>`)}
        <sds-field
            field-id="name"
            caption=${r("field.nameOverride")}
            hint=${r("field.namePlaceholder")}
            value=${e.name===""?Ze(e.branch):e.name}
            ?filled=${e.name!==""}
            @sds-input=${m=>{e.name=m.detail.trim(),Be(e,t,n,o,s),ls(e,t,n,o,s)}}></sds-field>
        ${p===""?c:a`<sds-note tone="error" body=${p}></sds-note>`}`,o),s.update()}async function ds(e,t,n){let o=e.mode==="fork"?{mode:"fork",branch:e.branch,from:e.from,name:e.name}:{mode:"branch",branch:e.branch,name:e.name};try{let s=await h.createWorktree(o);n.onJob(s.job,t)}catch(s){j(s),_("#name")!==null&&ko?.(A(s))}}function wt(e){return e.filter(t=>!t.isProject&&(t.merged||t.gone)&&t.changes===0)}function Co(e){return e.merged}function Ao(e,t){let n=wt(e),o=new Set(n.filter(Co).map(s=>s.name));K({tall:n.length>3,steps:[{label:r("tidy.step"),heading:r("tidy.heading"),lead:r("tidy.lead"),enter(s,i){b(a`
                    <sds-checkbox-group
                        legend=${r("tidy.heading")}
                        legend-said-only
                        name="tidy"
                        .choices=${n.map(d=>({label:d.name,value:d.name,hint:`${d.branch} \xB7 ${cs(d)}`}))}
                        .values=${[...o]}
                        @sds-change=${d=>{o.clear();for(let u of d.detail)o.add(u);i.update()}}></sds-checkbox-group>`,s)},ready:()=>o.size>0}],finishLabel:()=>r("tidy.confirm",{count:o.size}),finish:()=>us(n.filter(s=>o.has(s.name)),t)})}function cs(e){return e.merged?r("tidy.why.merged"):r("tidy.why.gone")}async function us(e,t){vt(r("tidy.working"),r("tidy.workingLead",{count:e.length}));let n=await Promise.allSettled(e.map(i=>h.removeWorktree(i.name))),o=[];n.forEach((i,d)=>{let u=e[d]?.name??"";i.status==="fulfilled"?o.push({job:i.value.job,name:u}):j(i.reason)});let s=o[0];if(s===void 0){D();return}t.onJob(s.job,s.name,"remove")}var ps=6,E="",Eo=10,an=!1,le=null;function dn(e){le=e,l.loading||ks();let t=bs(),n=bo(ut(l.worktrees,E),l.project?.branch??l.branch);b(a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${gs(t)}
            ${fs(t,e)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${hs()?W(0,"branchery-waiting__title"):ms()}</h2>
                ${l.repository===null?c:a`<span class="sds-row sds-row__end">${fe(l.repository,r("detail.repository"))}</span>`}
            </div>
            ${js()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${t.length+l.branches.length>=ps?$s():c}
                <div class="branchery-section-actions">${vs()}</div>
            </div>
            ${Ps(t,n.length)}
            ${_s(t,n)}
        </section>
        ${Hs()}
      </div>`,g("#main"))}function ms(){return l.repository!==null?zn(l.repository):l.projectName===""?r("nav.worktrees"):l.projectName}function hs(){return l.loading&&l.repository===null&&l.projectName===""}function fs(e,t){let n=wt(e);return n.length===0||l.loading?c:a`
        <sds-note tone="info"
                  body=${r("tidy.note",{count:n.length,names:jo(n)})}
                  action=${r("tidy.open")}
                  @sds-note-action=${()=>Ao(e,t)}></sds-note>`}function gs(e){let t=e.filter(n=>n.incomplete&&ge(n.name)===void 0);return t.length===0||l.loading?c:a`
        <sds-note tone="warn"
                  body=${r("overview.unfinished",{count:t.length,names:jo(t)})}></sds-note>`}function jo(e){return e.map(t=>t.name).join(", ")}function bs(){return l.project?[l.project,...l.worktrees]:l.worktrees}function $s(){return a`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${r("overview.filter")}
            value=${E===""?r("overview.filterPlaceholder"):E}
            ?filled=${E!==""}
            @sds-input=${e=>Wo(e.detail)}
            @keydown=${ys}></sds-field>`}function Wo(e){E=e,Ho()}function Ho(){le!==null&&dn(le)}function ys(e){if(e.key==="Escape"){e.target instanceof HTMLElement&&e.target.blur(),Wo("");return}if(e.key==="Enter"){let t=ut(l.worktrees,E)[0]??ut(l.project===null?[]:[l.project],E)[0];t!==void 0&&(e.preventDefault(),it(`/w/${t.name}`))}}var ln=null;function vs(){let e=JSON.stringify([l.remotes,l.language]);if(ln?.key!==e){let t=Os();ln={key:e,nodes:[...t===null?[]:[t],ws()]}}return ln.nodes}function _t(e){le!==null&&e(le)}function ws(){let e=S(r("nav.newWorktree"),"primary",()=>_t(G));return e.title=`${r("nav.newWorktree")} (n)`,e}function _s(e,t){if(l.unreachable&&e.length===0)return c;let n=fo(l.runningJobs,e.map(s=>s.name)).filter(s=>pt(s.subject,E)),o=E.trim()===""?r("table.empty"):r("overview.noMatch");return!l.loading&&t.length===0&&n.length===0?a`<p class="branchery-list__empty">${o}</p>`:a`
        <sds-table
            ?loading=${l.loading}
            loading-rows=${Ss()}
            .columns=${[{head:r("table.worktree"),cls:"sds-td-name"},{head:r("table.outstanding"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.php"),fit:!0},{head:"",cls:"sds-td-into"}]}
            .rows=${l.loading?[]:[...n.map(Ts),...t.map(xs)]}></sds-table>`}var Lo="branchery-rows";function Ss(){let e=l.worktrees.length;if(e>0)return e;let t=Number(tt(Lo));return Number.isFinite(t)&&t>0?t:1}function ks(){nt(Lo,String(l.worktrees.length))}function Ts(e){return{cells:[{value:a`<span class="branchery-list__title">${e.subject}</span>`,note:cn(`${r("table.making")} \xB7 ${e.step?.label??Kt(e.command)}`)},"","",""]}}function cn(e){return a`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${e}</span>`}function xs(e){let t=ge(e.name);return{cells:[{value:a`<a class="branchery-list__title" href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:Bo(e)}`,note:t===void 0?Do(e):cn(t)},Ds(e),e.php,Rs(e)]}}function Rs(e){return a`
        <span class="branchery-list__ways">
            ${""}
            <sds-button variant="secondary" size="sm" icon-only
                        href=${e.url} rel="external"
                        title=${r("table.openSiteAt",{host:me(e.url)})}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${w(r("table.view"),a`<sds-button variant="secondary" size="sm" href="#/w/${e.name}"
                        title=${r("table.viewOf",{name:e.name})}>${r("table.view")}</sds-button>`)}
        </span>`}function Cs(e){return e.split("_").map((t,n)=>n===0?a`${t}`:a`_<wbr>${t}`)}function Bo(e){return a`${As(e)}${Es(e)}${e.stale?a` <sds-badge label=${r("table.staleMark")} tone="warn"></sds-badge>`:c}`}function As(e){return e.ready?e.incomplete?a` <sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a` <sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}function Es(e){return e.merged?a` <sds-badge label=${r("table.mergedMark")} tone="ok"></sds-badge>`:e.gone?a` <sds-badge label=${r("table.goneMark")} tone="warn"></sds-badge>`:c}function Ps(e,t){if(l.unreachable&&e.length===0)return c;let n=l.worktrees.length;return a`<h2 class="sds-h3">${l.loading||n===0?r("nav.worktrees"):E.trim()===""?r("overview.worktrees",{count:n}):r("overview.matching",{shown:t,total:n})}</h2>`}function js(){let e=l.project;if(e===null)return l.loading?Ws():c;let t=ge(e.name);return Oo({name:a`<a class="branchery-checkout__name"
                      href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:Bo(e)}`,meta:t===void 0?a`${Do(e)}${Js(e)}`:cn(t),php:e.php,database:a`<code class="sds-mono">${Cs(e.database)}</code>`,address:a`<sds-link external href=${e.url} label=${me(e.url)}></sds-link>`})}function Ws(){return Oo({name:a`<span class="branchery-checkout__name">${W(0,"branchery-waiting__title")}</span>`,meta:W(1),php:W(0),database:W(1),address:W(2)})}function Oo(e){return a`
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
        </div>`}function Hs(){if(l.loading||l.branches.length===0)return c;let e=go(l.branches,E);if(e.length===0)return c;let t=e.length-Eo,n=an||t<=0?e:e.slice(0,Eo);return a`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${E.trim()===""?r("overview.branches",{count:l.branches.length}):r("overview.branchesMatching",{shown:e.length,total:l.branches.length})}</h2>
            <sds-table
                .columns=${[{head:r("table.branch"),cls:"sds-td-name"},{head:r("table.when"),cls:"sds-td-meta",fit:!0},{head:"",cls:"sds-td-into"}]}
                .rows=${n.map(Ls)}></sds-table>
            ${an||t<=0?c:a`
                <p class="branchery-branches__more">
                    ${w(r("overview.showAllBranches",{count:t}),a`<sds-button variant="ghost" @click=${()=>{an=!0,Ho()}}
                        >${r("overview.showAllBranches",{count:t})}</sds-button>`)}
                </p>`}
        </section>`}function Ls(e){return{cells:[{value:a`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(e.name)}">${e.name}</a>`,note:Bs(e)},R(e.when,l.language),a`${w(r("nav.newWorktree"),a`<sds-button variant="ghost" size="sm"
                             title=${r("table.worktreeOf",{branch:e.name})}
                             @click=${()=>_t(t=>G(t,e.name))}
                    >${r("nav.newWorktree")}</sds-button>`)}`]}}function Bs(e){let t=!e.onRemote&&l.remotes.length>0;return a`${t?a`<span>${r("table.nowhere")}</span>`:c}${e.tip===null?c:a`<span
            class="branchery-list__tip">${e.tip.subject} \u00b7 ${e.tip.sha}</span>`}`}function Os(){let e=l.remotes,t=e[0];if(t===void 0)return null;if(e.length===1)return S(r("nav.fetch",{remote:t}),"ghost",()=>_t(o=>void Po(t,o)));let n=document.createElement("sds-dropdown");return n.label=r("nav.fetchFrom"),n.variant="ghost",n.align="end",n.choices=e.map(o=>({label:o})),n.addEventListener("sds-dropdown-choose",o=>{let s=e[o.detail.index];s!==void 0&&_t(i=>void Po(s,i))}),n}async function Po(e,t){try{let n=await h.fetch(e);L(""),t.onJob(n.job,null,"fetch")}catch(n){j(n)}}function Do(e){return a`<span class="branchery-list__what">${e.branch}${e.tip===null?c:a` \u00b7 ${e.tip.subject}`}</span>`}function Ds(e){let t=Jo(e);return t.length===0?"":a`${t.map(n=>a`<span class="branchery-list__count">${n}</span>`)}`}function Js(e){let t=Jo(e);return t.length===0?c:a`<span class="branchery-list__count">${t.join(" \xB7 ")}</span>`}function Jo(e){let t=[];return e.changes>0&&t.push(r("table.changes",{count:e.changes})),e.ahead!==null&&e.ahead>0&&t.push(r("table.unpushed",{count:e.ahead})),e.behind!==null&&e.behind>0&&t.push(r("table.behind",{count:e.behind})),t}window.addEventListener("keydown",e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;let t=e.target;if(!(t instanceof Element&&t.closest("input, textarea, select, [contenteditable], dialog[open]"))){if(e.key==="/"){let n=_("#filter");n&&(e.preventDefault(),n.focus(),n.select());return}e.key==="n"&&le!==null&&_(".branchery-section-actions")!==null&&(e.preventDefault(),G(le))}});function ve(e,t){return async(n,o,s)=>{let i=null,d="";try{i=await n()}catch(u){d=e(u)}o()&&(s(i,d),t())}}function I(e,t){return a`
        <div class="sds-row branchery-back">
            ${w(e,a`<sds-button variant="ghost" href=${t}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${e}</sds-button>`)}
        </div>`}var Mo=25;function St(e){let t=e.files.length-Mo,n=e.all||t<=0?e.files:e.files.slice(0,Mo);return a`
        <ul class="branchery-changes">
            ${n.map(o=>{let s=e.diffs.get(o.path),i=s?.open===!0;return a`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${i}
                                @click=${()=>e.press(o.path)}>
                            <sds-badge label=${r(`change.${o.status}`)}
                                       tone=${o.status==="deleted"?"warn":c}></sds-badge>
                            ${Ms(o.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${i?"actions-chevron-down":"actions-chevron-end"}></sds-icon>
                        </button>
                        ${i?Ns(s):c}
                    </li>`})}
        </ul>
        ${e.all||t<=0?c:a`
            <p class="branchery-changes__more">
                ${w(r("detail.showAllFiles",{count:t}),a`<sds-button variant="ghost" @click=${e.showAll}>${r("detail.showAllFiles",{count:t})}</sds-button>`)}
            </p>`}`}function Ms(e){let t=e.lastIndexOf("/");return a`<code class="sds-mono branchery-changes__path">${t<0?c:a`<span class="branchery-changes__dir">${e.slice(0,t+1)}</span>`}${e.slice(t+1)}</code>`}function Ns(e){return e===void 0||e.read===null&&e.trouble===""?J():e.read===null?a`<sds-note tone="warn" body=${`${r("detail.changeFailed")} ${e.trouble}`}></sds-note>`:a`
        <sds-diff path=${e.read.path} .body=${e.read.lines}></sds-diff>
        ${e.read.truncated?a`<p class="branchery-changes__more">${r("detail.changeTruncated")}</p>`:c}`}function kt(e,t,n){let o=e.get(t)??{read:null,trouble:"",open:!1};o.open=!o.open,e.set(t,o),o.open&&o.read===null&&n()}function Tt(e,t,n,o){let s=e.get(t);s!==void 0&&e.set(t,{...s,read:n,trouble:o})}var H=null,M={name:"",sha:"",commit:null,trouble:""},Oe=new Map,un=!1,No=ve(A,mn);function Uo(){H=null}function pn(e,t,n=""){let o=n===""?e:l.projectName;H={name:o,sha:t,branch:n},(M.name!==o||M.sha!==t)&&(M={name:o,sha:t,commit:null,trouble:""},Oe=new Map,un=!1,Gs(o,t)),b(Fs(o,t,n),g("#main"))}function Us(e){return H?.name===e.name&&H.sha===e.sha&&H.branch===e.branch&&q(B(),{view:"commit",name:e.branch===""?e.name:"",sha:e.sha,branch:e.branch})}function mn(){H!==null&&Us(H)&&pn(H.branch===""?H.name:"",H.sha,H.branch)}function Fs(e,t,n){let o=M.commit;return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${n===""?I(e,`#/w/${encodeURIComponent(e)}`):I(n,`#/b/${encodeURIComponent(n)}`)}
            ${o===null?Is(t):zs(o,n)}
        </section>
        ${o===null?c:qs(e,o)}
      </div>`}function Is(e){return a`
        <h1 class="sds-h2"><span class="sds-mono">${e}</span></h1>
        ${M.trouble===""?J():a`<sds-note tone="warn" body=${`${r("detail.commitFailed")} ${M.trouble}`}></sds-note>`}`}function zs(e,t){return a`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${e.subject}
                ${e.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${e.url===null?c:a`${fe(e.url,r("detail.commitAtForge"))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${r("table.author")}</dt>
            <dd>${e.author}</dd>
            <dt>${r("table.when")}</dt>
            <dd>${R(e.when,l.language)}</dd>
            <dt>${r("table.commit")}</dt>
            ${""}
            <dd><sds-copy value=${e.id} label=${r("table.commit")}></sds-copy></dd>
            ${e.parents.length===0?c:a`
                <dt>${r("detail.parents")}</dt>
                ${""}
                <dd>${e.parents.map((n,o)=>a`${o===0?c:" \xB7 "}<sds-link
                    href=${t===""?`#/w/${encodeURIComponent(M.name)}/c/${n}`:`#/b/${encodeURIComponent(t)}/c/${n}`} label=${n}></sds-link>`)}</dd>`}
        </dl>
        ${e.body===""?c:a`<pre class="branchery-message">${e.body}</pre>`}`}function qs(e,t){return a`
        <section class="sds-band sds-band--quiet">
            ${""}
            <h2 class="sds-h3">${t.files.length===0?r("detail.touchedNothingHeading"):r("detail.touched",{count:t.files.length})}</h2>
            ${t.files.length===0?a`<p class="branchery-list__quiet">${r("detail.touchedNothing")}</p>`:St({files:t.files,diffs:Oe,press:n=>Ks(e,t.sha,n),all:un,showAll:()=>{un=!0,mn()}})}
        </section>`}function Ks(e,t,n){kt(Oe,n,()=>void Vs(e,t,n)),mn()}function Fo(e,t){return M.name===e&&M.sha===t}async function Gs(e,t){await No(()=>h.commit(e,t),()=>Fo(e,t),(n,o)=>{M={name:e,sha:t,commit:n,trouble:o}})}async function Vs(e,t,n){await No(()=>h.commitDiff(e,t,n),()=>Fo(e,t)&&Oe.has(n),(o,s)=>Tt(Oe,n,o,s))}var xt={log:"",size:0,steps:[]};function Rt(e,t){let n=new Map(e.steps.map(o=>[o.no,o.output]));return{log:t.partial?e.log+t.log:t.log,size:t.size,steps:t.steps.map(o=>({...o,output:o.output??n.get(o.no)??""}))}}function zo(e){switch(e){case"running":return"job.running";case"done":return"job.done";case"failed":return"job.failed";default:return"job.unknown"}}function hn(e){return e==="done"}function Ct(e){let t=e.trim().split(`
`).reverse().find(n=>n.startsWith(Io));return t===void 0?"":t.slice(Io.length).trim()}var Io="\u2717";function qo(e){let t={php:e.php},n=()=>{let s=[];return t.php!==e.php&&s.push({label:r("table.php"),value:t.php,note:r("edit.effect.php")}),s},o={steps:[Ys(e,t),Zs(e,n)],finishLabel:()=>r("action.apply"),finish:()=>Qs(e,t)};K(o)}function Ys(e,t){return{label:r("table.php"),heading:r("edit.step.php.heading",{name:e.name}),lead:r("edit.step.php.lead"),ready:()=>t.php!==e.php,enter(n,o){let s=l.phpVersions.filter(i=>i===e.php||e.minPhp===null||In(i,e.minPhp)>=0);b(a`${et(s.map(i=>({value:i,label:i,...i===e.php?{hint:r("edit.current")}:{}})),t.php,i=>{t.php=i,o.update()},r("table.php"))}`,n)}}}function Zs(e,t){return{label:r("step.review.label"),heading:r("edit.step.review.heading",{name:e.name}),lead:r("step.review.lead"),enter(n){b(a`
                <div class="branchery-preview">
                    <dl>
                        ${t().map(o=>a`
                            <dt>${o.label}</dt>
                            <dd>${o.value}<span class="branchery-preview__note">${o.note}</span></dd>`)}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,n)}}}async function Qs(e,t){try{t.php!==e.php&&await h.updateWorktree(e.name,{php:t.php}),L(""),await C(),D()}catch(n){j(n);let o=_("#editError");o!==null&&(o.body=A(n),o.hidden=!1)}}var Xs=10;function Ko(){return[{head:"",cls:"sds-td-graph"},{head:r("table.subject")},{head:r("table.when"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.author"),fit:!0},{head:r("table.commit"),cls:"sds-td-name",fit:!0}]}function ei(){return a`<sds-table scrollable loading loading-rows=${Xs} .columns=${Ko()}></sds-table>`}function ti(e,t){return e.commits.length===0?c:a`<sds-table
        scrollable
        .columns=${Ko()}
        .rows=${e.commits.map((n,o)=>{let s=!n.own&&(o===0||e.commits[o-1]?.own===!0),i=a`${n.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge> `}${s&&e.base!==null?a`<sds-badge label=${e.base} tone="neutral"></sds-badge> `:c}<span
                    class=${n.own?"branchery-subject":"branchery-subject branchery-subject--base"}><sds-link
                    href=${t(n.sha)}
                    label=${n.subject}></sds-link></span>`;return{cells:[ni(o===0?"current":""),o===0?a`<strong>${i}</strong>`:i,R(n.when,l.language),n.author,n.url===null?a`<code class="sds-mono">${n.sha}</code>`:a`<sds-link external href=${n.url} label=${n.sha}></sds-link>`]}})}></sds-table>`}function ni(e){return a`<span class="sds-graph${e===""?"":` sds-graph--${e}`}"></span>`}function oi(e,t,n,o){return!e.more&&t===""?c:a`
        <p class="branchery-changes__more">
            ${t===""?c:a`<sds-note tone="warn" body=${`${r("detail.commitsFailed")} ${t}`}></sds-note>`}
            ${e.more?n?w(r("detail.loading"),a`<sds-button variant="ghost" disabled>${r("detail.loading")}</sds-button>`):w(r("detail.olderCommits"),a`<sds-button variant="ghost" @click=${o}>${r("detail.olderCommits")}</sds-button>`):c}
        </p>`}function At(e,t,n){let o=fn("");async function s(i,d){d>0&&o.name===i&&(o={...o,reading:!0,trouble:""},n()),await t(()=>e(i,d),()=>o.name===i,(u,p)=>{let f=d>0?o.commits?.commits??[]:[];o={name:i,commits:u===null?o.commits:{...u,commits:[...f,...u.commits]},trouble:p,reading:!1}})}return{about(i){o.name!==i&&(o=fn(i),s(i,0))},of:i=>o.name===i?o.commits:null,trouble:i=>o.name===i&&o.commits===null&&o.trouble!==""?`${r("detail.commitsFailed")} ${o.trouble}`:"",body(i,d){let u=o.name===i?o.commits:null;return u===null?ei():a`${ti(u,d)}
                ${oi(u,o.trouble,o.reading,()=>void s(i,u.commits.length))}`},forget(i){o.name===i&&(o=fn(""))}}}function fn(e){return{name:e,commits:null,trouble:"",reading:!1}}function Et(e){return e.facts.length===0?c:a`
        <div class="sds-facts-group">
            <p class="sds-label">${e.title}</p>
            <dl class="sds-facts">${e.facts.map(ri)}</dl>
        </div>`}function ri(e,t){return a`
        <dt>${e.label}</dt>
        <dd>${e.waiting===!0?W(t):e.copy===!0?a`<sds-copy value=${e.value} label=${e.label}></sds-copy>`:e.said===!0?e.value:a`<code class="sds-mono">${e.value}</code>`}</dd>`}function Pt(e){return[e.own>0?r("detail.ownCommits",{count:e.own}):r("detail.ownNone"),...e.moved>0?[r("table.baseMoved",{base:e.branch,count:e.moved})]:[]].join(" \xB7 ")}var De={user:"admin",password:"Password1!"};function Go(e,t){return[{title:r("detail.repository"),facts:[{label:r("table.branch"),value:e.branch},...gn(e)?[{label:r("detail.madeFor"),value:e.madeFor??""}]:[],...e.base!==null?[{label:r("detail.base"),value:e.forkedAt!==null&&e.forkedFrom===e.base.branch?`${e.base.branch} @ ${e.forkedAt.slice(0,11)}`:e.base.branch},{label:r("detail.sinceBase"),value:Pt(e.base),said:!0}]:[],{label:r("detail.commits"),value:ii(e),said:!0},{label:r("detail.changes"),value:e.changes>0?r("table.changes",{count:e.changes}):r("detail.clean"),said:!0},...e.builtAt===null?[]:[{label:r("detail.built"),value:R(e.builtAt,l.language),said:!0}]]},{title:r("table.address"),facts:[{label:r("detail.site"),value:me(e.url),copy:!0},...e.backend===null?[]:[{label:r("detail.backend"),value:me(e.backend),copy:!0}]]},{title:r("detail.serving"),facts:[{label:r("table.php"),value:e.php+(e.minPhp!==null&&e.minPhp!==e.php?` (${r("detail.minPhp",{version:e.minPhp})})`:"")},...e.node===null?[]:[{label:r("table.node"),value:e.node}],{label:r("table.profile"),value:e.profile??r("table.noProfile")},{label:r("table.docroot"),value:e.docroot===""?"/":e.docroot}]},{title:r("detail.taken"),facts:[{label:r("table.directory"),value:e.path,copy:!0},{label:r("table.database"),value:e.database,copy:!0},...e.backend===null?[]:[{label:r("detail.user"),value:De.user,copy:!0},{label:r("detail.password"),value:De.password,copy:!0}]]},...e.isProject?[]:[si(e.name,t)]]}function si(e,t){return t.name===e&&t.trouble!==""?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:`${r("detail.storageFailed")} ${t.trouble}`,said:!0}]}:t.name!==e||t.value===null?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:"",waiting:!0},{label:r("detail.storageFiles"),value:"",waiting:!0},{label:r("detail.storageDatabase"),value:"",waiting:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}:{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:Xe(t.value.total,l.language),said:!0},{label:r("detail.storageFiles"),value:Xe(t.value.files,l.language),said:!0},{label:r("detail.storageDatabase"),value:Xe(t.value.database,l.language),said:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}}function ii(e){if(e.gone)return r("table.gone");if(e.ahead===null||e.behind===null)return r("detail.noRemote");let t=[...e.ahead>0?[r("table.unpushed",{count:e.ahead})]:[],...e.behind>0?[r("table.behind",{count:e.behind})]:[]];return t.length===0?r("detail.inStep"):t.join(" \xB7 ")}function gn(e){return e.madeFor!==null&&e.madeFor!==e.branch}var de=g("#changes"),bn="";function Vo(){return bn}function Yo(e,t,n){bn=e,de.heading=t,de.body=n,de.actions=[a`${w(r("action.close"),a`<sds-button variant="ghost" @click=${()=>de.close()}>${r("action.close")}</sds-button>`)}`],de.show()}function Zo(){de.close()}function Qo(e){de.addEventListener("sds-dialog-cancel",()=>{bn="",e()})}var we=g("#confirm");function jt(e){return we.heading=e.title,we.body=ai(e),we.confirmLabel=e.confirmLabel,we.cancelLabel=r("action.cancel"),we.tone=e.tone??"primary",we.ask()}function ai(e){return a`
        <p>${e.message}</p>
        ${e.warning===void 0?c:a`<sds-note tone="warn" body=${e.warning}></sds-note>`}
        ${e.facts===void 0||e.facts.length===0?c:a`
            <div class="branchery-preview">
                <dl>${e.facts.map(t=>a`
                    <dt>${t.label}</dt>
                    <dd><code class="sds-mono">${t.value}</code></dd>`)}</dl>
            </div>`}`}async function Xo(e,t){await jt({title:r("confirm.sync.title"),message:r("confirm.sync.body"),facts:[{label:r("table.worktree"),value:e.name},{label:r("table.database"),value:e.database},{label:r("confirm.source"),value:r("field.branchFromProject",{branch:l.project?.branch??l.branch})}],confirmLabel:r("action.sync")})&&await _e(()=>h.syncWorktree(e.name),e.name,"sync",t)}function li(e){return[...e.ahead===null?[r("confirm.worktree.nowhere")]:[],...e.ahead!==null&&e.ahead>0?[r("confirm.worktree.unpushed",{count:e.ahead})]:[],...e.changes>0?[r("confirm.worktree.changes",{count:e.changes})]:[]]}async function er(e,t,n){let o=n;if(o===null)try{o=await h.commits(e.name)}catch(u){j(u);return}let s=o.commits.filter(u=>!u.pushed),i=o.upstream??e.branch;await jt({title:r("confirm.discard.title"),message:r("confirm.discard.body",{upstream:i}),...(e.behind??0)>0?{warning:r("confirm.discard.behind",{count:e.behind??0})}:{},facts:s.map(u=>({label:u.sha,value:u.subject})),confirmLabel:r("action.discard"),tone:"danger"})&&await _e(()=>h.discardWorktree(e.name),e.name,"discard",t)}async function tr(e,t){await _e(()=>h.restoreWorktree(e.name),e.name,"restore",t)}async function nr(e,t){await _e(()=>h.pullWorktree(e.name),e.name,"pull",t)}async function Wt(e,t,n){await _e(()=>h.provisionWorktree(e,t),e,"create",n)}async function or(e,t){let n=li(e);await jt({title:r("confirm.worktree.title"),message:r("confirm.worktree.body"),...n.length>0?{warning:n.join(" ")}:{},facts:[{label:r("table.worktree"),value:e.name},{label:r("table.branch"),value:e.branch},{label:r("table.database"),value:e.database}],confirmLabel:r("action.remove"),tone:"danger"})&&await _e(()=>h.removeWorktree(e.name),null,"remove",t)&&it("/")}async function _e(e,t,n,o){try{let s=await e();return L(""),o.onJob(s.job,t,n),!0}catch(s){return j(s),await C(),!1}}function Ht(e,t){let n={fresh:!1},o={steps:[di(e,n)],finishLabel:()=>n.fresh?r("provision.fresh"):r("table.provision"),finish:()=>t(n.fresh)};K(o)}function di(e,t){return{label:r("table.database"),heading:r("provision.heading",{name:e.name}),lead:r("provision.lead"),enter(n,o){b(a`${et([{value:"keep",label:r("provision.keep"),hint:r("provision.keepHint")},{value:"fresh",label:r("provision.fresh"),hint:r("provision.freshHint")}],t.fresh?"fresh":"keep",s=>{t.fresh=s==="fresh",o.update()},r("table.database"))}`,n)}}}var P={name:"",entries:null,trouble:""},Y=new Map,$n=new Set,Me=ve(A,Z),ke=At((e,t)=>h.commits(e,t),Me,Z),$=yn(""),ce={name:"",value:null,trouble:""};function yn(e){return{name:e,list:{read:null,trouble:"",open:!1},all:!1,diffs:new Map}}var V=null;function rr(){V=null,Zo()}function ci(e){return V?.name===e&&q(B(),{view:"worktree",name:e})}function sr(e){if(P.name===e&&(P={name:"",entries:null,trouble:""},Y.clear()),ke.forget(e),$.name===e){let t=Vo()===e;$=yn(t?e:""),t&&($.list.open=!0,ir(e))}ce.name===e&&(ce={name:"",value:null,trouble:""}),V?.name===e&&Z()}function vn(e,t){V={name:e,handlers:t};let n=[l.project,...l.worktrees].find(s=>s?.name===e)??null;P.name!==e&&(P={name:e,entries:null,trouble:""},Y.clear(),Ri(e));let o=n?.incomplete===!0?ar():null;o!==null&&!Y.has(o.id)&&lr(o.id),n!==null&&ke.about(e),n!==null&&!n.isProject&&ce.name!==e&&(ce={name:e,value:null,trouble:""},Ci(e)),b(n===null?ui(e):pi(n,t),g("#main")),$.name===e&&$.list.open&&Yo(e,r("table.uncommitted"),bi(e))}function ui(e){return!l.loading&&!l.unreachable?a`
          <div class="sds-page">
            <sds-note tone="warn" body=${r("detail.gone",{name:e})}></sds-note>
            ${I(r("detail.back"),"#/")}
          </div>`:a`
      <div class="sds-bands">
        <section class="sds-band">
            ${I(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${e}</span></h1>
            </div>
            ${J()}
        </section>
      </div>`}function pi(e,t){let n=ge(e.name);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${I(r("detail.back"),"#/")}
            ${""}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${e.name}</span>
                    ${e.ready?e.incomplete?a`<sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a`<sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}
                </h1>
                <span class="sds-row sds-row__end">
                    ${Je(e.url,r("table.openSite"))}
                    ${Je(e.backend,r("detail.backend"))}
                    ${e.isProject?Je(l.repository,r("detail.repository")):c}
                    ${Je(e.review,r("detail.review"))}
                    ${Je(e.issue,e.issueId===null?r("detail.issue"):r("detail.issueNumber",{id:e.issueId}))}
                </span>
            </div>
            ${e.isProject?c:_i(e,t,n!==void 0)}
            ${n!==void 0?wi(n):c}
            ${e.incomplete&&n===void 0?vi(e,t):c}
            ${e.stale&&n===void 0?yi(e,t):c}
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.settled")}</h2>
            <div class="sds-facts-set">${Go(e,ce).map(Et)}</div>
        </section>

        ${mi(e)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.history")}</h2>
            ${ki()}
        </section>
      </div>`}function Je(e,t){return e===null?c:a`${fe(e,t)}`}function mi(e){let t=ke.of(e.name),n=ke.trouble(e.name);return n!==""?a`
            <section class="sds-band">
                <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
                <sds-note tone="warn" body=${n}></sds-note>
            </section>`:t!==null&&t.commits.length===0&&e.changes===0?c:a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${e.changes===0?c:a`
                <p class="branchery-uncommitted">
                    <strong>${r("table.uncommitted")}
                        <span class="sds-warn">${r("table.files",{count:e.changes})}</span></strong>
                    ${hi(e.name)}
                </p>`}
            ${ke.body(e.name,o=>`#/w/${encodeURIComponent(e.name)}/c/${o}`)}
        </section>`}function hi(e){return a` ${w(r("detail.showFiles"),a`<sds-button variant="ghost" @click=${()=>fi(e)}>${r("detail.showFiles")}</sds-button>`)}`}function fi(e){$.name!==e&&($=yn(e)),$.list.open=!0,$.list.read===null&&ir(e),Z()}Qo(()=>{$.list.open=!1,Z()});function gi(e,t){$.name===e&&(kt($.diffs,t,()=>void $i(e,t)),Z())}function bi(e){let t=$.list;return t.trouble!==""?a`<sds-note tone="warn" body=${`${r("detail.changesFailed")} ${t.trouble}`}></sds-note>`:t.read===null?J():St({files:t.read,diffs:$.diffs,press:n=>gi(e,n),all:$.all,showAll:()=>{$.all=!0,Z()}})}async function ir(e){await Me(async()=>(await h.changes(e)).changes,()=>$.name===e,(t,n)=>{$.list={...$.list,read:t,trouble:n}})}async function $i(e,t){await Me(()=>h.changeDiff(e,t),()=>$.name===e&&$.diffs.has(t),(n,o)=>Tt($.diffs,t,n,o))}function yi(e,t){return a`
        <sds-note
            tone="warn"
            heading=${r("detail.staleHeading")}
            body=${r("detail.stale")}
            action=${r("table.provision")}
            @sds-note-action=${()=>Ht(e,n=>Wt(e.name,n,t))}></sds-note>`}function vi(e,t){let n=ar(),o=n===null?null:Y.get(n.id)?.stopped??null;return a`
        <sds-note
            tone="warn"
            heading=${r("detail.unfinishedHeading")}
            body=${o===null?r("detail.unfinished"):r("detail.unfinishedAt",{no:o.no,step:o.step,reason:o.reason})}
            action=${r("table.provision")}
            @sds-note-action=${()=>Ht(e,s=>Wt(e.name,s,t))}></sds-note>`}function ar(){return P.entries?.find(e=>e.status==="failed")??null}function wi(e){return a`
        <sds-note
            tone="info"
            heading=${r("detail.busyHeading")}
            body=${r("detail.busy",{doing:e})}></sds-note>`}function _i(e,t,n){let o=JSON.stringify([e,l.language]);Se?.key!==o&&(Se={key:o,...Si(e,t)});for(let d of[...Se.doing,...Se.undoing])d.disabled=n||Se.held.has(d);let{doing:s,undoing:i}=Se;return a`
        <section class="sds-actions">
            ${""}
            <h2 class="sds-said-only">${r("detail.actions")}</h2>
            ${s}
            ${""}
            <span class="sds-row sds-row__end">${i}</span>
        </section>`}var Se=null;function Si(e,t){let n=S(r("table.discard"),"danger",()=>void er(e,t,ke.of(e.name))),o=S(r("table.remove"),"danger",()=>void or(e,t)),s=new Set;e.changes>0&&(s.add(n),n.title=r("detail.discardBlocked"));let i=S(r("table.pull"),"secondary",()=>void nr(e,t));e.behind===0&&(s.add(i),i.title=r("detail.pullBlocked"));let u=[...gn(e)?[S(r("table.restore",{branch:e.madeFor??""}),"secondary",()=>void tr(e,t))]:e.behind===null?[]:[i],S(r("table.edit"),"secondary",()=>qo(e)),S(r("table.sync"),"secondary",()=>void Xo(e,t)),S(r("table.provision"),"secondary",()=>Ht(e,f=>Wt(e.name,f,t)))],p=[...(e.ahead??0)>0?[n]:[],o];return{doing:u,undoing:p,held:s}}function ki(){return P.trouble!==""?a`<sds-note tone="warn" body=${`${r("detail.historyFailed")} ${P.trouble}`}></sds-note>`:P.entries===null?J():P.entries.length===0?a`<p class="branchery-list__quiet">${r("detail.noHistory")}</p>`:a`<div class="branchery-history">${P.entries.map(Ti)}</div>`}function Ti(e){let t=Y.get(e.id),n=`${R(e.started,l.language)} \xB7 ${je(e.elapsed)}`;return a`
        <sds-run
            heading=${rt(e.command)}
            verdict=${e.status}
            note=${t!==void 0&&t.trouble!==""?`${n} \xB7 ${t.trouble}`:n}
            .stateWords=${st()}
            .steps=${t?.steps??[]}
            @click=${o=>xi(o,e.id)}></sds-run>`}function xi(e,t){let n=e.target;!(n instanceof Element)||!n.closest(".sds-run__head")||Y.get(t)?.settled===!0||lr(t)}async function Ri(e){await Me(()=>h.worktreeJobs(e),()=>P.name===e,(t,n)=>{P={name:e,entries:t,trouble:n}})}async function Ci(e){await Me(()=>h.worktreeUsage(e),()=>ce.name===e,(t,n)=>{ce={name:e,value:t,trouble:n}})}async function lr(e){if(!$n.has(e)){$n.add(e);try{let t=await h.job(e),n=t.status==="unknown"&&t.steps.length===0;Y.set(e,{steps:Qe(Rt(xt,t).steps),trouble:n?r("detail.noLog"):"",settled:!0,stopped:Ai(t)})}catch(t){Y.set(e,{steps:[],trouble:`${r("detail.logFailed")} ${A(t)}`,settled:!1,stopped:null})}finally{$n.delete(e)}Z()}}function Ai(e){let t=e.steps.find(n=>n.state==="failed");return e.status!=="failed"||t===void 0?null:{no:t.no,step:t.label,reason:Ct(e.log)}}function Z(){V!==null&&ci(V.name)&&vn(V.name,V.handlers)}var Ne=null,Q={name:"",branch:null,trouble:""},dr=ve(A,ur),wn=At((e,t)=>h.branchCommits(e,t),dr,ur);function cr(){Ne=null}function Sn(e,t){Ne=e,Q.name!==e&&(Q={name:e,branch:null,trouble:""},Oi(e)),wn.about(e),b(Ei(e,t),g("#main"))}var _n=null;function ur(){Ne!==null&&_n!==null&&q(B(),{view:"branch",name:Ne})&&Sn(Ne,_n)}function Ei(e,t){_n=t;let n=Q.branch;return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${I(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${e}</span>
                    ${n===null?c:ji(n)}
                </h1>
            </div>
            ${n===null?Pi():Wi(n,t)}
        </section>
        ${n===null?c:a`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${r("detail.settled")}</h2>
                <div class="sds-facts-set">${Hi(n).map(Et)}</div>
            </section>`}
        ${n===null&&Q.trouble!==""?c:Bi(e)}
      </div>`}function Pi(){return Q.trouble===""?J():a`<sds-note tone="warn" body=${Q.trouble}></sds-note>`}function ji(e){return e.merged?a`<sds-badge label=${r("table.merged",{branch:l.project?.branch??l.branch})}
                               tone="neutral"></sds-badge>`:e.gone?a`<sds-badge label=${r("table.gone")} tone="warn"></sds-badge>`:!e.onRemote&&l.remotes.length>0?a`<sds-badge label=${r("table.nowhere")} tone="warn"></sds-badge>`:c}function Wi(e,t){return e.worktree!==null?a`
            <p class="branchery-list__quiet">${r("detail.branchHasWorktree")}
                <sds-link href=${`#/w/${encodeURIComponent(e.worktree)}`}
                          label=${e.worktree}></sds-link></p>`:a`
        <div class="sds-row">
            ${w(r("nav.newWorktree"),a`<sds-button variant="primary"
                        @click=${()=>G(t,e.name)}>${r("nav.newWorktree")}</sds-button>`)}
        </div>`}function Hi(e){return[{title:r("detail.repository"),facts:[...e.base===null?[]:[{label:r("detail.base"),value:e.base.branch},{label:r("detail.sinceBase"),value:Pt(e.base),said:!0}],{label:r("detail.commits"),value:Li(e),said:!0},{label:r("detail.moved"),value:R(e.when,l.language),said:!0}]}]}function Li(e){if(e.gone)return r("table.gone");if(e.upstream===null)return e.onRemote?r("detail.onRemoteOnly"):r("detail.noRemote");let t=[...e.ahead!==null&&e.ahead>0?[r("table.unpushed",{count:e.ahead})]:[],...e.behind!==null&&e.behind>0?[r("table.behind",{count:e.behind})]:[]];return t.length===0?r("detail.inStep"):`${e.upstream} \xB7 ${t.join(" \xB7 ")}`}function Bi(e){let t=wn.trouble(e);return a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${t===""?wn.body(e,n=>`#/b/${encodeURIComponent(e)}/c/${n}`):a`<sds-note tone="warn" body=${t}></sds-note>`}
        </section>`}async function Oi(e){await dr(()=>h.branch(e),()=>Q.name===e,(t,n)=>{Q={name:e,branch:t,trouble:n}})}var Di={schedule:(e,t)=>setTimeout(e,t),cancel:e=>clearTimeout(e)};function pr(e,t,n,o=Di){let s=!1,i=null,d=()=>{i=o.schedule(()=>{i=null,u()},n)},u=async()=>{let p;try{p=await e()}catch{s||d();return}s||(t(p)?d():s=!0)};return u(),()=>{s=!0,i!==null&&(o.cancel(i),i=null)}}var Ji=1e3,kn=0,mr=null,xn=null;function Rn(e,t,n,o,s=!0){let i=++kn;mr?.();let d=Qn(e,t,n??"create"),u=s,p=xt,f=()=>{u&&!gt()&&hr(d)};xn=()=>{u=!0,ft(),hr(d)},s&&xn();let v=async()=>{await C(),i===kn&&(l.job=d,f(),o(d))};mr=pr(()=>h.job(e,p.size),m=>i!==kn?!1:(p=Rt(p,m),d={...m,log:p.log,steps:p.steps,expected:t??(m.subject===""?null:m.subject),kind:n??Xn(m.command)},m.status==="running"?(f(),!0):(v(),!1)),Ji)}var Mi={running:"job.running",done:"job.ticket.done",failed:"job.ticket.failed",unknown:"job.ticket.unknown"},X=null,Tn="";function Lt(){let e=l.job!==null&&!ae()?l.job.status:"",t=Mi[e];if(t===void 0){X?.remove(),X=null,Tn="";return}X!==null&&Tn===e||(X?.remove(),Tn=e,X=S(r(t),"secondary",()=>{(xn??ft)(),Lt()}),X.className=`branchery-ticket branchery-ticket--${e}`,X.title=r("job.show"),document.body.append(X))}bt(()=>Lt());ot(()=>Lt());function hr(e){vt(Fi(e),e.status==="running"?"":zi(e)),_o(a`
        <sds-run open
                 heading=${Ui(e)}
                 verdict=${e.status}
                 note=${Ii(e)}
                 .stateWords=${st()}
                 .steps=${Qe(e.steps)}></sds-run>`),Ni(e),Lt()}function Ni(e){tn(e.status==="running"?{back:r("action.leaveRunning"),onBack:()=>D()}:{back:r("action.copyLog"),onBack:()=>void qi(e),next:r("action.close"),onNext:()=>{l.job=null,D()}})}function Ui(e){return r(zo(e.status))}function Fi(e){return e.expected??(e.subject===""?rt(e.command):e.subject)}function Ii(e){let t=je(e.elapsed);return e.status==="running"?e.step===null?t:`${r("job.stepOf",{no:e.step.no,total:e.step.total})} \xB7 ${t}`:e.status==="failed"?e.interrupted?r("job.interrupted"):Ct(e.log)||t:hn(e.status)?t:""}function zi(e){if(!hn(e.status))return"";let t=je(e.elapsed);if(e.kind==="fetch"){let s=e.log.split(`
`).filter(i=>i.includes(" -> ")).length;return s===0?r("job.done.fetch",{time:t}):r("job.done.fetchMoved",{count:s,time:t})}let n=l.worktrees.find(s=>s.name===e.expected);if(!n||e.kind==="remove")return r(`job.done.${e.kind}`,{name:e.expected??"",time:t});let o=e.kind==="sync"?r("job.done.sync",{name:n.database}):e.kind==="pull"?r("job.done.pull",{branch:n.branch}):e.kind==="restore"?r("job.done.restore",{branch:n.branch}):e.kind==="discard"?r("job.done.discard",{branch:n.branch}):n.backend===null?r("job.done.built",{php:n.php}):`${r("job.done.built",{php:n.php})} ${r("job.login",De)}`;return a`
        ${o}
        <sds-link external href=${n.url}
                  label=${r("action.openWorktree")}></sds-link>`}async function qi(e){let t=_("#wizBack");try{await navigator.clipboard.writeText(e.log.trim()),t&&(he(t,r("action.copied")),window.setTimeout(()=>he(t,r("action.copyLog")),2e3))}catch{}}var Bt={onJob(e,t=null,n=null){Rn(e,t,n,$r)}};function $r(e){let t=e.expected??e.subject;t!==""&&sr(t)}function Ot(e,t,n,o){let s=g(e);if(s.hidden=!t,!t)return;let i=s.firstElementChild;i===null&&(i=document.createElement("sds-note"),o!==void 0&&i.addEventListener("sds-note-action",o),s.append(i));for(let[d,u]of Object.entries(n()))i.setAttribute(d,u)}function Ki(){Ot("#offline",l.unreachable,()=>({tone:"warn",body:r("error.unreachable"),action:r("action.tryAgain")}),()=>void C())}function Gi(){Ot("#update",l.updateWaiting,()=>({tone:"info",heading:r("update.waiting"),body:r("update.how")}))}function Vi(){Ot("#unconfigured",l.unconfigured,()=>({tone:"info",heading:r("error.unconfigured"),body:r("error.unconfiguredHow")}))}function Yi(){let e=l.recipeProblem;Ot("#recipe",e!==null,()=>({tone:"warn",heading:r("error.recipe"),body:e??""}))}var Te=B();function Re(e=B()){if(ae())return;let t=e.view!==Te.view,n=!q(e,Te);n&&window.scrollTo(0,0),t&&(Te.view==="worktree"&&rr(),Te.view==="commit"&&Uo(),Te.view==="branch"&&cr()),Te=e,yr(),Ki(),Gi(),ra(),Yi(),Vi(),Zi(e),n&&Qi()}function Zi(e){if(e.view==="worktree"){vn(e.name,Bt);return}if(e.view==="branch"){Sn(e.name,Bt);return}if(e.view==="commit"){pn(e.name,e.sha,e.branch);return}dn(Bt)}function Qi(){g("#main").focus({preventScroll:!0})}ot(()=>Re());so(e=>{L(""),Re(e)});var xe=g("#bar"),Ue=[],Xi="https://benjaminkott.github.io/ddev-branchery/",fr="";function yr(){fr!==l.language&&(fr=l.language,xe.menu={label:r("app.title"),items:[{label:r("nav.worktrees"),href:"#/",current:!0},{label:r("nav.docs"),href:Xi,external:!0}]})}function vr(){xe.product=r("app.title"),yr()}function wr(){xe.languages=Ue.map(e=>({label:ea(e),current:e===l.language,lang:e})),xe.updateComplete.then(()=>{_(".sds-bar__lang",xe)?.setAttribute("name",r("app.language"))})}function ea(e){try{return new Intl.DisplayNames([e],{type:"language"}).of(e)??e.toUpperCase()}catch{return e.toUpperCase()}}xe.addEventListener("sds-dropdown-choose",e=>{let t=Ue[e.detail.index];!t||t===l.language||zt(t).then(()=>{wr(),vr(),Re()})});g("#wizard").addEventListener("close",()=>{l.job?.status!=="running"&&(l.job=null)});bt(()=>{let e=oo(location.hash);e!==null&&history.replaceState(null,"",e),Re(),C(!0)});var ta=5e3,gr=Date.now();async function _r(){let e=Date.now();document.visibilityState!=="visible"||l.job?.status==="running"||ae()||e-gr<ta||(gr=e,Sr(await C(!0)))}function Sr(e){let t=e[0];t!==void 0&&l.job?.status!=="running"&&Rn(t.id,null,null,$r,!1)}var na=2e3,oa=1e4,br=!1;function ra(){if(br)return;br=!0;let e=()=>{let t=l.runningJobs.length>0||ae()||l.unreachable;window.setTimeout(()=>{if(document.visibilityState!=="visible"||ae()){e();return}C(!0).then(e)},t?na:oa)};e()}document.addEventListener("visibilitychange",()=>void _r());window.addEventListener("focus",()=>void _r());function kr(){if(Gt(location.hash)){G(Bt);return}gt()&&D()}window.addEventListener("hashchange",kr);(async()=>(Ue=await qn(),await zt(Ue.includes(l.language)?l.language:Ue[0]??"en"),wr(),vr(),Re(),Sr(await C()),Re(),kr()))();
/*! Bundled license information:

lit-html/lit-html.js:
lit-html/directive.js:
@lit/reactive-element/reactive-element.js:
lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
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

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=app.js.map
