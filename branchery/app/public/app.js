var Mt=globalThis,En=e=>e,Ke=Mt.trustedTypes,Pn=Ke?Ke.createPolicy("lit-html",{createHTML:e=>e}):void 0,Ut="$lit$",N=`lit$${Math.random().toFixed(9).slice(2)}$`,Ft="?"+N,Rr=`<${Ft}>`,ee=document,Pe=()=>ee.createComment(""),je=e=>e===null||typeof e!="object"&&typeof e!="function",It=Array.isArray,Bn=e=>It(e)||typeof e?.[Symbol.iterator]=="function",Nt=`[ 	
\f\r]`,Ee=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,jn=/-->/g,Wn=/>/g,Q=RegExp(`>|${Nt}(?:([^\\s"'>=/]+)(${Nt}*=${Nt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Hn=/'/g,On=/"/g,Dn=/^(?:script|style|textarea|title)$/i,zt=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),a=zt(1),la=zt(2),da=zt(3),te=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),Ln=new WeakMap,X=ee.createTreeWalker(ee,129);function Jn(e,t){if(!It(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Pn!==void 0?Pn.createHTML(t):t}var Nn=(e,t)=>{let n=e.length-1,o=[],s,i=t===2?"<svg>":t===3?"<math>":"",d=Ee;for(let u=0;u<n;u++){let p=e[u],h,v,f=-1,J=0;for(;J<p.length&&(d.lastIndex=J,v=d.exec(p),v!==null);)J=d.lastIndex,d===Ee?v[1]==="!--"?d=jn:v[1]!==void 0?d=Wn:v[2]!==void 0?(Dn.test(v[2])&&(s=RegExp("</"+v[2],"g")),d=Q):v[3]!==void 0&&(d=Q):d===Q?v[0]===">"?(d=s??Ee,f=-1):v[1]===void 0?f=-2:(f=d.lastIndex-v[2].length,h=v[1],d=v[3]===void 0?Q:v[3]==='"'?On:Hn):d===On||d===Hn?d=Q:d===jn||d===Wn?d=Ee:(d=Q,s=void 0);let z=d===Q&&e[u+1].startsWith("/>")?" ":"";i+=d===Ee?p+Rr:f>=0?(o.push(h),p.slice(0,f)+Ut+p.slice(f)+N+z):p+N+(f===-2?u:z)}return[Jn(e,i+(e[n]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),o]},We=class e{constructor({strings:t,_$litType$:n},o){let s;this.parts=[];let i=0,d=0,u=t.length-1,p=this.parts,[h,v]=Nn(t,n);if(this.el=e.createElement(h,o),X.currentNode=this.el.content,n===2||n===3){let f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(s=X.nextNode())!==null&&p.length<u;){if(s.nodeType===1){if(s.hasAttributes())for(let f of s.getAttributeNames())if(f.endsWith(Ut)){let J=v[d++],z=s.getAttribute(f).split(N),qe=/([.?@])?(.*)/.exec(J);p.push({type:1,index:i,name:qe[2],strings:z,ctor:qe[1]==="."?Ve:qe[1]==="?"?Ye:qe[1]==="@"?Ze:oe}),s.removeAttribute(f)}else f.startsWith(N)&&(p.push({type:6,index:i}),s.removeAttribute(f));if(Dn.test(s.tagName)){let f=s.textContent.split(N),J=f.length-1;if(J>0){s.textContent=Ke?Ke.emptyScript:"";for(let z=0;z<J;z++)s.append(f[z],Pe()),X.nextNode(),p.push({type:2,index:++i});s.append(f[J],Pe())}}}else if(s.nodeType===8)if(s.data===Ft)p.push({type:2,index:i});else{let f=-1;for(;(f=s.data.indexOf(N,f+1))!==-1;)p.push({type:7,index:i}),f+=N.length-1}i++}}static createElement(t,n){let o=ee.createElement("template");return o.innerHTML=t,o}};function ne(e,t,n=e,o){if(t===te)return t;let s=o!==void 0?n._$Co?.[o]:n._$Cl,i=je(t)?void 0:t._$litDirective$;return s?.constructor!==i&&(s?._$AO?.(!1),i===void 0?s=void 0:(s=new i(e),s._$AT(e,n,o)),o!==void 0?(n._$Co??=[])[o]=s:n._$Cl=s),s!==void 0&&(t=ne(e,s._$AS(e,t.values),s,o)),t}var Ge=class{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:n},parts:o}=this._$AD,s=(t?.creationScope??ee).importNode(n,!0);X.currentNode=s;let i=X.nextNode(),d=0,u=0,p=o[0];for(;p!==void 0;){if(d===p.index){let h;p.type===2?h=new ue(i,i.nextSibling,this,t):p.type===1?h=new p.ctor(i,p.name,p.strings,this,t):p.type===6&&(h=new Qe(i,this,t)),this._$AV.push(h),p=o[++u]}d!==p?.index&&(i=X.nextNode(),d++)}return X.currentNode=ee,s}p(t){let n=0;for(let o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(t,o,n),n+=o.strings.length-2):o._$AI(t[n])),n++}},ue=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,o,s){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=o,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,n=this._$AM;return n!==void 0&&t?.nodeType===11&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=ne(this,t,n),je(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==te&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):Bn(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&je(this._$AH)?this._$AA.nextSibling.data=t:this.T(ee.createTextNode(t)),this._$AH=t}$(t){let{values:n,_$litType$:o}=t,s=typeof o=="number"?this._$AC(t):(o.el===void 0&&(o.el=We.createElement(Jn(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===s)this._$AH.p(n);else{let i=new Ge(s,this),d=i.u(this.options);i.p(n),this.T(d),this._$AH=i}}_$AC(t){let n=Ln.get(t.strings);return n===void 0&&Ln.set(t.strings,n=new We(t)),n}k(t){It(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,o,s=0;for(let i of t)s===n.length?n.push(o=new e(this.O(Pe()),this.O(Pe()),this,this.options)):o=n[s],o._$AI(i),s++;s<n.length&&(this._$AR(o&&o._$AB.nextSibling,s),n.length=s)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){let o=En(t).nextSibling;En(t).remove(),t=o}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},oe=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,o,s,i){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=n,this._$AM=s,this.options=i,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=c}_$AI(t,n=this,o,s){let i=this.strings,d=!1;if(i===void 0)t=ne(this,t,n,0),d=!je(t)||t!==this._$AH&&t!==te,d&&(this._$AH=t);else{let u=t,p,h;for(t=i[0],p=0;p<i.length-1;p++)h=ne(this,u[o+p],n,p),h===te&&(h=this._$AH[p]),d||=!je(h)||h!==this._$AH[p],h===c?t=c:t!==c&&(t+=(h??"")+i[p+1]),this._$AH[p]=h}d&&!s&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Ve=class extends oe{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},Ye=class extends oe{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},Ze=class extends oe{constructor(t,n,o,s,i){super(t,n,o,s,i),this.type=5}_$AI(t,n=this){if((t=ne(this,t,n,0)??c)===te)return;let o=this._$AH,s=t===c&&o!==c||t.capture!==o.capture||t.once!==o.once||t.passive!==o.passive,i=t!==c&&(o===c||s);s&&this.element.removeEventListener(this.name,this,o),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Qe=class{constructor(t,n,o){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(t){ne(this,t)}},Mn={M:Ut,P:N,A:Ft,C:1,L:Nn,R:Ge,D:Bn,V:ne,I:ue,H:oe,N:Ye,U:Ze,B:Ve,F:Qe},Cr=Mt.litHtmlPolyfillSupport;Cr?.(We,ue),(Mt.litHtmlVersions??=[]).push("3.3.3");var b=(e,t,n)=>{let o=n?.renderBefore??t,s=o._$litPart$;if(s===void 0){let i=n?.renderBefore??null;o._$litPart$=s=new ue(t.insertBefore(Pe(),i),i,void 0,n??{})}return s._$AI(e),s};var Un=e=>(...t)=>({_$litDirective$:e,values:t}),Xe=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,o){this._$Ct=t,this._$AM=n,this._$Ci=o}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}};var{I:fa}=Mn;var Ar={},Fn=(e,t=Ar)=>e._$AH=t;var In=Un(class extends Xe{constructor(){super(...arguments),this.key=c}render(e,t){return this.key=e,t}update(e,[t,n]){return t!==this.key&&(Fn(e),this.key=t),n}});function g(e,t=document){let n=t.querySelector(e);if(!n)throw new Error(`Element not found: ${e}`);return n}function _(e,t=document){return t.querySelector(e)}function pe(e){return Er.test(e)}var Er=/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;function et(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}function qn(e,t){let n=e.split(".").map(Number),o=t.split(".").map(Number);for(let s=0;s<Math.max(n.length,o.length);s+=1){let i=(n[s]??0)-(o[s]??0);if(i!==0)return i}return 0}function Kn(e){try{return new URL(e).pathname.replace(/^\/+|\/+$/g,"")||e}catch{return e}}function fe(e){return e.replace(/^https?:\/\//,"").replace(/\/$/,"")}function tt(e){return e.map(t=>({label:t.label,state:t.state,meta:Pr(t.seconds),output:t.output}))}function Pr(e){if(e<60)return`${e}s`;let t=e%60;return t===0?`${Math.floor(e/60)}m`:`${Math.floor(e/60)}m ${t}s`}function R(e,t){let n=Math.max(0,Math.round(Date.now()/1e3)-e),[o,s]=n<60?[n,"second"]:n<3600?[Math.round(n/60),"minute"]:n<86400?[Math.round(n/3600),"hour"]:[Math.round(n/86400),"day"];try{return new Intl.RelativeTimeFormat(t,{numeric:"auto"}).format(-o,s)}catch{return`${o} ${s}`}}function He(e){let t=Math.max(0,Math.round(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function nt(e,t){let n=["B","KB","MB","GB","TB"],o=Math.max(0,e),s=0;for(;o>=1024&&s<n.length-1;)o/=1024,s++;return`${new Intl.NumberFormat(t,{maximumFractionDigits:o<10?1:0}).format(o)} ${n[s]}`}function w(e,t){return In(e,t)}function k(e,t,n,o){let s=document.createElement("sds-button");return s.variant=t,o&&(s.size=o),s.append(document.createTextNode(e)),s.addEventListener("click",n),s}function me(e,t){t.trim()!==""&&e.updateComplete.then(()=>{let n=document.createTreeWalker(e,NodeFilter.SHOW_TEXT).nextNode();if(n){n.nodeValue=t;return}(e.querySelector("button, a")??e).append(document.createTextNode(t))})}function he(e,t){let n=document.createElement("sds-button"),o=document.createElement("sds-icon");return o.name="actions-window-open",o.size=16,n.variant="secondary",n.href=e,n.rel="external",n.append(document.createTextNode(t),o),n}function jr(e,t,n,o,s){let i=document.createElement("sds-select");return i.options=e.map(d=>({label:d.label,value:d.value,disabled:d.disabled===!0})),i.value=t,i.filled=t!=="",i.label=o,s===void 0?i.size="sm":i.caption=s,i.addEventListener("sds-change",d=>n(d.detail)),i}var zn=0;function ot(e,t,n,o){if(e.length>6)return jr(e.map(i=>({value:i.value,label:i.label})),t,n,o,o);let s=document.createElement("sds-radio");return zn+=1,s.name=`choice-${zn}`,s.legend=o,s.choices=e.map(i=>({label:i.label,value:i.value,...i.hint===void 0?{}:{hint:i.hint}})),s.value=t,s.addEventListener("sds-change",i=>n(i.detail)),s}async function Gn(){let e=await fetch("/translations/index.json");return e.ok?await e.json():["en"]}async function Vn(e){let t=await fetch(`/translations/${e}.json`);if(!t.ok)throw new Error(`Missing translations for "${e}"`);return await t.json()}function Yn(e,t,n={}){let o=e[Wr(e,t,n)]??e[t]??t;for(let[s,i]of Object.entries(n))o=o.replaceAll(`{${s}}`,String(i));return o}function Wr(e,t,n){return Number(n.count)===1&&e[`${t}.one`]!==void 0?`${t}.one`:t}var Hr="/api",re=class extends Error{constructor(n,o){super(n);this.status=o}},qt=class extends Error{constructor(n){super(`No answer from the container, only a ${n} from in front of it.`);this.status=n}};async function $(e,t={}){let n=t.body?{"Content-Type":"application/json"}:{},o=await fetch(`${Hr}/${e}`,{...t,headers:n});if(!o.ok&&Or(o.status,o.headers.get("Content-Type")))throw new qt(o.status);let s=await o.json().catch(()=>({}));if(!o.ok){let i=s.error;throw new re(i??`Request failed with status ${o.status}`,o.status)}return s}function Or(e,t){return!((t??"").split(";")[0]?.trim().toLowerCase()==="application/json")&&Lr.includes(e)}var Lr=[404,502,503,504],m={state:()=>$("state"),createWorktree:e=>$("worktrees",{method:"POST",body:JSON.stringify(e)}),preview:e=>$(`worktrees/preview?${new URLSearchParams(e).toString()}`),updateWorktree:(e,t)=>$(`worktrees/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),provisionWorktree:(e,t=!1)=>$(`worktrees/${encodeURIComponent(e)}/provision`,{method:"POST",body:JSON.stringify({fresh:t})}),syncWorktree:(e,t="")=>$(`worktrees/${encodeURIComponent(e)}/sync`,{method:"POST",body:JSON.stringify(t!==""?{from:t}:{})}),pullWorktree:e=>$(`worktrees/${encodeURIComponent(e)}/pull`,{method:"POST"}),commits:(e,t=0)=>$(`worktrees/${encodeURIComponent(e)}/commits${t>0?`?skip=${t}`:""}`),branch:e=>$(`branch?branch=${encodeURIComponent(e)}`),branchCommits:(e,t=0)=>$(`branch/commits?branch=${encodeURIComponent(e)}${t>0?`&skip=${t}`:""}`),commit:(e,t)=>$(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}`),commitDiff:(e,t,n)=>$(`worktrees/${encodeURIComponent(e)}/commits/${encodeURIComponent(t)}/diff?path=${encodeURIComponent(n)}`),changes:e=>$(`worktrees/${encodeURIComponent(e)}/changes`),worktreeUsage:e=>$(`worktrees/${encodeURIComponent(e)}/usage`),changeDiff:(e,t)=>$(`worktrees/${encodeURIComponent(e)}/changes/diff?path=${encodeURIComponent(t)}`),discardWorktree:e=>$(`worktrees/${encodeURIComponent(e)}/discard`,{method:"POST"}),restoreWorktree:e=>$(`worktrees/${encodeURIComponent(e)}/restore`,{method:"POST"}),removeWorktree:e=>$(`worktrees/${encodeURIComponent(e)}`,{method:"DELETE"}),fetch:e=>$("fetch",{method:"POST",body:JSON.stringify(e!==void 0?{remote:e}:{})}),job:(e,t=0)=>$(`jobs/${encodeURIComponent(e)}${t>0?`?since=${t}`:""}`),worktreeJobs:e=>$(`worktrees/${encodeURIComponent(e)}/jobs`)};function rt(e){try{return localStorage.getItem(e)}catch{return null}}function st(e,t){try{localStorage.setItem(e,t)}catch{}}function Zn(e,t){return JSON.stringify(e)!==JSON.stringify(t)}function Qn(e){let t=new Set,n=!1,o=()=>{n||(n=!0,requestAnimationFrame(()=>{n=!1;for(let i of t)i()}))};return{state:new Proxy({...e},{set(i,d,u){return Reflect.get(i,d)===u||(Reflect.set(i,d,u),o()),!0}}),subscribe(i){return t.add(i),()=>t.delete(i)}}}var Xn="branchery-language",{state:l,subscribe:it}=Qn({tld:location.host,projectName:"",worktrees:[],project:null,branch:"",branches:[],remotes:[],repository:null,phpVersions:[],strings:{},loading:!0,language:rt(Xn)||document.documentElement.lang||"en",job:null,runningJobs:[],error:"",unreachable:!1,recipeProblem:null,unconfigured:!1,updateWaiting:!1,exposed:null});function r(e,t={}){return Yn(l.strings,e,t)}async function Kt(e){l.strings=await Vn(e),l.language=e,document.documentElement.lang=e,st(Xn,e),document.querySelectorAll("[data-i18n]").forEach(t=>{let n=t.dataset.i18n;n&&(t.textContent=r(n))})}async function C(e=!1){return Oe!==null?(e||(l.loading=!0),Oe):(Oe=Br(e).finally(()=>{Oe=null}),Oe)}var Oe=null;async function Br(e){l.loading=!e;try{let t=await Dr();return l.unreachable=!1,t}catch(t){return t instanceof re?(l.unreachable=!1,H(t.message)):l.unreachable=!0,l.runningJobs}finally{l.loading=!1}}async function Dr(){let e=await m.state();return S("worktrees",e.worktrees),S("branches",e.branches),S("remotes",e.remotes),S("repository",e.repository??null),S("branch",e.branch),S("project",e.project),S("phpVersions",e.phpVersions),S("tld",e.tld||location.host),S("projectName",e.projectName??""),S("recipeProblem",e.recipeProblem??null),S("unconfigured",e.unconfigured===!0),S("updateWaiting",e.updateWaiting??!1),S("exposed",e.exposed??null),S("runningJobs",e.runningJobs??[]),l.runningJobs}function S(e,t){Zn(l[e],t)&&(l[e]=t)}function H(e){l.error=e}function P(e){if(Jr(e)){l.unreachable=!0;return}H(A(e))}function Jr(e){return e instanceof Error&&!(e instanceof re)}function A(e){return e instanceof re?e.message:e instanceof Error?r("error.unreachable"):r("error.generic")}function ge(e){let t=l.runningJobs.find(n=>n.subject===e);return t===void 0?void 0:t.step?.label??Vt(t.command)}function eo(e,t=null,n="create"){let o={id:e,expected:t,kind:n,status:"running",subject:t??"",command:"",step:null,steps:[],elapsed:0,log:"",size:0,partial:!1,interrupted:!1};return l.job=o,o}var Gt={"worktree:add":{kind:"create",history:"history.add",doing:"job.doing.create"},"worktree:fork":{kind:"create",history:"history.fork",doing:"job.doing.create"},"worktree:provision":{kind:"create",history:"history.provision",doing:"job.doing.provision"},"worktree:remove":{kind:"remove",history:"history.remove",doing:"job.doing.remove"},"database:sync":{kind:"sync",history:"history.sync",doing:"job.doing.sync"},"worktree:pull":{kind:"pull",history:"history.pull",doing:"job.doing.pull"},"worktree:restore":{kind:"restore",history:"history.restore",doing:"job.doing.restore"},"worktree:discard":{kind:"discard",history:"history.discard",doing:"job.doing.discard"},"git:fetch":{kind:"fetch",history:"history.fetch",doing:"job.doing.fetch"}};function to(e){return Gt[e]?.kind??"create"}function at(e){return r(Gt[e]?.history??"history.other")}function Vt(e){return r(Gt[e]?.doing??"job.doing.create")}function lt(){return{running:r("step.state.running"),done:r("step.state.done"),failed:r("step.state.failed")}}var oo="[A-Za-z0-9][A-Za-z0-9.-]*",Nr=new RegExp(`^/w/(${oo})$`),Mr=new RegExp(`^/w/(${oo})/c/([0-9a-f]{4,40})$`);function ro(e){let t=e.replace(/^#/,""),n=Mr.exec(t);if(n?.[1]!==void 0&&n[2]!==void 0)return{view:"commit",name:n[1],sha:n[2],branch:""};let o=Nr.exec(t);if(o?.[1]!==void 0)return{view:"worktree",name:o[1]};let s=/^\/b\/(.+)\/c\/([0-9a-f]{4,40})$/.exec(t),i=no(s?.[1]);if(i!==null&&s?.[2]!==void 0)return{view:"commit",name:"",sha:s[2],branch:i};let d=no(/^\/b\/(.+)$/.exec(t)?.[1]);return d!==null?{view:"branch",name:d}:{view:"overview"}}function no(e){if(e===void 0||e==="")return null;let t;try{t=decodeURIComponent(e)}catch{return null}return pe(t)?t:null}function q(e,t){return e.view!==t.view?!1:e.view==="worktree"&&t.view==="worktree"||e.view==="branch"&&t.view==="branch"?e.name===t.name:e.view==="commit"&&t.view==="commit"?e.name===t.name&&e.sha===t.sha&&e.branch===t.branch:!0}function Yt(e){return e.replace(/^#/,"").startsWith("new")}function so(e){return Yt(e)?"#/":null}var io=[];function O(){return ro(window.location.hash)}function dt(e){window.location.hash!==`#${e}`&&(window.location.hash=e)}function ao(e){io.push(e)}function lo(){history.scrollRestoration="manual"}lo();window.addEventListener("hashchange",()=>{lo();let e=O();for(let t of io)t(e)});var ct=globalThis,pt=ct.ShadowRoot&&(ct.ShadyCSS===void 0||ct.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,uo=Symbol(),co=new WeakMap,ut=class{constructor(t,n,o){if(this._$cssResult$=!0,o!==uo)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o,n=this.t;if(pt&&t===void 0){let o=n!==void 0&&n.length===1;o&&(t=co.get(n)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),o&&co.set(n,t))}return t}toString(){return this.cssText}},po=e=>new ut(typeof e=="string"?e:e+"",void 0,uo);var fo=(e,t)=>{if(pt)e.adoptedStyleSheets=t.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of t){let o=document.createElement("style"),s=ct.litNonce;s!==void 0&&o.setAttribute("nonce",s),o.textContent=n.cssText,e.appendChild(o)}},Zt=pt?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let n="";for(let o of t.cssRules)n+=o.cssText;return po(n)})(e):e;var{is:Ur,defineProperty:Fr,getOwnPropertyDescriptor:Ir,getOwnPropertyNames:zr,getOwnPropertySymbols:qr,getPrototypeOf:Kr}=Object,ft=globalThis,mo=ft.trustedTypes,Gr=mo?mo.emptyScript:"",Vr=ft.reactiveElementPolyfillSupport,Le=(e,t)=>e,Qt={toAttribute(e,t){switch(t){case Boolean:e=e?Gr:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},go=(e,t)=>!Ur(e,t),ho={attribute:!0,type:String,converter:Qt,reflect:!1,useDefault:!1,hasChanged:go};Symbol.metadata??=Symbol("metadata"),ft.litPropertyMetadata??=new WeakMap;var M=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=ho){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){let o=Symbol(),s=this.getPropertyDescriptor(t,o,n);s!==void 0&&Fr(this.prototype,t,s)}}static getPropertyDescriptor(t,n,o){let{get:s,set:i}=Ir(this.prototype,t)??{get(){return this[n]},set(d){this[n]=d}};return{get:s,set(d){let u=s?.call(this);i?.call(this,d),this.requestUpdate(t,u,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??ho}static _$Ei(){if(this.hasOwnProperty(Le("elementProperties")))return;let t=Kr(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Le("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Le("properties"))){let n=this.properties,o=[...zr(n),...qr(n)];for(let s of o)this.createProperty(s,n[s])}let t=this[Symbol.metadata];if(t!==null){let n=litPropertyMetadata.get(t);if(n!==void 0)for(let[o,s]of n)this.elementProperties.set(o,s)}this._$Eh=new Map;for(let[n,o]of this.elementProperties){let s=this._$Eu(n,o);s!==void 0&&this._$Eh.set(s,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let n=[];if(Array.isArray(t)){let o=new Set(t.flat(1/0).reverse());for(let s of o)n.unshift(Zt(s))}else t!==void 0&&n.push(Zt(t));return n}static _$Eu(t,n){let o=n.attribute;return o===!1?void 0:typeof o=="string"?o:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,n=this.constructor.elementProperties;for(let o of n.keys())this.hasOwnProperty(o)&&(t.set(o,this[o]),delete this[o]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return fo(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,o){this._$AK(t,o)}_$ET(t,n){let o=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,o);if(s!==void 0&&o.reflect===!0){let i=(o.converter?.toAttribute!==void 0?o.converter:Qt).toAttribute(n,o.type);this._$Em=t,i==null?this.removeAttribute(s):this.setAttribute(s,i),this._$Em=null}}_$AK(t,n){let o=this.constructor,s=o._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let i=o.getPropertyOptions(s),d=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:Qt;this._$Em=s;let u=d.fromAttribute(n,i.type);this[s]=u??this._$Ej?.get(s)??u,this._$Em=null}}requestUpdate(t,n,o,s=!1,i){if(t!==void 0){let d=this.constructor;if(s===!1&&(i=this[t]),o??=d.getPropertyOptions(t),!((o.hasChanged??go)(i,n)||o.useDefault&&o.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(d._$Eu(t,o))))return;this.C(t,n,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,n,{useDefault:o,reflect:s,wrapped:i},d){o&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,d??n??this[t]),i!==!0||d!==void 0)||(this._$AL.has(t)||(this.hasUpdated||o||(n=void 0),this._$AL.set(t,n)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,i]of this._$Ep)this[s]=i;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[s,i]of o){let{wrapped:d}=i,u=this[s];d!==!0||this._$AL.has(s)||u===void 0||this.C(s,void 0,i,u)}}let t=!1,n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(o=>o.hostUpdate?.()),this.update(n)):this._$EM()}catch(o){throw t=!1,this._$EM(),o}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(t){}firstUpdated(t){}};M.elementStyles=[],M.shadowRootOptions={mode:"open"},M[Le("elementProperties")]=new Map,M[Le("finalized")]=new Map,Vr?.({ReactiveElement:M}),(ft.reactiveElementVersions??=[]).push("2.1.2");var Xt=globalThis,be=class extends M{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=b(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return te}};be._$litElement$=!0,be.finalized=!0,Xt.litElementHydrateSupport?.({LitElement:be});var Yr=Xt.litElementPolyfillSupport;Yr?.({LitElement:be});(Xt.litElementVersions??=[]).push("4.2.2");var Zr=new Set(["worktree:add","worktree:fork"]);function bo(e,t){let n=new Set(t);return e.filter(o=>Zr.has(o.command)&&o.subject!==""&&!n.has(o.subject))}function mt(e,t){return e.filter(n=>ht([n.name,n.branch,n.database,n.url,n.php,n.base?.branch??"",n.tip?.subject??""].join(" "),t))}function yo(e,t){return e.filter(n=>ht([n.name,n.tip?.subject??""].join(" "),t))}function ht(e,t){let n=t.toLowerCase().split(/\s+/).filter(s=>s!==""),o=e.toLowerCase();return n.every(s=>o.includes(s))}function $o(e,t){let n=o=>o.base===null?[0,""]:o.base.branch===t?[1,""]:[2,o.base.branch];return e.map((o,s)=>({worktree:o,at:s,rank:n(o)})).sort((o,s)=>o.rank[0]-s.rank[0]||o.rank[1].localeCompare(s.rank[1],void 0,{numeric:!0})||o.at-s.at).map(o=>o.worktree)}function vo(){let e=!1;return{pending:()=>e,run(t,n=()=>{}){if(e)return!1;e=!0;let o=()=>{e=!1,n()},s;try{s=t()}catch(i){throw o(),i}return Promise.resolve(s).then(o,o),!0}}}var L=g("#wizard"),Qr=g("#wizForm"),ye=g("#wizProgress"),wo=g("#wizTitle"),bt=g("#wizLead"),gt=g("#wizBody"),Xr=g("#wizFoot"),en=g("#wizBack"),$e=g("#wizNext"),x=null,T=0,Be=!1,es=vo(),ts={update:()=>nn()};function K(e){x=e,T=0,Be=!1,_o(e.tall===!0),tn(),yt()}function _o(e){L.classList.toggle("sds-modal--lg",e),L.classList.toggle("sds-modal--md",!e)}function yt(){L.open||L.showModal()}function B(){L.open&&L.close()}function se(){return L.open}function $t(){return L.open&&x!==null}function vt(e){L.addEventListener("close",e)}function wt(){return x===null?[]:x.steps.filter(e=>e.when===void 0||e.when())}function _t(){wt()[T]?.leave?.()}function tn(){let e=wt(),t=e[T];t&&(wo.textContent=t.heading,b(t.lead??c,bt),bt.hidden=t.lead===void 0,ns(e),b(c,gt),t.enter(gt,ts),nn(),window.setTimeout(()=>{_('input:not([type]), input[type="text"]',gt)?.focus()},20))}function ns(e){ye.hidden=e.length<2,!(e.length<2)&&(ye.caption=e[T]?.label??"",ye.label=r("step.progress"),ye.max=e.length,ye.value=T+1)}function nn(){let e=wt(),t=e[T];if(!t||x===null)return;let n=T===e.length-1;on({back:T===0?r("action.cancel"):r("action.back"),onBack:os,next:n?x.finishLabel():r("action.next"),onNext:So}),$e.disabled=t.ready?.()===!1}function So(){let e=wt(),t=e[T];if(!(!t||x===null||t.ready?.()===!1)){if(T>=e.length-1){let n=x;es.run(()=>n.finish(),()=>{x===n&&!Be&&nn()})&&($e.disabled=!0);return}_t(),T+=1,tn()}}function os(){if(T===0){B();return}_t(),T-=1,tn()}Qr.addEventListener("submit",e=>{e.preventDefault(),x!==null&&So()});L.addEventListener("close",()=>{_t(),x=null,Be=!1});function on(e={}){Xr.hidden=e.back==null&&e.next==null,en.hidden=e.back==null,me(en,e.back??""),en.onclick=e.onBack??null,$e.hidden=e.next==null,me($e,e.next??""),$e.disabled=!1,$e.onclick=e.onNext??null}function St(e,t=""){Be||(Be=!0,x===null&&_o(!1)),_t(),x=null,ye.hidden=!0,wo.textContent=e,b(t===""?c:t,bt),bt.hidden=t===""}function ko(e){b(e,gt)}function D(){return a`
        <p class="sds-loading branchery-waiting" role="status">
            <sds-icon class="sds-spinner" name="actions-circle-half" aria-hidden="true"></sds-icon>
            <span class="sds-loading__label branchery-waiting__label">${r("detail.loading")}</span>
        </p>`}function j(e=0,t=""){return a`<span class="sds-skeleton branchery-waiting branchery-waiting__bar ${t}"
        style="--sds-skeleton-delay: ${e%3*.12}s"></span>`}var To=null,sn=new Map,rn=new Set,rs=300,an;function ln(e){return e!==""&&!pe(e)?r("error.branchName"):""}function Ro(e){return e===l.branch||l.project?.branch===e||l.branches.some(t=>t.name===e)||l.worktrees.some(t=>t.branch===e)}function xo(e){let t=ln(e);return t!==""?t:e!==""&&Ro(e)?r("error.branchExists",{branch:e}):""}function G(e,t=""){let n={mode:l.branches.length>0?"branch":"fork",branch:t,from:"",name:""},o=()=>n.name.trim()||et(n.branch),s=()=>{let d=o();return d!==""&&d===l.projectName?r("preview.isProject",{name:d}):l.worktrees.some(u=>u.name===d)?r("preview.exists",{name:d}):""},i={tall:!0,steps:[ss(n),as(n),ds(n,o,s)],finishLabel:()=>n.mode==="fork"?r("action.fork"):r("action.create"),finish:()=>us(n,o(),e)};K(i)}function ss(e){return{label:r("step.mode.label"),heading:r("step.mode.heading"),lead:r("step.mode.lead"),ready:()=>e.mode==="fork"||pe(e.branch),enter(t,n){let o=l.branches.length>0;o||(e.mode="fork");let s=()=>{b(a`
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
                        <div class="branchery-picklist">${is(e,s)}</div>
                        <sds-note tone="error" ?hidden=${ln(e.branch)===""}
                                  body=${ln(e.branch)}></sds-note>
                    </div>`,t),n.update()};s()}}}function is(e,t){let n=e.branch.toLowerCase(),o=l.branches.map(i=>i.name),s=o.includes(e.branch)?o:o.filter(i=>i.toLowerCase().includes(n));return s.length===0?a`<p class="branchery-picklist__empty">${r("step.branch.noMatch")}</p>`:s.map(i=>a`
        <button type="button" class="branchery-picklist__item"
                aria-pressed=${String(i===e.branch)}
                @click=${()=>{e.branch=i,t()}}>${i}</button>`)}function as(e){return{label:r("step.fork.label"),heading:r("step.fork.heading"),lead:r("step.fork.lead"),when:()=>e.mode==="fork",ready:()=>pe(e.branch)&&!Ro(e.branch),enter(t,n){let o=()=>{b(a`
                    ${""}
                    <sds-field
                        field-id="newBranch"
                        caption=${r("field.newBranch")}
                        value=${e.branch===""?r("field.newBranchPlaceholder"):e.branch}
                        ?filled=${e.branch!==""}
                        @sds-input=${s=>{e.branch=s.detail.trim(),o()}}></sds-field>
                    ${ls(e)}
                    <sds-note tone="error" ?hidden=${xo(e.branch)===""}
                              body=${xo(e.branch)}></sds-note>`,t),n.update()};o()}}}function ls(e){let t=document.createElement("sds-select");return t.caption=r("field.branchFrom"),t.options=[{label:r("field.branchFromProject",{branch:l.branch}),value:""},...l.worktrees.map(n=>({label:n.name,value:n.name}))],t.value=e.from,t.filled=!0,t.addEventListener("sds-change",n=>{e.from=n.detail}),t}function ds(e,t,n){return{label:r("step.review.label"),heading:r("step.review.heading"),lead:r("step.review.lead"),ready:()=>t()!==""&&n()==="",enter(o,s){To=i=>De(e,t,n,o,s,i),Ao(e,t(),()=>{_("#name")!==null&&De(e,t,n,o,s)}),De(e,t,n,o,s)},leave(){window.clearTimeout(an)}}}function Co(e,t){return JSON.stringify([e.mode,e.branch,e.mode==="fork"?e.from:"",t])}async function Ao(e,t,n){let o=Co(e,t);if(sn.get(o)!=null||rn.has(o))return;rn.add(o);let s=null;try{s=await m.preview({mode:e.mode,branch:e.branch,from:e.from,name:e.name})}catch{}finally{rn.delete(o)}sn.set(o,s),n()}function cs(e,t,n,o,s){window.clearTimeout(an),an=window.setTimeout(()=>{Ao(e,t(),()=>{_("#name")!==null&&De(e,t,n,o,s)})},rs)}function De(e,t,n,o,s,i=""){let d=e.mode==="fork"?l.worktrees.find(f=>f.name===e.from):void 0,u=r("preview.databaseCopy",{name:d?.database??l.project?.database??"db"}),p=i!==""?i:n(),h=sn.get(Co(e,t())),v=h===void 0?j(2):h===null?d?d.php:r("preview.phpFromProject"):h.php??r("preview.phpRead",{file:h.readFrom??""});b(a`
        <div class="branchery-preview">
            <dl>
                <dt>${r("preview.branch")}</dt>
                <dd><code class="sds-mono">${e.branch}</code></dd>
                <dt>${r("preview.directory")}</dt>
                <dd><code class="sds-mono">.worktrees/${t()}</code></dd>
                <dt>${r("preview.address")}</dt>
                <dd><code class="sds-mono">https://${et(t())}.${l.tld}</code></dd>
                <dt>${r("preview.database")}</dt>
                <dd>${u}</dd>
                <dt>${r("preview.php")}</dt>
                <dd>${v}</dd>
            </dl>
        </div>
        ${(h?.warnings??[]).map(f=>a`<sds-note tone="warn" body=${f}></sds-note>`)}
        <sds-field
            field-id="name"
            caption=${r("field.nameOverride")}
            hint=${r("field.namePlaceholder")}
            value=${e.name===""?et(e.branch):e.name}
            ?filled=${e.name!==""}
            @sds-input=${f=>{e.name=f.detail.trim(),De(e,t,n,o,s),cs(e,t,n,o,s)}}></sds-field>
        ${p===""?c:a`<sds-note tone="error" body=${p}></sds-note>`}`,o),s.update()}async function us(e,t,n){let o=e.mode==="fork"?{mode:"fork",branch:e.branch,from:e.from,name:e.name}:{mode:"branch",branch:e.branch,name:e.name};try{let s=await m.createWorktree(o);n.onJob(s.job,t)}catch(s){P(s),_("#name")!==null&&To?.(A(s))}}function kt(e){return e.filter(t=>!t.isProject&&(t.merged||t.gone)&&t.changes===0)}function Eo(e){return e.merged}function Po(e,t){let n=kt(e),o=new Set(n.filter(Eo).map(s=>s.name));K({tall:n.length>3,steps:[{label:r("tidy.step"),heading:r("tidy.heading"),lead:r("tidy.lead"),enter(s,i){b(a`
                    <sds-checkbox-group
                        legend=${r("tidy.heading")}
                        legend-said-only
                        name="tidy"
                        .choices=${n.map(d=>({label:d.name,value:d.name,hint:`${d.branch} \xB7 ${ps(d)}`}))}
                        .values=${[...o]}
                        @sds-change=${d=>{o.clear();for(let u of d.detail)o.add(u);i.update()}}></sds-checkbox-group>`,s)},ready:()=>o.size>0}],finishLabel:()=>r("tidy.confirm",{count:o.size}),finish:()=>fs(n.filter(s=>o.has(s.name)),t)})}function ps(e){return e.merged?r("tidy.why.merged"):r("tidy.why.gone")}async function fs(e,t){St(r("tidy.working"),r("tidy.workingLead",{count:e.length}));let n=await Promise.allSettled(e.map(i=>m.removeWorktree(i.name))),o=[];n.forEach((i,d)=>{let u=e[d]?.name??"";i.status==="fulfilled"?o.push({job:i.value.job,name:u}):P(i.reason)});let s=o[0];if(s===void 0){B();return}t.onJob(s.job,s.name,"remove")}var ms=6,E="",jo=10,dn=!1,ie=null;function un(e){ie=e,l.loading||Ts();let t=$s(),n=$o(mt(l.worktrees,E),l.project?.branch??l.branch);b(a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${ys(t)}
            ${bs(t,e)}
            <div class="sds-row branchery-project">
                <h2 class="branchery-project__name">${gs()?j(0,"branchery-waiting__title"):hs()}</h2>
                ${l.repository===null?c:a`<span class="sds-row sds-row__end">${he(l.repository,r("detail.repository"))}</span>`}
            </div>
            ${Hs()}
        </section>
        <section class="sds-band sds-band--quiet">
            <div class="branchery-section-head">
                ${t.length+l.branches.length>=ms?vs():c}
                <div class="branchery-section-actions">${_s()}</div>
            </div>
            ${Ws(t,n.length)}
            ${ks(t,n)}
        </section>
        ${Ls()}
      </div>`,g("#main"))}function hs(){return l.repository!==null?Kn(l.repository):l.projectName===""?r("nav.worktrees"):l.projectName}function gs(){return l.loading&&l.repository===null&&l.projectName===""}function bs(e,t){let n=kt(e);return n.length===0||l.loading?c:a`
        <sds-note tone="info"
                  body=${r("tidy.note",{count:n.length,names:Ho(n)})}
                  action=${r("tidy.open")}
                  @sds-note-action=${()=>Po(e,t)}></sds-note>`}function ys(e){let t=e.filter(n=>n.incomplete&&ge(n.name)===void 0);return t.length===0||l.loading?c:a`
        <sds-note tone="warn"
                  body=${r("overview.unfinished",{count:t.length,names:Ho(t)})}></sds-note>`}function Ho(e){return e.map(t=>t.name).join(", ")}function $s(){return l.project?[l.project,...l.worktrees]:l.worktrees}function vs(){return a`
        <sds-field
            class="branchery-filter"
            field-id="filter"
            icon="actions-search"
            suffix="/"
            label=${r("overview.filter")}
            value=${E===""?r("overview.filterPlaceholder"):E}
            ?filled=${E!==""}
            @sds-input=${e=>Oo(e.detail)}
            @keydown=${ws}></sds-field>`}function Oo(e){E=e,Lo()}function Lo(){ie!==null&&un(ie)}function ws(e){if(e.key==="Escape"){e.target instanceof HTMLElement&&e.target.blur(),Oo("");return}if(e.key==="Enter"){let t=mt(l.worktrees,E)[0]??mt(l.project===null?[]:[l.project],E)[0];t!==void 0&&(e.preventDefault(),dt(`/w/${t.name}`))}}var cn=null;function _s(){let e=JSON.stringify([l.remotes,l.language]);if(cn?.key!==e){let t=Js();cn={key:e,nodes:[...t===null?[]:[t],Ss()]}}return cn.nodes}function xt(e){ie!==null&&e(ie)}function Ss(){let e=k(r("nav.newWorktree"),"primary",()=>xt(G));return e.title=`${r("nav.newWorktree")} (n)`,e}function ks(e,t){if(l.unreachable&&e.length===0)return c;let n=bo(l.runningJobs,e.map(s=>s.name)).filter(s=>ht(s.subject,E)),o=E.trim()===""?r("table.empty"):r("overview.noMatch");return!l.loading&&t.length===0&&n.length===0?a`<p class="branchery-list__empty">${o}</p>`:a`
        <sds-table
            ?loading=${l.loading}
            loading-rows=${xs()}
            .columns=${[{head:r("table.worktree"),cls:"sds-td-name"},{head:r("table.outstanding"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.php"),fit:!0},{head:"",cls:"sds-td-into"}]}
            .rows=${l.loading?[]:[...n.map(Rs),...t.map(Cs)]}></sds-table>`}var Bo="branchery-rows";function xs(){let e=l.worktrees.length;if(e>0)return e;let t=Number(rt(Bo));return Number.isFinite(t)&&t>0?t:1}function Ts(){st(Bo,String(l.worktrees.length))}function Rs(e){return{cells:[{value:a`<span class="branchery-list__title">${e.subject}</span>`,note:pn(`${r("table.making")} \xB7 ${e.step?.label??Vt(e.command)}`)},"","",""]}}function pn(e){return a`<span class="branchery-list__meta--busy"><sds-icon
                    class="sds-spinner" name="actions-circle-half" size="em"
                    aria-hidden="true"></sds-icon>${e}</span>`}function Cs(e){let t=ge(e.name);return{cells:[{value:a`<a class="branchery-list__title" href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:Do(e)}`,note:t===void 0?No(e):pn(t)},Ns(e),e.php,As(e)]}}function As(e){return a`
        <span class="branchery-list__ways">
            ${""}
            <sds-button variant="secondary" size="sm" icon-only
                        href=${e.url} rel="external"
                        title=${r("table.openSiteAt",{host:fe(e.url)})}><sds-icon
                name="actions-window-open" size="16"></sds-icon></sds-button>
            ${w(r("table.view"),a`<sds-button variant="secondary" size="sm" href="#/w/${e.name}"
                        title=${r("table.viewOf",{name:e.name})}>${r("table.view")}</sds-button>`)}
        </span>`}function Es(e){return e.split("_").map((t,n)=>n===0?a`${t}`:a`_<wbr>${t}`)}function Do(e){return a`${Ps(e)}${js(e)}${e.stale?a` <sds-badge label=${r("table.staleMark")} tone="warn"></sds-badge>`:c}`}function Ps(e){return e.ready?e.incomplete?a` <sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a` <sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}function js(e){return e.merged?a` <sds-badge label=${r("table.mergedMark")} tone="ok"></sds-badge>`:e.gone?a` <sds-badge label=${r("table.goneMark")} tone="warn"></sds-badge>`:c}function Ws(e,t){if(l.unreachable&&e.length===0)return c;let n=l.worktrees.length;return a`<h2 class="sds-h3">${l.loading||n===0?r("nav.worktrees"):E.trim()===""?r("overview.worktrees",{count:n}):r("overview.matching",{shown:t,total:n})}</h2>`}function Hs(){let e=l.project;if(e===null)return l.loading?Os():c;let t=ge(e.name);return Jo({name:a`<a class="branchery-checkout__name"
                      href="#/w/${e.name}">${e.name}</a>${t!==void 0?c:Do(e)}`,meta:t===void 0?a`${No(e)}${Ms(e)}`:pn(t),php:e.php,database:a`<code class="sds-mono">${Es(e.database)}</code>`,address:a`<sds-link external href=${e.url} label=${fe(e.url)}></sds-link>`})}function Os(){return Jo({name:a`<span class="branchery-checkout__name">${j(0,"branchery-waiting__title")}</span>`,meta:j(1),php:j(0),database:j(1),address:j(2)})}function Jo(e){return a`
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
        </div>`}function Ls(){if(l.loading||l.branches.length===0)return c;let e=yo(l.branches,E);if(e.length===0)return c;let t=e.length-jo,n=dn||t<=0?e:e.slice(0,jo);return a`
        <section class="sds-band branchery-branches">
            <h2 class="sds-h3">${E.trim()===""?r("overview.branches",{count:l.branches.length}):r("overview.branchesMatching",{shown:e.length,total:l.branches.length})}</h2>
            <sds-table
                .columns=${[{head:r("table.branch"),cls:"sds-td-name"},{head:r("table.when"),cls:"sds-td-meta",fit:!0},{head:"",cls:"sds-td-into"}]}
                .rows=${n.map(Bs)}></sds-table>
            ${dn||t<=0?c:a`
                <p class="branchery-branches__more">
                    ${w(r("overview.showAllBranches",{count:t}),a`<sds-button variant="ghost" @click=${()=>{dn=!0,Lo()}}
                        >${r("overview.showAllBranches",{count:t})}</sds-button>`)}
                </p>`}
        </section>`}function Bs(e){return{cells:[{value:a`<a class="branchery-list__title"
                               href="#/b/${encodeURIComponent(e.name)}">${e.name}</a>`,note:Ds(e)},R(e.when,l.language),a`${w(r("nav.newWorktree"),a`<sds-button variant="ghost" size="sm"
                             title=${r("table.worktreeOf",{branch:e.name})}
                             @click=${()=>xt(t=>G(t,e.name))}
                    >${r("nav.newWorktree")}</sds-button>`)}`]}}function Ds(e){let t=!e.onRemote&&l.remotes.length>0;return a`${t?a`<span>${r("table.nowhere")}</span>`:c}${e.tip===null?c:a`<span
            class="branchery-list__tip">${e.tip.subject} \u00b7 ${e.tip.sha}</span>`}`}function Js(){let e=l.remotes,t=e[0];if(t===void 0)return null;if(e.length===1)return k(r("nav.fetch",{remote:t}),"ghost",()=>xt(o=>void Wo(t,o)));let n=document.createElement("sds-dropdown");return n.label=r("nav.fetchFrom"),n.variant="ghost",n.align="end",n.choices=e.map(o=>({label:o})),n.addEventListener("sds-dropdown-choose",o=>{let s=e[o.detail.index];s!==void 0&&xt(i=>void Wo(s,i))}),n}async function Wo(e,t){try{let n=await m.fetch(e);H(""),t.onJob(n.job,null,"fetch")}catch(n){P(n)}}function No(e){return a`<span class="branchery-list__what">${e.branch}${e.tip===null?c:a` \u00b7 ${e.tip.subject}`}</span>`}function Ns(e){let t=Mo(e);return t.length===0?"":a`${t.map(n=>a`<span class="branchery-list__count">${n}</span>`)}`}function Ms(e){let t=Mo(e);return t.length===0?c:a`<span class="branchery-list__count">${t.join(" \xB7 ")}</span>`}function Mo(e){let t=[];return e.changes>0&&t.push(r("table.changes",{count:e.changes})),e.ahead!==null&&e.ahead>0&&t.push(r("table.unpushed",{count:e.ahead})),e.behind!==null&&e.behind>0&&t.push(r("table.behind",{count:e.behind})),t}window.addEventListener("keydown",e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;let t=e.target;if(!(t instanceof Element&&t.closest("input, textarea, select, [contenteditable], dialog[open]"))){if(e.key==="/"){let n=_("#filter");n&&(e.preventDefault(),n.focus(),n.select());return}e.key==="n"&&ie!==null&&_(".branchery-section-actions")!==null&&(e.preventDefault(),G(ie))}});function ve(e,t){return async(n,o,s)=>{let i=null,d="";try{i=await n()}catch(u){d=e(u)}o()&&(s(i,d),t())}}function ae(){let e="",t=null,n="",o=s=>e===s;return{about(s){return e!==s?(e=s,t=null,n="",!0):t===null&&n===""},of:s=>o(s)?t:null,stillOn:o,trouble:s=>o(s)?n:"",put(s,i){o(s)&&(t=i,n="")},failed(s,i){o(s)&&(t=null,n=i)},forget(s){o(s)&&(e="",t=null,n="")},clear(){e="",t=null,n=""}}}function U(e,t){return a`
        <div class="sds-row branchery-back">
            ${w(e,a`<sds-button variant="ghost" href=${t}><sds-icon
                name="actions-arrow-start" aria-hidden="true"></sds-icon>${e}</sds-button>`)}
        </div>`}var Uo=25;function Tt(e){let t=e.files.length-Uo,n=e.all||t<=0?e.files:e.files.slice(0,Uo);return a`
        <ul class="branchery-changes">
            ${n.map(o=>{let s=e.diffs.get(o.path),i=s?.open===!0;return a`
                    <li class="branchery-changes__file">
                        <button type="button" class="branchery-changes__row" aria-expanded=${i}
                                @click=${()=>e.press(o.path)}>
                            <sds-badge label=${r(`change.${o.status}`)}
                                       tone=${o.status==="deleted"?"warn":c}></sds-badge>
                            ${Us(o.path)}
                            <sds-icon class="branchery-changes__mark" size="16" aria-hidden="true"
                                      name=${i?"actions-chevron-down":"actions-chevron-end"}></sds-icon>
                        </button>
                        ${i?Fs(s):c}
                    </li>`})}
        </ul>
        ${e.all||t<=0?c:a`
            <p class="branchery-changes__more">
                ${w(r("detail.showAllFiles",{count:t}),a`<sds-button variant="ghost" @click=${e.showAll}>${r("detail.showAllFiles",{count:t})}</sds-button>`)}
            </p>`}`}function Us(e){let t=e.lastIndexOf("/");return a`<code class="sds-mono branchery-changes__path">${t<0?c:a`<span class="branchery-changes__dir">${e.slice(0,t+1)}</span>`}${e.slice(t+1)}</code>`}function Fs(e){return e===void 0||e.read===null&&e.trouble===""?D():e.read===null?a`<sds-note tone="warn" body=${`${r("detail.changeFailed")} ${e.trouble}`}></sds-note>`:a`
        <sds-diff path=${e.read.path} .body=${e.read.lines}></sds-diff>
        ${e.read.truncated?a`<p class="branchery-changes__more">${r("detail.changeTruncated")}</p>`:c}`}function Rt(e,t,n){let o=e.get(t)??{read:null,trouble:"",open:!1};o.open=!o.open,e.set(t,o),o.open&&o.read===null&&n()}function Ct(e,t,n,o){let s=e.get(t);s!==void 0&&e.set(t,{...s,read:n,trouble:o})}var W=null,we=ae();function _e(e,t){return`${e}${t}`}var Je=new Map,fn=!1,Fo=ve(A,hn);function Io(){W=null}function mn(e,t,n=""){let o=n===""?e:l.projectName;W={name:o,sha:t,branch:n},we.about(_e(o,t))&&(Je=new Map,fn=!1,Ys(o,t)),b(zs(o,t,n),g("#main"))}function Is(e){return W?.name===e.name&&W.sha===e.sha&&W.branch===e.branch&&q(O(),{view:"commit",name:e.branch===""?e.name:"",sha:e.sha,branch:e.branch})}function hn(){W!==null&&Is(W)&&mn(W.branch===""?W.name:"",W.sha,W.branch)}function zs(e,t,n){let o=n===""?e:l.projectName,s=we.of(_e(o,t));return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${n===""?U(e,`#/w/${encodeURIComponent(e)}`):U(n,`#/b/${encodeURIComponent(n)}`)}
            ${s===null?qs(o,t):Ks(o,s,n)}
        </section>
        ${s===null?c:Gs(e,s)}
      </div>`}function qs(e,t){let n=we.trouble(_e(e,t));return a`
        <h1 class="sds-h2"><span class="sds-mono">${t}</span></h1>
        ${n===""?D():a`<sds-note tone="warn" body=${`${r("detail.commitFailed")} ${n}`}></sds-note>`}`}function Ks(e,t,n){return a`
        <div class="sds-row">
            <h1 class="sds-h2">
                ${t.subject}
                ${t.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge>`}
            </h1>
            <span class="sds-row sds-row__end">
                ${t.url===null?c:a`${he(t.url,r("detail.commitAtForge"))}`}
            </span>
        </div>
        <dl class="sds-facts">
            <dt>${r("table.author")}</dt>
            <dd>${t.author}</dd>
            <dt>${r("table.when")}</dt>
            <dd>${R(t.when,l.language)}</dd>
            <dt>${r("table.commit")}</dt>
            ${""}
            <dd><sds-copy value=${t.id} label=${r("table.commit")}></sds-copy></dd>
            ${t.parents.length===0?c:a`
                <dt>${r("detail.parents")}</dt>
                ${""}
                <dd>${t.parents.map((o,s)=>a`${s===0?c:" \xB7 "}<sds-link
                    href=${n===""?`#/w/${encodeURIComponent(e)}/c/${o}`:`#/b/${encodeURIComponent(n)}/c/${o}`} label=${o}></sds-link>`)}</dd>`}
        </dl>
        ${t.body===""?c:a`<pre class="branchery-message">${t.body}</pre>`}`}function Gs(e,t){return a`
        <section class="sds-band sds-band--quiet">
            ${""}
            <h2 class="sds-h3">${t.files.length===0?r("detail.touchedNothingHeading"):r("detail.touched",{count:t.files.length})}</h2>
            ${t.files.length===0?a`<p class="branchery-list__quiet">${r("detail.touchedNothing")}</p>`:Tt({files:t.files,diffs:Je,press:n=>Vs(e,t.sha,n),all:fn,showAll:()=>{fn=!0,hn()}})}
        </section>`}function Vs(e,t,n){Rt(Je,n,()=>void Zs(e,t,n)),hn()}function zo(e,t){return we.stillOn(_e(e,t))}async function Ys(e,t){await Fo(()=>m.commit(e,t),()=>zo(e,t),(n,o)=>{if(n===null){we.failed(_e(e,t),o);return}we.put(_e(e,t),n)})}async function Zs(e,t,n){await Fo(()=>m.commitDiff(e,t,n),()=>zo(e,t)&&Je.has(n),(o,s)=>Ct(Je,n,o,s))}var At={log:"",size:0,steps:[]};function Et(e,t){let n=new Map(e.steps.map(o=>[o.no,o.output]));return{log:t.partial?e.log+t.log:t.log,size:t.size,steps:t.steps.map(o=>({...o,output:o.output??n.get(o.no)??""}))}}function Ko(e){switch(e){case"running":return"job.running";case"done":return"job.done";case"failed":return"job.failed";default:return"job.unknown"}}function gn(e){return e==="done"}function Pt(e){let t=e.trim().split(`
`).reverse().find(n=>n.startsWith(qo));return t===void 0?"":t.slice(qo.length).trim()}var qo="\u2717";function Go(e){let t={php:e.php},n=()=>{let s=[];return t.php!==e.php&&s.push({label:r("table.php"),value:t.php,note:r("edit.effect.php")}),s},o={steps:[Qs(e,t),Xs(e,n)],finishLabel:()=>r("action.apply"),finish:()=>ei(e,t)};K(o)}function Qs(e,t){return{label:r("table.php"),heading:r("edit.step.php.heading",{name:e.name}),lead:r("edit.step.php.lead"),ready:()=>t.php!==e.php,enter(n,o){let s=l.phpVersions.filter(i=>i===e.php||e.minPhp===null||qn(i,e.minPhp)>=0);b(a`${ot(s.map(i=>({value:i,label:i,...i===e.php?{hint:r("edit.current")}:{}})),t.php,i=>{t.php=i,o.update()},r("table.php"))}`,n)}}}function Xs(e,t){return{label:r("step.review.label"),heading:r("edit.step.review.heading",{name:e.name}),lead:r("step.review.lead"),enter(n){b(a`
                <div class="branchery-preview">
                    <dl>
                        ${t().map(o=>a`
                            <dt>${o.label}</dt>
                            <dd>${o.value}<span class="branchery-preview__note">${o.note}</span></dd>`)}
                    </dl>
                </div>
                <sds-note tone="error" id="editError" hidden></sds-note>`,n)}}}async function ei(e,t){try{t.php!==e.php&&await m.updateWorktree(e.name,{php:t.php}),H(""),await C(),B()}catch(n){P(n);let o=_("#editError");o!==null&&(o.body=A(n),o.hidden=!1)}}var ti=10;function Vo(){return[{head:"",cls:"sds-td-graph"},{head:r("table.subject")},{head:r("table.when"),cls:"sds-td-meta",align:"end",fit:!0},{head:r("table.author"),fit:!0},{head:r("table.commit"),cls:"sds-td-name",fit:!0}]}function ni(){return a`<sds-table scrollable loading loading-rows=${ti} .columns=${Vo()}></sds-table>`}function oi(e,t){return e.commits.length===0?c:a`<sds-table
        scrollable
        .columns=${Vo()}
        .rows=${e.commits.map((n,o)=>{let s=!n.own&&(o===0||e.commits[o-1]?.own===!0),i=a`${n.pushed?c:a`<sds-badge label=${r("detail.notPushed")} tone="warn"></sds-badge> `}${s&&e.base!==null?a`<sds-badge label=${e.base} tone="neutral"></sds-badge> `:c}<span
                    class=${n.own?"branchery-subject":"branchery-subject branchery-subject--base"}><sds-link
                    href=${t(n.sha)}
                    label=${n.subject}></sds-link></span>`;return{cells:[ri(o===0?"current":""),o===0?a`<strong>${i}</strong>`:i,R(n.when,l.language),n.author,n.url===null?a`<code class="sds-mono">${n.sha}</code>`:a`<sds-link external href=${n.url} label=${n.sha}></sds-link>`]}})}></sds-table>`}function ri(e){return a`<span class="sds-graph${e===""?"":` sds-graph--${e}`}"></span>`}function si(e,t,n,o){return!e.more&&t===""?c:a`
        <p class="branchery-changes__more">
            ${t===""?c:a`<sds-note tone="warn" body=${`${r("detail.commitsFailed")} ${t}`}></sds-note>`}
            ${e.more?n?w(r("detail.loading"),a`<sds-button variant="ghost" disabled>${r("detail.loading")}</sds-button>`):w(r("detail.olderCommits"),a`<sds-button variant="ghost" @click=${o}>${r("detail.olderCommits")}</sds-button>`):c}
        </p>`}function jt(e,t,n){let o=bn("");async function s(i,d){d>0&&o.name===i&&(o={...o,reading:!0,trouble:""},n()),await t(()=>e(i,d),()=>o.name===i,(u,p)=>{let h=d>0?o.commits?.commits??[]:[];o={name:i,commits:u===null?o.commits:{...u,commits:[...h,...u.commits]},trouble:p,reading:!1}})}return{about(i){o.name!==i&&(o=bn(i),s(i,0))},of:i=>o.name===i?o.commits:null,trouble:i=>o.name===i&&o.commits===null&&o.trouble!==""?`${r("detail.commitsFailed")} ${o.trouble}`:"",body(i,d){let u=o.name===i?o.commits:null;return u===null?ni():a`${oi(u,d)}
                ${si(u,o.trouble,o.reading,()=>void s(i,u.commits.length))}`},forget(i){o.name===i&&(o=bn(""))}}}function bn(e){return{name:e,commits:null,trouble:"",reading:!1}}function Wt(e){return e.facts.length===0?c:a`
        <div class="sds-facts-group">
            <p class="sds-label">${e.title}</p>
            <dl class="sds-facts">${e.facts.map(ii)}</dl>
        </div>`}function ii(e,t){return a`
        <dt>${e.label}</dt>
        <dd>${e.waiting===!0?j(t):e.copy===!0?a`<sds-copy value=${e.value} label=${e.label}></sds-copy>`:e.said===!0?e.value:a`<code class="sds-mono">${e.value}</code>`}</dd>`}function Ht(e){return[e.own>0?r("detail.ownCommits",{count:e.own}):r("detail.ownNone"),...e.moved>0?[r("table.baseMoved",{base:e.branch,count:e.moved})]:[]].join(" \xB7 ")}var Ne={user:"admin",password:"Password1!"};function Yo(e,t){return[{title:r("detail.repository"),facts:[{label:r("table.branch"),value:e.branch},...yn(e)?[{label:r("detail.madeFor"),value:e.madeFor??""}]:[],...e.base!==null?[{label:r("detail.base"),value:e.forkedAt!==null&&e.forkedFrom===e.base.branch?`${e.base.branch} @ ${e.forkedAt.slice(0,11)}`:e.base.branch},{label:r("detail.sinceBase"),value:Ht(e.base),said:!0}]:[],{label:r("detail.commits"),value:li(e),said:!0},{label:r("detail.changes"),value:e.changes>0?r("table.changes",{count:e.changes}):r("detail.clean"),said:!0},...e.builtAt===null?[]:[{label:r("detail.built"),value:R(e.builtAt,l.language),said:!0}]]},{title:r("table.address"),facts:[{label:r("detail.site"),value:fe(e.url),copy:!0},...e.backend===null?[]:[{label:r("detail.backend"),value:fe(e.backend),copy:!0}]]},{title:r("detail.serving"),facts:[{label:r("table.php"),value:e.php+(e.minPhp!==null&&e.minPhp!==e.php?` (${r("detail.minPhp",{version:e.minPhp})})`:"")},...e.node===null?[]:[{label:r("table.node"),value:e.node}],{label:r("table.profile"),value:e.profile??r("table.noProfile")},{label:r("table.docroot"),value:e.docroot===""?"/":e.docroot}]},{title:r("detail.taken"),facts:[{label:r("table.directory"),value:e.path,copy:!0},{label:r("table.database"),value:e.database,copy:!0},...e.backend===null?[]:[{label:r("detail.user"),value:Ne.user,copy:!0},{label:r("detail.password"),value:Ne.password,copy:!0}]]},...e.isProject?[]:[ai(t)]]}function ai(e){return e.trouble!==""?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:`${r("detail.storageFailed")} ${e.trouble}`,said:!0}]}:e.value===null?{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:"",waiting:!0},{label:r("detail.storageFiles"),value:"",waiting:!0},{label:r("detail.storageDatabase"),value:"",waiting:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}:{title:r("detail.storage"),facts:[{label:r("detail.storageTotal"),value:nt(e.value.total,l.language),said:!0},{label:r("detail.storageFiles"),value:nt(e.value.files,l.language),said:!0},{label:r("detail.storageDatabase"),value:nt(e.value.database,l.language),said:!0},{label:r("detail.storageShared"),value:r("detail.storageExcluded"),said:!0}]}}function li(e){if(e.gone)return r("table.gone");if(e.ahead===null||e.behind===null)return r("detail.noRemote");let t=[...e.ahead>0?[r("table.unpushed",{count:e.ahead})]:[],...e.behind>0?[r("table.behind",{count:e.behind})]:[]];return t.length===0?r("detail.inStep"):t.join(" \xB7 ")}function yn(e){return e.madeFor!==null&&e.madeFor!==e.branch}var le=g("#changes"),$n="";function Zo(){return $n}function Qo(e,t,n){$n=e,le.heading=t,le.body=n,le.actions=[a`${w(r("action.close"),a`<sds-button variant="ghost" @click=${()=>le.close()}>${r("action.close")}</sds-button>`)}`],le.show()}function Xo(){le.close()}function er(e){le.addEventListener("sds-dialog-cancel",()=>{$n="",e()})}var Se=g("#confirm");function Ot(e){return Se.heading=e.title,Se.body=di(e),Se.confirmLabel=e.confirmLabel,Se.cancelLabel=r("action.cancel"),Se.tone=e.tone??"primary",Se.ask()}function di(e){return a`
        <p>${e.message}</p>
        ${e.warning===void 0?c:a`<sds-note tone="warn" body=${e.warning}></sds-note>`}
        ${e.facts===void 0||e.facts.length===0?c:a`
            <div class="branchery-preview">
                <dl>${e.facts.map(t=>a`
                    <dt>${t.label}</dt>
                    <dd><code class="sds-mono">${t.value}</code></dd>`)}</dl>
            </div>`}`}async function tr(e,t){await Ot({title:r("confirm.sync.title"),message:r("confirm.sync.body"),facts:[{label:r("table.worktree"),value:e.name},{label:r("table.database"),value:e.database},{label:r("confirm.source"),value:r("field.branchFromProject",{branch:l.project?.branch??l.branch})}],confirmLabel:r("action.sync")})&&await ke(()=>m.syncWorktree(e.name),e.name,"sync",t)}function ci(e){return[...e.ahead===null?[r("confirm.worktree.nowhere")]:[],...e.ahead!==null&&e.ahead>0?[r("confirm.worktree.unpushed",{count:e.ahead})]:[],...e.changes>0?[r("confirm.worktree.changes",{count:e.changes})]:[]]}async function nr(e,t,n){let o=n;if(o===null)try{o=await m.commits(e.name)}catch(u){P(u);return}let s=o.commits.filter(u=>!u.pushed),i=o.upstream??e.branch;await Ot({title:r("confirm.discard.title"),message:r("confirm.discard.body",{upstream:i}),...(e.behind??0)>0?{warning:r("confirm.discard.behind",{count:e.behind??0})}:{},facts:s.map(u=>({label:u.sha,value:u.subject})),confirmLabel:r("action.discard"),tone:"danger"})&&await ke(()=>m.discardWorktree(e.name),e.name,"discard",t)}async function or(e,t){await ke(()=>m.restoreWorktree(e.name),e.name,"restore",t)}async function rr(e,t){await ke(()=>m.pullWorktree(e.name),e.name,"pull",t)}async function Lt(e,t,n){await ke(()=>m.provisionWorktree(e,t),e,"create",n)}async function sr(e,t){let n=ci(e);await Ot({title:r("confirm.worktree.title"),message:r("confirm.worktree.body"),...n.length>0?{warning:n.join(" ")}:{},facts:[{label:r("table.worktree"),value:e.name},{label:r("table.branch"),value:e.branch},{label:r("table.database"),value:e.database}],confirmLabel:r("action.remove"),tone:"danger"})&&await ke(()=>m.removeWorktree(e.name),null,"remove",t)&&dt("/")}async function ke(e,t,n,o){try{let s=await e();return H(""),o.onJob(s.job,t,n),!0}catch(s){return P(s),await C(),!1}}function Bt(e,t){let n={fresh:!1},o={steps:[ui(e,n)],finishLabel:()=>n.fresh?r("provision.fresh"):r("table.provision"),finish:()=>t(n.fresh)};K(o)}function ui(e,t){return{label:r("table.database"),heading:r("provision.heading",{name:e.name}),lead:r("provision.lead"),enter(n,o){b(a`${ot([{value:"keep",label:r("provision.keep"),hint:r("provision.keepHint")},{value:"fresh",label:r("provision.fresh"),hint:r("provision.freshHint")}],t.fresh?"fresh":"keep",s=>{t.fresh=s==="fresh",o.update()},r("table.database"))}`,n)}}}var I=ae(),V=new Map,vn=new Set,Ue=ve(A,Y),Te=jt((e,t)=>m.commits(e,t),Ue,Y),y=wn(""),de=ae();function wn(e){return{name:e,list:{read:null,trouble:"",open:!1},all:!1,diffs:new Map}}var F=null;function ir(){F=null,Xo()}function pi(e){return F?.name===e&&q(O(),{view:"worktree",name:e})}function ar(e){if(I.stillOn(e)&&(I.forget(e),V.clear()),Te.forget(e),y.name===e){let t=Zo()===e;y=wn(t?e:""),t&&(y.list.open=!0,lr(e))}de.forget(e),F?.name===e&&Y()}function _n(e,t){F={name:e,handlers:t};let n=[l.project,...l.worktrees].find(s=>s?.name===e)??null;I.about(e)&&(V.clear(),Ai(e));let o=n?.incomplete===!0?dr():null;o!==null&&!V.has(o.id)&&cr(o.id),n!==null&&Te.about(e),n!==null&&!n.isProject&&de.about(e)&&Ei(e),b(n===null?fi(e):mi(n,t),g("#main")),y.name===e&&y.list.open&&Qo(e,r("table.uncommitted"),$i(e))}function fi(e){return!l.loading&&!l.unreachable?a`
          <div class="sds-page">
            <sds-note tone="warn" body=${r("detail.gone",{name:e})}></sds-note>
            ${U(r("detail.back"),"#/")}
          </div>`:a`
      <div class="sds-bands">
        <section class="sds-band">
            ${U(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2"><span class="sds-mono">${e}</span></h1>
            </div>
            ${D()}
        </section>
      </div>`}function mi(e,t){let n=ge(e.name);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${U(r("detail.back"),"#/")}
            ${""}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${e.name}</span>
                    ${e.ready?e.incomplete?a`<sds-badge label=${r("table.unfinished")} tone="warn"></sds-badge>`:c:a`<sds-badge label=${r("table.unbuilt")} tone="warn"></sds-badge>`}
                </h1>
                <span class="sds-row sds-row__end">
                    ${Me(e.url,r("table.openSite"))}
                    ${Me(e.backend,r("detail.backend"))}
                    ${e.isProject?Me(l.repository,r("detail.repository")):c}
                    ${Me(e.review,r("detail.review"))}
                    ${Me(e.issue,e.issueId===null?r("detail.issue"):r("detail.issueNumber",{id:e.issueId}))}
                </span>
            </div>
            ${e.isProject?c:ki(e,t,n!==void 0)}
            ${n!==void 0?Si(n):c}
            ${e.incomplete&&n===void 0?_i(e,t):c}
            ${e.stale&&n===void 0?wi(e,t):c}
        </section>

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.settled")}</h2>
            <div class="sds-facts-set">${Yo(e,{value:de.of(e.name),trouble:de.trouble(e.name)}).map(Wt)}</div>
        </section>

        ${hi(e)}

        <section class="sds-band sds-band--quiet">
            <h2 class="sds-h3">${r("detail.history")}</h2>
            ${Ti(e.name)}
        </section>
      </div>`}function Me(e,t){return e===null?c:a`${he(e,t)}`}function hi(e){let t=Te.of(e.name),n=Te.trouble(e.name);return n!==""?a`
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
                    ${gi(e.name)}
                </p>`}
            ${Te.body(e.name,o=>`#/w/${encodeURIComponent(e.name)}/c/${o}`)}
        </section>`}function gi(e){return a` ${w(r("detail.showFiles"),a`<sds-button variant="ghost" @click=${()=>bi(e)}>${r("detail.showFiles")}</sds-button>`)}`}function bi(e){y.name!==e&&(y=wn(e)),y.list.open=!0,y.list.read===null&&lr(e),Y()}er(()=>{y.list.open=!1,Y()});function yi(e,t){y.name===e&&(Rt(y.diffs,t,()=>void vi(e,t)),Y())}function $i(e){let t=y.list;return t.trouble!==""?a`<sds-note tone="warn" body=${`${r("detail.changesFailed")} ${t.trouble}`}></sds-note>`:t.read===null?D():Tt({files:t.read,diffs:y.diffs,press:n=>yi(e,n),all:y.all,showAll:()=>{y.all=!0,Y()}})}async function lr(e){await Ue(async()=>(await m.changes(e)).changes,()=>y.name===e,(t,n)=>{y.list={...y.list,read:t,trouble:n}})}async function vi(e,t){await Ue(()=>m.changeDiff(e,t),()=>y.name===e&&y.diffs.has(t),(n,o)=>Ct(y.diffs,t,n,o))}function wi(e,t){return a`
        <sds-note
            tone="warn"
            heading=${r("detail.staleHeading")}
            body=${r("detail.stale")}
            action=${r("table.provision")}
            @sds-note-action=${()=>Bt(e,n=>Lt(e.name,n,t))}></sds-note>`}function _i(e,t){let n=dr(),o=n===null?null:V.get(n.id)?.stopped??null;return a`
        <sds-note
            tone="warn"
            heading=${r("detail.unfinishedHeading")}
            body=${o===null?r("detail.unfinished"):r("detail.unfinishedAt",{no:o.no,step:o.step,reason:o.reason})}
            action=${r("table.provision")}
            @sds-note-action=${()=>Bt(e,s=>Lt(e.name,s,t))}></sds-note>`}function dr(){return I.of(F?.name??"")?.find(e=>e.status==="failed")??null}function Si(e){return a`
        <sds-note
            tone="info"
            heading=${r("detail.busyHeading")}
            body=${r("detail.busy",{doing:e})}></sds-note>`}function ki(e,t,n){let o=JSON.stringify([e,l.language]);xe?.key!==o&&(xe={key:o,...xi(e,t)});for(let d of[...xe.doing,...xe.undoing])d.disabled=n||xe.held.has(d);let{doing:s,undoing:i}=xe;return a`
        <section class="sds-actions">
            ${""}
            <h2 class="sds-said-only">${r("detail.actions")}</h2>
            ${s}
            ${""}
            <span class="sds-row sds-row__end">${i}</span>
        </section>`}var xe=null;function xi(e,t){let n=k(r("table.discard"),"danger",()=>void nr(e,t,Te.of(e.name))),o=k(r("table.remove"),"danger",()=>void sr(e,t)),s=new Set;e.changes>0&&(s.add(n),n.title=r("detail.discardBlocked"));let i=k(r("table.pull"),"secondary",()=>void rr(e,t));e.behind===0&&(s.add(i),i.title=r("detail.pullBlocked"));let u=[...yn(e)?[k(r("table.restore",{branch:e.madeFor??""}),"secondary",()=>void or(e,t))]:e.behind===null?[]:[i],k(r("table.edit"),"secondary",()=>Go(e)),k(r("table.sync"),"secondary",()=>void tr(e,t)),k(r("table.provision"),"secondary",()=>Bt(e,h=>Lt(e.name,h,t)))],p=[...(e.ahead??0)>0?[n]:[],o];return{doing:u,undoing:p,held:s}}function Ti(e){let t=I.trouble(e);if(t!=="")return a`<sds-note tone="warn" body=${`${r("detail.historyFailed")} ${t}`}></sds-note>`;let n=I.of(e);return n===null?D():n.length===0?a`<p class="branchery-list__quiet">${r("detail.noHistory")}</p>`:a`<div class="branchery-history">${n.map(Ri)}</div>`}function Ri(e){let t=V.get(e.id),n=`${R(e.started,l.language)} \xB7 ${He(e.elapsed)}`;return a`
        <sds-run
            heading=${at(e.command)}
            verdict=${e.status}
            note=${t!==void 0&&t.trouble!==""?`${n} \xB7 ${t.trouble}`:n}
            .stateWords=${lt()}
            .steps=${t?.steps??[]}
            @click=${o=>Ci(o,e.id)}></sds-run>`}function Ci(e,t){let n=e.target;!(n instanceof Element)||!n.closest(".sds-run__head")||V.get(t)?.settled===!0||cr(t)}async function Ai(e){await Ue(()=>m.worktreeJobs(e),()=>I.stillOn(e),(t,n)=>{if(t===null){I.failed(e,n);return}I.put(e,t)})}async function Ei(e){await Ue(()=>m.worktreeUsage(e),()=>de.stillOn(e),(t,n)=>{if(t===null){de.failed(e,n);return}de.put(e,t)})}async function cr(e){if(!vn.has(e)){vn.add(e);try{let t=await m.job(e),n=t.status==="unknown"&&t.steps.length===0;V.set(e,{steps:tt(Et(At,t).steps),trouble:n?r("detail.noLog"):"",settled:!0,stopped:Pi(t)})}catch(t){V.set(e,{steps:[],trouble:`${r("detail.logFailed")} ${A(t)}`,settled:!1,stopped:null})}finally{vn.delete(e)}Y()}}function Pi(e){let t=e.steps.find(n=>n.state==="failed");return e.status!=="failed"||t===void 0?null:{no:t.no,step:t.label,reason:Pt(e.log)}}function Y(){F!==null&&pi(F.name)&&_n(F.name,F.handlers)}var Fe=null,ce=ae(),ur=ve(A,fr),Sn=jt((e,t)=>m.branchCommits(e,t),ur,fr);function pr(){Fe=null}function xn(e,t){Fe=e,ce.about(e)&&Ji(e),Sn.about(e),b(ji(e,t),g("#main"))}var kn=null;function fr(){Fe!==null&&kn!==null&&q(O(),{view:"branch",name:Fe})&&xn(Fe,kn)}function ji(e,t){kn=t;let n=ce.of(e);return a`
      <div class="sds-bands">
        <section class="sds-band">
            ${l.error===""?c:a`<sds-note tone="error" body=${l.error}></sds-note>`}
            ${U(r("detail.back"),"#/")}
            <div class="sds-row">
                <h1 class="sds-h2">
                    <span class="sds-mono">${e}</span>
                    ${n===null?c:Hi(n)}
                </h1>
            </div>
            ${n===null?Wi(e):Oi(n,t)}
        </section>
        ${n===null?c:a`
            <section class="sds-band sds-band--quiet">
                <h2 class="sds-h3">${r("detail.settled")}</h2>
                <div class="sds-facts-set">${Li(n).map(Wt)}</div>
            </section>`}
        ${n===null&&ce.trouble(e)!==""?c:Di(e)}
      </div>`}function Wi(e){let t=ce.trouble(e);return t===""?D():a`<sds-note tone="warn" body=${t}></sds-note>`}function Hi(e){return e.merged?a`<sds-badge label=${r("table.merged",{branch:l.project?.branch??l.branch})}
                               tone="neutral"></sds-badge>`:e.gone?a`<sds-badge label=${r("table.gone")} tone="warn"></sds-badge>`:!e.onRemote&&l.remotes.length>0?a`<sds-badge label=${r("table.nowhere")} tone="warn"></sds-badge>`:c}function Oi(e,t){return e.worktree!==null?a`
            <p class="branchery-list__quiet">${r("detail.branchHasWorktree")}
                <sds-link href=${`#/w/${encodeURIComponent(e.worktree)}`}
                          label=${e.worktree}></sds-link></p>`:a`
        <div class="sds-row">
            ${w(r("nav.newWorktree"),a`<sds-button variant="primary"
                        @click=${()=>G(t,e.name)}>${r("nav.newWorktree")}</sds-button>`)}
        </div>`}function Li(e){return[{title:r("detail.repository"),facts:[...e.base===null?[]:[{label:r("detail.base"),value:e.base.branch},{label:r("detail.sinceBase"),value:Ht(e.base),said:!0}],{label:r("detail.commits"),value:Bi(e),said:!0},{label:r("detail.moved"),value:R(e.when,l.language),said:!0}]}]}function Bi(e){if(e.gone)return r("table.gone");if(e.upstream===null)return e.onRemote?r("detail.onRemoteOnly"):r("detail.noRemote");let t=[...e.ahead!==null&&e.ahead>0?[r("table.unpushed",{count:e.ahead})]:[],...e.behind!==null&&e.behind>0?[r("table.behind",{count:e.behind})]:[]];return t.length===0?r("detail.inStep"):`${e.upstream} \xB7 ${t.join(" \xB7 ")}`}function Di(e){let t=Sn.trouble(e);return a`
        <section class="sds-band">
            <h2 class="sds-h3">${r("detail.commitsHeading")}</h2>
            ${t===""?Sn.body(e,n=>`#/b/${encodeURIComponent(e)}/c/${n}`):a`<sds-note tone="warn" body=${t}></sds-note>`}
        </section>`}async function Ji(e){await ur(()=>m.branch(e),()=>ce.stillOn(e),(t,n)=>{if(t===null){ce.failed(e,n);return}ce.put(e,t)})}var Ni={schedule:(e,t)=>setTimeout(e,t),cancel:e=>clearTimeout(e)};function mr(e,t,n,o=Ni){let s=!1,i=null,d=()=>{i=o.schedule(()=>{i=null,u()},n)},u=async()=>{let p;try{p=await e()}catch{s||d();return}s||(t(p)?d():s=!0)};return u(),()=>{s=!0,i!==null&&(o.cancel(i),i=null)}}var Mi=1e3,Tn=0,hr=null,Cn=null;function An(e,t,n,o,s=!0){let i=++Tn;hr?.();let d=eo(e,t,n??"create"),u=s,p=At,h=()=>{u&&!$t()&&gr(d)};Cn=()=>{u=!0,yt(),gr(d)},s&&Cn();let v=async()=>{await C(),i===Tn&&(l.job=d,h(),o(d))};hr=mr(()=>m.job(e,p.size),f=>i!==Tn?!1:(p=Et(p,f),d={...f,log:p.log,steps:p.steps,expected:t??(f.subject===""?null:f.subject),kind:n??to(f.command)},f.status==="running"?(h(),!0):(v(),!1)),Mi)}var Ui={running:"job.running",done:"job.ticket.done",failed:"job.ticket.failed",unknown:"job.ticket.unknown"},Z=null,Rn="";function Dt(){let e=l.job!==null&&!se()?l.job.status:"",t=Ui[e];if(t===void 0){Z?.remove(),Z=null,Rn="";return}Z!==null&&Rn===e||(Z?.remove(),Rn=e,Z=k(r(t),"secondary",()=>{(Cn??yt)(),Dt()}),Z.className=`branchery-ticket branchery-ticket--${e}`,Z.title=r("job.show"),document.body.append(Z))}vt(()=>Dt());it(()=>Dt());function gr(e){St(zi(e),e.status==="running"?"":Ki(e)),ko(a`
        <sds-run open
                 heading=${Ii(e)}
                 verdict=${e.status}
                 note=${qi(e)}
                 .stateWords=${lt()}
                 .steps=${tt(e.steps)}></sds-run>`),Fi(e),Dt()}function Fi(e){on(e.status==="running"?{back:r("action.leaveRunning"),onBack:()=>B()}:{back:r("action.copyLog"),onBack:()=>void Gi(e),next:r("action.close"),onNext:()=>{l.job=null,B()}})}function Ii(e){return r(Ko(e.status))}function zi(e){return e.expected??(e.subject===""?at(e.command):e.subject)}function qi(e){let t=He(e.elapsed);return e.status==="running"?e.step===null?t:`${r("job.stepOf",{no:e.step.no,total:e.step.total})} \xB7 ${t}`:e.status==="failed"?e.interrupted?r("job.interrupted"):Pt(e.log)||t:gn(e.status)?t:""}function Ki(e){if(!gn(e.status))return"";let t=He(e.elapsed);if(e.kind==="fetch"){let s=e.log.split(`
`).filter(i=>i.includes(" -> ")).length;return s===0?r("job.done.fetch",{time:t}):r("job.done.fetchMoved",{count:s,time:t})}let n=l.worktrees.find(s=>s.name===e.expected);if(!n||e.kind==="remove")return r(`job.done.${e.kind}`,{name:e.expected??"",time:t});let o=e.kind==="sync"?r("job.done.sync",{name:n.database}):e.kind==="pull"?r("job.done.pull",{branch:n.branch}):e.kind==="restore"?r("job.done.restore",{branch:n.branch}):e.kind==="discard"?r("job.done.discard",{branch:n.branch}):n.backend===null?r("job.done.built",{php:n.php}):`${r("job.done.built",{php:n.php})} ${r("job.login",Ne)}`;return a`
        ${o}
        <sds-link external href=${n.url}
                  label=${r("action.openWorktree")}></sds-link>`}async function Gi(e){let t=_("#wizBack");try{await navigator.clipboard.writeText(e.log.trim()),t&&(me(t,r("action.copied")),window.setTimeout(()=>me(t,r("action.copyLog")),2e3))}catch{}}var Jt={onJob(e,t=null,n=null){An(e,t,n,vr)}};function vr(e){let t=e.expected??e.subject;t!==""&&ar(t)}function ze(e,t,n,o){let s=g(e);if(s.hidden=!t,!t)return;let i=s.firstElementChild;i===null&&(i=document.createElement("sds-note"),o!==void 0&&i.addEventListener("sds-note-action",o),s.append(i));for(let[d,u]of Object.entries(n()))i.setAttribute(d,u)}function Vi(){ze("#offline",l.unreachable,()=>({tone:"warn",body:r("error.unreachable"),action:r("action.tryAgain")}),()=>void C())}function Yi(){ze("#update",l.updateWaiting,()=>({tone:"info",heading:r("update.waiting"),body:r("update.how")}))}function Zi(){let e=l.exposed;ze("#exposed",e!==null,()=>({tone:"warn",heading:r("exposed.heading"),body:r(e==="router"?"exposed.router":"exposed.container")}))}function Qi(){ze("#unconfigured",l.unconfigured,()=>({tone:"info",heading:r("error.unconfigured"),body:r("error.unconfiguredHow")}))}function Xi(){let e=l.recipeProblem;ze("#recipe",e!==null,()=>({tone:"warn",heading:r("error.recipe"),body:e??""}))}var Re=O();function Ae(e=O()){if(se())return;let t=e.view!==Re.view,n=!q(e,Re);n&&window.scrollTo(0,0),t&&(Re.view==="worktree"&&ir(),Re.view==="commit"&&Io(),Re.view==="branch"&&pr()),Re=e,wr(),Vi(),Zi(),Yi(),aa(),Xi(),Qi(),ea(e),n&&ta()}function ea(e){if(e.view==="worktree"){_n(e.name,Jt);return}if(e.view==="branch"){xn(e.name,Jt);return}if(e.view==="commit"){mn(e.name,e.sha,e.branch);return}un(Jt)}function ta(){g("#main").focus({preventScroll:!0})}it(()=>Ae());ao(e=>{H(""),Ae(e)});var Ce=g("#bar"),Ie=[],na="https://benjaminkott.github.io/ddev-branchery/",br="";function wr(){br!==l.language&&(br=l.language,Ce.menu={label:r("app.title"),items:[{label:r("nav.worktrees"),href:"#/",current:!0},{label:r("nav.docs"),href:na,external:!0}]})}function _r(){Ce.product=r("app.title"),wr()}function Sr(){Ce.languages=Ie.map(e=>({label:oa(e),current:e===l.language,lang:e})),Ce.updateComplete.then(()=>{_(".sds-bar__lang",Ce)?.setAttribute("name",r("app.language"))})}function oa(e){try{return new Intl.DisplayNames([e],{type:"language"}).of(e)??e.toUpperCase()}catch{return e.toUpperCase()}}Ce.addEventListener("sds-dropdown-choose",e=>{let t=Ie[e.detail.index];!t||t===l.language||Kt(t).then(()=>{Sr(),_r(),Ae()})});g("#wizard").addEventListener("close",()=>{l.job?.status!=="running"&&(l.job=null)});vt(()=>{let e=so(location.hash);e!==null&&history.replaceState(null,"",e),Ae(),C(!0)});var ra=5e3,yr=Date.now();async function kr(){let e=Date.now();document.visibilityState!=="visible"||l.job?.status==="running"||se()||e-yr<ra||(yr=e,xr(await C(!0)))}function xr(e){let t=e[0];t!==void 0&&l.job?.status!=="running"&&An(t.id,null,null,vr,!1)}var sa=2e3,ia=1e4,$r=!1;function aa(){if($r)return;$r=!0;let e=()=>{let t=l.runningJobs.length>0||se()||l.unreachable;window.setTimeout(()=>{if(document.visibilityState!=="visible"||se()){e();return}C(!0).then(e)},t?sa:ia)};e()}document.addEventListener("visibilitychange",()=>void kr());window.addEventListener("focus",()=>void kr());function Tr(){if(Yt(location.hash)){G(Jt);return}$t()&&B()}window.addEventListener("hashchange",Tr);(async()=>(Ie=await Gn(),await Kt(Ie.includes(l.language)?l.language:Ie[0]??"en"),Sr(),_r(),Ae(),xr(await C()),Ae(),Tr()))();
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
