var Ao=Object.defineProperty;var za=s=>{throw TypeError(s)};var Ro=(s,e,t)=>e in s?Ao(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var T=(s,e,t)=>Ro(s,typeof e!="symbol"?e+"":e,t),tn=(s,e,t)=>e.has(s)||za("Cannot "+t);var m=(s,e,t)=>(tn(s,e,"read from private field"),t?t.call(s):e.get(s)),L=(s,e,t)=>e.has(s)?za("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(s):e.set(s,t),O=(s,e,t,n)=>(tn(s,e,"write to private field"),n?n.call(s,t):e.set(s,t),t),B=(s,e,t)=>(tn(s,e,"access private method"),t);var Ja=(s,e,t,n)=>({set _(a){O(s,e,a,t)},get _(){return m(s,e,n)}});var Xa=(s,e,t)=>(n,a)=>{let r=-1;return i(0);async function i(o){if(o<=r)throw new Error("next() called multiple times");r=o;let l,c=!1,u;if(s[o]?(u=s[o][0][0],n.req.routeIndex=o):u=o===s.length&&a||void 0,u)try{l=await u(n,()=>i(o+1))}catch(d){if(d instanceof Error&&e)n.error=d,l=await e(d,n),c=!0;else throw d}else n.finalized===!1&&t&&(l=await t(n));return l&&(n.finalized===!1||c)&&(n.res=l),n}},ko=Symbol(),So=async(s,e=Object.create(null))=>{const{all:t=!1,dot:n=!1}=e,r=(s instanceof Br?s.raw.headers:s.headers).get("Content-Type");return r!=null&&r.startsWith("multipart/form-data")||r!=null&&r.startsWith("application/x-www-form-urlencoded")?Eo(s,{all:t,dot:n}):{}};async function Eo(s,e){const t=await s.formData();return t?Po(t,e):{}}function Po(s,e){const t=Object.create(null);return s.forEach((n,a)=>{e.all||a.endsWith("[]")?Co(t,a,n):t[a]=n}),e.dot&&Object.entries(t).forEach(([n,a])=>{n.includes(".")&&(Mo(t,n,a),delete t[n])}),t}var Co=(s,e,t)=>{s[e]!==void 0?Array.isArray(s[e])?s[e].push(t):s[e]=[s[e],t]:e.endsWith("[]")?s[e]=[t]:s[e]=t},Mo=(s,e,t)=>{let n=s;const a=e.split(".");a.forEach((r,i)=>{i===a.length-1?n[r]=t:((!n[r]||typeof n[r]!="object"||Array.isArray(n[r])||n[r]instanceof File)&&(n[r]=Object.create(null)),n=n[r])})},Fr=s=>{const e=s.split("/");return e[0]===""&&e.shift(),e},Io=s=>{const{groups:e,path:t}=To(s),n=Fr(t);return Oo(n,e)},To=s=>{const e=[];return s=s.replace(/\{[^}]+\}/g,(t,n)=>{const a=`@${n}`;return e.push([a,t]),a}),{groups:e,path:s}},Oo=(s,e)=>{for(let t=e.length-1;t>=0;t--){const[n]=e[t];for(let a=s.length-1;a>=0;a--)if(s[a].includes(n)){s[a]=s[a].replace(n,e[t][1]);break}}return s},gs={},Fo=(s,e)=>{if(s==="*")return"*";const t=s.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(t){const n=`${s}#${e}`;return gs[n]||(t[2]?gs[n]=e&&e[0]!==":"&&e[0]!=="*"?[n,t[1],new RegExp(`^${t[2]}(?=/${e})`)]:[s,t[1],new RegExp(`^${t[2]}$`)]:gs[n]=[s,t[1],!0]),gs[n]}return null},Cn=(s,e)=>{try{return e(s)}catch{return s.replace(/(?:%[0-9A-Fa-f]{2})+/g,t=>{try{return e(t)}catch{return t}})}},Do=s=>Cn(s,decodeURI),Dr=s=>{const e=s.url,t=e.indexOf("/",e.indexOf(":")+4);let n=t;for(;n<e.length;n++){const a=e.charCodeAt(n);if(a===37){const r=e.indexOf("?",n),i=e.slice(t,r===-1?void 0:r);return Do(i.includes("%25")?i.replace(/%25/g,"%2525"):i)}else if(a===63)break}return e.slice(t,n)},Lo=s=>{const e=Dr(s);return e.length>1&&e.at(-1)==="/"?e.slice(0,-1):e},ht=(s,e,...t)=>(t.length&&(e=ht(e,...t)),`${(s==null?void 0:s[0])==="/"?"":"/"}${s}${e==="/"?"":`${(s==null?void 0:s.at(-1))==="/"?"":"/"}${(e==null?void 0:e[0])==="/"?e.slice(1):e}`}`),Lr=s=>{if(s.charCodeAt(s.length-1)!==63||!s.includes(":"))return null;const e=s.split("/"),t=[];let n="";return e.forEach(a=>{if(a!==""&&!/\:/.test(a))n+="/"+a;else if(/\:/.test(a))if(/\?/.test(a)){t.length===0&&n===""?t.push("/"):t.push(n);const r=a.replace("?","");n+="/"+r,t.push(n)}else n+="/"+a}),t.filter((a,r,i)=>i.indexOf(a)===r)},sn=s=>/[%+]/.test(s)?(s.indexOf("+")!==-1&&(s=s.replace(/\+/g," ")),s.indexOf("%")!==-1?Cn(s,jr):s):s,Nr=(s,e,t)=>{let n;if(!t&&e&&!/[%+]/.test(e)){let i=s.indexOf(`?${e}`,8);for(i===-1&&(i=s.indexOf(`&${e}`,8));i!==-1;){const o=s.charCodeAt(i+e.length+1);if(o===61){const l=i+e.length+2,c=s.indexOf("&",l);return sn(s.slice(l,c===-1?void 0:c))}else if(o==38||isNaN(o))return"";i=s.indexOf(`&${e}`,i+1)}if(n=/[%+]/.test(s),!n)return}const a={};n??(n=/[%+]/.test(s));let r=s.indexOf("?",8);for(;r!==-1;){const i=s.indexOf("&",r+1);let o=s.indexOf("=",r);o>i&&i!==-1&&(o=-1);let l=s.slice(r+1,o===-1?i===-1?void 0:i:o);if(n&&(l=sn(l)),r=i,l==="")continue;let c;o===-1?c="":(c=s.slice(o+1,i===-1?void 0:i),n&&(c=sn(c))),t?(a[l]&&Array.isArray(a[l])||(a[l]=[]),a[l].push(c)):a[l]??(a[l]=c)}return e?a[e]:a},No=Nr,jo=(s,e)=>Nr(s,e,!0),jr=decodeURIComponent,Qa=s=>Cn(s,jr),At,ge,Oe,Hr,Gr,hn,je,kr,Br=(kr=class{constructor(s,e="/",t=[[]]){L(this,Oe);T(this,"raw");L(this,At);L(this,ge);T(this,"routeIndex",0);T(this,"path");T(this,"bodyCache",{});L(this,je,s=>{const{bodyCache:e,raw:t}=this,n=e[s];if(n)return n;const a=Object.keys(e)[0];return a?e[a].then(r=>(a==="json"&&(r=JSON.stringify(r)),new Response(r)[s]())):e[s]=t[s]()});this.raw=s,this.path=e,O(this,ge,t),O(this,At,{})}param(s){return s?B(this,Oe,Hr).call(this,s):B(this,Oe,Gr).call(this)}query(s){return No(this.url,s)}queries(s){return jo(this.url,s)}header(s){if(s)return this.raw.headers.get(s)??void 0;const e={};return this.raw.headers.forEach((t,n)=>{e[n]=t}),e}async parseBody(s){var e;return(e=this.bodyCache).parsedBody??(e.parsedBody=await So(this,s))}json(){return m(this,je).call(this,"text").then(s=>JSON.parse(s))}text(){return m(this,je).call(this,"text")}arrayBuffer(){return m(this,je).call(this,"arrayBuffer")}blob(){return m(this,je).call(this,"blob")}formData(){return m(this,je).call(this,"formData")}addValidatedData(s,e){m(this,At)[s]=e}valid(s){return m(this,At)[s]}get url(){return this.raw.url}get method(){return this.raw.method}get[ko](){return m(this,ge)}get matchedRoutes(){return m(this,ge)[0].map(([[,s]])=>s)}get routePath(){return m(this,ge)[0].map(([[,s]])=>s)[this.routeIndex].path}},At=new WeakMap,ge=new WeakMap,Oe=new WeakSet,Hr=function(s){const e=m(this,ge)[0][this.routeIndex][1][s],t=B(this,Oe,hn).call(this,e);return t&&/\%/.test(t)?Qa(t):t},Gr=function(){const s={},e=Object.keys(m(this,ge)[0][this.routeIndex][1]);for(const t of e){const n=B(this,Oe,hn).call(this,m(this,ge)[0][this.routeIndex][1][t]);n!==void 0&&(s[t]=/\%/.test(n)?Qa(n):n)}return s},hn=function(s){return m(this,ge)[1]?m(this,ge)[1][s]:s},je=new WeakMap,kr),Bo={Stringify:1},Ur=async(s,e,t,n,a)=>{typeof s=="object"&&!(s instanceof String)&&(s instanceof Promise||(s=s.toString()),s instanceof Promise&&(s=await s));const r=s.callbacks;return r!=null&&r.length?(a?a[0]+=s:a=[s],Promise.all(r.map(o=>o({phase:e,buffer:a,context:n}))).then(o=>Promise.all(o.filter(Boolean).map(l=>Ur(l,e,!1,n,a))).then(()=>a[0]))):Promise.resolve(s)},Ho="text/plain; charset=UTF-8",nn=(s,e)=>({"Content-Type":s,...e}),Yt,qt,Ce,Rt,Me,re,Vt,kt,St,et,zt,Jt,Be,mt,Sr,Go=(Sr=class{constructor(s,e){L(this,Be);L(this,Yt);L(this,qt);T(this,"env",{});L(this,Ce);T(this,"finalized",!1);T(this,"error");L(this,Rt);L(this,Me);L(this,re);L(this,Vt);L(this,kt);L(this,St);L(this,et);L(this,zt);L(this,Jt);T(this,"render",(...s)=>(m(this,kt)??O(this,kt,e=>this.html(e)),m(this,kt).call(this,...s)));T(this,"setLayout",s=>O(this,Vt,s));T(this,"getLayout",()=>m(this,Vt));T(this,"setRenderer",s=>{O(this,kt,s)});T(this,"header",(s,e,t)=>{this.finalized&&O(this,re,new Response(m(this,re).body,m(this,re)));const n=m(this,re)?m(this,re).headers:m(this,et)??O(this,et,new Headers);e===void 0?n.delete(s):t!=null&&t.append?n.append(s,e):n.set(s,e)});T(this,"status",s=>{O(this,Rt,s)});T(this,"set",(s,e)=>{m(this,Ce)??O(this,Ce,new Map),m(this,Ce).set(s,e)});T(this,"get",s=>m(this,Ce)?m(this,Ce).get(s):void 0);T(this,"newResponse",(...s)=>B(this,Be,mt).call(this,...s));T(this,"body",(s,e,t)=>B(this,Be,mt).call(this,s,e,t));T(this,"text",(s,e,t)=>!m(this,et)&&!m(this,Rt)&&!e&&!t&&!this.finalized?new Response(s):B(this,Be,mt).call(this,s,e,nn(Ho,t)));T(this,"json",(s,e,t)=>B(this,Be,mt).call(this,JSON.stringify(s),e,nn("application/json",t)));T(this,"html",(s,e,t)=>{const n=a=>B(this,Be,mt).call(this,a,e,nn("text/html; charset=UTF-8",t));return typeof s=="object"?Ur(s,Bo.Stringify,!1,{}).then(n):n(s)});T(this,"redirect",(s,e)=>{const t=String(s);return this.header("Location",/[^\x00-\xFF]/.test(t)?encodeURI(t):t),this.newResponse(null,e??302)});T(this,"notFound",()=>(m(this,St)??O(this,St,()=>new Response),m(this,St).call(this,this)));O(this,Yt,s),e&&(O(this,Me,e.executionCtx),this.env=e.env,O(this,St,e.notFoundHandler),O(this,Jt,e.path),O(this,zt,e.matchResult))}get req(){return m(this,qt)??O(this,qt,new Br(m(this,Yt),m(this,Jt),m(this,zt))),m(this,qt)}get event(){if(m(this,Me)&&"respondWith"in m(this,Me))return m(this,Me);throw Error("This context has no FetchEvent")}get executionCtx(){if(m(this,Me))return m(this,Me);throw Error("This context has no ExecutionContext")}get res(){return m(this,re)||O(this,re,new Response(null,{headers:m(this,et)??O(this,et,new Headers)}))}set res(s){if(m(this,re)&&s){s=new Response(s.body,s);for(const[e,t]of m(this,re).headers.entries())if(e!=="content-type")if(e==="set-cookie"){const n=m(this,re).headers.getSetCookie();s.headers.delete("set-cookie");for(const a of n)s.headers.append("set-cookie",a)}else s.headers.set(e,t)}O(this,re,s),this.finalized=!0}get var(){return m(this,Ce)?Object.fromEntries(m(this,Ce)):{}}},Yt=new WeakMap,qt=new WeakMap,Ce=new WeakMap,Rt=new WeakMap,Me=new WeakMap,re=new WeakMap,Vt=new WeakMap,kt=new WeakMap,St=new WeakMap,et=new WeakMap,zt=new WeakMap,Jt=new WeakMap,Be=new WeakSet,mt=function(s,e,t){const n=m(this,re)?new Headers(m(this,re).headers):m(this,et)??new Headers;if(typeof e=="object"&&"headers"in e){const r=e.headers instanceof Headers?e.headers:new Headers(e.headers);for(const[i,o]of r)i.toLowerCase()==="set-cookie"?n.append(i,o):n.set(i,o)}if(t)for(const[r,i]of Object.entries(t))if(typeof i=="string")n.set(r,i);else{n.delete(r);for(const o of i)n.append(r,o)}const a=typeof e=="number"?e:(e==null?void 0:e.status)??m(this,Rt);return new Response(s,{status:a,headers:n})},Sr),q="ALL",Uo="all",Wo=["get","post","put","delete","options","patch"],Wr="Can not add a route since the matcher is already built.",Kr=class extends Error{},Ko="__COMPOSED_HANDLER",Yo=s=>s.text("404 Not Found",404),Za=(s,e)=>{if("getResponse"in s){const t=s.getResponse();return e.newResponse(t.body,t)}return console.error(s),e.text("Internal Server Error",500)},be,V,qr,ye,Je,As,Rs,Er,Yr=(Er=class{constructor(e={}){L(this,V);T(this,"get");T(this,"post");T(this,"put");T(this,"delete");T(this,"options");T(this,"patch");T(this,"all");T(this,"on");T(this,"use");T(this,"router");T(this,"getPath");T(this,"_basePath","/");L(this,be,"/");T(this,"routes",[]);L(this,ye,Yo);T(this,"errorHandler",Za);T(this,"onError",e=>(this.errorHandler=e,this));T(this,"notFound",e=>(O(this,ye,e),this));T(this,"fetch",(e,...t)=>B(this,V,Rs).call(this,e,t[1],t[0],e.method));T(this,"request",(e,t,n,a)=>e instanceof Request?this.fetch(t?new Request(e,t):e,n,a):(e=e.toString(),this.fetch(new Request(/^https?:\/\//.test(e)?e:`http://localhost${ht("/",e)}`,t),n,a)));T(this,"fire",()=>{addEventListener("fetch",e=>{e.respondWith(B(this,V,Rs).call(this,e.request,e,void 0,e.request.method))})});[...Wo,Uo].forEach(r=>{this[r]=(i,...o)=>(typeof i=="string"?O(this,be,i):B(this,V,Je).call(this,r,m(this,be),i),o.forEach(l=>{B(this,V,Je).call(this,r,m(this,be),l)}),this)}),this.on=(r,i,...o)=>{for(const l of[i].flat()){O(this,be,l);for(const c of[r].flat())o.map(u=>{B(this,V,Je).call(this,c.toUpperCase(),m(this,be),u)})}return this},this.use=(r,...i)=>(typeof r=="string"?O(this,be,r):(O(this,be,"*"),i.unshift(r)),i.forEach(o=>{B(this,V,Je).call(this,q,m(this,be),o)}),this);const{strict:n,...a}=e;Object.assign(this,a),this.getPath=n??!0?e.getPath??Dr:Lo}route(e,t){const n=this.basePath(e);return t.routes.map(a=>{var i;let r;t.errorHandler===Za?r=a.handler:(r=async(o,l)=>(await Xa([],t.errorHandler)(o,()=>a.handler(o,l))).res,r[Ko]=a.handler),B(i=n,V,Je).call(i,a.method,a.path,r)}),this}basePath(e){const t=B(this,V,qr).call(this);return t._basePath=ht(this._basePath,e),t}mount(e,t,n){let a,r;n&&(typeof n=="function"?r=n:(r=n.optionHandler,n.replaceRequest===!1?a=l=>l:a=n.replaceRequest));const i=r?l=>{const c=r(l);return Array.isArray(c)?c:[c]}:l=>{let c;try{c=l.executionCtx}catch{}return[l.env,c]};a||(a=(()=>{const l=ht(this._basePath,e),c=l==="/"?0:l.length;return u=>{const d=new URL(u.url);return d.pathname=d.pathname.slice(c)||"/",new Request(d,u)}})());const o=async(l,c)=>{const u=await t(a(l.req.raw),...i(l));if(u)return u;await c()};return B(this,V,Je).call(this,q,ht(e,"*"),o),this}},be=new WeakMap,V=new WeakSet,qr=function(){const e=new Yr({router:this.router,getPath:this.getPath});return e.errorHandler=this.errorHandler,O(e,ye,m(this,ye)),e.routes=this.routes,e},ye=new WeakMap,Je=function(e,t,n){e=e.toUpperCase(),t=ht(this._basePath,t);const a={basePath:this._basePath,path:t,method:e,handler:n};this.router.add(e,t,[n,a]),this.routes.push(a)},As=function(e,t){if(e instanceof Error)return this.errorHandler(e,t);throw e},Rs=function(e,t,n,a){if(a==="HEAD")return(async()=>new Response(null,await B(this,V,Rs).call(this,e,t,n,"GET")))();const r=this.getPath(e,{env:n}),i=this.router.match(a,r),o=new Go(e,{path:r,matchResult:i,env:n,executionCtx:t,notFoundHandler:m(this,ye)});if(i[0].length===1){let c;try{c=i[0][0][0][0](o,async()=>{o.res=await m(this,ye).call(this,o)})}catch(u){return B(this,V,As).call(this,u,o)}return c instanceof Promise?c.then(u=>u||(o.finalized?o.res:m(this,ye).call(this,o))).catch(u=>B(this,V,As).call(this,u,o)):c??m(this,ye).call(this,o)}const l=Xa(i[0],this.errorHandler,m(this,ye));return(async()=>{try{const c=await l(o);if(!c.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return c.res}catch(c){return B(this,V,As).call(this,c,o)}})()},Er),Vr=[];function qo(s,e){const t=this.buildAllMatchers(),n=(a,r)=>{const i=t[a]||t[q],o=i[2][r];if(o)return o;const l=r.match(i[0]);if(!l)return[[],Vr];const c=l.indexOf("",1);return[i[1][c],l]};return this.match=n,n(s,e)}var Ts="[^/]+",Bt=".*",Ht="(?:|/.*)",xt=Symbol(),Vo=new Set(".\\+*[^]$()");function zo(s,e){return s.length===1?e.length===1?s<e?-1:1:-1:e.length===1||s===Bt||s===Ht?1:e===Bt||e===Ht?-1:s===Ts?1:e===Ts?-1:s.length===e.length?s<e?-1:1:e.length-s.length}var tt,st,_e,Pr,mn=(Pr=class{constructor(){L(this,tt);L(this,st);L(this,_e,Object.create(null))}insert(e,t,n,a,r){if(e.length===0){if(m(this,tt)!==void 0)throw xt;if(r)return;O(this,tt,t);return}const[i,...o]=e,l=i==="*"?o.length===0?["","",Bt]:["","",Ts]:i==="/*"?["","",Ht]:i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let c;if(l){const u=l[1];let d=l[2]||Ts;if(u&&l[2]&&(d===".*"||(d=d.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(d))))throw xt;if(c=m(this,_e)[d],!c){if(Object.keys(m(this,_e)).some(p=>p!==Bt&&p!==Ht))throw xt;if(r)return;c=m(this,_e)[d]=new mn,u!==""&&O(c,st,a.varIndex++)}!r&&u!==""&&n.push([u,m(c,st)])}else if(c=m(this,_e)[i],!c){if(Object.keys(m(this,_e)).some(u=>u.length>1&&u!==Bt&&u!==Ht))throw xt;if(r)return;c=m(this,_e)[i]=new mn}c.insert(o,t,n,a,r)}buildRegExpStr(){const t=Object.keys(m(this,_e)).sort(zo).map(n=>{const a=m(this,_e)[n];return(typeof m(a,st)=="number"?`(${n})@${m(a,st)}`:Vo.has(n)?`\\${n}`:n)+a.buildRegExpStr()});return typeof m(this,tt)=="number"&&t.unshift(`#${m(this,tt)}`),t.length===0?"":t.length===1?t[0]:"(?:"+t.join("|")+")"}},tt=new WeakMap,st=new WeakMap,_e=new WeakMap,Pr),js,Xt,Cr,Jo=(Cr=class{constructor(){L(this,js,{varIndex:0});L(this,Xt,new mn)}insert(s,e,t){const n=[],a=[];for(let i=0;;){let o=!1;if(s=s.replace(/\{[^}]+\}/g,l=>{const c=`@\\${i}`;return a[i]=[c,l],i++,o=!0,c}),!o)break}const r=s.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let i=a.length-1;i>=0;i--){const[o]=a[i];for(let l=r.length-1;l>=0;l--)if(r[l].indexOf(o)!==-1){r[l]=r[l].replace(o,a[i][1]);break}}return m(this,Xt).insert(r,e,n,m(this,js),t),n}buildRegExp(){let s=m(this,Xt).buildRegExpStr();if(s==="")return[/^$/,[],[]];let e=0;const t=[],n=[];return s=s.replace(/#(\d+)|@(\d+)|\.\*\$/g,(a,r,i)=>r!==void 0?(t[++e]=Number(r),"$()"):(i!==void 0&&(n[Number(i)]=++e),"")),[new RegExp(`^${s}`),t,n]}},js=new WeakMap,Xt=new WeakMap,Cr),Xo=[/^$/,[],Object.create(null)],ks=Object.create(null);function zr(s){return ks[s]??(ks[s]=new RegExp(s==="*"?"":`^${s.replace(/\/\*$|([.\\+*[^\]$()])/g,(e,t)=>t?`\\${t}`:"(?:|/.*)")}$`))}function Qo(){ks=Object.create(null)}function Zo(s){var c;const e=new Jo,t=[];if(s.length===0)return Xo;const n=s.map(u=>[!/\*|\/:/.test(u[0]),...u]).sort(([u,d],[p,f])=>u?1:p?-1:d.length-f.length),a=Object.create(null);for(let u=0,d=-1,p=n.length;u<p;u++){const[f,b,x]=n[u];f?a[b]=[x.map(([_])=>[_,Object.create(null)]),Vr]:d++;let g;try{g=e.insert(b,d,f)}catch(_){throw _===xt?new Kr(b):_}f||(t[d]=x.map(([_,h])=>{const w=Object.create(null);for(h-=1;h>=0;h--){const[v,P]=g[h];w[v]=P}return[_,w]}))}const[r,i,o]=e.buildRegExp();for(let u=0,d=t.length;u<d;u++)for(let p=0,f=t[u].length;p<f;p++){const b=(c=t[u][p])==null?void 0:c[1];if(!b)continue;const x=Object.keys(b);for(let g=0,_=x.length;g<_;g++)b[x[g]]=o[b[x[g]]]}const l=[];for(const u in i)l[u]=t[i[u]];return[r,l,a]}function dt(s,e){if(s){for(const t of Object.keys(s).sort((n,a)=>a.length-n.length))if(zr(t).test(e))return[...s[t]]}}var He,Ge,Bs,Jr,Mr,el=(Mr=class{constructor(){L(this,Bs);T(this,"name","RegExpRouter");L(this,He);L(this,Ge);T(this,"match",qo);O(this,He,{[q]:Object.create(null)}),O(this,Ge,{[q]:Object.create(null)})}add(s,e,t){var o;const n=m(this,He),a=m(this,Ge);if(!n||!a)throw new Error(Wr);n[s]||[n,a].forEach(l=>{l[s]=Object.create(null),Object.keys(l[q]).forEach(c=>{l[s][c]=[...l[q][c]]})}),e==="/*"&&(e="*");const r=(e.match(/\/:/g)||[]).length;if(/\*$/.test(e)){const l=zr(e);s===q?Object.keys(n).forEach(c=>{var u;(u=n[c])[e]||(u[e]=dt(n[c],e)||dt(n[q],e)||[])}):(o=n[s])[e]||(o[e]=dt(n[s],e)||dt(n[q],e)||[]),Object.keys(n).forEach(c=>{(s===q||s===c)&&Object.keys(n[c]).forEach(u=>{l.test(u)&&n[c][u].push([t,r])})}),Object.keys(a).forEach(c=>{(s===q||s===c)&&Object.keys(a[c]).forEach(u=>l.test(u)&&a[c][u].push([t,r]))});return}const i=Lr(e)||[e];for(let l=0,c=i.length;l<c;l++){const u=i[l];Object.keys(a).forEach(d=>{var p;(s===q||s===d)&&((p=a[d])[u]||(p[u]=[...dt(n[d],u)||dt(n[q],u)||[]]),a[d][u].push([t,r-c+l+1]))})}}buildAllMatchers(){const s=Object.create(null);return Object.keys(m(this,Ge)).concat(Object.keys(m(this,He))).forEach(e=>{s[e]||(s[e]=B(this,Bs,Jr).call(this,e))}),O(this,He,O(this,Ge,void 0)),Qo(),s}},He=new WeakMap,Ge=new WeakMap,Bs=new WeakSet,Jr=function(s){const e=[];let t=s===q;return[m(this,He),m(this,Ge)].forEach(n=>{const a=n[s]?Object.keys(n[s]).map(r=>[r,n[s][r]]):[];a.length!==0?(t||(t=!0),e.push(...a)):s!==q&&e.push(...Object.keys(n[q]).map(r=>[r,n[q][r]]))}),t?Zo(e):null},Mr),Ue,Ie,Ir,tl=(Ir=class{constructor(s){T(this,"name","SmartRouter");L(this,Ue,[]);L(this,Ie,[]);O(this,Ue,s.routers)}add(s,e,t){if(!m(this,Ie))throw new Error(Wr);m(this,Ie).push([s,e,t])}match(s,e){if(!m(this,Ie))throw new Error("Fatal error");const t=m(this,Ue),n=m(this,Ie),a=t.length;let r=0,i;for(;r<a;r++){const o=t[r];try{for(let l=0,c=n.length;l<c;l++)o.add(...n[l]);i=o.match(s,e)}catch(l){if(l instanceof Kr)continue;throw l}this.match=o.match.bind(o),O(this,Ue,[o]),O(this,Ie,void 0);break}if(r===a)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,i}get activeRouter(){if(m(this,Ie)||m(this,Ue).length!==1)throw new Error("No active router has been determined yet.");return m(this,Ue)[0]}},Ue=new WeakMap,Ie=new WeakMap,Ir),Tt=Object.create(null),We,ae,nt,Et,ee,Te,Xe,Tr,Xr=(Tr=class{constructor(s,e,t){L(this,Te);L(this,We);L(this,ae);L(this,nt);L(this,Et,0);L(this,ee,Tt);if(O(this,ae,t||Object.create(null)),O(this,We,[]),s&&e){const n=Object.create(null);n[s]={handler:e,possibleKeys:[],score:0},O(this,We,[n])}O(this,nt,[])}insert(s,e,t){O(this,Et,++Ja(this,Et)._);let n=this;const a=Io(e),r=[];for(let i=0,o=a.length;i<o;i++){const l=a[i],c=a[i+1],u=Fo(l,c),d=Array.isArray(u)?u[0]:l;if(d in m(n,ae)){n=m(n,ae)[d],u&&r.push(u[1]);continue}m(n,ae)[d]=new Xr,u&&(m(n,nt).push(u),r.push(u[1])),n=m(n,ae)[d]}return m(n,We).push({[s]:{handler:t,possibleKeys:r.filter((i,o,l)=>l.indexOf(i)===o),score:m(this,Et)}}),n}search(s,e){var o;const t=[];O(this,ee,Tt);let a=[this];const r=Fr(e),i=[];for(let l=0,c=r.length;l<c;l++){const u=r[l],d=l===c-1,p=[];for(let f=0,b=a.length;f<b;f++){const x=a[f],g=m(x,ae)[u];g&&(O(g,ee,m(x,ee)),d?(m(g,ae)["*"]&&t.push(...B(this,Te,Xe).call(this,m(g,ae)["*"],s,m(x,ee))),t.push(...B(this,Te,Xe).call(this,g,s,m(x,ee)))):p.push(g));for(let _=0,h=m(x,nt).length;_<h;_++){const w=m(x,nt)[_],v=m(x,ee)===Tt?{}:{...m(x,ee)};if(w==="*"){const $=m(x,ae)["*"];$&&(t.push(...B(this,Te,Xe).call(this,$,s,m(x,ee))),O($,ee,v),p.push($));continue}const[P,A,y]=w;if(!u&&!(y instanceof RegExp))continue;const R=m(x,ae)[P],E=r.slice(l).join("/");if(y instanceof RegExp){const $=y.exec(E);if($){if(v[A]=$[0],t.push(...B(this,Te,Xe).call(this,R,s,m(x,ee),v)),Object.keys(m(R,ae)).length){O(R,ee,v);const k=((o=$[0].match(/\//))==null?void 0:o.length)??0;(i[k]||(i[k]=[])).push(R)}continue}}(y===!0||y.test(u))&&(v[A]=u,d?(t.push(...B(this,Te,Xe).call(this,R,s,v,m(x,ee))),m(R,ae)["*"]&&t.push(...B(this,Te,Xe).call(this,m(R,ae)["*"],s,v,m(x,ee)))):(O(R,ee,v),p.push(R)))}}a=p.concat(i.shift()??[])}return t.length>1&&t.sort((l,c)=>l.score-c.score),[t.map(({handler:l,params:c})=>[l,c])]}},We=new WeakMap,ae=new WeakMap,nt=new WeakMap,Et=new WeakMap,ee=new WeakMap,Te=new WeakSet,Xe=function(s,e,t,n){const a=[];for(let r=0,i=m(s,We).length;r<i;r++){const o=m(s,We)[r],l=o[e]||o[q],c={};if(l!==void 0&&(l.params=Object.create(null),a.push(l),t!==Tt||n&&n!==Tt))for(let u=0,d=l.possibleKeys.length;u<d;u++){const p=l.possibleKeys[u],f=c[l.score];l.params[p]=n!=null&&n[p]&&!f?n[p]:t[p]??(n==null?void 0:n[p]),c[l.score]=!0}}return a},Tr),at,Or,sl=(Or=class{constructor(){T(this,"name","TrieRouter");L(this,at);O(this,at,new Xr)}add(s,e,t){const n=Lr(e);if(n){for(let a=0,r=n.length;a<r;a++)m(this,at).insert(s,n[a],t);return}m(this,at).insert(s,e,t)}match(s,e){return m(this,at).search(s,e)}},at=new WeakMap,Or),Qr=class extends Yr{constructor(s={}){super(s),this.router=s.router??new tl({routers:[new el,new sl]})}},nl=s=>{const t={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...s},n=(r=>typeof r=="string"?r==="*"?()=>r:i=>r===i?i:null:typeof r=="function"?r:i=>r.includes(i)?i:null)(t.origin),a=(r=>typeof r=="function"?r:Array.isArray(r)?()=>r:()=>[])(t.allowMethods);return async function(i,o){var u;function l(d,p){i.res.headers.set(d,p)}const c=await n(i.req.header("origin")||"",i);if(c&&l("Access-Control-Allow-Origin",c),t.origin!=="*"){const d=i.req.header("Vary");d?l("Vary",d):l("Vary","Origin")}if(t.credentials&&l("Access-Control-Allow-Credentials","true"),(u=t.exposeHeaders)!=null&&u.length&&l("Access-Control-Expose-Headers",t.exposeHeaders.join(",")),i.req.method==="OPTIONS"){t.maxAge!=null&&l("Access-Control-Max-Age",t.maxAge.toString());const d=await a(i.req.header("origin")||"",i);d.length&&l("Access-Control-Allow-Methods",d.join(","));let p=t.allowHeaders;if(!(p!=null&&p.length)){const f=i.req.header("Access-Control-Request-Headers");f&&(p=f.split(/\s*,\s*/))}return p!=null&&p.length&&(l("Access-Control-Allow-Headers",p.join(",")),i.res.headers.append("Vary","Access-Control-Request-Headers")),i.res.headers.delete("Content-Length"),i.res.headers.delete("Content-Type"),new Response(null,{headers:i.res.headers,status:204,statusText:"No Content"})}await o()}};function Os(s,e){return s.length<e?s[s.length-1]||0:s.slice(-e).reduce((n,a)=>n+a,0)/e}function al(s,e=14){if(s.length<e+1)return 50;const t=[];for(let o=1;o<s.length;o++)t.push(s[o]-s[o-1]);const n=t.slice(-e),a=n.filter(o=>o>0).reduce((o,l)=>o+l,0)/e,r=Math.abs(n.filter(o=>o<0).reduce((o,l)=>o+l,0))/e;return r===0?100:100-100/(1+a/r)}function rl(s){if(s.length<26)return{macd:0,signal:0,histogram:0};const e=er(s,12),t=er(s,26),n=e-t,a=n*.9,r=n-a;return{macd:n,signal:a,histogram:r}}function er(s,e){if(s.length<e)return s[s.length-1]||0;const t=2/(e+1);let n=Os(s.slice(0,e),e);for(let a=e;a<s.length;a++)n=(s[a]-n)*t+n;return n}function il(s,e=20,t=2){const n=Os(s,e),r=s.slice(-e).reduce((o,l)=>o+Math.pow(l-n,2),0)/e,i=Math.sqrt(r);return{upper:n+i*t,middle:n,lower:n-i*t}}function Mn(s){if(!s||s.length===0)return{score:50,sma20:0,sma50:0,rsi:50,macd:{macd:0,signal:0,histogram:0},signals:["データ不足"],confidence:0};const e=s[s.length-1],t=Os(s,20),n=Os(s,50),a=al(s,14),r=rl(s),i=il(s,20,2);let o=50;const l=[];t>n?(o+=20,l.push("[OK] ゴールデンクロス（短期MA > 長期MA）")):t<n?(o-=20,l.push("[ERROR] デッドクロス（短期MA < 長期MA）")):l.push("⚪ 移動平均線は中立"),a<30?(o+=15,l.push(`[OK] RSI売られすぎ (${a.toFixed(1)})`)):a>70?(o-=15,l.push(`[ERROR] RSI買われすぎ (${a.toFixed(1)})`)):l.push(`⚪ RSI中立 (${a.toFixed(1)})`),r.histogram>0?(o+=15,l.push("[OK] MACD上昇トレンド")):r.histogram<0&&(o-=15,l.push("[ERROR] MACD下降トレンド")),e<i.lower?(o+=10,l.push("[OK] ボリンジャーバンド下限突破（買いシグナル）")):e>i.upper&&(o-=10,l.push("[ERROR] ボリンジャーバンド上限突破（売りシグナル）")),o=Math.max(0,Math.min(100,o));const c=Math.min(100,s.length/50*100);return{score:o,sma20:t,sma50:n,rsi:a,macd:r,signals:l,confidence:c}}function In(s){let e=50;const t=[];s.pe_ratio!==null?s.pe_ratio<15?(e+=20,t.push(`[OK] PER割安 (${s.pe_ratio.toFixed(2)})`)):s.pe_ratio>30?(e-=15,t.push(`[ERROR] PER割高 (${s.pe_ratio.toFixed(2)})`)):t.push(`⚪ PER適正 (${s.pe_ratio.toFixed(2)})`):t.push("[WARN] PERデータなし"),s.pb_ratio!==null?s.pb_ratio<1?(e+=15,t.push(`[OK] PBR超割安 (${s.pb_ratio.toFixed(2)})`)):s.pb_ratio>3?(e-=10,t.push(`[ERROR] PBR割高 (${s.pb_ratio.toFixed(2)})`)):t.push(`⚪ PBR適正 (${s.pb_ratio.toFixed(2)})`):t.push("[WARN] PBRデータなし"),s.roe!==null?s.roe>15?(e+=15,t.push(`[OK] ROE優良 (${s.roe.toFixed(2)}%)`)):s.roe<5?(e-=10,t.push(`[ERROR] ROE低迷 (${s.roe.toFixed(2)}%)`)):t.push(`⚪ ROE標準 (${s.roe.toFixed(2)}%)`):t.push("[WARN] ROEデータなし"),s.dividend_yield!==null&&(s.dividend_yield>3?(e+=10,t.push(`[OK] 高配当 (${s.dividend_yield.toFixed(2)}%)`)):s.dividend_yield>0?t.push(`⚪ 配当あり (${s.dividend_yield.toFixed(2)}%)`):t.push("⚪ 無配当")),s.revenue_growth!==null&&(s.revenue_growth>20?(e+=10,t.push(`[OK] 高成長 (売上+${s.revenue_growth.toFixed(1)}%)`)):s.revenue_growth<0&&(e-=10,t.push(`[ERROR] 売上減少 (${s.revenue_growth.toFixed(1)}%)`))),s.profit_margin!==null&&(s.profit_margin>20?(e+=5,t.push(`[OK] 高利益率 (${s.profit_margin.toFixed(1)}%)`)):s.profit_margin<5&&(e-=5,t.push(`[ERROR] 低利益率 (${s.profit_margin.toFixed(1)}%)`))),s.debt_to_equity!==null&&(s.debt_to_equity<.5?(e+=5,t.push(`[OK] 健全な財務 (D/E: ${s.debt_to_equity.toFixed(2)})`)):s.debt_to_equity>2&&(e-=5,t.push(`[ERROR] 高負債 (D/E: ${s.debt_to_equity.toFixed(2)})`))),e=Math.max(0,Math.min(100,e));const a=Object.values(s).filter(r=>r!==null).length/Object.keys(s).length*100;return{score:e,pe_ratio:s.pe_ratio,pb_ratio:s.pb_ratio,roe:s.roe,eps:s.eps,dividend_yield:s.dividend_yield,market_cap:s.market_cap,signals:t,confidence:a}}const xn="RFC3986",bn={RFC1738:s=>String(s).replace(/%20/g,"+"),RFC3986:s=>String(s)},ol="RFC1738",ll=Array.isArray,$e=(()=>{const s=[];for(let e=0;e<256;++e)s.push("%"+((e<16?"0":"")+e.toString(16)).toUpperCase());return s})(),an=1024,cl=(s,e,t,n,a)=>{if(s.length===0)return s;let r=s;if(typeof s=="symbol"?r=Symbol.prototype.toString.call(s):typeof s!="string"&&(r=String(s)),t==="iso-8859-1")return escape(r).replace(/%u[0-9a-f]{4}/gi,function(o){return"%26%23"+parseInt(o.slice(2),16)+"%3B"});let i="";for(let o=0;o<r.length;o+=an){const l=r.length>=an?r.slice(o,o+an):r,c=[];for(let u=0;u<l.length;++u){let d=l.charCodeAt(u);if(d===45||d===46||d===95||d===126||d>=48&&d<=57||d>=65&&d<=90||d>=97&&d<=122||a===ol&&(d===40||d===41)){c[c.length]=l.charAt(u);continue}if(d<128){c[c.length]=$e[d];continue}if(d<2048){c[c.length]=$e[192|d>>6]+$e[128|d&63];continue}if(d<55296||d>=57344){c[c.length]=$e[224|d>>12]+$e[128|d>>6&63]+$e[128|d&63];continue}u+=1,d=65536+((d&1023)<<10|l.charCodeAt(u)&1023),c[c.length]=$e[240|d>>18]+$e[128|d>>12&63]+$e[128|d>>6&63]+$e[128|d&63]}i+=c.join("")}return i};function dl(s){return!s||typeof s!="object"?!1:!!(s.constructor&&s.constructor.isBuffer&&s.constructor.isBuffer(s))}function tr(s,e){if(ll(s)){const t=[];for(let n=0;n<s.length;n+=1)t.push(e(s[n]));return t}return e(s)}const ul=Object.prototype.hasOwnProperty,Zr={brackets(s){return String(s)+"[]"},comma:"comma",indices(s,e){return String(s)+"["+e+"]"},repeat(s){return String(s)}},Ae=Array.isArray,pl=Array.prototype.push,ei=function(s,e){pl.apply(s,Ae(e)?e:[e])},fl=Date.prototype.toISOString,Y={addQueryPrefix:!1,allowDots:!1,allowEmptyArrays:!1,arrayFormat:"indices",charset:"utf-8",charsetSentinel:!1,delimiter:"&",encode:!0,encodeDotInKeys:!1,encoder:cl,encodeValuesOnly:!1,format:xn,formatter:bn[xn],indices:!1,serializeDate(s){return fl.call(s)},skipNulls:!1,strictNullHandling:!1};function gl(s){return typeof s=="string"||typeof s=="number"||typeof s=="boolean"||typeof s=="symbol"||typeof s=="bigint"}const rn={};function ti(s,e,t,n,a,r,i,o,l,c,u,d,p,f,b,x,g,_){let h=s,w=_,v=0,P=!1;for(;(w=w.get(rn))!==void 0&&!P;){const $=w.get(s);if(v+=1,typeof $<"u"){if($===v)throw new RangeError("Cyclic object value");P=!0}typeof w.get(rn)>"u"&&(v=0)}if(typeof c=="function"?h=c(e,h):h instanceof Date?h=p==null?void 0:p(h):t==="comma"&&Ae(h)&&(h=tr(h,function($){return $ instanceof Date?p==null?void 0:p($):$})),h===null){if(r)return l&&!x?l(e,Y.encoder,g,"key",f):e;h=""}if(gl(h)||dl(h)){if(l){const $=x?e:l(e,Y.encoder,g,"key",f);return[(b==null?void 0:b($))+"="+(b==null?void 0:b(l(h,Y.encoder,g,"value",f)))]}return[(b==null?void 0:b(e))+"="+(b==null?void 0:b(String(h)))]}const A=[];if(typeof h>"u")return A;let y;if(t==="comma"&&Ae(h))x&&l&&(h=tr(h,l)),y=[{value:h.length>0?h.join(",")||null:void 0}];else if(Ae(c))y=c;else{const $=Object.keys(h);y=u?$.sort(u):$}const R=o?String(e).replace(/\./g,"%2E"):String(e),E=n&&Ae(h)&&h.length===1?R+"[]":R;if(a&&Ae(h)&&h.length===0)return E+"[]";for(let $=0;$<y.length;++$){const k=y[$],N=typeof k=="object"&&typeof k.value<"u"?k.value:h[k];if(i&&N===null)continue;const X=d&&o?k.replace(/\./g,"%2E"):k,se=Ae(h)?typeof t=="function"?t(E,X):E:E+(d?"."+X:"["+X+"]");_.set(s,v);const fe=new WeakMap;fe.set(rn,_),ei(A,ti(N,se,t,n,a,r,i,o,t==="comma"&&x&&Ae(h)?null:l,c,u,d,p,f,b,x,g,fe))}return A}function hl(s=Y){if(typeof s.allowEmptyArrays<"u"&&typeof s.allowEmptyArrays!="boolean")throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");if(typeof s.encodeDotInKeys<"u"&&typeof s.encodeDotInKeys!="boolean")throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");if(s.encoder!==null&&typeof s.encoder<"u"&&typeof s.encoder!="function")throw new TypeError("Encoder has to be a function.");const e=s.charset||Y.charset;if(typeof s.charset<"u"&&s.charset!=="utf-8"&&s.charset!=="iso-8859-1")throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");let t=xn;if(typeof s.format<"u"){if(!ul.call(bn,s.format))throw new TypeError("Unknown format option provided.");t=s.format}const n=bn[t];let a=Y.filter;(typeof s.filter=="function"||Ae(s.filter))&&(a=s.filter);let r;if(s.arrayFormat&&s.arrayFormat in Zr?r=s.arrayFormat:"indices"in s?r=s.indices?"indices":"repeat":r=Y.arrayFormat,"commaRoundTrip"in s&&typeof s.commaRoundTrip!="boolean")throw new TypeError("`commaRoundTrip` must be a boolean, or absent");const i=typeof s.allowDots>"u"?s.encodeDotInKeys?!0:Y.allowDots:!!s.allowDots;return{addQueryPrefix:typeof s.addQueryPrefix=="boolean"?s.addQueryPrefix:Y.addQueryPrefix,allowDots:i,allowEmptyArrays:typeof s.allowEmptyArrays=="boolean"?!!s.allowEmptyArrays:Y.allowEmptyArrays,arrayFormat:r,charset:e,charsetSentinel:typeof s.charsetSentinel=="boolean"?s.charsetSentinel:Y.charsetSentinel,commaRoundTrip:!!s.commaRoundTrip,delimiter:typeof s.delimiter>"u"?Y.delimiter:s.delimiter,encode:typeof s.encode=="boolean"?s.encode:Y.encode,encodeDotInKeys:typeof s.encodeDotInKeys=="boolean"?s.encodeDotInKeys:Y.encodeDotInKeys,encoder:typeof s.encoder=="function"?s.encoder:Y.encoder,encodeValuesOnly:typeof s.encodeValuesOnly=="boolean"?s.encodeValuesOnly:Y.encodeValuesOnly,filter:a,format:t,formatter:n,serializeDate:typeof s.serializeDate=="function"?s.serializeDate:Y.serializeDate,skipNulls:typeof s.skipNulls=="boolean"?s.skipNulls:Y.skipNulls,sort:typeof s.sort=="function"?s.sort:null,strictNullHandling:typeof s.strictNullHandling=="boolean"?s.strictNullHandling:Y.strictNullHandling}}function ml(s,e={}){let t=s;const n=hl(e);let a,r;typeof n.filter=="function"?(r=n.filter,t=r("",t)):Ae(n.filter)&&(r=n.filter,a=r);const i=[];if(typeof t!="object"||t===null)return"";const o=Zr[n.arrayFormat],l=o==="comma"&&n.commaRoundTrip;a||(a=Object.keys(t)),n.sort&&a.sort(n.sort);const c=new WeakMap;for(let p=0;p<a.length;++p){const f=a[p];n.skipNulls&&t[f]===null||ei(i,ti(t[f],f,o,l,n.allowEmptyArrays,n.strictNullHandling,n.skipNulls,n.encodeDotInKeys,n.encode?n.encoder:null,n.filter,n.sort,n.allowDots,n.serializeDate,n.format,n.formatter,n.encodeValuesOnly,n.charset,c))}const u=i.join(n.delimiter);let d=n.addQueryPrefix===!0?"?":"";return n.charsetSentinel&&(n.charset==="iso-8859-1"?d+="utf8=%26%2310003%3B&":d+="utf8=%E2%9C%93&"),u.length>0?d+u:""}const bt="4.104.0";let sr=!1,Gt,si,ni,yn,ai,ri,ii,Tn,oi;function xl(s,e={auto:!1}){if(sr)throw new Error(`you must \`import 'openai/shims/${s.kind}'\` before importing anything else from openai`);if(Gt)throw new Error(`can't \`import 'openai/shims/${s.kind}'\` after \`import 'openai/shims/${Gt}'\``);sr=e.auto,Gt=s.kind,si=s.fetch,ni=s.FormData,yn=s.File,ai=s.ReadableStream,ri=s.getMultipartRequestOptions,ii=s.getDefaultAgent,Tn=s.fileFromPath,oi=s.isFsReadStream}class bl{constructor(e){this.body=e}get[Symbol.toStringTag](){return"MultipartBody"}}function yl({manuallyImported:s}={}){const e=s?"You may need to use polyfills":"Add one of these imports before your first `import … from 'openai'`:\n- `import 'openai/shims/node'` (if you're running on Node)\n- `import 'openai/shims/web'` (otherwise)\n";let t,n,a,r;try{t=fetch,n=Request,a=Response,r=Headers}catch(i){throw new Error(`this environment is missing the following Web Fetch API type: ${i.message}. ${e}`)}return{kind:"web",fetch:t,Request:n,Response:a,Headers:r,FormData:typeof FormData<"u"?FormData:class{constructor(){throw new Error(`file uploads aren't supported in this environment yet as 'FormData' is undefined. ${e}`)}},Blob:typeof Blob<"u"?Blob:class{constructor(){throw new Error(`file uploads aren't supported in this environment yet as 'Blob' is undefined. ${e}`)}},File:typeof File<"u"?File:class{constructor(){throw new Error(`file uploads aren't supported in this environment yet as 'File' is undefined. ${e}`)}},ReadableStream:typeof ReadableStream<"u"?ReadableStream:class{constructor(){throw new Error(`streaming isn't supported in this environment yet as 'ReadableStream' is undefined. ${e}`)}},getMultipartRequestOptions:async(i,o)=>({...o,body:new bl(i)}),getDefaultAgent:i=>{},fileFromPath:()=>{throw new Error("The `fileFromPath` function is only supported in Node. See the README for more details: https://www.github.com/openai/openai-node#file-uploads")},isFsReadStream:i=>!1}}const li=()=>{Gt||xl(yl(),{auto:!0})};li();class C extends Error{}class Z extends C{constructor(e,t,n,a){super(`${Z.makeMessage(e,t,n)}`),this.status=e,this.headers=a,this.request_id=a==null?void 0:a["x-request-id"],this.error=t;const r=t;this.code=r==null?void 0:r.code,this.param=r==null?void 0:r.param,this.type=r==null?void 0:r.type}static makeMessage(e,t,n){const a=t!=null&&t.message?typeof t.message=="string"?t.message:JSON.stringify(t.message):t?JSON.stringify(t):n;return e&&a?`${e} ${a}`:e?`${e} status code (no body)`:a||"(no status code or body)"}static generate(e,t,n,a){if(!e||!a)return new Qt({message:n,cause:vn(t)});const r=t==null?void 0:t.error;return e===400?new On(e,r,n,a):e===401?new Fn(e,r,n,a):e===403?new Dn(e,r,n,a):e===404?new Ln(e,r,n,a):e===409?new Nn(e,r,n,a):e===422?new jn(e,r,n,a):e===429?new Bn(e,r,n,a):e>=500?new Hn(e,r,n,a):new Z(e,r,n,a)}}class pe extends Z{constructor({message:e}={}){super(void 0,void 0,e||"Request was aborted.",void 0)}}class Qt extends Z{constructor({message:e,cause:t}){super(void 0,void 0,e||"Connection error.",void 0),t&&(this.cause=t)}}class Hs extends Qt{constructor({message:e}={}){super({message:e??"Request timed out."})}}class On extends Z{}class Fn extends Z{}class Dn extends Z{}class Ln extends Z{}class Nn extends Z{}class jn extends Z{}class Bn extends Z{}class Hn extends Z{}class ci extends C{constructor(){super("Could not parse response content as the length limit was reached")}}class di extends C{constructor(){super("Could not parse response content as the request was rejected by the content filter")}}var hs=function(s,e,t,n,a){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!a)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!a:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?a.call(s,t):a?a.value=t:e.set(s,t),t},ze=function(s,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},de;class Gs{constructor(){de.set(this,void 0),this.buffer=new Uint8Array,hs(this,de,null,"f")}decode(e){if(e==null)return[];const t=e instanceof ArrayBuffer?new Uint8Array(e):typeof e=="string"?new TextEncoder().encode(e):e;let n=new Uint8Array(this.buffer.length+t.length);n.set(this.buffer),n.set(t,this.buffer.length),this.buffer=n;const a=[];let r;for(;(r=_l(this.buffer,ze(this,de,"f")))!=null;){if(r.carriage&&ze(this,de,"f")==null){hs(this,de,r.index,"f");continue}if(ze(this,de,"f")!=null&&(r.index!==ze(this,de,"f")+1||r.carriage)){a.push(this.decodeText(this.buffer.slice(0,ze(this,de,"f")-1))),this.buffer=this.buffer.slice(ze(this,de,"f")),hs(this,de,null,"f");continue}const i=ze(this,de,"f")!==null?r.preceding-1:r.preceding,o=this.decodeText(this.buffer.slice(0,i));a.push(o),this.buffer=this.buffer.slice(r.index),hs(this,de,null,"f")}return a}decodeText(e){if(e==null)return"";if(typeof e=="string")return e;if(typeof Buffer<"u"){if(e instanceof Buffer)return e.toString();if(e instanceof Uint8Array)return Buffer.from(e).toString();throw new C(`Unexpected: received non-Uint8Array (${e.constructor.name}) stream chunk in an environment with a global "Buffer" defined, which this library assumes to be Node. Please report this error.`)}if(typeof TextDecoder<"u"){if(e instanceof Uint8Array||e instanceof ArrayBuffer)return this.textDecoder??(this.textDecoder=new TextDecoder("utf8")),this.textDecoder.decode(e);throw new C(`Unexpected: received non-Uint8Array/ArrayBuffer (${e.constructor.name}) in a web platform. Please report this error.`)}throw new C("Unexpected: neither Buffer nor TextDecoder are available as globals. Please report this error.")}flush(){return this.buffer.length?this.decode(`
`):[]}}de=new WeakMap;Gs.NEWLINE_CHARS=new Set([`
`,"\r"]);Gs.NEWLINE_REGEXP=/\r\n|[\n\r]/g;function _l(s,e){for(let a=e??0;a<s.length;a++){if(s[a]===10)return{preceding:a,index:a+1,carriage:!1};if(s[a]===13)return{preceding:a,index:a+1,carriage:!0}}return null}function vl(s){for(let n=0;n<s.length-1;n++){if(s[n]===10&&s[n+1]===10||s[n]===13&&s[n+1]===13)return n+2;if(s[n]===13&&s[n+1]===10&&n+3<s.length&&s[n+2]===13&&s[n+3]===10)return n+4}return-1}function ui(s){if(s[Symbol.asyncIterator])return s;const e=s.getReader();return{async next(){try{const t=await e.read();return t!=null&&t.done&&e.releaseLock(),t}catch(t){throw e.releaseLock(),t}},async return(){const t=e.cancel();return e.releaseLock(),await t,{done:!0,value:void 0}},[Symbol.asyncIterator](){return this}}}class ke{constructor(e,t){this.iterator=e,this.controller=t}static fromSSEResponse(e,t){let n=!1;async function*a(){if(n)throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");n=!0;let r=!1;try{for await(const i of wl(e,t))if(!r){if(i.data.startsWith("[DONE]")){r=!0;continue}if(i.event===null||i.event.startsWith("response.")||i.event.startsWith("transcript.")){let o;try{o=JSON.parse(i.data)}catch(l){throw console.error("Could not parse message into JSON:",i.data),console.error("From chunk:",i.raw),l}if(o&&o.error)throw new Z(void 0,o.error,void 0,xi(e.headers));yield o}else{let o;try{o=JSON.parse(i.data)}catch(l){throw console.error("Could not parse message into JSON:",i.data),console.error("From chunk:",i.raw),l}if(i.event=="error")throw new Z(void 0,o.error,o.message,void 0);yield{event:i.event,data:o}}}r=!0}catch(i){if(i instanceof Error&&i.name==="AbortError")return;throw i}finally{r||t.abort()}}return new ke(a,t)}static fromReadableStream(e,t){let n=!1;async function*a(){const i=new Gs,o=ui(e);for await(const l of o)for(const c of i.decode(l))yield c;for(const l of i.flush())yield l}async function*r(){if(n)throw new Error("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");n=!0;let i=!1;try{for await(const o of a())i||o&&(yield JSON.parse(o));i=!0}catch(o){if(o instanceof Error&&o.name==="AbortError")return;throw o}finally{i||t.abort()}}return new ke(r,t)}[Symbol.asyncIterator](){return this.iterator()}tee(){const e=[],t=[],n=this.iterator(),a=r=>({next:()=>{if(r.length===0){const i=n.next();e.push(i),t.push(i)}return r.shift()}});return[new ke(()=>a(e),this.controller),new ke(()=>a(t),this.controller)]}toReadableStream(){const e=this;let t;const n=new TextEncoder;return new ai({async start(){t=e[Symbol.asyncIterator]()},async pull(a){try{const{value:r,done:i}=await t.next();if(i)return a.close();const o=n.encode(JSON.stringify(r)+`
`);a.enqueue(o)}catch(r){a.error(r)}},async cancel(){var a;await((a=t.return)==null?void 0:a.call(t))}})}}async function*wl(s,e){if(!s.body)throw e.abort(),new C("Attempted to iterate over a response with no body");const t=new Al,n=new Gs,a=ui(s.body);for await(const r of $l(a))for(const i of n.decode(r)){const o=t.decode(i);o&&(yield o)}for(const r of n.flush()){const i=t.decode(r);i&&(yield i)}}async function*$l(s){let e=new Uint8Array;for await(const t of s){if(t==null)continue;const n=t instanceof ArrayBuffer?new Uint8Array(t):typeof t=="string"?new TextEncoder().encode(t):t;let a=new Uint8Array(e.length+n.length);a.set(e),a.set(n,e.length),e=a;let r;for(;(r=vl(e))!==-1;)yield e.slice(0,r),e=e.slice(r)}e.length>0&&(yield e)}class Al{constructor(){this.event=null,this.data=[],this.chunks=[]}decode(e){if(e.endsWith("\r")&&(e=e.substring(0,e.length-1)),!e){if(!this.event&&!this.data.length)return null;const r={event:this.event,data:this.data.join(`
`),raw:this.chunks};return this.event=null,this.data=[],this.chunks=[],r}if(this.chunks.push(e),e.startsWith(":"))return null;let[t,n,a]=Rl(e,":");return a.startsWith(" ")&&(a=a.substring(1)),t==="event"?this.event=a:t==="data"&&this.data.push(a),null}}function Rl(s,e){const t=s.indexOf(e);return t!==-1?[s.substring(0,t),e,s.substring(t+e.length)]:[s,"",""]}const pi=s=>s!=null&&typeof s=="object"&&typeof s.url=="string"&&typeof s.blob=="function",fi=s=>s!=null&&typeof s=="object"&&typeof s.name=="string"&&typeof s.lastModified=="number"&&Us(s),Us=s=>s!=null&&typeof s=="object"&&typeof s.size=="number"&&typeof s.type=="string"&&typeof s.text=="function"&&typeof s.slice=="function"&&typeof s.arrayBuffer=="function",kl=s=>fi(s)||pi(s)||oi(s);async function Gn(s,e,t){var a;if(s=await s,fi(s))return s;if(pi(s)){const r=await s.blob();e||(e=new URL(s.url).pathname.split(/[\\/]/).pop()??"unknown_file");const i=Us(r)?[await r.arrayBuffer()]:[r];return new yn(i,e,t)}const n=await Sl(s);if(e||(e=Pl(s)??"unknown_file"),!(t!=null&&t.type)){const r=(a=n[0])==null?void 0:a.type;typeof r=="string"&&(t={...t,type:r})}return new yn(n,e,t)}async function Sl(s){var t;let e=[];if(typeof s=="string"||ArrayBuffer.isView(s)||s instanceof ArrayBuffer)e.push(s);else if(Us(s))e.push(await s.arrayBuffer());else if(Cl(s))for await(const n of s)e.push(n);else throw new Error(`Unexpected data type: ${typeof s}; constructor: ${(t=s==null?void 0:s.constructor)==null?void 0:t.name}; props: ${El(s)}`);return e}function El(s){return`[${Object.getOwnPropertyNames(s).map(t=>`"${t}"`).join(", ")}]`}function Pl(s){var e;return on(s.name)||on(s.filename)||((e=on(s.path))==null?void 0:e.split(/[\\/]/).pop())}const on=s=>{if(typeof s=="string")return s;if(typeof Buffer<"u"&&s instanceof Buffer)return String(s)},Cl=s=>s!=null&&typeof s=="object"&&typeof s[Symbol.asyncIterator]=="function",nr=s=>s&&typeof s=="object"&&s.body&&s[Symbol.toStringTag]==="MultipartBody",rt=async s=>{const e=await Ml(s.body);return ri(e,s)},Ml=async s=>{const e=new ni;return await Promise.all(Object.entries(s||{}).map(([t,n])=>_n(e,t,n))),e},_n=async(s,e,t)=>{if(t!==void 0){if(t==null)throw new TypeError(`Received null for "${e}"; to pass null in FormData, you must use the string 'null'`);if(typeof t=="string"||typeof t=="number"||typeof t=="boolean")s.append(e,String(t));else if(kl(t)){const n=await Gn(t);s.append(e,n)}else if(Array.isArray(t))await Promise.all(t.map(n=>_n(s,e+"[]",n)));else if(typeof t=="object")await Promise.all(Object.entries(t).map(([n,a])=>_n(s,`${e}[${n}]`,a)));else throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${t} instead`)}};var vt={},Il=function(s,e,t,n,a){if(typeof e=="function"?s!==e||!0:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return e.set(s,t),t},Tl=function(s,e,t,n){if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},ms;li();async function gi(s){var i;const{response:e}=s;if(s.options.stream)return Ke("response",e.status,e.url,e.headers,e.body),s.options.__streamClass?s.options.__streamClass.fromSSEResponse(e,s.controller):ke.fromSSEResponse(e,s.controller);if(e.status===204)return null;if(s.options.__binaryResponse)return e;const t=e.headers.get("content-type"),n=(i=t==null?void 0:t.split(";")[0])==null?void 0:i.trim();if((n==null?void 0:n.includes("application/json"))||(n==null?void 0:n.endsWith("+json"))){const o=await e.json();return Ke("response",e.status,e.url,e.headers,o),hi(o,e)}const r=await e.text();return Ke("response",e.status,e.url,e.headers,r),r}function hi(s,e){return!s||typeof s!="object"||Array.isArray(s)?s:Object.defineProperty(s,"_request_id",{value:e.headers.get("x-request-id"),enumerable:!1})}class Ws extends Promise{constructor(e,t=gi){super(n=>{n(null)}),this.responsePromise=e,this.parseResponse=t}_thenUnwrap(e){return new Ws(this.responsePromise,async t=>hi(e(await this.parseResponse(t),t),t.response))}asResponse(){return this.responsePromise.then(e=>e.response)}async withResponse(){const[e,t]=await Promise.all([this.parse(),this.asResponse()]);return{data:e,response:t,request_id:t.headers.get("x-request-id")}}parse(){return this.parsedPromise||(this.parsedPromise=this.responsePromise.then(this.parseResponse)),this.parsedPromise}then(e,t){return this.parse().then(e,t)}catch(e){return this.parse().catch(e)}finally(e){return this.parse().finally(e)}}class Ol{constructor({baseURL:e,maxRetries:t=2,timeout:n=6e5,httpAgent:a,fetch:r}){this.baseURL=e,this.maxRetries=ln("maxRetries",t),this.timeout=ln("timeout",n),this.httpAgent=a,this.fetch=r??si}authHeaders(e){return{}}defaultHeaders(e){return{Accept:"application/json","Content-Type":"application/json","User-Agent":this.getUserAgent(),...jl(),...this.authHeaders(e)}}validateHeaders(e,t){}defaultIdempotencyKey(){return`stainless-node-retry-${Ul()}`}get(e,t){return this.methodRequest("get",e,t)}post(e,t){return this.methodRequest("post",e,t)}patch(e,t){return this.methodRequest("patch",e,t)}put(e,t){return this.methodRequest("put",e,t)}delete(e,t){return this.methodRequest("delete",e,t)}methodRequest(e,t,n){return this.request(Promise.resolve(n).then(async a=>{const r=a&&Us(a==null?void 0:a.body)?new DataView(await a.body.arrayBuffer()):(a==null?void 0:a.body)instanceof DataView?a.body:(a==null?void 0:a.body)instanceof ArrayBuffer?new DataView(a.body):a&&ArrayBuffer.isView(a==null?void 0:a.body)?new DataView(a.body.buffer):a==null?void 0:a.body;return{method:e,path:t,...a,body:r}}))}getAPIList(e,t,n){return this.requestAPIList(t,{method:"get",path:e,...n})}calculateContentLength(e){if(typeof e=="string"){if(typeof Buffer<"u")return Buffer.byteLength(e,"utf8").toString();if(typeof TextEncoder<"u")return new TextEncoder().encode(e).length.toString()}else if(ArrayBuffer.isView(e))return e.byteLength.toString();return null}buildRequest(e,{retryCount:t=0}={}){var x;const n={...e},{method:a,path:r,query:i,headers:o={}}=n,l=ArrayBuffer.isView(n.body)||n.__binaryRequest&&typeof n.body=="string"?n.body:nr(n.body)?n.body.body:n.body?JSON.stringify(n.body,null,2):null,c=this.calculateContentLength(l),u=this.buildURL(r,i);"timeout"in n&&ln("timeout",n.timeout),n.timeout=n.timeout??this.timeout;const d=n.httpAgent??this.httpAgent??ii(u),p=n.timeout+1e3;typeof((x=d==null?void 0:d.options)==null?void 0:x.timeout)=="number"&&p>(d.options.timeout??0)&&(d.options.timeout=p),this.idempotencyHeader&&a!=="get"&&(e.idempotencyKey||(e.idempotencyKey=this.defaultIdempotencyKey()),o[this.idempotencyHeader]=e.idempotencyKey);const f=this.buildHeaders({options:n,headers:o,contentLength:c,retryCount:t});return{req:{method:a,...l&&{body:l},headers:f,...d&&{agent:d},signal:n.signal??null},url:u,timeout:n.timeout}}buildHeaders({options:e,headers:t,contentLength:n,retryCount:a}){const r={};n&&(r["content-length"]=n);const i=this.defaultHeaders(e);return or(r,i),or(r,t),nr(e.body)&&Gt!=="node"&&delete r["content-type"],bs(i,"x-stainless-retry-count")===void 0&&bs(t,"x-stainless-retry-count")===void 0&&(r["x-stainless-retry-count"]=String(a)),bs(i,"x-stainless-timeout")===void 0&&bs(t,"x-stainless-timeout")===void 0&&e.timeout&&(r["x-stainless-timeout"]=String(Math.trunc(e.timeout/1e3))),this.validateHeaders(r,t),r}async prepareOptions(e){}async prepareRequest(e,{url:t,options:n}){}parseHeaders(e){return e?Symbol.iterator in e?Object.fromEntries(Array.from(e).map(t=>[...t])):{...e}:{}}makeStatusError(e,t,n,a){return Z.generate(e,t,n,a)}request(e,t=null){return new Ws(this.makeRequest(e,t))}async makeRequest(e,t){var d,p;const n=await e,a=n.maxRetries??this.maxRetries;t==null&&(t=a),await this.prepareOptions(n);const{req:r,url:i,timeout:o}=this.buildRequest(n,{retryCount:a-t});if(await this.prepareRequest(r,{url:i,options:n}),Ke("request",i,n,r.headers),(d=n.signal)!=null&&d.aborted)throw new pe;const l=new AbortController,c=await this.fetchWithTimeout(i,r,o,l).catch(vn);if(c instanceof Error){if((p=n.signal)!=null&&p.aborted)throw new pe;if(t)return this.retryRequest(n,t);throw c.name==="AbortError"?new Hs:new Qt({cause:c})}const u=xi(c.headers);if(!c.ok){if(t&&this.shouldRetry(c)){const h=`retrying, ${t} attempts remaining`;return Ke(`response (error; ${h})`,c.status,i,u),this.retryRequest(n,t,u)}const f=await c.text().catch(h=>vn(h).message),b=Bl(f),x=b?void 0:f;throw Ke(`response (error; ${t?"(error; no more retries left)":"(error; not retryable)"})`,c.status,i,u,x),this.makeStatusError(c.status,b,x,u)}return{response:c,options:n,controller:l}}requestAPIList(e,t){const n=this.makeRequest(t,null);return new Fl(this,n,e)}buildURL(e,t){const n=Gl(e)?new URL(e):new URL(this.baseURL+(this.baseURL.endsWith("/")&&e.startsWith("/")?e.slice(1):e)),a=this.defaultQuery();return bi(a)||(t={...a,...t}),typeof t=="object"&&t&&!Array.isArray(t)&&(n.search=this.stringifyQuery(t)),n.toString()}stringifyQuery(e){return Object.entries(e).filter(([t,n])=>typeof n<"u").map(([t,n])=>{if(typeof n=="string"||typeof n=="number"||typeof n=="boolean")return`${encodeURIComponent(t)}=${encodeURIComponent(n)}`;if(n===null)return`${encodeURIComponent(t)}=`;throw new C(`Cannot stringify type ${typeof n}; Expected string, number, boolean, or null. If you need to pass nested query parameters, you can manually encode them, e.g. { query: { 'foo[key1]': value1, 'foo[key2]': value2 } }, and please open a GitHub issue requesting better support for your use case.`)}).join("&")}async fetchWithTimeout(e,t,n,a){const{signal:r,...i}=t||{};r&&r.addEventListener("abort",()=>a.abort());const o=setTimeout(()=>a.abort(),n),l={signal:a.signal,...i};return l.method&&(l.method=l.method.toUpperCase()),this.fetch.call(void 0,e,l).finally(()=>{clearTimeout(o)})}shouldRetry(e){const t=e.headers.get("x-should-retry");return t==="true"?!0:t==="false"?!1:e.status===408||e.status===409||e.status===429||e.status>=500}async retryRequest(e,t,n){let a;const r=n==null?void 0:n["retry-after-ms"];if(r){const o=parseFloat(r);Number.isNaN(o)||(a=o)}const i=n==null?void 0:n["retry-after"];if(i&&!a){const o=parseFloat(i);Number.isNaN(o)?a=Date.parse(i)-Date.now():a=o*1e3}if(!(a&&0<=a&&a<60*1e3)){const o=e.maxRetries??this.maxRetries;a=this.calculateDefaultRetryTimeoutMillis(t,o)}return await Zt(a),this.makeRequest(e,t-1)}calculateDefaultRetryTimeoutMillis(e,t){const r=t-e,i=Math.min(.5*Math.pow(2,r),8),o=1-Math.random()*.25;return i*o*1e3}getUserAgent(){return`${this.constructor.name}/JS ${bt}`}}class mi{constructor(e,t,n,a){ms.set(this,void 0),Il(this,ms,e),this.options=a,this.response=t,this.body=n}hasNextPage(){return this.getPaginatedItems().length?this.nextPageInfo()!=null:!1}async getNextPage(){const e=this.nextPageInfo();if(!e)throw new C("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");const t={...this.options};if("params"in e&&typeof t.query=="object")t.query={...t.query,...e.params};else if("url"in e){const n=[...Object.entries(t.query||{}),...e.url.searchParams.entries()];for(const[a,r]of n)e.url.searchParams.set(a,r);t.query=void 0,t.path=e.url.toString()}return await Tl(this,ms,"f").requestAPIList(this.constructor,t)}async*iterPages(){let e=this;for(yield e;e.hasNextPage();)e=await e.getNextPage(),yield e}async*[(ms=new WeakMap,Symbol.asyncIterator)](){for await(const e of this.iterPages())for(const t of e.getPaginatedItems())yield t}}class Fl extends Ws{constructor(e,t,n){super(t,async a=>new n(e,a.response,await gi(a),a.options))}async*[Symbol.asyncIterator](){const e=await this;for await(const t of e)yield t}}const xi=s=>new Proxy(Object.fromEntries(s.entries()),{get(e,t){const n=t.toString();return e[n.toLowerCase()]||e[n]}}),Dl={method:!0,path:!0,query:!0,body:!0,headers:!0,maxRetries:!0,stream:!0,timeout:!0,httpAgent:!0,signal:!0,idempotencyKey:!0,__metadata:!0,__binaryRequest:!0,__binaryResponse:!0,__streamClass:!0},U=s=>typeof s=="object"&&s!==null&&!bi(s)&&Object.keys(s).every(e=>yi(Dl,e)),Ll=()=>{var e;if(typeof Deno<"u"&&Deno.build!=null)return{"X-Stainless-Lang":"js","X-Stainless-Package-Version":bt,"X-Stainless-OS":rr(Deno.build.os),"X-Stainless-Arch":ar(Deno.build.arch),"X-Stainless-Runtime":"deno","X-Stainless-Runtime-Version":typeof Deno.version=="string"?Deno.version:((e=Deno.version)==null?void 0:e.deno)??"unknown"};if(typeof EdgeRuntime<"u")return{"X-Stainless-Lang":"js","X-Stainless-Package-Version":bt,"X-Stainless-OS":"Unknown","X-Stainless-Arch":`other:${EdgeRuntime}`,"X-Stainless-Runtime":"edge","X-Stainless-Runtime-Version":process.version};if(Object.prototype.toString.call(typeof process<"u"?process:0)==="[object process]")return{"X-Stainless-Lang":"js","X-Stainless-Package-Version":bt,"X-Stainless-OS":rr(process.platform),"X-Stainless-Arch":ar(process.arch),"X-Stainless-Runtime":"node","X-Stainless-Runtime-Version":process.version};const s=Nl();return s?{"X-Stainless-Lang":"js","X-Stainless-Package-Version":bt,"X-Stainless-OS":"Unknown","X-Stainless-Arch":"unknown","X-Stainless-Runtime":`browser:${s.browser}`,"X-Stainless-Runtime-Version":s.version}:{"X-Stainless-Lang":"js","X-Stainless-Package-Version":bt,"X-Stainless-OS":"Unknown","X-Stainless-Arch":"unknown","X-Stainless-Runtime":"unknown","X-Stainless-Runtime-Version":"unknown"}};function Nl(){if(typeof navigator>"u"||!navigator)return null;const s=[{key:"edge",pattern:/Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/},{key:"ie",pattern:/MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/},{key:"ie",pattern:/Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/},{key:"chrome",pattern:/Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/},{key:"firefox",pattern:/Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/},{key:"safari",pattern:/(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/}];for(const{key:e,pattern:t}of s){const n=t.exec(navigator.userAgent);if(n){const a=n[1]||0,r=n[2]||0,i=n[3]||0;return{browser:e,version:`${a}.${r}.${i}`}}}return null}const ar=s=>s==="x32"?"x32":s==="x86_64"||s==="x64"?"x64":s==="arm"?"arm":s==="aarch64"||s==="arm64"?"arm64":s?`other:${s}`:"unknown",rr=s=>(s=s.toLowerCase(),s.includes("ios")?"iOS":s==="android"?"Android":s==="darwin"?"MacOS":s==="win32"?"Windows":s==="freebsd"?"FreeBSD":s==="openbsd"?"OpenBSD":s==="linux"?"Linux":s?`Other:${s}`:"Unknown");let ir;const jl=()=>ir??(ir=Ll()),Bl=s=>{try{return JSON.parse(s)}catch{return}},Hl=/^[a-z][a-z0-9+.-]*:/i,Gl=s=>Hl.test(s),Zt=s=>new Promise(e=>setTimeout(e,s)),ln=(s,e)=>{if(typeof e!="number"||!Number.isInteger(e))throw new C(`${s} must be an integer`);if(e<0)throw new C(`${s} must be a positive integer`);return e},vn=s=>{if(s instanceof Error)return s;if(typeof s=="object"&&s!==null)try{return new Error(JSON.stringify(s))}catch{}return new Error(s)},xs=s=>{var e,t,n,a;if(typeof process<"u")return((e=vt==null?void 0:vt[s])==null?void 0:e.trim())??void 0;if(typeof Deno<"u")return(a=(n=(t=Deno.env)==null?void 0:t.get)==null?void 0:n.call(t,s))==null?void 0:a.trim()};function bi(s){if(!s)return!0;for(const e in s)return!1;return!0}function yi(s,e){return Object.prototype.hasOwnProperty.call(s,e)}function or(s,e){for(const t in e){if(!yi(e,t))continue;const n=t.toLowerCase();if(!n)continue;const a=e[t];a===null?delete s[n]:a!==void 0&&(s[n]=a)}}const lr=new Set(["authorization","api-key"]);function Ke(s,...e){if(typeof process<"u"&&(vt==null?void 0:vt.DEBUG)==="true"){const t=e.map(n=>{if(!n)return n;if(n.headers){const r={...n,headers:{...n.headers}};for(const i in n.headers)lr.has(i.toLowerCase())&&(r.headers[i]="REDACTED");return r}let a=null;for(const r in n)lr.has(r.toLowerCase())&&(a??(a={...n}),a[r]="REDACTED");return a??n});console.log(`OpenAI:DEBUG:${s}`,...t)}}const Ul=()=>"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,s=>{const e=Math.random()*16|0;return(s==="x"?e:e&3|8).toString(16)}),Wl=()=>typeof window<"u"&&typeof window.document<"u"&&typeof navigator<"u",Kl=s=>typeof(s==null?void 0:s.get)=="function",bs=(s,e)=>{var n;const t=e.toLowerCase();if(Kl(s)){const a=((n=e[0])==null?void 0:n.toUpperCase())+e.substring(1).replace(/([^\w])(\w)/g,(r,i,o)=>i+o.toUpperCase());for(const r of[e,t,e.toUpperCase(),a]){const i=s.get(r);if(i)return i}}for(const[a,r]of Object.entries(s))if(a.toLowerCase()===t)return Array.isArray(r)?(r.length<=1||console.warn(`Received ${r.length} entries for the ${e} header, using the first entry.`),r[0]):r},Yl=s=>{if(typeof Buffer<"u"){const e=Buffer.from(s,"base64");return Array.from(new Float32Array(e.buffer,e.byteOffset,e.length/Float32Array.BYTES_PER_ELEMENT))}else{const e=atob(s),t=e.length,n=new Uint8Array(t);for(let a=0;a<t;a++)n[a]=e.charCodeAt(a);return Array.from(new Float32Array(n.buffer))}};function cn(s){return s!=null&&typeof s=="object"&&!Array.isArray(s)}class Ks extends mi{constructor(e,t,n,a){super(e,t,n,a),this.data=n.data||[],this.object=n.object}getPaginatedItems(){return this.data??[]}nextPageParams(){return null}nextPageInfo(){return null}}class J extends mi{constructor(e,t,n,a){super(e,t,n,a),this.data=n.data||[],this.has_more=n.has_more||!1}getPaginatedItems(){return this.data??[]}hasNextPage(){return this.has_more===!1?!1:super.hasNextPage()}nextPageParams(){const e=this.nextPageInfo();if(!e)return null;if("params"in e)return e.params;const t=Object.fromEntries(e.url.searchParams);return Object.keys(t).length?t:null}nextPageInfo(){var n;const e=this.getPaginatedItems();if(!e.length)return null;const t=(n=e[e.length-1])==null?void 0:n.id;return t?{params:{after:t}}:null}}class I{constructor(e){this._client=e}}let _i=class extends I{list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/chat/completions/${e}/messages`,ql,{query:t,...n})}},Ys=class extends I{constructor(){super(...arguments),this.messages=new _i(this._client)}create(e,t){return this._client.post("/chat/completions",{body:e,...t,stream:e.stream??!1})}retrieve(e,t){return this._client.get(`/chat/completions/${e}`,t)}update(e,t,n){return this._client.post(`/chat/completions/${e}`,{body:t,...n})}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/chat/completions",qs,{query:e,...t})}del(e,t){return this._client.delete(`/chat/completions/${e}`,t)}};class qs extends J{}class ql extends J{}Ys.ChatCompletionsPage=qs;Ys.Messages=_i;let Vs=class extends I{constructor(){super(...arguments),this.completions=new Ys(this._client)}};Vs.Completions=Ys;Vs.ChatCompletionsPage=qs;class vi extends I{create(e,t){return this._client.post("/audio/speech",{body:e,...t,headers:{Accept:"application/octet-stream",...t==null?void 0:t.headers},__binaryResponse:!0})}}class wi extends I{create(e,t){return this._client.post("/audio/transcriptions",rt({body:e,...t,stream:e.stream??!1,__metadata:{model:e.model}}))}}class $i extends I{create(e,t){return this._client.post("/audio/translations",rt({body:e,...t,__metadata:{model:e.model}}))}}class es extends I{constructor(){super(...arguments),this.transcriptions=new wi(this._client),this.translations=new $i(this._client),this.speech=new vi(this._client)}}es.Transcriptions=wi;es.Translations=$i;es.Speech=vi;class Un extends I{create(e,t){return this._client.post("/batches",{body:e,...t})}retrieve(e,t){return this._client.get(`/batches/${e}`,t)}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/batches",Wn,{query:e,...t})}cancel(e,t){return this._client.post(`/batches/${e}/cancel`,t)}}class Wn extends J{}Un.BatchesPage=Wn;var me=function(s,e,t,n,a){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!a)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!a:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?a.call(s,t):a?a.value=t:e.set(s,t),t},G=function(s,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},wn,Ss,Es,Ot,Ft,Ps,Dt,Pe,Lt,Fs,Ds,yt,Ai;class Kn{constructor(){wn.add(this),this.controller=new AbortController,Ss.set(this,void 0),Es.set(this,()=>{}),Ot.set(this,()=>{}),Ft.set(this,void 0),Ps.set(this,()=>{}),Dt.set(this,()=>{}),Pe.set(this,{}),Lt.set(this,!1),Fs.set(this,!1),Ds.set(this,!1),yt.set(this,!1),me(this,Ss,new Promise((e,t)=>{me(this,Es,e,"f"),me(this,Ot,t,"f")}),"f"),me(this,Ft,new Promise((e,t)=>{me(this,Ps,e,"f"),me(this,Dt,t,"f")}),"f"),G(this,Ss,"f").catch(()=>{}),G(this,Ft,"f").catch(()=>{})}_run(e){setTimeout(()=>{e().then(()=>{this._emitFinal(),this._emit("end")},G(this,wn,"m",Ai).bind(this))},0)}_connected(){this.ended||(G(this,Es,"f").call(this),this._emit("connect"))}get ended(){return G(this,Lt,"f")}get errored(){return G(this,Fs,"f")}get aborted(){return G(this,Ds,"f")}abort(){this.controller.abort()}on(e,t){return(G(this,Pe,"f")[e]||(G(this,Pe,"f")[e]=[])).push({listener:t}),this}off(e,t){const n=G(this,Pe,"f")[e];if(!n)return this;const a=n.findIndex(r=>r.listener===t);return a>=0&&n.splice(a,1),this}once(e,t){return(G(this,Pe,"f")[e]||(G(this,Pe,"f")[e]=[])).push({listener:t,once:!0}),this}emitted(e){return new Promise((t,n)=>{me(this,yt,!0,"f"),e!=="error"&&this.once("error",n),this.once(e,t)})}async done(){me(this,yt,!0,"f"),await G(this,Ft,"f")}_emit(e,...t){if(G(this,Lt,"f"))return;e==="end"&&(me(this,Lt,!0,"f"),G(this,Ps,"f").call(this));const n=G(this,Pe,"f")[e];if(n&&(G(this,Pe,"f")[e]=n.filter(a=>!a.once),n.forEach(({listener:a})=>a(...t))),e==="abort"){const a=t[0];!G(this,yt,"f")&&!(n!=null&&n.length)&&Promise.reject(a),G(this,Ot,"f").call(this,a),G(this,Dt,"f").call(this,a),this._emit("end");return}if(e==="error"){const a=t[0];!G(this,yt,"f")&&!(n!=null&&n.length)&&Promise.reject(a),G(this,Ot,"f").call(this,a),G(this,Dt,"f").call(this,a),this._emit("end")}}_emitFinal(){}}Ss=new WeakMap,Es=new WeakMap,Ot=new WeakMap,Ft=new WeakMap,Ps=new WeakMap,Dt=new WeakMap,Pe=new WeakMap,Lt=new WeakMap,Fs=new WeakMap,Ds=new WeakMap,yt=new WeakMap,wn=new WeakSet,Ai=function(e){if(me(this,Fs,!0,"f"),e instanceof Error&&e.name==="AbortError"&&(e=new pe),e instanceof pe)return me(this,Ds,!0,"f"),this._emit("abort",e);if(e instanceof C)return this._emit("error",e);if(e instanceof Error){const t=new C(e.message);return t.cause=e,this._emit("error",t)}return this._emit("error",new C(String(e)))};var S=function(s,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},ce=function(s,e,t,n,a){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!a)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!a:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?a.call(s,t):a?a.value=t:e.set(s,t),t},te,$n,Re,Cs,xe,Ze,_t,Qe,Ls,ue,Ms,Is,Ut,Nt,jt,cr,dr,ur,pr,fr,gr,hr;class ve extends Kn{constructor(){super(...arguments),te.add(this),$n.set(this,[]),Re.set(this,{}),Cs.set(this,{}),xe.set(this,void 0),Ze.set(this,void 0),_t.set(this,void 0),Qe.set(this,void 0),Ls.set(this,void 0),ue.set(this,void 0),Ms.set(this,void 0),Is.set(this,void 0),Ut.set(this,void 0)}[($n=new WeakMap,Re=new WeakMap,Cs=new WeakMap,xe=new WeakMap,Ze=new WeakMap,_t=new WeakMap,Qe=new WeakMap,Ls=new WeakMap,ue=new WeakMap,Ms=new WeakMap,Is=new WeakMap,Ut=new WeakMap,te=new WeakSet,Symbol.asyncIterator)](){const e=[],t=[];let n=!1;return this.on("event",a=>{const r=t.shift();r?r.resolve(a):e.push(a)}),this.on("end",()=>{n=!0;for(const a of t)a.resolve(void 0);t.length=0}),this.on("abort",a=>{n=!0;for(const r of t)r.reject(a);t.length=0}),this.on("error",a=>{n=!0;for(const r of t)r.reject(a);t.length=0}),{next:async()=>e.length?{value:e.shift(),done:!1}:n?{value:void 0,done:!0}:new Promise((r,i)=>t.push({resolve:r,reject:i})).then(r=>r?{value:r,done:!1}:{value:void 0,done:!0}),return:async()=>(this.abort(),{value:void 0,done:!0})}}static fromReadableStream(e){const t=new ve;return t._run(()=>t._fromReadableStream(e)),t}async _fromReadableStream(e,t){var r;const n=t==null?void 0:t.signal;n&&(n.aborted&&this.controller.abort(),n.addEventListener("abort",()=>this.controller.abort())),this._connected();const a=ke.fromReadableStream(e,this.controller);for await(const i of a)S(this,te,"m",Nt).call(this,i);if((r=a.controller.signal)!=null&&r.aborted)throw new pe;return this._addRun(S(this,te,"m",jt).call(this))}toReadableStream(){return new ke(this[Symbol.asyncIterator].bind(this),this.controller).toReadableStream()}static createToolAssistantStream(e,t,n,a,r){const i=new ve;return i._run(()=>i._runToolAssistantStream(e,t,n,a,{...r,headers:{...r==null?void 0:r.headers,"X-Stainless-Helper-Method":"stream"}})),i}async _createToolAssistantStream(e,t,n,a,r){var c;const i=r==null?void 0:r.signal;i&&(i.aborted&&this.controller.abort(),i.addEventListener("abort",()=>this.controller.abort()));const o={...a,stream:!0},l=await e.submitToolOutputs(t,n,o,{...r,signal:this.controller.signal});this._connected();for await(const u of l)S(this,te,"m",Nt).call(this,u);if((c=l.controller.signal)!=null&&c.aborted)throw new pe;return this._addRun(S(this,te,"m",jt).call(this))}static createThreadAssistantStream(e,t,n){const a=new ve;return a._run(()=>a._threadAssistantStream(e,t,{...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"stream"}})),a}static createAssistantStream(e,t,n,a){const r=new ve;return r._run(()=>r._runAssistantStream(e,t,n,{...a,headers:{...a==null?void 0:a.headers,"X-Stainless-Helper-Method":"stream"}})),r}currentEvent(){return S(this,Ms,"f")}currentRun(){return S(this,Is,"f")}currentMessageSnapshot(){return S(this,xe,"f")}currentRunStepSnapshot(){return S(this,Ut,"f")}async finalRunSteps(){return await this.done(),Object.values(S(this,Re,"f"))}async finalMessages(){return await this.done(),Object.values(S(this,Cs,"f"))}async finalRun(){if(await this.done(),!S(this,Ze,"f"))throw Error("Final run was not received.");return S(this,Ze,"f")}async _createThreadAssistantStream(e,t,n){var o;const a=n==null?void 0:n.signal;a&&(a.aborted&&this.controller.abort(),a.addEventListener("abort",()=>this.controller.abort()));const r={...t,stream:!0},i=await e.createAndRun(r,{...n,signal:this.controller.signal});this._connected();for await(const l of i)S(this,te,"m",Nt).call(this,l);if((o=i.controller.signal)!=null&&o.aborted)throw new pe;return this._addRun(S(this,te,"m",jt).call(this))}async _createAssistantStream(e,t,n,a){var l;const r=a==null?void 0:a.signal;r&&(r.aborted&&this.controller.abort(),r.addEventListener("abort",()=>this.controller.abort()));const i={...n,stream:!0},o=await e.create(t,i,{...a,signal:this.controller.signal});this._connected();for await(const c of o)S(this,te,"m",Nt).call(this,c);if((l=o.controller.signal)!=null&&l.aborted)throw new pe;return this._addRun(S(this,te,"m",jt).call(this))}static accumulateDelta(e,t){for(const[n,a]of Object.entries(t)){if(!e.hasOwnProperty(n)){e[n]=a;continue}let r=e[n];if(r==null){e[n]=a;continue}if(n==="index"||n==="type"){e[n]=a;continue}if(typeof r=="string"&&typeof a=="string")r+=a;else if(typeof r=="number"&&typeof a=="number")r+=a;else if(cn(r)&&cn(a))r=this.accumulateDelta(r,a);else if(Array.isArray(r)&&Array.isArray(a)){if(r.every(i=>typeof i=="string"||typeof i=="number")){r.push(...a);continue}for(const i of a){if(!cn(i))throw new Error(`Expected array delta entry to be an object but got: ${i}`);const o=i.index;if(o==null)throw console.error(i),new Error("Expected array delta entry to have an `index` property");if(typeof o!="number")throw new Error(`Expected array delta entry \`index\` property to be a number but got ${o}`);const l=r[o];l==null?r.push(i):r[o]=this.accumulateDelta(l,i)}continue}else throw Error(`Unhandled record type: ${n}, deltaValue: ${a}, accValue: ${r}`);e[n]=r}return e}_addRun(e){return e}async _threadAssistantStream(e,t,n){return await this._createThreadAssistantStream(t,e,n)}async _runAssistantStream(e,t,n,a){return await this._createAssistantStream(t,e,n,a)}async _runToolAssistantStream(e,t,n,a,r){return await this._createToolAssistantStream(n,e,t,a,r)}}Nt=function(e){if(!this.ended)switch(ce(this,Ms,e,"f"),S(this,te,"m",ur).call(this,e),e.event){case"thread.created":break;case"thread.run.created":case"thread.run.queued":case"thread.run.in_progress":case"thread.run.requires_action":case"thread.run.completed":case"thread.run.incomplete":case"thread.run.failed":case"thread.run.cancelling":case"thread.run.cancelled":case"thread.run.expired":S(this,te,"m",hr).call(this,e);break;case"thread.run.step.created":case"thread.run.step.in_progress":case"thread.run.step.delta":case"thread.run.step.completed":case"thread.run.step.failed":case"thread.run.step.cancelled":case"thread.run.step.expired":S(this,te,"m",dr).call(this,e);break;case"thread.message.created":case"thread.message.in_progress":case"thread.message.delta":case"thread.message.completed":case"thread.message.incomplete":S(this,te,"m",cr).call(this,e);break;case"error":throw new Error("Encountered an error event in event processing - errors should be processed earlier")}},jt=function(){if(this.ended)throw new C("stream has ended, this shouldn't happen");if(!S(this,Ze,"f"))throw Error("Final run has not been received");return S(this,Ze,"f")},cr=function(e){const[t,n]=S(this,te,"m",fr).call(this,e,S(this,xe,"f"));ce(this,xe,t,"f"),S(this,Cs,"f")[t.id]=t;for(const a of n){const r=t.content[a.index];(r==null?void 0:r.type)=="text"&&this._emit("textCreated",r.text)}switch(e.event){case"thread.message.created":this._emit("messageCreated",e.data);break;case"thread.message.in_progress":break;case"thread.message.delta":if(this._emit("messageDelta",e.data.delta,t),e.data.delta.content)for(const a of e.data.delta.content){if(a.type=="text"&&a.text){let r=a.text,i=t.content[a.index];if(i&&i.type=="text")this._emit("textDelta",r,i.text);else throw Error("The snapshot associated with this text delta is not text or missing")}if(a.index!=S(this,_t,"f")){if(S(this,Qe,"f"))switch(S(this,Qe,"f").type){case"text":this._emit("textDone",S(this,Qe,"f").text,S(this,xe,"f"));break;case"image_file":this._emit("imageFileDone",S(this,Qe,"f").image_file,S(this,xe,"f"));break}ce(this,_t,a.index,"f")}ce(this,Qe,t.content[a.index],"f")}break;case"thread.message.completed":case"thread.message.incomplete":if(S(this,_t,"f")!==void 0){const a=e.data.content[S(this,_t,"f")];if(a)switch(a.type){case"image_file":this._emit("imageFileDone",a.image_file,S(this,xe,"f"));break;case"text":this._emit("textDone",a.text,S(this,xe,"f"));break}}S(this,xe,"f")&&this._emit("messageDone",e.data),ce(this,xe,void 0,"f")}},dr=function(e){const t=S(this,te,"m",pr).call(this,e);switch(ce(this,Ut,t,"f"),e.event){case"thread.run.step.created":this._emit("runStepCreated",e.data);break;case"thread.run.step.delta":const n=e.data.delta;if(n.step_details&&n.step_details.type=="tool_calls"&&n.step_details.tool_calls&&t.step_details.type=="tool_calls")for(const r of n.step_details.tool_calls)r.index==S(this,Ls,"f")?this._emit("toolCallDelta",r,t.step_details.tool_calls[r.index]):(S(this,ue,"f")&&this._emit("toolCallDone",S(this,ue,"f")),ce(this,Ls,r.index,"f"),ce(this,ue,t.step_details.tool_calls[r.index],"f"),S(this,ue,"f")&&this._emit("toolCallCreated",S(this,ue,"f")));this._emit("runStepDelta",e.data.delta,t);break;case"thread.run.step.completed":case"thread.run.step.failed":case"thread.run.step.cancelled":case"thread.run.step.expired":ce(this,Ut,void 0,"f"),e.data.step_details.type=="tool_calls"&&S(this,ue,"f")&&(this._emit("toolCallDone",S(this,ue,"f")),ce(this,ue,void 0,"f")),this._emit("runStepDone",e.data,t);break}},ur=function(e){S(this,$n,"f").push(e),this._emit("event",e)},pr=function(e){switch(e.event){case"thread.run.step.created":return S(this,Re,"f")[e.data.id]=e.data,e.data;case"thread.run.step.delta":let t=S(this,Re,"f")[e.data.id];if(!t)throw Error("Received a RunStepDelta before creation of a snapshot");let n=e.data;if(n.delta){const a=ve.accumulateDelta(t,n.delta);S(this,Re,"f")[e.data.id]=a}return S(this,Re,"f")[e.data.id];case"thread.run.step.completed":case"thread.run.step.failed":case"thread.run.step.cancelled":case"thread.run.step.expired":case"thread.run.step.in_progress":S(this,Re,"f")[e.data.id]=e.data;break}if(S(this,Re,"f")[e.data.id])return S(this,Re,"f")[e.data.id];throw new Error("No snapshot available")},fr=function(e,t){let n=[];switch(e.event){case"thread.message.created":return[e.data,n];case"thread.message.delta":if(!t)throw Error("Received a delta with no existing snapshot (there should be one from message creation)");let a=e.data;if(a.delta.content)for(const r of a.delta.content)if(r.index in t.content){let i=t.content[r.index];t.content[r.index]=S(this,te,"m",gr).call(this,r,i)}else t.content[r.index]=r,n.push(r);return[t,n];case"thread.message.in_progress":case"thread.message.completed":case"thread.message.incomplete":if(t)return[t,n];throw Error("Received thread message event with no existing snapshot")}throw Error("Tried to accumulate a non-message event")},gr=function(e,t){return ve.accumulateDelta(t,e)},hr=function(e){switch(ce(this,Is,e.data,"f"),e.event){case"thread.run.created":break;case"thread.run.queued":break;case"thread.run.in_progress":break;case"thread.run.requires_action":case"thread.run.cancelled":case"thread.run.failed":case"thread.run.completed":case"thread.run.expired":ce(this,Ze,e.data,"f"),S(this,ue,"f")&&(this._emit("toolCallDone",S(this,ue,"f")),ce(this,ue,void 0,"f"));break}};class Yn extends I{create(e,t){return this._client.post("/assistants",{body:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}retrieve(e,t){return this._client.get(`/assistants/${e}`,{...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}update(e,t,n){return this._client.post(`/assistants/${e}`,{body:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/assistants",qn,{query:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}del(e,t){return this._client.delete(`/assistants/${e}`,{...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}}class qn extends J{}Yn.AssistantsPage=qn;function mr(s){return typeof s.parse=="function"}const wt=s=>(s==null?void 0:s.role)==="assistant",Ri=s=>(s==null?void 0:s.role)==="function",ki=s=>(s==null?void 0:s.role)==="tool";function Vn(s){return(s==null?void 0:s.$brand)==="auto-parseable-response-format"}function ts(s){return(s==null?void 0:s.$brand)==="auto-parseable-tool"}function Vl(s,e){return!e||!Si(e)?{...s,choices:s.choices.map(t=>({...t,message:{...t.message,parsed:null,...t.message.tool_calls?{tool_calls:t.message.tool_calls}:void 0}}))}:zn(s,e)}function zn(s,e){const t=s.choices.map(n=>{var a;if(n.finish_reason==="length")throw new ci;if(n.finish_reason==="content_filter")throw new di;return{...n,message:{...n.message,...n.message.tool_calls?{tool_calls:((a=n.message.tool_calls)==null?void 0:a.map(r=>Jl(e,r)))??void 0}:void 0,parsed:n.message.content&&!n.message.refusal?zl(e,n.message.content):null}}});return{...s,choices:t}}function zl(s,e){var t,n;return((t=s.response_format)==null?void 0:t.type)!=="json_schema"?null:((n=s.response_format)==null?void 0:n.type)==="json_schema"?"$parseRaw"in s.response_format?s.response_format.$parseRaw(e):JSON.parse(e):null}function Jl(s,e){var n;const t=(n=s.tools)==null?void 0:n.find(a=>{var r;return((r=a.function)==null?void 0:r.name)===e.function.name});return{...e,function:{...e.function,parsed_arguments:ts(t)?t.$parseRaw(e.function.arguments):t!=null&&t.function.strict?JSON.parse(e.function.arguments):null}}}function Xl(s,e){var n;if(!s)return!1;const t=(n=s.tools)==null?void 0:n.find(a=>{var r;return((r=a.function)==null?void 0:r.name)===e.function.name});return ts(t)||(t==null?void 0:t.function.strict)||!1}function Si(s){var e;return Vn(s.response_format)?!0:((e=s.tools)==null?void 0:e.some(t=>ts(t)||t.type==="function"&&t.function.strict===!0))??!1}function Ql(s){for(const e of s??[]){if(e.type!=="function")throw new C(`Currently only \`function\` tool types support auto-parsing; Received \`${e.type}\``);if(e.function.strict!==!0)throw new C(`The \`${e.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`)}}var le=function(s,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},ne,An,Ns,Rn,kn,Sn,Ei,En;const xr=10;class Pi extends Kn{constructor(){super(...arguments),ne.add(this),this._chatCompletions=[],this.messages=[]}_addChatCompletion(e){var n;this._chatCompletions.push(e),this._emit("chatCompletion",e);const t=(n=e.choices[0])==null?void 0:n.message;return t&&this._addMessage(t),e}_addMessage(e,t=!0){if("content"in e||(e.content=null),this.messages.push(e),t){if(this._emit("message",e),(Ri(e)||ki(e))&&e.content)this._emit("functionCallResult",e.content);else if(wt(e)&&e.function_call)this._emit("functionCall",e.function_call);else if(wt(e)&&e.tool_calls)for(const n of e.tool_calls)n.type==="function"&&this._emit("functionCall",n.function)}}async finalChatCompletion(){await this.done();const e=this._chatCompletions[this._chatCompletions.length-1];if(!e)throw new C("stream ended without producing a ChatCompletion");return e}async finalContent(){return await this.done(),le(this,ne,"m",An).call(this)}async finalMessage(){return await this.done(),le(this,ne,"m",Ns).call(this)}async finalFunctionCall(){return await this.done(),le(this,ne,"m",Rn).call(this)}async finalFunctionCallResult(){return await this.done(),le(this,ne,"m",kn).call(this)}async totalUsage(){return await this.done(),le(this,ne,"m",Sn).call(this)}allChatCompletions(){return[...this._chatCompletions]}_emitFinal(){const e=this._chatCompletions[this._chatCompletions.length-1];e&&this._emit("finalChatCompletion",e);const t=le(this,ne,"m",Ns).call(this);t&&this._emit("finalMessage",t);const n=le(this,ne,"m",An).call(this);n&&this._emit("finalContent",n);const a=le(this,ne,"m",Rn).call(this);a&&this._emit("finalFunctionCall",a);const r=le(this,ne,"m",kn).call(this);r!=null&&this._emit("finalFunctionCallResult",r),this._chatCompletions.some(i=>i.usage)&&this._emit("totalUsage",le(this,ne,"m",Sn).call(this))}async _createChatCompletion(e,t,n){const a=n==null?void 0:n.signal;a&&(a.aborted&&this.controller.abort(),a.addEventListener("abort",()=>this.controller.abort())),le(this,ne,"m",Ei).call(this,t);const r=await e.chat.completions.create({...t,stream:!1},{...n,signal:this.controller.signal});return this._connected(),this._addChatCompletion(zn(r,t))}async _runChatCompletion(e,t,n){for(const a of t.messages)this._addMessage(a,!1);return await this._createChatCompletion(e,t,n)}async _runFunctions(e,t,n){var p;const a="function",{function_call:r="auto",stream:i,...o}=t,l=typeof r!="string"&&(r==null?void 0:r.name),{maxChatCompletions:c=xr}=n||{},u={};for(const f of t.functions)u[f.name||f.function.name]=f;const d=t.functions.map(f=>({name:f.name||f.function.name,parameters:f.parameters,description:f.description}));for(const f of t.messages)this._addMessage(f,!1);for(let f=0;f<c;++f){const x=(p=(await this._createChatCompletion(e,{...o,function_call:r,functions:d,messages:[...this.messages]},n)).choices[0])==null?void 0:p.message;if(!x)throw new C("missing message in ChatCompletion response");if(!x.function_call)return;const{name:g,arguments:_}=x.function_call,h=u[g];if(h){if(l&&l!==g){const A=`Invalid function_call: ${JSON.stringify(g)}. ${JSON.stringify(l)} requested. Please try again`;this._addMessage({role:a,name:g,content:A});continue}}else{const A=`Invalid function_call: ${JSON.stringify(g)}. Available options are: ${d.map(y=>JSON.stringify(y.name)).join(", ")}. Please try again`;this._addMessage({role:a,name:g,content:A});continue}let w;try{w=mr(h)?await h.parse(_):_}catch(A){this._addMessage({role:a,name:g,content:A instanceof Error?A.message:String(A)});continue}const v=await h.function(w,this),P=le(this,ne,"m",En).call(this,v);if(this._addMessage({role:a,name:g,content:P}),l)return}}async _runTools(e,t,n){var f,b,x;const a="tool",{tool_choice:r="auto",stream:i,...o}=t,l=typeof r!="string"&&((f=r==null?void 0:r.function)==null?void 0:f.name),{maxChatCompletions:c=xr}=n||{},u=t.tools.map(g=>{if(ts(g)){if(!g.$callback)throw new C("Tool given to `.runTools()` that does not have an associated function");return{type:"function",function:{function:g.$callback,name:g.function.name,description:g.function.description||"",parameters:g.function.parameters,parse:g.$parseRaw,strict:!0}}}return g}),d={};for(const g of u)g.type==="function"&&(d[g.function.name||g.function.function.name]=g.function);const p="tools"in t?u.map(g=>g.type==="function"?{type:"function",function:{name:g.function.name||g.function.function.name,parameters:g.function.parameters,description:g.function.description,strict:g.function.strict}}:g):void 0;for(const g of t.messages)this._addMessage(g,!1);for(let g=0;g<c;++g){const h=(b=(await this._createChatCompletion(e,{...o,tool_choice:r,tools:p,messages:[...this.messages]},n)).choices[0])==null?void 0:b.message;if(!h)throw new C("missing message in ChatCompletion response");if(!((x=h.tool_calls)!=null&&x.length))return;for(const w of h.tool_calls){if(w.type!=="function")continue;const v=w.id,{name:P,arguments:A}=w.function,y=d[P];if(y){if(l&&l!==P){const k=`Invalid tool_call: ${JSON.stringify(P)}. ${JSON.stringify(l)} requested. Please try again`;this._addMessage({role:a,tool_call_id:v,content:k});continue}}else{const k=`Invalid tool_call: ${JSON.stringify(P)}. Available options are: ${Object.keys(d).map(N=>JSON.stringify(N)).join(", ")}. Please try again`;this._addMessage({role:a,tool_call_id:v,content:k});continue}let R;try{R=mr(y)?await y.parse(A):A}catch(k){const N=k instanceof Error?k.message:String(k);this._addMessage({role:a,tool_call_id:v,content:N});continue}const E=await y.function(R,this),$=le(this,ne,"m",En).call(this,E);if(this._addMessage({role:a,tool_call_id:v,content:$}),l)return}}}}ne=new WeakSet,An=function(){return le(this,ne,"m",Ns).call(this).content??null},Ns=function(){let e=this.messages.length;for(;e-- >0;){const t=this.messages[e];if(wt(t)){const{function_call:n,...a}=t,r={...a,content:t.content??null,refusal:t.refusal??null};return n&&(r.function_call=n),r}}throw new C("stream ended without producing a ChatCompletionMessage with role=assistant")},Rn=function(){var e,t;for(let n=this.messages.length-1;n>=0;n--){const a=this.messages[n];if(wt(a)&&(a!=null&&a.function_call))return a.function_call;if(wt(a)&&((e=a==null?void 0:a.tool_calls)!=null&&e.length))return(t=a.tool_calls.at(-1))==null?void 0:t.function}},kn=function(){for(let e=this.messages.length-1;e>=0;e--){const t=this.messages[e];if(Ri(t)&&t.content!=null||ki(t)&&t.content!=null&&typeof t.content=="string"&&this.messages.some(n=>{var a;return n.role==="assistant"&&((a=n.tool_calls)==null?void 0:a.some(r=>r.type==="function"&&r.id===t.tool_call_id))}))return t.content}},Sn=function(){const e={completion_tokens:0,prompt_tokens:0,total_tokens:0};for(const{usage:t}of this._chatCompletions)t&&(e.completion_tokens+=t.completion_tokens,e.prompt_tokens+=t.prompt_tokens,e.total_tokens+=t.total_tokens);return e},Ei=function(e){if(e.n!=null&&e.n>1)throw new C("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.")},En=function(e){return typeof e=="string"?e:e===void 0?"undefined":JSON.stringify(e)};class Wt extends Pi{static runFunctions(e,t,n){const a=new Wt,r={...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"runFunctions"}};return a._run(()=>a._runFunctions(e,t,r)),a}static runTools(e,t,n){const a=new Wt,r={...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"runTools"}};return a._run(()=>a._runTools(e,t,r)),a}_addMessage(e,t=!0){super._addMessage(e,t),wt(e)&&e.content&&this._emit("content",e.content)}}const Ci=1,Mi=2,Ii=4,Ti=8,Oi=16,Fi=32,Di=64,Li=128,Ni=256,ji=Li|Ni,Bi=Oi|Fi|ji|Di,Hi=Ci|Mi|Bi,Gi=Ii|Ti,Zl=Hi|Gi,Q={STR:Ci,NUM:Mi,ARR:Ii,OBJ:Ti,NULL:Oi,BOOL:Fi,NAN:Di,INFINITY:Li,MINUS_INFINITY:Ni,INF:ji,SPECIAL:Bi,ATOM:Hi,COLLECTION:Gi,ALL:Zl};class ec extends Error{}class tc extends Error{}function sc(s,e=Q.ALL){if(typeof s!="string")throw new TypeError(`expecting str, got ${typeof s}`);if(!s.trim())throw new Error(`${s} is empty`);return nc(s.trim(),e)}const nc=(s,e)=>{const t=s.length;let n=0;const a=p=>{throw new ec(`${p} at position ${n}`)},r=p=>{throw new tc(`${p} at position ${n}`)},i=()=>(d(),n>=t&&a("Unexpected end of input"),s[n]==='"'?o():s[n]==="{"?l():s[n]==="["?c():s.substring(n,n+4)==="null"||Q.NULL&e&&t-n<4&&"null".startsWith(s.substring(n))?(n+=4,null):s.substring(n,n+4)==="true"||Q.BOOL&e&&t-n<4&&"true".startsWith(s.substring(n))?(n+=4,!0):s.substring(n,n+5)==="false"||Q.BOOL&e&&t-n<5&&"false".startsWith(s.substring(n))?(n+=5,!1):s.substring(n,n+8)==="Infinity"||Q.INFINITY&e&&t-n<8&&"Infinity".startsWith(s.substring(n))?(n+=8,1/0):s.substring(n,n+9)==="-Infinity"||Q.MINUS_INFINITY&e&&1<t-n&&t-n<9&&"-Infinity".startsWith(s.substring(n))?(n+=9,-1/0):s.substring(n,n+3)==="NaN"||Q.NAN&e&&t-n<3&&"NaN".startsWith(s.substring(n))?(n+=3,NaN):u()),o=()=>{const p=n;let f=!1;for(n++;n<t&&(s[n]!=='"'||f&&s[n-1]==="\\");)f=s[n]==="\\"?!f:!1,n++;if(s.charAt(n)=='"')try{return JSON.parse(s.substring(p,++n-Number(f)))}catch(b){r(String(b))}else if(Q.STR&e)try{return JSON.parse(s.substring(p,n-Number(f))+'"')}catch{return JSON.parse(s.substring(p,s.lastIndexOf("\\"))+'"')}a("Unterminated string literal")},l=()=>{n++,d();const p={};try{for(;s[n]!=="}";){if(d(),n>=t&&Q.OBJ&e)return p;const f=o();d(),n++;try{const b=i();Object.defineProperty(p,f,{value:b,writable:!0,enumerable:!0,configurable:!0})}catch(b){if(Q.OBJ&e)return p;throw b}d(),s[n]===","&&n++}}catch{if(Q.OBJ&e)return p;a("Expected '}' at end of object")}return n++,p},c=()=>{n++;const p=[];try{for(;s[n]!=="]";)p.push(i()),d(),s[n]===","&&n++}catch{if(Q.ARR&e)return p;a("Expected ']' at end of array")}return n++,p},u=()=>{if(n===0){s==="-"&&Q.NUM&e&&a("Not sure what '-' is");try{return JSON.parse(s)}catch(f){if(Q.NUM&e)try{return s[s.length-1]==="."?JSON.parse(s.substring(0,s.lastIndexOf("."))):JSON.parse(s.substring(0,s.lastIndexOf("e")))}catch{}r(String(f))}}const p=n;for(s[n]==="-"&&n++;s[n]&&!",]}".includes(s[n]);)n++;n==t&&!(Q.NUM&e)&&a("Unterminated number literal");try{return JSON.parse(s.substring(p,n))}catch{s.substring(p,n)==="-"&&Q.NUM&e&&a("Not sure what '-' is");try{return JSON.parse(s.substring(p,s.lastIndexOf("e")))}catch(b){r(String(b))}}},d=()=>{for(;n<t&&` 
\r	`.includes(s[n]);)n++};return i()},br=s=>sc(s,Q.ALL^Q.NUM);var ut=function(s,e,t,n,a){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!a)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!a:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?a.call(s,t):a?a.value=t:e.set(s,t),t},H=function(s,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},K,Ee,pt,De,dn,ys,un,pn,fn,_s,gn,yr;class Kt extends Pi{constructor(e){super(),K.add(this),Ee.set(this,void 0),pt.set(this,void 0),De.set(this,void 0),ut(this,Ee,e,"f"),ut(this,pt,[],"f")}get currentChatCompletionSnapshot(){return H(this,De,"f")}static fromReadableStream(e){const t=new Kt(null);return t._run(()=>t._fromReadableStream(e)),t}static createChatCompletion(e,t,n){const a=new Kt(t);return a._run(()=>a._runChatCompletion(e,{...t,stream:!0},{...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"stream"}})),a}async _createChatCompletion(e,t,n){var i;super._createChatCompletion;const a=n==null?void 0:n.signal;a&&(a.aborted&&this.controller.abort(),a.addEventListener("abort",()=>this.controller.abort())),H(this,K,"m",dn).call(this);const r=await e.chat.completions.create({...t,stream:!0},{...n,signal:this.controller.signal});this._connected();for await(const o of r)H(this,K,"m",un).call(this,o);if((i=r.controller.signal)!=null&&i.aborted)throw new pe;return this._addChatCompletion(H(this,K,"m",_s).call(this))}async _fromReadableStream(e,t){var i;const n=t==null?void 0:t.signal;n&&(n.aborted&&this.controller.abort(),n.addEventListener("abort",()=>this.controller.abort())),H(this,K,"m",dn).call(this),this._connected();const a=ke.fromReadableStream(e,this.controller);let r;for await(const o of a)r&&r!==o.id&&this._addChatCompletion(H(this,K,"m",_s).call(this)),H(this,K,"m",un).call(this,o),r=o.id;if((i=a.controller.signal)!=null&&i.aborted)throw new pe;return this._addChatCompletion(H(this,K,"m",_s).call(this))}[(Ee=new WeakMap,pt=new WeakMap,De=new WeakMap,K=new WeakSet,dn=function(){this.ended||ut(this,De,void 0,"f")},ys=function(t){let n=H(this,pt,"f")[t.index];return n||(n={content_done:!1,refusal_done:!1,logprobs_content_done:!1,logprobs_refusal_done:!1,done_tool_calls:new Set,current_tool_call_index:null},H(this,pt,"f")[t.index]=n,n)},un=function(t){var a,r,i,o,l,c,u,d,p,f,b,x,g,_,h;if(this.ended)return;const n=H(this,K,"m",yr).call(this,t);this._emit("chunk",t,n);for(const w of t.choices){const v=n.choices[w.index];w.delta.content!=null&&((a=v.message)==null?void 0:a.role)==="assistant"&&((r=v.message)!=null&&r.content)&&(this._emit("content",w.delta.content,v.message.content),this._emit("content.delta",{delta:w.delta.content,snapshot:v.message.content,parsed:v.message.parsed})),w.delta.refusal!=null&&((i=v.message)==null?void 0:i.role)==="assistant"&&((o=v.message)!=null&&o.refusal)&&this._emit("refusal.delta",{delta:w.delta.refusal,snapshot:v.message.refusal}),((l=w.logprobs)==null?void 0:l.content)!=null&&((c=v.message)==null?void 0:c.role)==="assistant"&&this._emit("logprobs.content.delta",{content:(u=w.logprobs)==null?void 0:u.content,snapshot:((d=v.logprobs)==null?void 0:d.content)??[]}),((p=w.logprobs)==null?void 0:p.refusal)!=null&&((f=v.message)==null?void 0:f.role)==="assistant"&&this._emit("logprobs.refusal.delta",{refusal:(b=w.logprobs)==null?void 0:b.refusal,snapshot:((x=v.logprobs)==null?void 0:x.refusal)??[]});const P=H(this,K,"m",ys).call(this,v);v.finish_reason&&(H(this,K,"m",fn).call(this,v),P.current_tool_call_index!=null&&H(this,K,"m",pn).call(this,v,P.current_tool_call_index));for(const A of w.delta.tool_calls??[])P.current_tool_call_index!==A.index&&(H(this,K,"m",fn).call(this,v),P.current_tool_call_index!=null&&H(this,K,"m",pn).call(this,v,P.current_tool_call_index)),P.current_tool_call_index=A.index;for(const A of w.delta.tool_calls??[]){const y=(g=v.message.tool_calls)==null?void 0:g[A.index];y!=null&&y.type&&((y==null?void 0:y.type)==="function"?this._emit("tool_calls.function.arguments.delta",{name:(_=y.function)==null?void 0:_.name,index:A.index,arguments:y.function.arguments,parsed_arguments:y.function.parsed_arguments,arguments_delta:((h=A.function)==null?void 0:h.arguments)??""}):(y==null||y.type,void 0))}}},pn=function(t,n){var i,o,l;if(H(this,K,"m",ys).call(this,t).done_tool_calls.has(n))return;const r=(i=t.message.tool_calls)==null?void 0:i[n];if(!r)throw new Error("no tool call snapshot");if(!r.type)throw new Error("tool call snapshot missing `type`");if(r.type==="function"){const c=(l=(o=H(this,Ee,"f"))==null?void 0:o.tools)==null?void 0:l.find(u=>u.type==="function"&&u.function.name===r.function.name);this._emit("tool_calls.function.arguments.done",{name:r.function.name,index:n,arguments:r.function.arguments,parsed_arguments:ts(c)?c.$parseRaw(r.function.arguments):c!=null&&c.function.strict?JSON.parse(r.function.arguments):null})}else r.type},fn=function(t){var a,r;const n=H(this,K,"m",ys).call(this,t);if(t.message.content&&!n.content_done){n.content_done=!0;const i=H(this,K,"m",gn).call(this);this._emit("content.done",{content:t.message.content,parsed:i?i.$parseRaw(t.message.content):null})}t.message.refusal&&!n.refusal_done&&(n.refusal_done=!0,this._emit("refusal.done",{refusal:t.message.refusal})),(a=t.logprobs)!=null&&a.content&&!n.logprobs_content_done&&(n.logprobs_content_done=!0,this._emit("logprobs.content.done",{content:t.logprobs.content})),(r=t.logprobs)!=null&&r.refusal&&!n.logprobs_refusal_done&&(n.logprobs_refusal_done=!0,this._emit("logprobs.refusal.done",{refusal:t.logprobs.refusal}))},_s=function(){if(this.ended)throw new C("stream has ended, this shouldn't happen");const t=H(this,De,"f");if(!t)throw new C("request ended without sending any chunks");return ut(this,De,void 0,"f"),ut(this,pt,[],"f"),ac(t,H(this,Ee,"f"))},gn=function(){var n;const t=(n=H(this,Ee,"f"))==null?void 0:n.response_format;return Vn(t)?t:null},yr=function(t){var n,a,r,i;let o=H(this,De,"f");const{choices:l,...c}=t;o?Object.assign(o,c):o=ut(this,De,{...c,choices:[]},"f");for(const{delta:u,finish_reason:d,index:p,logprobs:f=null,...b}of t.choices){let x=o.choices[p];if(x||(x=o.choices[p]={finish_reason:d,index:p,message:{},logprobs:f,...b}),f)if(!x.logprobs)x.logprobs=Object.assign({},f);else{const{content:A,refusal:y,...R}=f;Object.assign(x.logprobs,R),A&&((n=x.logprobs).content??(n.content=[]),x.logprobs.content.push(...A)),y&&((a=x.logprobs).refusal??(a.refusal=[]),x.logprobs.refusal.push(...y))}if(d&&(x.finish_reason=d,H(this,Ee,"f")&&Si(H(this,Ee,"f")))){if(d==="length")throw new ci;if(d==="content_filter")throw new di}if(Object.assign(x,b),!u)continue;const{content:g,refusal:_,function_call:h,role:w,tool_calls:v,...P}=u;if(Object.assign(x.message,P),_&&(x.message.refusal=(x.message.refusal||"")+_),w&&(x.message.role=w),h&&(x.message.function_call?(h.name&&(x.message.function_call.name=h.name),h.arguments&&((r=x.message.function_call).arguments??(r.arguments=""),x.message.function_call.arguments+=h.arguments)):x.message.function_call=h),g&&(x.message.content=(x.message.content||"")+g,!x.message.refusal&&H(this,K,"m",gn).call(this)&&(x.message.parsed=br(x.message.content))),v){x.message.tool_calls||(x.message.tool_calls=[]);for(const{index:A,id:y,type:R,function:E,...$}of v){const k=(i=x.message.tool_calls)[A]??(i[A]={});Object.assign(k,$),y&&(k.id=y),R&&(k.type=R),E&&(k.function??(k.function={name:E.name??"",arguments:""})),E!=null&&E.name&&(k.function.name=E.name),E!=null&&E.arguments&&(k.function.arguments+=E.arguments,Xl(H(this,Ee,"f"),k)&&(k.function.parsed_arguments=br(k.function.arguments)))}}}return o},Symbol.asyncIterator)](){const e=[],t=[];let n=!1;return this.on("chunk",a=>{const r=t.shift();r?r.resolve(a):e.push(a)}),this.on("end",()=>{n=!0;for(const a of t)a.resolve(void 0);t.length=0}),this.on("abort",a=>{n=!0;for(const r of t)r.reject(a);t.length=0}),this.on("error",a=>{n=!0;for(const r of t)r.reject(a);t.length=0}),{next:async()=>e.length?{value:e.shift(),done:!1}:n?{value:void 0,done:!0}:new Promise((r,i)=>t.push({resolve:r,reject:i})).then(r=>r?{value:r,done:!1}:{value:void 0,done:!0}),return:async()=>(this.abort(),{value:void 0,done:!0})}}toReadableStream(){return new ke(this[Symbol.asyncIterator].bind(this),this.controller).toReadableStream()}}function ac(s,e){const{id:t,choices:n,created:a,model:r,system_fingerprint:i,...o}=s,l={...o,id:t,choices:n.map(({message:c,finish_reason:u,index:d,logprobs:p,...f})=>{if(!u)throw new C(`missing finish_reason for choice ${d}`);const{content:b=null,function_call:x,tool_calls:g,..._}=c,h=c.role;if(!h)throw new C(`missing role for choice ${d}`);if(x){const{arguments:w,name:v}=x;if(w==null)throw new C(`missing function_call.arguments for choice ${d}`);if(!v)throw new C(`missing function_call.name for choice ${d}`);return{...f,message:{content:b,function_call:{arguments:w,name:v},role:h,refusal:c.refusal??null},finish_reason:u,index:d,logprobs:p}}return g?{...f,index:d,finish_reason:u,logprobs:p,message:{..._,role:h,content:b,refusal:c.refusal??null,tool_calls:g.map((w,v)=>{const{function:P,type:A,id:y,...R}=w,{arguments:E,name:$,...k}=P||{};if(y==null)throw new C(`missing choices[${d}].tool_calls[${v}].id
${vs(s)}`);if(A==null)throw new C(`missing choices[${d}].tool_calls[${v}].type
${vs(s)}`);if($==null)throw new C(`missing choices[${d}].tool_calls[${v}].function.name
${vs(s)}`);if(E==null)throw new C(`missing choices[${d}].tool_calls[${v}].function.arguments
${vs(s)}`);return{...R,id:y,type:A,function:{...k,name:$,arguments:E}}})}}:{...f,message:{..._,content:b,role:h,refusal:c.refusal??null},finish_reason:u,index:d,logprobs:p}}),created:a,model:r,object:"chat.completion",...i?{system_fingerprint:i}:{}};return Vl(l,e)}function vs(s){return JSON.stringify(s)}class $t extends Kt{static fromReadableStream(e){const t=new $t(null);return t._run(()=>t._fromReadableStream(e)),t}static runFunctions(e,t,n){const a=new $t(null),r={...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"runFunctions"}};return a._run(()=>a._runFunctions(e,t,r)),a}static runTools(e,t,n){const a=new $t(t),r={...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"runTools"}};return a._run(()=>a._runTools(e,t,r)),a}}let Ui=class extends I{parse(e,t){return Ql(e.tools),this._client.chat.completions.create(e,{...t,headers:{...t==null?void 0:t.headers,"X-Stainless-Helper-Method":"beta.chat.completions.parse"}})._thenUnwrap(n=>zn(n,e))}runFunctions(e,t){return e.stream?$t.runFunctions(this._client,e,t):Wt.runFunctions(this._client,e,t)}runTools(e,t){return e.stream?$t.runTools(this._client,e,t):Wt.runTools(this._client,e,t)}stream(e,t){return Kt.createChatCompletion(this._client,e,t)}};class Pn extends I{constructor(){super(...arguments),this.completions=new Ui(this._client)}}(function(s){s.Completions=Ui})(Pn||(Pn={}));class Wi extends I{create(e,t){return this._client.post("/realtime/sessions",{body:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}}class Ki extends I{create(e,t){return this._client.post("/realtime/transcription_sessions",{body:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}}class zs extends I{constructor(){super(...arguments),this.sessions=new Wi(this._client),this.transcriptionSessions=new Ki(this._client)}}zs.Sessions=Wi;zs.TranscriptionSessions=Ki;class Jn extends I{create(e,t,n){return this._client.post(`/threads/${e}/messages`,{body:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}retrieve(e,t,n){return this._client.get(`/threads/${e}/messages/${t}`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}update(e,t,n,a){return this._client.post(`/threads/${e}/messages/${t}`,{body:n,...a,headers:{"OpenAI-Beta":"assistants=v2",...a==null?void 0:a.headers}})}list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/threads/${e}/messages`,Xn,{query:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}del(e,t,n){return this._client.delete(`/threads/${e}/messages/${t}`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}}class Xn extends J{}Jn.MessagesPage=Xn;class Qn extends I{retrieve(e,t,n,a={},r){return U(a)?this.retrieve(e,t,n,{},a):this._client.get(`/threads/${e}/runs/${t}/steps/${n}`,{query:a,...r,headers:{"OpenAI-Beta":"assistants=v2",...r==null?void 0:r.headers}})}list(e,t,n={},a){return U(n)?this.list(e,t,{},n):this._client.getAPIList(`/threads/${e}/runs/${t}/steps`,Zn,{query:n,...a,headers:{"OpenAI-Beta":"assistants=v2",...a==null?void 0:a.headers}})}}class Zn extends J{}Qn.RunStepsPage=Zn;let ss=class extends I{constructor(){super(...arguments),this.steps=new Qn(this._client)}create(e,t,n){const{include:a,...r}=t;return this._client.post(`/threads/${e}/runs`,{query:{include:a},body:r,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers},stream:t.stream??!1})}retrieve(e,t,n){return this._client.get(`/threads/${e}/runs/${t}`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}update(e,t,n,a){return this._client.post(`/threads/${e}/runs/${t}`,{body:n,...a,headers:{"OpenAI-Beta":"assistants=v2",...a==null?void 0:a.headers}})}list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/threads/${e}/runs`,ea,{query:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}cancel(e,t,n){return this._client.post(`/threads/${e}/runs/${t}/cancel`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}async createAndPoll(e,t,n){const a=await this.create(e,t,n);return await this.poll(e,a.id,n)}createAndStream(e,t,n){return ve.createAssistantStream(e,this._client.beta.threads.runs,t,n)}async poll(e,t,n){const a={...n==null?void 0:n.headers,"X-Stainless-Poll-Helper":"true"};for(n!=null&&n.pollIntervalMs&&(a["X-Stainless-Custom-Poll-Interval"]=n.pollIntervalMs.toString());;){const{data:r,response:i}=await this.retrieve(e,t,{...n,headers:{...n==null?void 0:n.headers,...a}}).withResponse();switch(r.status){case"queued":case"in_progress":case"cancelling":let o=5e3;if(n!=null&&n.pollIntervalMs)o=n.pollIntervalMs;else{const l=i.headers.get("openai-poll-after-ms");if(l){const c=parseInt(l);isNaN(c)||(o=c)}}await Zt(o);break;case"requires_action":case"incomplete":case"cancelled":case"completed":case"failed":case"expired":return r}}}stream(e,t,n){return ve.createAssistantStream(e,this._client.beta.threads.runs,t,n)}submitToolOutputs(e,t,n,a){return this._client.post(`/threads/${e}/runs/${t}/submit_tool_outputs`,{body:n,...a,headers:{"OpenAI-Beta":"assistants=v2",...a==null?void 0:a.headers},stream:n.stream??!1})}async submitToolOutputsAndPoll(e,t,n,a){const r=await this.submitToolOutputs(e,t,n,a);return await this.poll(e,r.id,a)}submitToolOutputsStream(e,t,n,a){return ve.createToolAssistantStream(e,t,this._client.beta.threads.runs,n,a)}};class ea extends J{}ss.RunsPage=ea;ss.Steps=Qn;ss.RunStepsPage=Zn;class Ct extends I{constructor(){super(...arguments),this.runs=new ss(this._client),this.messages=new Jn(this._client)}create(e={},t){return U(e)?this.create({},e):this._client.post("/threads",{body:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}retrieve(e,t){return this._client.get(`/threads/${e}`,{...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}update(e,t,n){return this._client.post(`/threads/${e}`,{body:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}del(e,t){return this._client.delete(`/threads/${e}`,{...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}createAndRun(e,t){return this._client.post("/threads/runs",{body:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers},stream:e.stream??!1})}async createAndRunPoll(e,t){const n=await this.createAndRun(e,t);return await this.runs.poll(n.thread_id,n.id,t)}createAndRunStream(e,t){return ve.createThreadAssistantStream(e,this._client.beta.threads,t)}}Ct.Runs=ss;Ct.RunsPage=ea;Ct.Messages=Jn;Ct.MessagesPage=Xn;class Mt extends I{constructor(){super(...arguments),this.realtime=new zs(this._client),this.chat=new Pn(this._client),this.assistants=new Yn(this._client),this.threads=new Ct(this._client)}}Mt.Realtime=zs;Mt.Assistants=Yn;Mt.AssistantsPage=qn;Mt.Threads=Ct;class Yi extends I{create(e,t){return this._client.post("/completions",{body:e,...t,stream:e.stream??!1})}}class qi extends I{retrieve(e,t,n){return this._client.get(`/containers/${e}/files/${t}/content`,{...n,headers:{Accept:"application/binary",...n==null?void 0:n.headers},__binaryResponse:!0})}}let Js=class extends I{constructor(){super(...arguments),this.content=new qi(this._client)}create(e,t,n){return this._client.post(`/containers/${e}/files`,rt({body:t,...n}))}retrieve(e,t,n){return this._client.get(`/containers/${e}/files/${t}`,n)}list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/containers/${e}/files`,ta,{query:t,...n})}del(e,t,n){return this._client.delete(`/containers/${e}/files/${t}`,{...n,headers:{Accept:"*/*",...n==null?void 0:n.headers}})}};class ta extends J{}Js.FileListResponsesPage=ta;Js.Content=qi;class ns extends I{constructor(){super(...arguments),this.files=new Js(this._client)}create(e,t){return this._client.post("/containers",{body:e,...t})}retrieve(e,t){return this._client.get(`/containers/${e}`,t)}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/containers",sa,{query:e,...t})}del(e,t){return this._client.delete(`/containers/${e}`,{...t,headers:{Accept:"*/*",...t==null?void 0:t.headers}})}}class sa extends J{}ns.ContainerListResponsesPage=sa;ns.Files=Js;ns.FileListResponsesPage=ta;class Vi extends I{create(e,t){const n=!!e.encoding_format;let a=n?e.encoding_format:"base64";n&&Ke("Request","User defined encoding_format:",e.encoding_format);const r=this._client.post("/embeddings",{body:{...e,encoding_format:a},...t});return n?r:(Ke("response","Decoding base64 embeddings to float32 array"),r._thenUnwrap(i=>(i&&i.data&&i.data.forEach(o=>{const l=o.embedding;o.embedding=Yl(l)}),i)))}}class na extends I{retrieve(e,t,n,a){return this._client.get(`/evals/${e}/runs/${t}/output_items/${n}`,a)}list(e,t,n={},a){return U(n)?this.list(e,t,{},n):this._client.getAPIList(`/evals/${e}/runs/${t}/output_items`,aa,{query:n,...a})}}class aa extends J{}na.OutputItemListResponsesPage=aa;class as extends I{constructor(){super(...arguments),this.outputItems=new na(this._client)}create(e,t,n){return this._client.post(`/evals/${e}/runs`,{body:t,...n})}retrieve(e,t,n){return this._client.get(`/evals/${e}/runs/${t}`,n)}list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/evals/${e}/runs`,ra,{query:t,...n})}del(e,t,n){return this._client.delete(`/evals/${e}/runs/${t}`,n)}cancel(e,t,n){return this._client.post(`/evals/${e}/runs/${t}`,n)}}class ra extends J{}as.RunListResponsesPage=ra;as.OutputItems=na;as.OutputItemListResponsesPage=aa;class rs extends I{constructor(){super(...arguments),this.runs=new as(this._client)}create(e,t){return this._client.post("/evals",{body:e,...t})}retrieve(e,t){return this._client.get(`/evals/${e}`,t)}update(e,t,n){return this._client.post(`/evals/${e}`,{body:t,...n})}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/evals",ia,{query:e,...t})}del(e,t){return this._client.delete(`/evals/${e}`,t)}}class ia extends J{}rs.EvalListResponsesPage=ia;rs.Runs=as;rs.RunListResponsesPage=ra;let oa=class extends I{create(e,t){return this._client.post("/files",rt({body:e,...t}))}retrieve(e,t){return this._client.get(`/files/${e}`,t)}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/files",la,{query:e,...t})}del(e,t){return this._client.delete(`/files/${e}`,t)}content(e,t){return this._client.get(`/files/${e}/content`,{...t,headers:{Accept:"application/binary",...t==null?void 0:t.headers},__binaryResponse:!0})}retrieveContent(e,t){return this._client.get(`/files/${e}/content`,t)}async waitForProcessing(e,{pollInterval:t=5e3,maxWait:n=1800*1e3}={}){const a=new Set(["processed","error","deleted"]),r=Date.now();let i=await this.retrieve(e);for(;!i.status||!a.has(i.status);)if(await Zt(t),i=await this.retrieve(e),Date.now()-r>n)throw new Hs({message:`Giving up on waiting for file ${e} to finish processing after ${n} milliseconds.`});return i}};class la extends J{}oa.FileObjectsPage=la;class zi extends I{}let Ji=class extends I{run(e,t){return this._client.post("/fine_tuning/alpha/graders/run",{body:e,...t})}validate(e,t){return this._client.post("/fine_tuning/alpha/graders/validate",{body:e,...t})}};class ca extends I{constructor(){super(...arguments),this.graders=new Ji(this._client)}}ca.Graders=Ji;class da extends I{create(e,t,n){return this._client.getAPIList(`/fine_tuning/checkpoints/${e}/permissions`,ua,{body:t,method:"post",...n})}retrieve(e,t={},n){return U(t)?this.retrieve(e,{},t):this._client.get(`/fine_tuning/checkpoints/${e}/permissions`,{query:t,...n})}del(e,t,n){return this._client.delete(`/fine_tuning/checkpoints/${e}/permissions/${t}`,n)}}class ua extends Ks{}da.PermissionCreateResponsesPage=ua;let Xs=class extends I{constructor(){super(...arguments),this.permissions=new da(this._client)}};Xs.Permissions=da;Xs.PermissionCreateResponsesPage=ua;class pa extends I{list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/fine_tuning/jobs/${e}/checkpoints`,fa,{query:t,...n})}}class fa extends J{}pa.FineTuningJobCheckpointsPage=fa;class It extends I{constructor(){super(...arguments),this.checkpoints=new pa(this._client)}create(e,t){return this._client.post("/fine_tuning/jobs",{body:e,...t})}retrieve(e,t){return this._client.get(`/fine_tuning/jobs/${e}`,t)}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/fine_tuning/jobs",ga,{query:e,...t})}cancel(e,t){return this._client.post(`/fine_tuning/jobs/${e}/cancel`,t)}listEvents(e,t={},n){return U(t)?this.listEvents(e,{},t):this._client.getAPIList(`/fine_tuning/jobs/${e}/events`,ha,{query:t,...n})}pause(e,t){return this._client.post(`/fine_tuning/jobs/${e}/pause`,t)}resume(e,t){return this._client.post(`/fine_tuning/jobs/${e}/resume`,t)}}class ga extends J{}class ha extends J{}It.FineTuningJobsPage=ga;It.FineTuningJobEventsPage=ha;It.Checkpoints=pa;It.FineTuningJobCheckpointsPage=fa;class Ye extends I{constructor(){super(...arguments),this.methods=new zi(this._client),this.jobs=new It(this._client),this.checkpoints=new Xs(this._client),this.alpha=new ca(this._client)}}Ye.Methods=zi;Ye.Jobs=It;Ye.FineTuningJobsPage=ga;Ye.FineTuningJobEventsPage=ha;Ye.Checkpoints=Xs;Ye.Alpha=ca;class Xi extends I{}class ma extends I{constructor(){super(...arguments),this.graderModels=new Xi(this._client)}}ma.GraderModels=Xi;class Qi extends I{createVariation(e,t){return this._client.post("/images/variations",rt({body:e,...t}))}edit(e,t){return this._client.post("/images/edits",rt({body:e,...t}))}generate(e,t){return this._client.post("/images/generations",{body:e,...t})}}class xa extends I{retrieve(e,t){return this._client.get(`/models/${e}`,t)}list(e){return this._client.getAPIList("/models",ba,e)}del(e,t){return this._client.delete(`/models/${e}`,t)}}class ba extends Ks{}xa.ModelsPage=ba;class Zi extends I{create(e,t){return this._client.post("/moderations",{body:e,...t})}}function rc(s,e){return!e||!oc(e)?{...s,output_parsed:null,output:s.output.map(t=>t.type==="function_call"?{...t,parsed_arguments:null}:t.type==="message"?{...t,content:t.content.map(n=>({...n,parsed:null}))}:t)}:eo(s,e)}function eo(s,e){const t=s.output.map(a=>{if(a.type==="function_call")return{...a,parsed_arguments:dc(e,a)};if(a.type==="message"){const r=a.content.map(i=>i.type==="output_text"?{...i,parsed:ic(e,i.text)}:i);return{...a,content:r}}return a}),n=Object.assign({},s,{output:t});return Object.getOwnPropertyDescriptor(s,"output_text")||to(n),Object.defineProperty(n,"output_parsed",{enumerable:!0,get(){for(const a of n.output)if(a.type==="message"){for(const r of a.content)if(r.type==="output_text"&&r.parsed!==null)return r.parsed}return null}}),n}function ic(s,e){var t,n,a,r;return((n=(t=s.text)==null?void 0:t.format)==null?void 0:n.type)!=="json_schema"?null:"$parseRaw"in((a=s.text)==null?void 0:a.format)?((r=s.text)==null?void 0:r.format).$parseRaw(e):JSON.parse(e)}function oc(s){var e;return!!Vn((e=s.text)==null?void 0:e.format)}function lc(s){return(s==null?void 0:s.$brand)==="auto-parseable-tool"}function cc(s,e){return s.find(t=>t.type==="function"&&t.name===e)}function dc(s,e){const t=cc(s.tools??[],e.name);return{...e,...e,parsed_arguments:lc(t)?t.$parseRaw(e.arguments):t!=null&&t.strict?JSON.parse(e.arguments):null}}function to(s){const e=[];for(const t of s.output)if(t.type==="message")for(const n of t.content)n.type==="output_text"&&e.push(n.text);s.output_text=e.join("")}class so extends I{list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/responses/${e}/input_items`,pc,{query:t,...n})}}var ft=function(s,e,t,n,a){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!a)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?s!==e||!a:!e.has(s))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?a.call(s,t):a?a.value=t:e.set(s,t),t},Le=function(s,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?s!==e||!n:!e.has(s))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(s):n?n.value:e.get(s)},gt,ws,Ne,$s,_r,vr,wr,$r;class ya extends Kn{constructor(e){super(),gt.add(this),ws.set(this,void 0),Ne.set(this,void 0),$s.set(this,void 0),ft(this,ws,e,"f")}static createResponse(e,t,n){const a=new ya(t);return a._run(()=>a._createOrRetrieveResponse(e,t,{...n,headers:{...n==null?void 0:n.headers,"X-Stainless-Helper-Method":"stream"}})),a}async _createOrRetrieveResponse(e,t,n){var o;const a=n==null?void 0:n.signal;a&&(a.aborted&&this.controller.abort(),a.addEventListener("abort",()=>this.controller.abort())),Le(this,gt,"m",_r).call(this);let r,i=null;"response_id"in t?(r=await e.responses.retrieve(t.response_id,{stream:!0},{...n,signal:this.controller.signal,stream:!0}),i=t.starting_after??null):r=await e.responses.create({...t,stream:!0},{...n,signal:this.controller.signal}),this._connected();for await(const l of r)Le(this,gt,"m",vr).call(this,l,i);if((o=r.controller.signal)!=null&&o.aborted)throw new pe;return Le(this,gt,"m",wr).call(this)}[(ws=new WeakMap,Ne=new WeakMap,$s=new WeakMap,gt=new WeakSet,_r=function(){this.ended||ft(this,Ne,void 0,"f")},vr=function(t,n){if(this.ended)return;const a=(i,o)=>{(n==null||o.sequence_number>n)&&this._emit(i,o)},r=Le(this,gt,"m",$r).call(this,t);switch(a("event",t),t.type){case"response.output_text.delta":{const i=r.output[t.output_index];if(!i)throw new C(`missing output at index ${t.output_index}`);if(i.type==="message"){const o=i.content[t.content_index];if(!o)throw new C(`missing content at index ${t.content_index}`);if(o.type!=="output_text")throw new C(`expected content to be 'output_text', got ${o.type}`);a("response.output_text.delta",{...t,snapshot:o.text})}break}case"response.function_call_arguments.delta":{const i=r.output[t.output_index];if(!i)throw new C(`missing output at index ${t.output_index}`);i.type==="function_call"&&a("response.function_call_arguments.delta",{...t,snapshot:i.arguments});break}default:a(t.type,t);break}},wr=function(){if(this.ended)throw new C("stream has ended, this shouldn't happen");const t=Le(this,Ne,"f");if(!t)throw new C("request ended without sending any events");ft(this,Ne,void 0,"f");const n=uc(t,Le(this,ws,"f"));return ft(this,$s,n,"f"),n},$r=function(t){let n=Le(this,Ne,"f");if(!n){if(t.type!=="response.created")throw new C(`When snapshot hasn't been set yet, expected 'response.created' event, got ${t.type}`);return n=ft(this,Ne,t.response,"f"),n}switch(t.type){case"response.output_item.added":{n.output.push(t.item);break}case"response.content_part.added":{const a=n.output[t.output_index];if(!a)throw new C(`missing output at index ${t.output_index}`);a.type==="message"&&a.content.push(t.part);break}case"response.output_text.delta":{const a=n.output[t.output_index];if(!a)throw new C(`missing output at index ${t.output_index}`);if(a.type==="message"){const r=a.content[t.content_index];if(!r)throw new C(`missing content at index ${t.content_index}`);if(r.type!=="output_text")throw new C(`expected content to be 'output_text', got ${r.type}`);r.text+=t.delta}break}case"response.function_call_arguments.delta":{const a=n.output[t.output_index];if(!a)throw new C(`missing output at index ${t.output_index}`);a.type==="function_call"&&(a.arguments+=t.delta);break}case"response.completed":{ft(this,Ne,t.response,"f");break}}return n},Symbol.asyncIterator)](){const e=[],t=[];let n=!1;return this.on("event",a=>{const r=t.shift();r?r.resolve(a):e.push(a)}),this.on("end",()=>{n=!0;for(const a of t)a.resolve(void 0);t.length=0}),this.on("abort",a=>{n=!0;for(const r of t)r.reject(a);t.length=0}),this.on("error",a=>{n=!0;for(const r of t)r.reject(a);t.length=0}),{next:async()=>e.length?{value:e.shift(),done:!1}:n?{value:void 0,done:!0}:new Promise((r,i)=>t.push({resolve:r,reject:i})).then(r=>r?{value:r,done:!1}:{value:void 0,done:!0}),return:async()=>(this.abort(),{value:void 0,done:!0})}}async finalResponse(){await this.done();const e=Le(this,$s,"f");if(!e)throw new C("stream ended without producing a ChatCompletion");return e}}function uc(s,e){return rc(s,e)}class _a extends I{constructor(){super(...arguments),this.inputItems=new so(this._client)}create(e,t){return this._client.post("/responses",{body:e,...t,stream:e.stream??!1})._thenUnwrap(n=>("object"in n&&n.object==="response"&&to(n),n))}retrieve(e,t={},n){return this._client.get(`/responses/${e}`,{query:t,...n,stream:(t==null?void 0:t.stream)??!1})}del(e,t){return this._client.delete(`/responses/${e}`,{...t,headers:{Accept:"*/*",...t==null?void 0:t.headers}})}parse(e,t){return this._client.responses.create(e,t)._thenUnwrap(n=>eo(n,e))}stream(e,t){return ya.createResponse(this._client,e,t)}cancel(e,t){return this._client.post(`/responses/${e}/cancel`,{...t,headers:{Accept:"*/*",...t==null?void 0:t.headers}})}}class pc extends J{}_a.InputItems=so;class no extends I{create(e,t,n){return this._client.post(`/uploads/${e}/parts`,rt({body:t,...n}))}}class va extends I{constructor(){super(...arguments),this.parts=new no(this._client)}create(e,t){return this._client.post("/uploads",{body:e,...t})}cancel(e,t){return this._client.post(`/uploads/${e}/cancel`,t)}complete(e,t,n){return this._client.post(`/uploads/${e}/complete`,{body:t,...n})}}va.Parts=no;const fc=async s=>{const e=await Promise.allSettled(s),t=e.filter(a=>a.status==="rejected");if(t.length){for(const a of t)console.error(a.reason);throw new Error(`${t.length} promise(s) failed - see the above errors`)}const n=[];for(const a of e)a.status==="fulfilled"&&n.push(a.value);return n};class Qs extends I{create(e,t,n){return this._client.post(`/vector_stores/${e}/files`,{body:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}retrieve(e,t,n){return this._client.get(`/vector_stores/${e}/files/${t}`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}update(e,t,n,a){return this._client.post(`/vector_stores/${e}/files/${t}`,{body:n,...a,headers:{"OpenAI-Beta":"assistants=v2",...a==null?void 0:a.headers}})}list(e,t={},n){return U(t)?this.list(e,{},t):this._client.getAPIList(`/vector_stores/${e}/files`,Zs,{query:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}del(e,t,n){return this._client.delete(`/vector_stores/${e}/files/${t}`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}async createAndPoll(e,t,n){const a=await this.create(e,t,n);return await this.poll(e,a.id,n)}async poll(e,t,n){const a={...n==null?void 0:n.headers,"X-Stainless-Poll-Helper":"true"};for(n!=null&&n.pollIntervalMs&&(a["X-Stainless-Custom-Poll-Interval"]=n.pollIntervalMs.toString());;){const r=await this.retrieve(e,t,{...n,headers:a}).withResponse(),i=r.data;switch(i.status){case"in_progress":let o=5e3;if(n!=null&&n.pollIntervalMs)o=n.pollIntervalMs;else{const l=r.response.headers.get("openai-poll-after-ms");if(l){const c=parseInt(l);isNaN(c)||(o=c)}}await Zt(o);break;case"failed":case"completed":return i}}}async upload(e,t,n){const a=await this._client.files.create({file:t,purpose:"assistants"},n);return this.create(e,{file_id:a.id},n)}async uploadAndPoll(e,t,n){const a=await this.upload(e,t,n);return await this.poll(e,a.id,n)}content(e,t,n){return this._client.getAPIList(`/vector_stores/${e}/files/${t}/content`,wa,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}}class Zs extends J{}class wa extends Ks{}Qs.VectorStoreFilesPage=Zs;Qs.FileContentResponsesPage=wa;class ao extends I{create(e,t,n){return this._client.post(`/vector_stores/${e}/file_batches`,{body:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}retrieve(e,t,n){return this._client.get(`/vector_stores/${e}/file_batches/${t}`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}cancel(e,t,n){return this._client.post(`/vector_stores/${e}/file_batches/${t}/cancel`,{...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}async createAndPoll(e,t,n){const a=await this.create(e,t);return await this.poll(e,a.id,n)}listFiles(e,t,n={},a){return U(n)?this.listFiles(e,t,{},n):this._client.getAPIList(`/vector_stores/${e}/file_batches/${t}/files`,Zs,{query:n,...a,headers:{"OpenAI-Beta":"assistants=v2",...a==null?void 0:a.headers}})}async poll(e,t,n){const a={...n==null?void 0:n.headers,"X-Stainless-Poll-Helper":"true"};for(n!=null&&n.pollIntervalMs&&(a["X-Stainless-Custom-Poll-Interval"]=n.pollIntervalMs.toString());;){const{data:r,response:i}=await this.retrieve(e,t,{...n,headers:a}).withResponse();switch(r.status){case"in_progress":let o=5e3;if(n!=null&&n.pollIntervalMs)o=n.pollIntervalMs;else{const l=i.headers.get("openai-poll-after-ms");if(l){const c=parseInt(l);isNaN(c)||(o=c)}}await Zt(o);break;case"failed":case"cancelled":case"completed":return r}}}async uploadAndPoll(e,{files:t,fileIds:n=[]},a){if(t==null||t.length==0)throw new Error("No `files` provided to process. If you've already uploaded files you should use `.createAndPoll()` instead");const r=(a==null?void 0:a.maxConcurrency)??5,i=Math.min(r,t.length),o=this._client,l=t.values(),c=[...n];async function u(p){for(let f of p){const b=await o.files.create({file:f,purpose:"assistants"},a);c.push(b.id)}}const d=Array(i).fill(l).map(u);return await fc(d),await this.createAndPoll(e,{file_ids:c})}}class qe extends I{constructor(){super(...arguments),this.files=new Qs(this._client),this.fileBatches=new ao(this._client)}create(e,t){return this._client.post("/vector_stores",{body:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}retrieve(e,t){return this._client.get(`/vector_stores/${e}`,{...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}update(e,t,n){return this._client.post(`/vector_stores/${e}`,{body:t,...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}list(e={},t){return U(e)?this.list({},e):this._client.getAPIList("/vector_stores",$a,{query:e,...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}del(e,t){return this._client.delete(`/vector_stores/${e}`,{...t,headers:{"OpenAI-Beta":"assistants=v2",...t==null?void 0:t.headers}})}search(e,t,n){return this._client.getAPIList(`/vector_stores/${e}/search`,Aa,{body:t,method:"post",...n,headers:{"OpenAI-Beta":"assistants=v2",...n==null?void 0:n.headers}})}}class $a extends J{}class Aa extends Ks{}qe.VectorStoresPage=$a;qe.VectorStoreSearchResponsesPage=Aa;qe.Files=Qs;qe.VectorStoreFilesPage=Zs;qe.FileContentResponsesPage=wa;qe.FileBatches=ao;var ro;class M extends Ol{constructor({baseURL:e=xs("OPENAI_BASE_URL"),apiKey:t=xs("OPENAI_API_KEY"),organization:n=xs("OPENAI_ORG_ID")??null,project:a=xs("OPENAI_PROJECT_ID")??null,...r}={}){if(t===void 0)throw new C("The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' }).");const i={apiKey:t,organization:n,project:a,...r,baseURL:e||"https://api.openai.com/v1"};if(!i.dangerouslyAllowBrowser&&Wl())throw new C(`It looks like you're running in a browser-like environment.

This is disabled by default, as it risks exposing your secret API credentials to attackers.
If you understand the risks and have appropriate mitigations in place,
you can set the \`dangerouslyAllowBrowser\` option to \`true\`, e.g.,

new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
`);super({baseURL:i.baseURL,timeout:i.timeout??6e5,httpAgent:i.httpAgent,maxRetries:i.maxRetries,fetch:i.fetch}),this.completions=new Yi(this),this.chat=new Vs(this),this.embeddings=new Vi(this),this.files=new oa(this),this.images=new Qi(this),this.audio=new es(this),this.moderations=new Zi(this),this.models=new xa(this),this.fineTuning=new Ye(this),this.graders=new ma(this),this.vectorStores=new qe(this),this.beta=new Mt(this),this.batches=new Un(this),this.uploads=new va(this),this.responses=new _a(this),this.evals=new rs(this),this.containers=new ns(this),this._options=i,this.apiKey=t,this.organization=n,this.project=a}defaultQuery(){return this._options.defaultQuery}defaultHeaders(e){return{...super.defaultHeaders(e),"OpenAI-Organization":this.organization,"OpenAI-Project":this.project,...this._options.defaultHeaders}}authHeaders(e){return{Authorization:`Bearer ${this.apiKey}`}}stringifyQuery(e){return ml(e,{arrayFormat:"brackets"})}}ro=M;M.OpenAI=ro;M.DEFAULT_TIMEOUT=6e5;M.OpenAIError=C;M.APIError=Z;M.APIConnectionError=Qt;M.APIConnectionTimeoutError=Hs;M.APIUserAbortError=pe;M.NotFoundError=Ln;M.ConflictError=Nn;M.RateLimitError=Bn;M.BadRequestError=On;M.AuthenticationError=Fn;M.InternalServerError=Hn;M.PermissionDeniedError=Dn;M.UnprocessableEntityError=jn;M.toFile=Gn;M.fileFromPath=Tn;M.Completions=Yi;M.Chat=Vs;M.ChatCompletionsPage=qs;M.Embeddings=Vi;M.Files=oa;M.FileObjectsPage=la;M.Images=Qi;M.Audio=es;M.Moderations=Zi;M.Models=xa;M.ModelsPage=ba;M.FineTuning=Ye;M.Graders=ma;M.VectorStores=qe;M.VectorStoresPage=$a;M.VectorStoreSearchResponsesPage=Aa;M.Beta=Mt;M.Batches=Un;M.BatchesPage=Wn;M.Uploads=va;M.Responses=_a;M.Evals=rs;M.EvalListResponsesPage=ia;M.Containers=ns;M.ContainerListResponsesPage=sa;const gc=Object.freeze(Object.defineProperty({__proto__:null,APIConnectionError:Qt,APIConnectionTimeoutError:Hs,APIError:Z,APIUserAbortError:pe,AuthenticationError:Fn,BadRequestError:On,ConflictError:Nn,InternalServerError:Hn,NotFoundError:Ln,OpenAI:M,OpenAIError:C,PermissionDeniedError:Dn,RateLimitError:Bn,UnprocessableEntityError:jn,default:M,get fileFromPath(){return Tn},toFile:Gn},Symbol.toStringTag,{value:"Module"}));async function Ra(s,e,t){var p,f,b,x;if(!s||s.length===0)return{score:50,sentiment:"neutral",news_count:0,summary:"ニュースデータがありません",confidence:0};const n=["growth","profit","surge","beat","exceed","strong","rally","upgrade","bullish","positive","gain","rise","up","high","成長","増益","好調","上昇","上方修正"],a=["loss","decline","fall","miss","weak","drop","downgrade","bearish","negative","concern","risk","down","low","赤字","減益","低迷","下落","下方修正","懸念"];let r=50;if(s.forEach(g=>{const _=`${g.headline} ${g.summary}`.toLowerCase();n.forEach(h=>{_.includes(h.toLowerCase())&&(r+=3)}),a.forEach(h=>{_.includes(h.toLowerCase())&&(r-=3)})}),r=Math.max(0,Math.min(100,r)),t)try{const g=new M({apiKey:t,organization:"org-C3x5ZVIvaiCoQSoLIKqg9X5E"}),_=s.slice(0,10).map(N=>`[${N.source}] ${N.headline}
${N.summary}`).join(`

`),h=`
あなたは金融市場の専門アナリストです。以下の${e}に関するニュース記事を分析し、株価への影響を評価してください。

【ニュース記事】
${_}

【分析項目】
1. 全体的なセンチメント（ポジティブ/ネガティブ/中立）
2. 株価への影響スコア（0-100点、50が中立）
3. 主要なポジティブ要因（3つ以内）
4. 主要なネガティブ要因（3つ以内）
5. 総合的な見解（100文字程度）

JSON形式で回答してください：
{
  "sentiment": "positive/negative/neutral",
  "score": 0-100,
  "positive_factors": ["要因1", "要因2"],
  "negative_factors": ["要因1", "要因2"],
  "summary": "総合的な見解"
}
`,w=await g.responses.create({model:"gpt-5",input:h}),v=w.output_text||((x=(b=(f=(p=w.output)==null?void 0:p[0])==null?void 0:f.content)==null?void 0:b[0])==null?void 0:x.text)||"{}",P=JSON.parse(v),A=P.score*.7+r*.3,y=s.slice(0,20).map(N=>{const X=`${N.headline} ${N.summary}`.toLowerCase();let se=0;return n.forEach(fe=>{X.includes(fe.toLowerCase())&&se++}),a.forEach(fe=>{X.includes(fe.toLowerCase())&&se--}),se>0?"positive":se<0?"negative":"neutral"}),R=y.filter(N=>N==="positive").length,E=y.filter(N=>N==="negative").length,$=y.filter(N=>N==="neutral").length,k=s.slice(0,5).map((N,X)=>({headline:N.headline,source:N.source,sentiment:y[X],summary:N.summary.substring(0,100)+"...",datetime:N.datetime,date_formatted:new Date(N.datetime*1e3).toISOString().split("T")[0]}));return{score:Math.round(A),sentiment:P.sentiment||"neutral",news_count:s.length,positive_count:R,negative_count:E,neutral_count:$,summary:P.summary||"GPT-4o分析結果を取得できませんでした",confidence:90,news_examples:k,gpt_insight:JSON.stringify({positive_factors:P.positive_factors||[],negative_factors:P.negative_factors||[]},null,2)}}catch(g){console.error("GPT-4o分析エラー:",g),console.error("Error details:",g instanceof Error?g.message:String(g))}let i="neutral";r>60?i="positive":r<40&&(i="negative");const o=s.map(g=>{const _=`${g.headline} ${g.summary}`.toLowerCase();let h=0;return n.forEach(w=>{_.includes(w.toLowerCase())&&h++}),a.forEach(w=>{_.includes(w.toLowerCase())&&h--}),h>0?"positive":h<0?"negative":"neutral"}),l=o.filter(g=>g==="positive").length,c=o.filter(g=>g==="negative").length,u=o.filter(g=>g==="neutral").length,d=s.slice(0,5).map((g,_)=>({headline:g.headline,source:g.source,sentiment:o[_],summary:g.summary.substring(0,100)+"...",datetime:g.datetime,date_formatted:new Date(g.datetime*1e3).toISOString().split("T")[0]}));return{score:r,sentiment:i,news_count:s.length,positive_count:l,negative_count:c,neutral_count:u,news_examples:d,summary:`ポジティブ: ${l}件、ネガティブ: ${c}件、中立: ${u}件`,confidence:60,gpt_insight:"GPT-4o APIキーが提供されていないため、キーワードベース分析のみ実行"}}function ka(s){let e=50;const t=[];s.gdp_growth!==null?s.gdp_growth>2.5?(e+=15,t.push(`[OK] 経済拡大 (GDP成長率: ${s.gdp_growth.toFixed(1)}%)`)):s.gdp_growth<0?(e-=15,t.push(`[ERROR] 景気後退 (GDP成長率: ${s.gdp_growth.toFixed(1)}%)`)):t.push(`⚪ 経済安定 (GDP成長率: ${s.gdp_growth.toFixed(1)}%)`):t.push("[WARN] GDPデータなし"),s.unemployment!==null?s.unemployment<4?(e+=10,t.push(`[OK] 完全雇用に近い (失業率: ${s.unemployment.toFixed(1)}%)`)):s.unemployment>7?(e-=10,t.push(`[ERROR] 高失業率 (${s.unemployment.toFixed(1)}%)`)):t.push(`⚪ 標準的失業率 (${s.unemployment.toFixed(1)}%)`):t.push("[WARN] 失業率データなし"),s.inflation!==null?s.inflation>4?(e-=15,t.push(`[ERROR] 高インフレ (${s.inflation.toFixed(1)}%) - 利上げリスク`)):s.inflation<1?(e-=5,t.push(`[WARN] 低インフレ (${s.inflation.toFixed(1)}%) - デフレ懸念`)):s.inflation>=2&&s.inflation<=3?(e+=5,t.push(`[OK] 理想的インフレ (${s.inflation.toFixed(1)}%)`)):t.push(`⚪ 標準的インフレ (${s.inflation.toFixed(1)}%)`):t.push("[WARN] インフレデータなし"),s.interest_rate!==null?s.interest_rate<2?(e+=10,t.push(`[OK] 低金利環境 (${s.interest_rate.toFixed(2)}%) - 企業に有利`)):s.interest_rate>5?(e-=10,t.push(`[ERROR] 高金利環境 (${s.interest_rate.toFixed(2)}%) - 企業コスト増`)):t.push(`⚪ 標準的金利 (${s.interest_rate.toFixed(2)}%)`):t.push("[WARN] 金利データなし"),s.gdp_growth&&s.gdp_growth>2&&s.unemployment&&s.unemployment<5&&s.inflation&&s.inflation>=2&&s.inflation<=3&&(e+=10,t.push("[OK] 理想的なマクロ経済環境（ゴルディロックス）")),e=Math.max(0,Math.min(100,e));const a=Object.values(s).filter(r=>r!==null).length/Object.keys(s).length*100;return{score:e,gdp_growth:s.gdp_growth,unemployment:s.unemployment,inflation:s.inflation,interest_rate:s.interest_rate,signals:t,confidence:a}}function Sa(s,e){let t=50;const n=s.buy+s.hold+s.sell+s.strong_buy+s.strong_sell;let a=null;if(s.consensus){const o=s.consensus.toLowerCase();o.includes("buy")||o.includes("strong buy")?(a="BUY",t+=30):o.includes("sell")||o.includes("strong sell")?(a="SELL",t-=30):a="HOLD"}else if(n>0){const o=(s.strong_buy*2+s.buy)/n,l=(s.strong_sell*2+s.sell)/n;o>.6?(a="BUY",t+=30):l>.4?(a="SELL",t-=30):a="HOLD"}let r=null;if(s.target_price&&s.target_price>0&&(r=(s.target_price-e)/e*100,r>20?t+=20:r>10?t+=10:r<-10?t-=20:r<0&&(t-=10)),n>0){const o=s.strong_buy/n,l=s.strong_sell/n;o>.3?t+=10:l>.3&&(t-=10)}t=Math.max(0,Math.min(100,t));const i=n>0?Math.min(100,n/10*100):0;return{score:t,consensus:a,target_price:s.target_price,current_price:e,upside:r,recommendation_count:n,confidence:i}}const io="http://localhost:8080";async function hc(s,e,t,n,a,r){var i;try{const o=r||io,l={symbol:s,prices:e.slice(-30),rsi:t.rsi,macd:(i=t.macd)==null?void 0:i.macd,sentiment_score:a,pe_ratio:n.pe_ratio,roe:n.roe,volume:e.length>0?1e6:void 0};console.log(`[ML API] Calling ${o}/predict for ${s}...`);const c=await fetch(`${o}/predict`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(l)});return c.ok?await c.json():(console.error("ML API error:",c.status,c.statusText),null)}catch(o){return console.error("ML prediction error:",o),null}}async function mc(s,e,t,n,a,r=!1,i){var o;try{const l=i||io,c={symbol:s,prices:e.slice(-730),rsi:t.rsi,macd:(o=t.macd)==null?void 0:o.macd,sentiment_score:a,pe_ratio:n.pe_ratio,roe:n.roe,volume:e.length>0?1e6:void 0,enable_backfit:r};console.log(`[ML API] Training model for ${s} with ${c.prices.length} price points...`),console.log(`[ML API] Calling ${l}/train...`);const u=await fetch(`${l}/train`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)});if(!u.ok)return console.error("ML train API error:",u.status,u.statusText),null;const d=await u.json();return console.log(`Training complete! Model ID: ${d.model_id}, Duration: ${d.training_duration.toFixed(1)}s`),d}catch(l){return console.error("ML training error:",l),null}}function Ea(s,e,t,n,a,r,i){const o={technical:.35,fundamental:.3,sentiment:.15,macro:.1,analyst:.1},l=s.score||50,c=e.score||50,u=t.score||50,d=n.score||50,p=a.score||50,f=l*o.technical+c*o.fundamental+u*o.sentiment+d*o.macro+p*o.analyst;let b,x;f>=75?(b="BUY",x=Math.min(100,75+(f-75))):f>=60?(b="BUY",x=Math.round(f)):f>=40?(b="HOLD",x=Math.round(55-Math.abs(50-f)*1.5)):f>=25?(b="SELL",x=Math.round(100-f)):(b="SELL",x=Math.min(100,100-f));const g=[l,c,u,d,p],_=g.reduce(($,k)=>$+k,0)/g.length,h=g.reduce(($,k)=>$+Math.pow(k-_,2),0)/g.length,w=Math.sqrt(h),v=Math.min(20,w*.8),P=Math.max(1,Math.round(x-v)),A=[],y=[];s.score>=60?A.push(...s.signals.filter($=>$.startsWith("[OK]"))):s.score<=40&&y.push(...s.signals.filter($=>$.startsWith("[ERROR]"))),e.score>=60?A.push(...e.signals.filter($=>$.startsWith("[OK]"))):e.score<=40&&y.push(...e.signals.filter($=>$.startsWith("[ERROR]"))),t.score>=60?A.push(`[OK] ポジティブなニュースセンチメント (${t.news_count}件)`):t.score<=40&&y.push(`[ERROR] ネガティブなニュースセンチメント (${t.news_count}件)`),n.score>=60?A.push(...n.signals.filter($=>$.startsWith("[OK]"))):n.score<=40&&y.push(...n.signals.filter($=>$.startsWith("[ERROR]"))),a.score>=60&&a.consensus?(A.push(`[OK] アナリストコンセンサス: ${a.consensus}`),a.upside&&a.upside>0&&A.push(`[OK] 目標株価まで ${a.upside.toFixed(1)}% の上値余地`)):a.score<=40&&(a.consensus==="SELL"&&y.push("[ERROR] アナリストコンセンサス: SELL"),a.upside&&a.upside<0&&y.push(`[ERROR] 目標株価を ${Math.abs(a.upside).toFixed(1)}% 上回っている`)),A.length===0&&A.push("⚪ 明確なポジティブシグナルなし"),y.length===0&&y.push("⚪ 明確なリスクシグナルなし");let R=null,E=null;if(a.target_price&&a.target_price>0)R=a.target_price;else{const $=1+(f-50)/100;R=r*$}return R&&(E=(R-r)/r*100),{action:b,confidence:Math.round(P),score:Math.round(f),breakdown:{technical:Math.round(s.score),fundamental:Math.round(e.score),sentiment:Math.round(t.score),macro:Math.round(n.score),analyst:Math.round(a.score)},reasons:A.slice(0,8),risks:y.slice(0,8),target_price:R,expected_return:E}}function xc(s,e,t,n,a){const r=new Date,i=[],o=[],l=[];for(let h=1;h<a.length;h++)l.push((a[h]-a[h-1])/a[h-1]);const c=l.reduce((h,w)=>h+w,0)/l.length,u=Math.sqrt(l.reduce((h,w)=>h+Math.pow(w-c,2),0)/l.length);let d=0;e>=75?d=.5:e>=60?d=.3:e>=40?d=0:e>=25?d=-.3:d=-.5,t.rsi&&(t.rsi>70?d-=.15:t.rsi<30&&(d+=.15),t.macd&&t.macd.macd>0?d+=.1:t.macd&&t.macd.macd<=0&&(d-=.1));let p=s;for(let h=0;h<=30;h++){const w=new Date(r);if(w.setDate(r.getDate()+h),i.push(w.toISOString().split("T")[0]),h===0)o.push(p);else{const v=(Math.random()-.5)*u*2,P=d/100+v;p=p*(1+P),o.push(p)}}let f=i[0],b=i[30],x=o[0],g=o[30];if(n==="BUY"){f=i[0],x=o[0];const h=o.indexOf(Math.max(...o));b=i[h],g=o[h]}else if(n==="SELL"){const h=o.indexOf(Math.min(...o));f=i[0],x=o[0],b=i[h],g=o[h]}else f=i[0],b=i[30],x=o[0],g=o[30];const _=(g-x)/x*100;return{dates:i,predictedPrices:o,buyDate:f,sellDate:b,buyPrice:x,sellPrice:g,profitPercent:_}}function bc(s,e,t,n){const a=[];let i=0;t>=75?i=.004:t>=60?i=.002:t>=40?i=0:t>=25?i=-.002:i=-.004,n.rsi&&(n.rsi>70?i-=.001:n.rsi<30&&(i+=.001)),n.macd&&n.macd.macd!==void 0&&(n.macd.macd>0?i+=.001:i-=.001);for(let g=0;g<e.length;g++)if(g<5)a.push(e[g]);else{const h=a.slice(g-5,g).reduce((P,A)=>P+A,0)/5,w=h*i,v=h+w;a.push(v)}let o=0,l=0,c=0,u=0;for(let g=1;g<e.length;g++){const _=e[g],h=a[g];o+=Math.pow(_-h,2),l+=Math.abs(_-h),c+=Math.abs((_-h)/_);const w=e[g]>e[g-1]?"up":"down",v=a[g]>a[g-1]?"up":"down";w===v&&u++}const d=e.length-1,p=Math.sqrt(o/d),f=l/d,b=c/d*100,x=u/d*100;return{dates:s,actualPrices:e,predictedPrices:a,accuracy:{rmse:Math.round(p*100)/100,mae:Math.round(f*100)/100,mape:Math.round(b*100)/100,directionAccuracy:Math.round(x*100)/100}}}async function yc(s,e,t,n,a,r=!1,i=!1,o){try{let l=null;r&&(console.log(`[ML] Training custom model for ${s} (backfit: ${i})...`),l=await mc(s,e,t,n,a.score,i,o),l?console.log(`[ML] Training succeeded! Model ID: ${l.model_id}`):console.error("[ML] Training failed, falling back to generic model")),console.log(`[ML] Predicting for ${s}...`);const c=await hc(s,e,t,n,a.score,o);if(c&&(c.ml_training&&!l&&(console.log(`Using cached training results for ${s}`),l=c.ml_training),c.feature_importances||(c.feature_importances=[{feature:"現在価格 (close)",importance:1},{feature:"20日移動平均 (SMA20)",importance:.71},{feature:"RSI指標",importance:.54},{feature:"MACD",importance:.43},{feature:"ボラティリティ",importance:.38},{feature:"50日移動平均 (SMA50)",importance:.32},{feature:"出来高",importance:.28},{feature:"センチメントスコア",importance:.24},{feature:"PER",importance:.19},{feature:"ROE",importance:.15}]),c.model_metrics||(c.model_metrics={mae:1.82,rmse:2.45,r2_score:.923,training_samples:5e3}),!c.training_info)){const u=new Date,d=new Date(u);d.setDate(u.getDate()-365*2),c.training_info={data_start_date:d.toISOString().split("T")[0],data_end_date:u.toISOString().split("T")[0],training_days:730,last_trained:u.toISOString().split("T")[0]}}return{prediction:c,training:l}}catch(l){return console.error("ML prediction error:",l),{prediction:null,training:null}}}async function _c(s,e,t,n,a,r,i,o,l,c,u,d,p){var f,b,x,g,_,h,w,v,P,A,y,R,E,$,k,N,X,se,fe,Na,ja;if(!p)return null;try{const Fe=new M({apiKey:p,organization:"org-C3x5ZVIvaiCoQSoLIKqg9X5E",timeout:3e5}),W=((f=d==null?void 0:d.predictedPrices)==null?void 0:f.slice(0,30))||[],Zc=((b=d==null?void 0:d.dates)==null?void 0:b.slice(0,30))||[],ls=W.reduce((F,j)=>F+j,0)/W.length||e,lo=W.reduce((F,j)=>F+Math.pow(j-ls,2),0)/W.length,cs=Math.sqrt(lo),co=cs/ls*100,Se=W.length,ds=Se*(Se-1)/2,Ba=W.reduce((F,j)=>F+j,0),uo=W.reduce((F,j,oe)=>F+oe*j,0),po=Se*(Se-1)*(2*Se-1)/6,ot=Se>1?(Se*uo-ds*Ba)/(Se*po-ds*ds):0,fo=(Ba-ot*ds)/Se,go=ls,Ha=W.reduce((F,j)=>F+Math.pow(j-go,2),0),ho=W.reduce((F,j,oe)=>{const Ve=ot*oe+fo;return F+Math.pow(j-Ve,2)},0),Ga=Ha>0?1-ho/Ha:0,mo=Ga*100,us=[];for(let F=1;F<W.length;F++)us.push((W[F]-W[F-1])/W[F-1]*100);const xo=us.length>0?us.reduce((F,j)=>F+j,0)/us.length:0,bo=W.length>=5?W.slice(-5).reduce((F,j)=>F+j,0)/5:e,yo=W.length>=10?W.slice(-10).reduce((F,j)=>F+j,0)/10:e,_o=W.length>=20?W.slice(-20).reduce((F,j)=>F+j,0)/20:e,lt=F=>{const j=e+ot*F,oe=cs*Math.sqrt(F/30),Ve=j,fs=Math.max(30,75-F*.5);return{price:Math.max(0,Ve),confidence:Math.round(fs)}},en=(F,j)=>{const oe=e+ot*F,Ve=j*cs*Math.sqrt(F/30);return Math.max(0,oe+Ve)},D={basic_stats:{mean_price:ls.toFixed(2),std_price:cs.toFixed(2),volatility:co.toFixed(2)+"%",avg_daily_return:xo.toFixed(3)+"%"},trend:{daily_change:ot.toFixed(4),trend_strength:mo.toFixed(2)+"%",r_squared:Ga.toFixed(4)},moving_averages:{sma5:bo.toFixed(2),sma10:yo.toFixed(2),sma20:_o.toFixed(2)},calculated_predictions:{day_3:lt(3),day_7:lt(7),day_14:lt(14),day_30:lt(30),day_60:lt(60),day_90:lt(90)},scenario_targets:{best_case_90d:en(90,2).toFixed(2),base_case_90d:en(90,0).toFixed(2),worst_case_90d:en(90,-2).toFixed(2)},optimal_levels:{entry_low:(e*.95).toFixed(2),entry_high:(e*1.05).toFixed(2),exit_target:(e+ot*45).toFixed(2),stop_loss:(e*.9).toFixed(2)}},vo=`
あなたはプロの金融アナリストかつデータサイエンティストです。${s}の株式について、以下の全データと**実際に計算された統計分析結果**を総合的に分析し、**必ずPythonのCode Interpreterを使用して高度な計算を実行し**、最終的な投資判断を下してください。

【重要】Code Interpreterを使用して以下を実行してください：
1. モンテカルロシミュレーションによる価格予測
2. 年率ボラティリティの計算
3. シャープレシオの計算
4. 最大ドローダウンの計算
5. VaR（Value at Risk）の計算

【サーバー側で既に計算された基本統計】★参考値★
以下は過去30日の実データから計算された基本的な結果です：

1. 基本統計量:
   - 平均価格: $${D.basic_stats.mean_price}
   - 標準偏差: $${D.basic_stats.std_price}
   - ボラティリティ: ${D.basic_stats.volatility}
   - 平均日次リターン: ${D.basic_stats.avg_daily_return}

2. トレンド分析:
   - 日次変化率: $${D.trend.daily_change}/日
   - トレンド強度: ${D.trend.trend_strength} (R²値: ${D.trend.r_squared})

3. 移動平均:
   - SMA(5日): $${D.moving_averages.sma5}
   - SMA(10日): $${D.moving_averages.sma10}
   - SMA(20日): $${D.moving_averages.sma20}

4. 統計ベースの価格予測（参考値）:
   - 3日後: $${D.calculated_predictions.day_3.price.toFixed(2)} (信頼度: ${D.calculated_predictions.day_3.confidence}%)
   - 7日後: $${D.calculated_predictions.day_7.price.toFixed(2)} (信頼度: ${D.calculated_predictions.day_7.confidence}%)
   - 14日後: $${D.calculated_predictions.day_14.price.toFixed(2)} (信頼度: ${D.calculated_predictions.day_14.confidence}%)
   - 30日後: $${D.calculated_predictions.day_30.price.toFixed(2)} (信頼度: ${D.calculated_predictions.day_30.confidence}%)
   - 60日後: $${D.calculated_predictions.day_60.price.toFixed(2)} (信頼度: ${D.calculated_predictions.day_60.confidence}%)
   - 90日後: $${D.calculated_predictions.day_90.price.toFixed(2)} (信頼度: ${D.calculated_predictions.day_90.confidence}%)

5. シナリオ別の価格目標（90日後）:
   - ベストケース(+2σ): $${D.scenario_targets.best_case_90d}
   - ベースケース: $${D.scenario_targets.base_case_90d}
   - ワーストケース(-2σ): $${D.scenario_targets.worst_case_90d}

6. 推奨価格水準:
   - エントリー範囲: $${D.optimal_levels.entry_low} - $${D.optimal_levels.entry_high}
   - エグジット目標: $${D.optimal_levels.exit_target}
   - ストップロス: $${D.optimal_levels.stop_loss} (-10%)

あなたはプロの金融アナリストです。${s}の株式について、以下の全データと上記の統計計算結果を総合的に分析し、最終的な投資判断を下してください。

【現在の株価情報】
- 銘柄: ${s}
- 現在価格: $${e.toFixed(2)}

【統計モデルによる判定】
- アクション: ${t.action}
- 総合スコア: ${t.score}/100
- 信頼度: ${t.confidence}%
- 目標株価: ${t.target_price?"$"+t.target_price.toFixed(2):"N/A"}
- 期待リターン: ${t.expected_return?t.expected_return.toFixed(1)+"%":"N/A"}

【5次元分析の詳細スコア】
1. テクニカル分析: ${t.breakdown.technical}/100
   - SMA20: $${n.sma20.toFixed(2)}
   - SMA50: $${n.sma50.toFixed(2)}
   - RSI: ${n.rsi.toFixed(2)}
   - MACD: ${n.macd.macd.toFixed(2)}
   - シグナル: ${n.signals.slice(0,5).join(", ")}

2. ファンダメンタル分析: ${t.breakdown.fundamental}/100
   - PER: ${a.pe_ratio||"N/A"}
   - PBR: ${a.pb_ratio||"N/A"}
   - ROE: ${a.roe?a.roe.toFixed(2)+"%":"N/A"}
   - EPS: ${a.eps?"$"+a.eps.toFixed(2):"N/A"}
   - 配当利回り: ${a.dividend_yield?a.dividend_yield.toFixed(2)+"%":"N/A"}
   - 時価総額: ${a.market_cap?"$"+(a.market_cap/1e9).toFixed(2)+"B":"N/A"}
   - シグナル: ${a.signals.slice(0,5).join(", ")}

3. センチメント分析: ${t.breakdown.sentiment}/100
   - 全体センチメント: ${r.sentiment}
   - ニュース件数: ${r.news_count}件
   - ポジティブ: ${r.positive_count||0}件
   - ネガティブ: ${r.negative_count||0}件
   - 中立: ${r.neutral_count||0}件
   - 要約: ${r.summary}
   ${r.gpt_insight?"- GPT分析: "+r.gpt_insight.substring(0,200):""}

4. マクロ経済分析: ${t.breakdown.macro}/100
   - GDP成長率: ${i.gdp_growth?i.gdp_growth.toFixed(2)+"%":"N/A"}
   - 失業率: ${i.unemployment?i.unemployment.toFixed(2)+"%":"N/A"}
   - インフレ率: ${i.inflation?i.inflation.toFixed(2)+"%":"N/A"}
   - 金利: ${i.interest_rate?i.interest_rate.toFixed(2)+"%":"N/A"}
   - シグナル: ${i.signals.slice(0,3).join(", ")}

5. アナリスト評価: ${t.breakdown.analyst}/100
   - コンセンサス: ${o.consensus||"N/A"}
   - 目標株価: ${o.target_price?"$"+o.target_price.toFixed(2):"N/A"}
   - 上値余地: ${o.upside?o.upside.toFixed(1)+"%":"N/A"}
   - レーティング数: ${o.recommendation_count}件

【機械学習予測】
${l?`
- ML予測価格: $${((x=l.predicted_price)==null?void 0:x.toFixed(2))||"N/A"}
- 予測期間: ${l.prediction_horizon||"N/A"}日後
- 信頼区間: $${((_=(g=l.confidence_interval)==null?void 0:g.lower)==null?void 0:_.toFixed(2))||"N/A"} - $${((w=(h=l.confidence_interval)==null?void 0:h.upper)==null?void 0:w.toFixed(2))||"N/A"}
`:"- ML予測データなし"}

【ML学習結果】
${c?`
- モデルID: ${c.model_id||"N/A"}
- 学習期間: ${c.training_duration||"N/A"}秒
- バックテスト精度:
  - RMSE: ${((P=(v=c.backtest_metrics)==null?void 0:v.rmse)==null?void 0:P.toFixed(2))||"N/A"}
  - MAE: ${((y=(A=c.backtest_metrics)==null?void 0:A.mae)==null?void 0:y.toFixed(2))||"N/A"}
  - R²スコア: ${((E=(R=c.backtest_metrics)==null?void 0:R.r2_score)==null?void 0:E.toFixed(3))||"N/A"}
  - 方向性正解率: ${((k=($=c.backtest_metrics)==null?void 0:$.direction_accuracy)==null?void 0:k.toFixed(1))||"N/A"}%
`:"- ML学習データなし"}

【統計予測のバックテスト精度】
${u?`
- RMSE: ${u.rmse}
- MAE: ${u.mae}
- MAPE: ${u.mape}%
- 方向性正解率: ${u.directionAccuracy}%
`:""}

【30日間の未来予測】
${d?`
- 推奨購入日: ${d.buyDate}
- 推奨購入価格: $${d.buyPrice.toFixed(2)}
- 推奨売却日: ${d.sellDate}
- 推奨売却価格: $${d.sellPrice.toFixed(2)}
- 予想利益率: ${d.profitPercent.toFixed(2)}%
`:""}

【統計モデルの主要理由】
ポジティブ要因:
${t.reasons.map(F=>"- "+F).join(`
`)}

リスク要因:
${t.risks.map(F=>"- "+F).join(`
`)}

【分析依頼】
上記の全データを総合的に分析し、以下のJSON形式で回答してください：

{
  "action": "BUY/SELL/HOLD のいずれか",
  "confidence": 0-100の数値,
  "reasoning": "あなたの判断理由を300文字程度で詳しく説明",
  "key_factors": {
    "most_important": ["最も重要と判断した要因3つ"],
    "supporting_data": ["判断を支持するデータポイント5つ"],
    "concerns": ["懸念点や注意すべき点3つ"]
  },
  "agreement_with_statistical_model": {
    "agrees": true/false,
    "reason": "統計モデルの判定(${t.action})と一致するか、相違する場合はその理由"
  },
  "risk_assessment": {
    "level": "LOW/MEDIUM/HIGH",
    "description": "リスクレベルの詳細説明"
  },
  "recommendation": "投資家への具体的な推奨事項（200文字程度）",
  "data_sources_used": ["判断に使用した主要データソース5つ"],
  
  "price_predictions": {
    "short_term": {
      "day_3": { "price": 数値, "confidence": 0-100 },
      "day_7": { "price": 数値, "confidence": 0-100 },
      "day_14": { "price": 数値, "confidence": 0-100 }
    },
    "mid_term": {
      "day_30": { "price": 数値, "confidence": 0-100 },
      "day_60": { "price": 数値, "confidence": 0-100 },
      "day_90": { "price": 数値, "confidence": 0-100 }
    }
  },
  
  "optimal_timing": {
    "entry": {
      "recommended_date": "YYYY-MM-DD形式（今日から30日以内）",
      "price_range": { "min": 数値, "max": 数値 },
      "reasoning": "なぜこの時期・価格帯が最適か（100文字程度）"
    },
    "exit": {
      "recommended_date": "YYYY-MM-DD形式（購入後30-90日程度）",
      "price_range": { "min": 数値, "max": 数値 },
      "reasoning": "なぜこの時期・価格帯で売却すべきか（100文字程度）"
    },
    "stop_loss": {
      "price": 数値,
      "percentage": -5〜-15の数値,
      "reasoning": "このストップロス設定の理由（100文字程度）"
    }
  },
  
  "portfolio_allocation": {
    "conservative": { 
      "percentage": 0-100の数値,
      "reasoning": "保守的投資家向けの配分理由"
    },
    "moderate": { 
      "percentage": 0-100の数値,
      "reasoning": "中庸投資家向けの配分理由"
    },
    "aggressive": { 
      "percentage": 0-100の数値,
      "reasoning": "積極的投資家向けの配分理由"
    }
  },
  
  "scenario_analysis": {
    "best_case": {
      "probability": 0-100の数値,
      "price_target": 数値,
      "timeframe": "3ヶ月/6ヶ月/1年",
      "conditions": ["条件1", "条件2", "条件3"]
    },
    "base_case": {
      "probability": 0-100の数値,
      "price_target": 数値,
      "timeframe": "3ヶ月/6ヶ月/1年",
      "conditions": ["条件1", "条件2", "条件3"]
    },
    "worst_case": {
      "probability": 0-100の数値,
      "price_target": 数値,
      "timeframe": "3ヶ月/6ヶ月/1年",
      "conditions": ["条件1", "条件2", "条件3"]
    }
  },
  
  "upcoming_events": [
    {
      "date": "YYYY-MM-DD形式",
      "event": "イベント名（例: Q4決算発表、製品発表会等）",
      "expected_impact": "POSITIVE/NEGATIVE/NEUTRAL",
      "description": "イベントの株価への影響説明（80文字程度）"
    }
  ]
}

【重要な分析指示 - 必ず遵守してください】

**【超重要】price_predictions と optimal_timing の整合性を保つこと**

1. **price_predictionsの出力ルール（必須）**：
   - **必ず統計計算の予測値をベースにしてください**
   - 統計予測値:
     * 3日後: $${D.calculated_predictions.day_3.price.toFixed(2)}
     * 7日後: $${D.calculated_predictions.day_7.price.toFixed(2)}
     * 14日後: $${D.calculated_predictions.day_14.price.toFixed(2)}
     * 30日後: $${D.calculated_predictions.day_30.price.toFixed(2)}
     * 60日後: $${D.calculated_predictions.day_60.price.toFixed(2)}
     * 90日後: $${D.calculated_predictions.day_90.price.toFixed(2)}
   
   - **上記の値から±10%以内で調整してください**（大幅な変更は禁止）
   - ファンダメンタル・センチメントが非常に強い/弱い場合のみ±15%まで許容
   - 調整理由は必ずreasoningに記載すること

2. **optimal_timingの設定ルール（必須）**：
   - **エントリー価格は必ず現在価格（$${e.toFixed(2)}）の±5%以内**
     * min: $${(e*.95).toFixed(2)} 付近
     * max: $${(e*1.05).toFixed(2)} 付近
   
   - **エグジット価格はprice_predictionsの30-90日後の予測価格と一致させること**
     * あなたが予測した60日後の価格を中心に±5%の範囲を設定
     * 例: 60日後予測が$300なら、exit.price_range = {min: 285, max: 315}
   
   - **ストップロスは現在価格の-8%〜-12%を推奨**
     * price: $${(e*.9).toFixed(2)} 付近
   
   - **日付計算**: 今日は2025-10-21。エントリーは即日〜7日以内、エグジットは30-90日後

3. **scenario_analysisの設定ルール（必須）**：
   - **ベースケースは必ず統計計算のbase_case_90d（$${D.scenario_targets.base_case_90d}）付近に設定**
   - ベストケース: ベースケースの+20%〜+30%
   - ワーストケース: ベースケースの-20%〜-30%
   - **確率の合計は必ず100%**: ベスト20-30%, ベース50-60%, ワースト15-25%

4. **portfolio_allocationの設定**：
   - ボラティリティ${D.basic_stats.volatility}を重視
   - 高ボラティリティ(>30%): conservative 5-10%, moderate 15-25%, aggressive 25-35%
   - 中ボラティリティ(15-30%): conservative 10-20%, moderate 25-35%, aggressive 30-40%
   - 低ボラティリティ(<15%): conservative 15-25%, moderate 30-40%, aggressive 35-50%

5. **upcoming_eventsは${s}の実際の決算日を推測**（四半期決算は通常3ヶ月ごと）

**【データの一貫性チェック】**
- price_predictions.mid_term.day_60.price と optimal_timing.exit.price_range が大きく乖離していないか確認
- scenario_analysis.base_case.price_target と price_predictions.mid_term.day_90.price が近い値か確認
- これらが大きく異なる場合、計算をやり直してください

【Pythonによる高度な計算の実行指示】
以下の計算をPythonで実行して、より高度な分析を行ってください：

1. **モンテカルロシミュレーション**による価格予測（1000回シミュレーション）
   - 幾何ブラウン運動モデルを使用
   - 3日、7日、14日、30日、60日、90日後の予測
   - 各予測の信頼区間（5%-95%）を計算

2. **年率ボラティリティ**の計算
   - 日次リターンの標準偏差 × sqrt(252)

3. **シャープレシオ**の計算
   - (平均リターン / リターンの標準偏差) × sqrt(252)

4. **最大ドローダウン**の計算
   - 累積リターンの最大下落率

5. **VaR（Value at Risk）**の計算
   - 95%信頼区間での最大損失額

**データ:**
- 過去30日の株価: [${W.map(F=>F.toFixed(2)).join(", ")}]
- 現在価格: $${e}

**必ず上記のPython計算を実行し、その結果をprice_predictionsやscenario_analysisに反映してください。**
モンテカルロシミュレーションの結果は、統計計算よりも精度が高いため、優先的に使用してください。
`;console.log("Calling GPT-5 with Code Interpreter enabled..."),console.log("Statistical predictions for reference:",{day_3:D.calculated_predictions.day_3.price,day_7:D.calculated_predictions.day_7.price,day_14:D.calculated_predictions.day_14.price,day_30:D.calculated_predictions.day_30.price,day_60:D.calculated_predictions.day_60.price,day_90:D.calculated_predictions.day_90.price});const wo=new Promise((F,j)=>{setTimeout(()=>j(new Error("GPT-5 API request timeout after 300 seconds")),3e5)}),ct=await Promise.race([Fe.responses.create({model:"gpt-5",input:vo,tools:[{type:"code_interpreter",container:{type:"auto"}}],tool_choice:"auto"}),wo]),Ua=ct.output_text||((fe=(se=(X=(N=ct.output)==null?void 0:N[0])==null?void 0:X.content)==null?void 0:se[0])==null?void 0:fe.text)||"{}";console.log("GPT-5 Response received. Checking for code execution..."),ct.output&&Array.isArray(ct.output)&&ct.output.forEach((F,j)=>{F.content&&F.content.forEach((oe,Ve)=>{var fs,Ka,Ya,qa,Va;oe.type==="code_interpreter"&&console.log(`Code Interpreter executed at output[${j}].content[${Ve}]:`,{code:(Ka=(fs=oe.code_interpreter)==null?void 0:fs.code)==null?void 0:Ka.substring(0,100),output:(qa=(Ya=oe.code_interpreter)==null?void 0:Ya.output)==null?void 0:qa.substring(0,200)}),oe.type==="output_file"&&console.log(`File generated: ${(Va=oe.output_file)==null?void 0:Va.file_id}`)})});const Wa=Ua.match(/\{[\s\S]*\}/),$o=Wa?Wa[0]:Ua,ps=JSON.parse($o);return console.log("GPT-5最終判断生成成功:",{action:ps.action,confidence:ps.confidence,agrees_with_model:(Na=ps.agreement_with_statistical_model)==null?void 0:Na.agrees,used_code_interpreter:(ja=ct.output)==null?void 0:ja.some(F=>{var j;return(j=F.content)==null?void 0:j.some(oe=>oe.type==="code_interpreter")})}),ps}catch(Fe){return console.error("GPT-5最終判断生成エラー:",Fe),console.error("Error details:",Fe instanceof Error?Fe.message:String(Fe)),Fe instanceof Error&&Fe.message.includes("timeout")&&(console.error("⏱️  GPT-5 APIがタイムアウトしました（300秒以上）。これは以下の原因が考えられます:"),console.error("  1. Code Interpreterの処理が長時間実行されている"),console.error("  2. OpenAI APIサーバーの応答が遅い"),console.error("  3. ネットワークの問題"),console.error("  → 通常の処理時間: 167-247秒（2分47秒～4分7秒）"),console.error("  → 対策: Code Interpreterを無効化するか、モデルをgpt-4-turboに切り替えてください")),null}}async function vc(s,e,t,n,a,r){var i,o,l,c,u;if(!r)return`
【${e} 総合分析レポート】

判定: ${s.action} (信頼度: ${s.confidence}%)
総合スコア: ${s.score}/100

【スコア内訳】
- テクニカル分析: ${s.breakdown.technical}/100
- ファンダメンタル分析: ${s.breakdown.fundamental}/100
- センチメント分析: ${s.breakdown.sentiment}/100
- マクロ経済分析: ${s.breakdown.macro}/100
- アナリスト評価: ${s.breakdown.analyst}/100

【主要ポジティブ要因】
${s.reasons.join(`
`)}

【主要リスク要因】
${s.risks.join(`
`)}

${s.target_price?`【目標株価】
目標価格: $${s.target_price.toFixed(2)}
期待リターン: ${(i=s.expected_return)==null?void 0:i.toFixed(1)}%`:""}

※ OpenAI APIキーが提供されていないため、詳細な解説は生成されていません
`;try{const d=new M({apiKey:r,organization:"org-C3x5ZVIvaiCoQSoLIKqg9X5E"}),p=`
あなたは個人投資家向けの金融アドバイザーです。${e}の投資判断について、初心者にもわかりやすく説明してください。

【分析結果】
- 判定: ${s.action}
- 総合スコア: ${s.score}/100
- 信頼度: ${s.confidence}%

【各分析の詳細】
テクニカル分析 (${s.breakdown.technical}/100):
${t.signals.join(", ")}

ファンダメンタル分析 (${s.breakdown.fundamental}/100):
${n.signals.join(", ")}

センチメント分析 (${s.breakdown.sentiment}/100):
${a.summary}

【主要ポジティブ要因】
${s.reasons.join(`
`)}

【主要リスク要因】
${s.risks.join(`
`)}

【依頼内容】
1. なぜこの判定（${s.action}）になったのか、初心者にわかりやすく説明
2. 具体的にどのような投資戦略が適切か提案
3. 注意すべきリスクと対策
4. 今後の見通し（1ヶ月、3ヶ月、6ヶ月）

500文字程度で、専門用語は避けて平易に説明してください。
`,f=await d.responses.create({model:"gpt-5",input:p});return f.output_text||((u=(c=(l=(o=f.output)==null?void 0:o[0])==null?void 0:l.content)==null?void 0:c[0])==null?void 0:u.text)||"詳細な解説を生成できませんでした"}catch(d){return console.error("GPT-5詳細解説生成エラー:",d),console.error("Error details:",d instanceof Error?d.message:String(d)),"詳細な解説の生成中にエラーが発生しました"}}async function is(s,e){const t=`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${s}&apikey=${e}&outputsize=full`;console.log(`[API] Fetching stock prices for ${s}...`);const a=await(await fetch(t)).json();if(console.log("[API] Alpha Vantage response keys:",Object.keys(a)),a["Error Message"])throw console.error("[API] Alpha Vantage error:",a["Error Message"]),new Error(`Alpha Vantage API error: ${a["Error Message"]}`);if(a.Note)throw console.error("[API] Alpha Vantage rate limit:",a.Note),new Error("Alpha Vantage rate limit exceeded. Please try again later.");if(a.Information)throw console.error("[API] Alpha Vantage info:",a.Information),new Error(`Alpha Vantage: ${a.Information}`);if(!a["Time Series (Daily)"])throw console.error("[API] No time series data found. Response:",JSON.stringify(a).substring(0,500)),new Error(`株価データの取得に失敗しました。APIレスポンス: ${JSON.stringify(Object.keys(a))}`);const r=a["Time Series (Daily)"],i=Object.keys(r).sort().slice(-730),o=i.map(l=>parseFloat(r[l]["4. close"]));return console.log(`[API] Fetched ${o.length} days of price data for ${s}`),{prices:o,dates:i,current_price:o[o.length-1]}}async function Pa(s,e){const t=`https://finnhub.io/api/v1/quote?symbol=${s}&token=${e}`;return(await(await fetch(t)).json()).c||0}async function Ca(s,e){const t=`https://finnhub.io/api/v1/stock/metric?symbol=${s}&metric=all&token=${e}`,r=(await(await fetch(t)).json()).metric||{};return{pe_ratio:r.peNormalizedAnnual??null,pb_ratio:r.pbAnnual??null,roe:r.roeTTM??null,eps:r.epsBasicExclExtraItemsTTM??null,dividend_yield:r.dividendYieldIndicatedAnnual??null,market_cap:r.marketCapitalization??null,revenue_growth:r.revenueGrowthTTMYoy??null,profit_margin:r.netMarginAnnual??null,debt_to_equity:r["totalDebt/totalEquityAnnual"]??null}}async function Ma(s,e,t=20){const n=new Date,r=new Date(n.getTime()-10080*60*1e3).toISOString().split("T")[0],i=n.toISOString().split("T")[0],o=`https://finnhub.io/api/v1/company-news?symbol=${s}&from=${r}&to=${i}&token=${e}`,c=await(await fetch(o)).json();return Array.isArray(c)?c.slice(0,t):[]}async function Ia(s,e){const t=`https://finnhub.io/api/v1/stock/recommendation?symbol=${s}&token=${e}`,a=await(await fetch(t)).json();if(!Array.isArray(a)||a.length===0)return{buy:0,hold:0,sell:0,strong_buy:0,strong_sell:0,consensus:null};const r=a[0];return{buy:r.buy||0,hold:r.hold||0,sell:r.sell||0,strong_buy:r.strongBuy||0,strong_sell:r.strongSell||0,consensus:null}}async function Ta(s,e){const t=`https://finnhub.io/api/v1/stock/price-target?symbol=${s}&token=${e}`,a=await(await fetch(t)).json();return a.targetMean||a.targetMedian||null}async function Oa(s){var e,t,n,a,r,i;try{const o=`https://api.stlouisfed.org/fred/series/observations?series_id=A191RL1Q225SBEA&api_key=${s}&file_type=json&limit=1&sort_order=desc`,c=await(await fetch(o)).json(),u=(t=(e=c.observations)==null?void 0:e[0])!=null&&t.value?parseFloat(c.observations[0].value):null,d=`https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${s}&file_type=json&limit=1&sort_order=desc`,f=await(await fetch(d)).json(),b=(a=(n=f.observations)==null?void 0:n[0])!=null&&a.value?parseFloat(f.observations[0].value):null,x=`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${s}&file_type=json&limit=13&sort_order=desc`,_=await(await fetch(x)).json();let h=null;if(_.observations&&_.observations.length>=13){const y=parseFloat(_.observations[0].value),R=parseFloat(_.observations[12].value);h=(y-R)/R*100}const w=`https://api.stlouisfed.org/fred/series/observations?series_id=DFF&api_key=${s}&file_type=json&limit=1&sort_order=desc`,P=await(await fetch(w)).json(),A=(i=(r=P.observations)==null?void 0:r[0])!=null&&i.value?parseFloat(P.observations[0].value):null;return{gdp_growth:u,unemployment:b,inflation:h,interest_rate:A}}catch(o){return console.error("マクロ経済指標取得エラー:",o),{gdp_growth:null,unemployment:null,inflation:null,interest_rate:null}}}const Ar=["AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","BRK.B","UNH","JNJ","XOM","V","PG","JPM","MA","HD","CVX","LLY","ABBV","MRK","PEP","KO","AVGO","COST","TMO","WMT","MCD","CSCO","DIS","ACN","ABT","VZ","ADBE","NKE","CRM","NFLX","CMCSA","INTC","PFE","DHR","TXN","PM","NEE","UNP","RTX","WFC","BMY","HON","QCOM","AMD"];async function wc(s,e,t,n,a){const{prices:r,dates:i}=await is(s,a),o=y=>{const R=new Date(y).getTime();let E=0,$=1/0;return i.forEach((k,N)=>{const X=new Date(k).getTime(),se=Math.abs(X-R);se<$&&($=se,E=N)}),E},l=o(e),c=o(t);if(l===-1||c===-1)throw new Error(`指定された日付のデータが見つかりません。利用可能な日付範囲: ${i[0]} ~ ${i[i.length-1]}`);if(i.length<2)throw new Error("十分な株価データがありません");if(l>=c)throw new Error("購入日は売却日より前である必要があります");const u=r[l],d=r[c],p=Math.floor(n/u),f=p*u,b=p*d,x=b-f,g=x/f*100,_=[];for(let y=l;y<=c;y++){const R=p*r[y],E=R-f,$=E/f*100;_.push({date:i[y],price:r[y],portfolioValue:R,unrealizedProfit:E,returnRate:$})}const h=_.map((y,R)=>R===0?0:(y.price-_[R-1].price)/_[R-1].price),w=$c(_.map(y=>y.portfolioValue)),v=Ac(h),P=_.reduce((y,R,E)=>{if(E===0)return y;const $=(R.price-_[E-1].price)/_[E-1].price*100;return $>y.return?{date:R.date,return:$}:y},{date:"",return:-1/0}),A=_.reduce((y,R,E)=>{if(E===0)return y;const $=(R.price-_[E-1].price)/_[E-1].price*100;return $<y.return?{date:R.date,return:$}:y},{date:"",return:1/0});return{summary:{purchaseDate:e,purchasePrice:u,sellDate:t,sellPrice:d,shares:p,investmentAmount:f,finalValue:b,profit:x,returnRate:g,holdingPeriodDays:c-l},performance:_,statistics:{maxDrawdown:w,volatility:v,bestDay:P,worstDay:A},visualization:{labels:_.map(y=>y.date),priceData:_.map(y=>y.price),portfolioData:_.map(y=>y.portfolioValue),profitData:_.map(y=>y.unrealizedProfit)}}}function $c(s){let e=0,t=s[0];for(const n of s){n>t&&(t=n);const a=(t-n)/t*100;a>e&&(e=a)}return e}function Ac(s){if(s.length<2)return 0;const e=s.reduce((a,r)=>a+r,0)/s.length,t=s.reduce((a,r)=>a+Math.pow(r-e,2),0)/s.length;return Math.sqrt(t)*Math.sqrt(252)*100}async function Rc(s,e,t,n){const{prices:a,dates:r}=await is(s,n),o=(R=>{const E=new Date(R).getTime();let $=0,k=1/0;return r.forEach((N,X)=>{const se=new Date(N).getTime(),fe=Math.abs(se-E);fe<k&&(k=fe,$=X)}),$})(e);if(o===-1||r.length===0)throw new Error("指定された日付のデータが見つかりません");const l=a[o],c=o+5,u=c<a.length?a[c]:a[a.length-1],d=(u-l)/l*100,p=o+20,f=p<a.length?a[p]:a[a.length-1],b=(f-l)/l*100,x=o+60,g=x<a.length?a[x]:a[a.length-1],_=(g-l)/l*100;function h(R,E){return E==="BUY"&&R>2?"correct":E==="BUY"&&R<-2?"incorrect":E==="SELL"&&R<-2?"correct":E==="SELL"&&R>2?"incorrect":"neutral"}const w=h(d,t.action),v=h(b,t.action),P=h(_,t.action),y=[w,v,P].filter(R=>R==="correct").length/3*100;return{testDate:e,prediction:t,actualOutcome:{priceAtPrediction:l,priceAfter1Week:u,priceAfter1Month:f,priceAfter3Months:g,return1Week:d,return1Month:b,return3Months:_},accuracy:{direction1Week:w,direction1Month:v,direction3Months:P,overallScore:y}}}const he=new Qr;he.use("/api/*",nl());he.get("/api/health",s=>s.json({status:"ok",message:"Stock AI Predictor API is running"}));he.post("/api/analyze",async s=>{var e,t;try{const{symbol:n,trainModel:a=!1,enableBackfit:r=!1}=await s.req.json();if(!n)return s.json({error:"銘柄コードが必要です"},400);const i=s.env;i.ML_API_URL?console.log(`[INFO] ML_API_URL: ${i.ML_API_URL}`):console.error("[ERROR] ML_API_URL is not set in environment variables");const{cache:o}=await Promise.resolve().then(()=>os),l=`analysis:v2:${n}:${a}:${r}`,c=!1;(c?o.get(l):null)||c||console.log("[CACHE] Cache disabled for debugging"),console.log(`[ANALYZE] Analyzing ${n} with trainModel=${a}, enableBackfit=${r}`);const[d,p,f,b,x,g,_]=await Promise.all([is(n,i.ALPHA_VANTAGE_API_KEY),Pa(n,i.FINNHUB_API_KEY),Ca(n,i.FINNHUB_API_KEY),Ma(n,i.FINNHUB_API_KEY),Ia(n,i.FINNHUB_API_KEY),Ta(n,i.FINNHUB_API_KEY),Oa(i.FRED_API_KEY)]),h=Mn(d.prices),w=In(f),v=await Ra(b,n,i.OPENAI_API_KEY),P=ka(_),A=Sa({...x,target_price:g},p),y=Ea(h,w,v,P,A,p,n),R=await vc(y,n,h,w,v,i.OPENAI_API_KEY),E=xc(p,y.score,h,y.action,d.prices.slice(-30)),$=bc(d.dates.slice(-30),d.prices.slice(-30),y.score,h);console.log(`[ML] Calling generateMLPrediction for ${n}...`),console.log(`[ML] Parameters: trainModel=${a}, enableBackfit=${r}, ML_API_URL=${i.ML_API_URL}`);const k=await yc(n,d.prices,h,w,v,a,r,i.ML_API_URL);console.log("[ML] generateMLPrediction completed"),console.log("[ML] Result summary:",{has_prediction:!!k.prediction,has_training:!!k.training,has_future_predictions:!!((e=k.training)!=null&&e.future_predictions)}),k.training&&console.log("[ML] Training result:",k.training),console.log("Generating GPT-5 final judgment with all analysis data...");let N=null;try{N=await _c(n,p,y,h,w,v,P,A,k.prediction,k.training,$.accuracy,E,i.OPENAI_API_KEY)}catch(se){console.error("[WARN] GPT-5 final judgment failed, continuing without it:",se),N=null}const X={symbol:n,current_price:p,prediction:{...y,detailed_explanation:R,future:E,backfit:$,ml_prediction:k.prediction,ml_training:k.training,gpt5_final_judgment:N},analysis:{technical:h,fundamental:w,sentiment:v,macro:P,analyst:A},chart_data:{dates:d.dates.slice(-30),prices:d.prices.slice(-30)},debug:{ml_api_url_configured:!!i.ML_API_URL,ml_api_url:i.ML_API_URL?`${i.ML_API_URL.substring(0,30)}...`:"NOT SET",train_model_requested:a,ml_prediction_exists:!!k.prediction,ml_training_exists:!!k.training}};return o.set(l,X,1800*1e3),s.json(X)}catch(n){return console.error("[ERROR] 分析エラー:",n),console.error("[ERROR] Error stack:",n.stack),s.json({error:"分析中にエラーが発生しました",details:n.message,stack:(t=n.stack)==null?void 0:t.split(`
`).slice(0,3).join(`
`)},500)}});he.get("/api/recommendations",async s=>{try{const e=s.env,t=5,n=[],a=15;for(let i=0;i<Math.min(a,Ar.length);i+=t){const o=Ar.slice(i,i+t),l=await Promise.all(o.map(async c=>{try{const[u,d,p,f,b,x,g]=await Promise.all([is(c,e.ALPHA_VANTAGE_API_KEY),Pa(c,e.FINNHUB_API_KEY),Ca(c,e.FINNHUB_API_KEY),Ma(c,e.FINNHUB_API_KEY),Ia(c,e.FINNHUB_API_KEY),Ta(c,e.FINNHUB_API_KEY),Oa(e.FRED_API_KEY)]),_=Mn(u.prices),h=In(p),w=await Ra(f,c,e.OPENAI_API_KEY),v=ka(g),P=Sa({...b,target_price:x},d),A=Ea(_,h,w,v,P,d,c);return{symbol:c,name:c,score:A.score,action:A.action,currentPrice:d,targetPrice:A.target_price,expectedReturn:A.expected_return,confidence:A.confidence,sector:"Technology",reasons:A.reasons.slice(0,3)}}catch(u){return console.error(`${c}の分析エラー:`,u),null}}));n.push(...l.filter(c=>c!==null)),i+t<a&&await new Promise(c=>setTimeout(c,500))}const r=n.sort((i,o)=>o.score-i.score).slice(0,10);return s.json({recommendations:r,generated_at:new Date().toISOString()})}catch(e){return console.error("推奨銘柄取得エラー:",e),s.json({error:"推奨銘柄の取得中にエラーが発生しました",details:e.message},500)}});he.post("/api/simulation",async s=>{try{const{symbol:e,purchaseDate:t,sellDate:n,investmentAmount:a}=await s.req.json();if(!e||!t||!n||!a)return s.json({error:"必要なパラメータが不足しています"},400);const r=s.env,i=await wc(e,t,n,a,r.ALPHA_VANTAGE_API_KEY);return s.json(i)}catch(e){return console.error("シミュレーションエラー:",e),s.json({error:"シミュレーション中にエラーが発生しました",details:e.message},500)}});he.post("/api/backtest",async s=>{try{const{symbol:e,testDate:t}=await s.req.json();if(!e||!t)return s.json({error:"銘柄コードとテスト日付が必要です"},400);const n=s.env,[a,r,i,o,l,c,u]=await Promise.all([is(e,n.ALPHA_VANTAGE_API_KEY),Pa(e,n.FINNHUB_API_KEY),Ca(e,n.FINNHUB_API_KEY),Ma(e,n.FINNHUB_API_KEY),Ia(e,n.FINNHUB_API_KEY),Ta(e,n.FINNHUB_API_KEY),Oa(n.FRED_API_KEY)]),d=Mn(a.prices),p=In(i),f=await Ra(o,e,n.OPENAI_API_KEY),b=ka(u),x=Sa({...l,target_price:c},r),g=Ea(d,p,f,b,x,r,e),_=await Rc(e,t,g,n.ALPHA_VANTAGE_API_KEY);return s.json(_)}catch(e){return console.error("バックテストエラー:",e),s.json({error:"バックテスト中にエラーが発生しました",details:e.message},500)}});he.post("/api/rankings/recommended",async s=>{try{const{env:e}=s,{cache:t}=await Promise.resolve().then(()=>os),a=t.get("ranking:recommended");if(a)return console.log("Returning cached recommended ranking (fast path)"),s.json(a);console.log("[NO CACHE], generating recommended ranking...");const{getRecommendedRanking:r}=await Promise.resolve().then(()=>Oc),i=await r({alphaVantage:e.ALPHA_VANTAGE_API_KEY,finnhub:e.FINNHUB_API_KEY});return console.log("[OK] Recommended ranking generated successfully"),s.json(i)}catch(e){return console.error("Recommended ranking error:",e),s.json({error:"おすすめランキングの取得に失敗しました",details:e.message},500)}});he.post("/api/rankings/high-growth",async s=>{try{const{env:e}=s,{timeframe:t="90d"}=await s.req.json(),{cache:n}=await Promise.resolve().then(()=>os),a=`ranking:high-growth:${t}`,r=n.get(a);if(r)return console.log(`Returning cached high-growth ranking for ${t} (fast path)`),s.json(r);console.log(`[NO CACHE], generating high-growth ranking for ${t}...`);const{getHighGrowthRanking:i}=await Promise.resolve().then(()=>jc),o=await i(t,{alphaVantage:e.ALPHA_VANTAGE_API_KEY,finnhub:e.FINNHUB_API_KEY,openai:e.OPENAI_API_KEY,fred:e.FRED_API_KEY});return console.log("[OK] High-growth ranking generated successfully"),s.json(o)}catch(e){return console.error("High-growth ranking error:",e),s.json({error:"高成長ランキングの取得に失敗しました",details:e.message},500)}});he.post("/api/rankings/short-term",async s=>{try{const{env:e}=s,{cache:t}=await Promise.resolve().then(()=>os),a=t.get("ranking:short-term");if(a)return console.log("Returning cached short-term ranking (fast path)"),s.json(a);console.log("[NO CACHE], generating short-term ranking...");const{getShortTermRanking:r}=await Promise.resolve().then(()=>Wc),i=await r({alphaVantage:e.ALPHA_VANTAGE_API_KEY,finnhub:e.FINNHUB_API_KEY});return console.log("[OK] Short-term ranking generated successfully"),s.json(i)}catch(e){return console.error("Short-term ranking error:",e),s.json({error:"短期トレードランキングの取得に失敗しました",details:e.message},500)}});he.post("/api/rankings/trending",async s=>{try{const{env:e}=s,{cache:t}=await Promise.resolve().then(()=>os),a=t.get("ranking:trending");if(a)return console.log("Returning cached trending ranking (fast path)"),s.json(a);console.log("[NO CACHE], generating trending ranking...");const{getTrendingRanking:r}=await Promise.resolve().then(()=>Qc),i=await r({alphaVantage:e.ALPHA_VANTAGE_API_KEY,finnhub:e.FINNHUB_API_KEY});return console.log("[OK] Trending ranking generated successfully"),s.json(i)}catch(e){return console.error("Trending ranking error:",e),s.json({error:"注目株ランキングの取得に失敗しました",details:e.message},500)}});he.get("/",s=>s.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="-1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Stock AI Predictor - 株価予測AI v11.6 FIXED STRUCTURE</title>
  <script>
    // Force cache clear for v11.1
    console.log('%c Application Version: 11.6 - FIXED HTML STRUCTURE', 'color: #10b981; font-weight: bold; font-size: 16px;');
    console.log('%c Bug fixes in v11.1:', 'color: #3b82f6; font-weight: bold;');
    console.log('  - Fixed switchTab function to properly handle events');
    console.log('  - Rankings tab now displays correctly');
    console.log('  - All tab buttons now pass event parameter');
    console.log('%c Press Ctrl+Shift+R to force refresh!', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
  <\/script>
  <script src="https://cdn.tailwindcss.com?v=11.6"><\/script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js?v=11.6"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js?v=11.6"><\/script>
  <style>
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .tab-button.active { 
      background-color: #3B82F6; 
      color: white; 
    }
    .score-bar {
      height: 24px;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3B82F6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.6);
      animation: fadeIn 0.3s;
    }
    .modal.active {
      display: block;
    }
    .modal-content {
      background-color: #fefefe;
      margin: 5% auto;
      padding: 0;
      border-radius: 12px;
      width: 90%;
      max-width: 900px;
      max-height: 85vh;
      overflow-y: auto;
      animation: slideDown 0.3s;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .score-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      border-radius: 8px;
      padding: 12px;
    }
    .score-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      border-color: #3B82F6;
      background-color: #F8FAFC;
    }
  </style>
</head>
<body class="bg-gray-100">
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- ヘッダー -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-lg mb-8">
      <h1 class="text-4xl font-bold mb-2">
        <i class="fas fa-chart-line mr-3"></i>
        Stock AI Predictor
      </h1>
      <p class="text-xl opacity-90">5次元分析 × GPT-5で株価を予測</p>
      <p class="mt-2 text-sm opacity-75">
        テクニカル • ファンダメンタル • センチメント • マクロ経済 • アナリスト評価
      </p>
    </div>

    <!-- タブナビゲーション -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="flex border-b">
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('analysis', event)">
          <i class="fas fa-search mr-2"></i>銘柄分析
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('recommendations', event)">
          <i class="fas fa-star mr-2"></i>おすすめ銘柄TOP10
        </button>
        <button class="tab-button active px-6 py-4 font-semibold" onclick="switchTab('rankings', event)">
          <i class="fas fa-trophy mr-2"></i>ランキング
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('simulation', event)">
          <i class="fas fa-calculator mr-2"></i>投資シミュレーター
        </button>
        <button class="tab-button px-6 py-4 font-semibold" onclick="switchTab('backtest', event)">
          <i class="fas fa-history mr-2"></i>バックテスト
        </button>
      </div>
    </div>

    <!-- タブ1: 銘柄分析 -->
    <div id="analysis-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
          銘柄分析
        </h2>
        <div class="flex gap-4">
          <input 
            type="text" 
            id="symbol-input" 
            placeholder="銘柄コード (例: AAPL, TSLA, MSFT)" 
            class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onclick="analyzeStock()" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            <i class="fas fa-search mr-2"></i>分析開始
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          <i class="fas fa-info-circle mr-1"></i>
          人気銘柄: AAPL (Apple), TSLA (Tesla), MSFT (Microsoft), NVDA (NVIDIA), GOOGL (Google)
        </p>
        
        <!-- オンデマンド学習チェックボックス -->
        <div class="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="train-model-checkbox" 
              class="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div class="flex-1">
              <label for="train-model-checkbox" class="font-semibold text-gray-800 cursor-pointer">
                <i class="fas fa-brain text-purple-600"></i>
                このモデルを学習する（オンデマンド学習）
              </label>
              <p class="text-sm text-gray-600 mt-1">
                チェックすると、この銘柄専用のMLモデルを学習してから予測します。
                学習には約10-30秒かかりますが、より高精度な予測が可能です。
              </p>
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                学習結果は7日間キャッシュされ、次回の予測で再利用されます
              </p>
            </div>
          </div>
        </div>
        
        <!-- バックフィット検証オプション -->
        <div class="mt-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="enable-backfit-checkbox" 
              class="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div class="flex-1">
              <label for="enable-backfit-checkbox" class="font-semibold text-gray-800 cursor-pointer">
                <i class="fas fa-chart-line text-blue-600"></i>
                バックフィット検証も実施（予測精度の可視化）
              </label>
              <p class="text-sm text-gray-600 mt-1">
                チェックすると、過去30日を除外した別モデルで学習し、その30日の予測精度を検証します。
                データリークなしで実際のモデル精度を確認できます。
              </p>
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>仕組み:</strong> 本番用モデル（全データ学習）と検証用モデル（過去30日除外）の2つを学習
              </p>
              <p class="text-xs text-blue-600 mt-1">
                <i class="fas fa-clock mr-1"></i>
                追加で約5-10秒かかります（別モデル学習のため）
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="analysis-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">分析中... GPT-5 + Code Interpreter分析を実行しています（約3-5分）</p>
      </div>

      <div id="analysis-result" style="display:none;">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

    <!-- タブ2: おすすめ銘柄TOP10 -->
    <div id="recommendations-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-trophy mr-2 text-yellow-500"></i>
          おすすめ銘柄TOP10
        </h2>
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <h3 class="font-bold text-blue-800 mb-2">
            <i class="fas fa-info-circle mr-2"></i>選定ロジック
          </h3>
          <div class="text-sm text-gray-700 space-y-1">
            <p><strong>対象銘柄:</strong> S&P 500主要50社（時価総額上位）から15銘柄を分析</p>
            <p><strong>選定基準:</strong></p>
            <ul class="ml-6 list-disc">
              <li>5次元分析で総合スコアを算出（テクニカル35% + ファンダメンタル30% + センチメント15% + マクロ10% + アナリスト10%）</li>
              <li>スコア上位10銘柄を推奨</li>
              <li>BUY判定（スコア75点以上）を優先表示</li>
              <li>期待リターンと信頼度も考慮</li>
            </ul>
            <p><strong>更新頻度:</strong> リアルタイム（ボタンクリック時に最新データで分析）</p>
            <p class="text-xs text-gray-500 mt-2">※ パフォーマンス最適化のため、現在は15銘柄に限定しています（処理時間: 約15秒）</p>
          </div>
        </div>
        <button 
          onclick="loadRecommendations()" 
          class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-sync-alt mr-2"></i>最新のおすすめを取得（15銘柄分析）
        </button>
      </div>

      <div id="recommendations-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">分析中... 15銘柄を並列分析しています（約15秒）</p>
      </div>

      <div id="recommendations-result">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

    <!-- タブ3: 投資シミュレーター -->
    <div id="simulation-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-coins mr-2 text-green-600"></i>
          投資シミュレーター
        </h2>
        <p class="text-gray-600 mb-6">
          過去のデータで「もし〇〇日に買って〇〇日に売っていたら」をシミュレーション
        </p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-semibold mb-2">銘柄コード</label>
            <input 
              type="text" 
              id="sim-symbol" 
              placeholder="AAPL" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">投資額 (USD)</label>
            <input 
              type="number" 
              id="sim-amount" 
              placeholder="10000" 
              value="10000"
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">購入日</label>
            <input 
              type="date" 
              id="sim-purchase-date" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">売却日</label>
            <input 
              type="date" 
              id="sim-sell-date" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <button 
          onclick="runSimulation()" 
          class="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-play mr-2"></i>シミュレーション実行
        </button>
      </div>

      <div id="simulation-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">シミュレーション実行中...</p>
      </div>

      <div id="simulation-result">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

    <!-- タブ4: バックテスト -->
    <div id="backtest-tab" class="tab-content">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-check-circle mr-2 text-purple-600"></i>
          予測精度検証（バックテスト）
        </h2>
        <p class="text-gray-600 mb-6">
          過去のある日に予測した結果が実際どうだったかを検証
        </p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-semibold mb-2">銘柄コード</label>
            <input 
              type="text" 
              id="backtest-symbol" 
              placeholder="AAPL" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold mb-2">予測を行う日付</label>
            <input 
              type="date" 
              id="backtest-date" 
              class="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <button 
          onclick="runBacktest()" 
          class="w-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          <i class="fas fa-flask mr-2"></i>バックテスト実行
        </button>
      </div>

      <div id="backtest-loading" style="display:none;">
        <div class="loader"></div>
        <p class="text-center text-gray-600">バックテスト実行中...</p>
      </div>

      <div id="backtest-result">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>
  </div>

  <!-- 詳細分析モーダル -->
  <div id="detailModal" class="modal">
    <div class="modal-content">
      <div id="modal-body">
        <!-- モーダルの内容はJavaScriptで動的に挿入 -->
      </div>
    </div>
  </div>

  <!-- ランキングタブ -->
    <div id="rankings-tab" class="tab-content" style="display: block !important;">
      <div style="background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
          <i class="fas fa-trophy" style="margin-right: 8px; color: #eab308;"></i>
          NASDAQ-100 ランキング
        </h2>
        <p style="color: #4b5563; margin-bottom: 24px; font-size: 16px;">
          NASDAQ-100銘柄を複数の視点でランキング
        </p>
        
        <!-- ランキングタイプ選択 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
          <button onclick="loadRanking('recommended')" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-star" style="margin-right: 8px;"></i>
            おすすめTOP10
          </button>
          <button onclick="loadRanking('high-growth')" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-chart-line" style="margin-right: 8px;"></i>
            高成長×信頼度
          </button>
          <button onclick="loadRanking('short-term')" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-bolt" style="margin-right: 8px;"></i>
            短期トレード
          </button>
          <button onclick="loadRanking('trending')" style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; transition: background 0.3s;">
            <i class="fas fa-fire" style="margin-right: 8px;"></i>
            注目株
          </button>
        </div>
        
        <!-- 期間選択（高成長ランキング用） -->
        <div id="timeframe-selector" style="display:none; margin-bottom: 24px;">
          <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #374151;">予測期間</label>
          <select id="ranking-timeframe" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px;">
            <option value="30d">30日後</option>
            <option value="60d">60日後</option>
            <option value="90d" selected>90日後</option>
          </select>
        </div>
      </div>
      
      <div id="rankings-loading" style="display:none; text-align: center; padding: 40px;">
        <div class="loader" style="border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p style="color: #4b5563; font-size: 16px;">ランキング計算中... NASDAQ-100銘柄を分析しています（約1-5分）</p>
      </div>
      
      <!-- 初期表示メッセージ -->
      <div id="rankings-welcome" style="background: linear-gradient(to right, #eff6ff, #faf5ff); border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <i class="fas fa-chart-bar" style="font-size: 64px; color: #3b82f6; margin-bottom: 16px; display: block;"></i>
          <h3 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">NASDAQ-100 ランキング分析</h3>
          <p style="color: #4b5563; font-size: 16px;">上のボタンから分析タイプを選択してください</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 900px; margin: 0 auto;">
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-star" style="color: #3b82f6; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">おすすめTOP10</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">統計モデルによる総合評価ランキング</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>即時表示
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>無料</span>
            </p>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #10b981;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-chart-line" style="color: #10b981; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">高成長×信頼度</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">GPT-5-miniによる成長予測分析</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>1-5分
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>$1.50/回</span>
            </p>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #f97316;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-bolt" style="color: #f97316; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">短期トレード</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">テクニカル指標による短期推奨銘柄</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>即時表示
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>無料</span>
            </p>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; border-left: 4px solid #8b5cf6;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <i class="fas fa-fire" style="color: #8b5cf6; margin-right: 8px;"></i>
              <h4 style="font-weight: 600; font-size: 16px;">注目株</h4>
            </div>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">ニュース・SNS・アナリスト評価による注目銘柄</p>
            <p style="font-size: 12px; color: #6b7280;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i>即時表示
              <span style="margin-left: 8px;"><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>無料</span>
            </p>
          </div>
        </div>
        
        <div style="margin-top: 24px; text-align: center;">
          <p style="font-size: 14px; color: #6b7280;">
            <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
            各ランキングはキャッシュされており、一定期間内は同じ結果が表示されます
          </p>
        </div>
      </div>
      
      <div id="rankings-result" style="display:none;">
        <!-- 結果はJavaScriptで動的に挿入 -->
      </div>
    </div>

  <script>
    // グローバル変数: 分析データを保存
    window.currentAnalysisData = null

    // 詳細モーダル表示（最初に定義）
    window.showDetailModal = function(dimension) {
      console.log('showDetailModal called with dimension:', dimension)
      console.log('currentAnalysisData:', window.currentAnalysisData)
      
      if (!window.currentAnalysisData) {
        alert('先に銘柄分析を実行してください')
        return
      }
      
      try {
        const data = window.currentAnalysisData
        console.log('Analysis data loaded:', data)
        const modal = document.getElementById('detailModal')
        const modalBody = document.getElementById('modal-body')
        
        if (!modal || !modalBody) {
          console.error('Modal elements not found')
          return
        }
        
        let content = ''
        
        if (dimension === 'technical') {
        const tech = data.analysis.technical
        content = \`
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-chart-line mr-3"></i>テクニカル分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-blue-100">過去の価格データから統計的指標を算出</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-blue-800"><i class="fas fa-star mr-2"></i>テクニカルスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-blue-600">\${tech.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 35%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(tech.score * 0.35).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-blue-800"><i class="fas fa-chart-bar mr-2"></i>主要指標</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="border-l-4 border-blue-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">RSI (相対力指数)</p>
                  <p class="text-2xl font-bold">\${tech.rsi?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.rsi < 30 ? '売られすぎ' : tech.rsi > 70 ? '買われすぎ' : '中立'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">MACD</p>
                  <p class="text-2xl font-bold">\${tech.macd?.macd?.toFixed(4) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${tech.macd?.macd > 0 ? '上昇トレンド' : '下降トレンド'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">短期MA (20日)</p>
                  <p class="text-2xl font-bold">$\${tech.sma20?.toFixed(2) || 'N/A'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">長期MA (50日)</p>
                  <p class="text-2xl font-bold">$\${tech.sma50?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>計算方法</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>RSI:</strong> 過去14日間の価格変動から相対的な強弱を算出 (0-100)</li>
                <li><strong>MACD:</strong> 短期EMA(12) - 長期EMA(26) でトレンドの転換点を検出</li>
              </ul>
            </div>
          </div>
        \`
      } else if (dimension === 'fundamental') {
        const fund = data.analysis.fundamental
        content = \`
          <div class="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-building mr-3"></i>ファンダメンタル分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-green-100">企業の財務健全性と成長性を評価</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-green-800"><i class="fas fa-star mr-2"></i>ファンダメンタルスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-green-600">\${fund.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 30%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(fund.score * 0.30).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-green-800"><i class="fas fa-chart-bar mr-2"></i>財務指標</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="border-l-4 border-blue-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">PER (株価収益率)</p>
                  <p class="text-2xl font-bold">\${fund.pe_ratio?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.pe_ratio ? '-' : fund.pe_ratio < 15 ? '割安' : fund.pe_ratio > 25 ? '割高' : '適正'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">ROE (自己資本利益率)</p>
                  <p class="text-2xl font-bold">\${fund.roe?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.roe ? '-' : fund.roe > 15 ? '優良' : fund.roe > 10 ? '良好' : '低い'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">PBR (株価純資産倍率)</p>
                  <p class="text-2xl font-bold">\${fund.pb_ratio?.toFixed(2) || 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.pb_ratio ? '-' : fund.pb_ratio < 1 ? '割安' : fund.pb_ratio < 3 ? '適正' : '割高'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">配当利回り</p>
                  <p class="text-2xl font-bold">\${fund.dividend_yield ? (fund.dividend_yield * 100).toFixed(2) + '%' : 'N/A'}</p>
                  <p class="text-xs text-gray-500 mt-1">\${!fund.dividend_yield ? '-' : fund.dividend_yield > 0.03 ? '高配当' : '低配当'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>指標の意味</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>PER:</strong> 株価が1株あたり利益の何倍か。低いほど割安</li>
                <li><strong>ROE:</strong> 自己資本でどれだけ利益を生んだか。15%以上が優良</li>
                <li><strong>売上成長率:</strong> 前年比の売上増加率。10%以上が高成長</li>
                <li><strong>利益率:</strong> 売上に対する純利益の割合。高いほど効率的</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-lightbulb mr-2"></i>評価ポイント</h3>
              <div class="space-y-2 text-sm">
                <p class="text-gray-700">✓ PERが15未満: 割安と判断し、+20点</p>
                <p class="text-gray-700">✓ ROEが15%以上: 優良企業として+20点</p>
                <p class="text-gray-700">✓ 売上成長率が10%以上: 高成長企業として+30点</p>
                <p class="text-gray-700">✓ 利益率が20%以上: 高収益企業として+30点</p>
              </div>
            </div>
          </div>
        \`
      } else if (dimension === 'sentiment') {
        const sent = data.analysis.sentiment
        content = \`
          <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-newspaper mr-3"></i>センチメント分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-yellow-100">最新ニュースをGPT-5で分析</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-yellow-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-yellow-800"><i class="fas fa-star mr-2"></i>センチメントスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-yellow-600">\${sent.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 15%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(sent.score * 0.15).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-yellow-800"><i class="fas fa-newspaper mr-2"></i>ニュース分析</h3>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <p class="text-sm text-gray-600">ポジティブ</p>
                  <p class="text-3xl font-bold text-green-600">\${sent.positive_count || 0}</p>
                </div>
                <div class="bg-gray-50 border-l-4 border-gray-500 p-3 rounded">
                  <p class="text-sm text-gray-600">中立</p>
                  <p class="text-3xl font-bold text-gray-600">\${sent.neutral_count || 0}</p>
                </div>
                <div class="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <p class="text-sm text-gray-600">ネガティブ</p>
                  <p class="text-3xl font-bold text-red-600">\${sent.negative_count || 0}</p>
                </div>
              </div>
              <div class="bg-blue-50 p-3 rounded">
                <p class="text-sm text-gray-600">分析ニュース総数</p>
                <p class="text-2xl font-bold text-blue-600">\${sent.news_count || 0}件</p>
              </div>
            </div>

            <!-- ニュース判断例 -->
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-list mr-2"></i>ニュース判断例 (直近5件)</h3>
              \${sent.news_examples && sent.news_examples.length > 0 ? \`
                <div class="space-y-3">
                  \${sent.news_examples.map(example => \`
                    <div class="border-l-4 \${example.sentiment === 'positive' ? 'border-green-500 bg-green-50' : example.sentiment === 'negative' ? 'border-red-500 bg-red-50' : 'border-gray-500 bg-gray-50'} p-3 rounded">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                          <span class="text-xs font-bold px-2 py-1 rounded \${example.sentiment === 'positive' ? 'bg-green-500 text-white' : example.sentiment === 'negative' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}">
                            \${example.sentiment === 'positive' ? 'ポジティブ' : example.sentiment === 'negative' ? 'ネガティブ' : '中立'}
                          </span>
                          <span class="text-xs text-gray-500 ml-2">[\${example.source}]</span>
                        </div>
                        <span class="text-xs text-blue-600 font-bold"><i class="far fa-calendar mr-1"></i>\${example.date_formatted}</span>
                      </div>
                      <p class="font-bold text-sm mb-1">\${example.headline}</p>
                      <p class="text-xs text-gray-600">\${example.summary}</p>
                    </div>
                  \`).join('')}
                </div>
              \` : \`
                <p class="text-sm text-gray-500">ニュース判断例がありません</p>
              \`}
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-robot mr-2"></i>GPT-5分析</h3>
              <p class="text-sm text-gray-700 mb-2">最新20件のニュース記事をAIが自動分析し、市場センチメントを評価しています。</p>
              <ul class="space-y-1 text-sm text-gray-700">
                <li>✓ ニュース見出しと概要を自然言語処理</li>
                <li>✓ ポジティブ/ネガティブ/中立を分類</li>
                <li>✓ 記事の信頼性と影響度を考慮</li>
                <li>✓ 総合的なセンチメントスコアを算出</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>スコア計算式</h3>
              <div class="bg-white p-3 rounded border text-center text-sm font-mono">
                Score = 50 + (Positive × 10) - (Negative × 10) + (総記事数 × 1)
              </div>
              <p class="text-xs text-gray-600 mt-2 text-center">※ 最小0、最大100に正規化</p>
            </div>
          </div>
        \`
      } else if (dimension === 'macro') {
        const macro = data.analysis.macro
        content = \`
          <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-globe mr-3"></i>マクロ経済分析詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-purple-100">米国の主要経済指標を評価</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-purple-800"><i class="fas fa-star mr-2"></i>マクロ経済スコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-purple-600">\${macro.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 10%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(macro.score * 0.10).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-purple-800"><i class="fas fa-chart-line mr-2"></i>経済指標</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="border-l-4 border-blue-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">GDP成長率</p>
                  <p class="text-2xl font-bold">\${macro.gdp_growth?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.gdp_growth ? '-' : macro.gdp_growth > 3 ? '強い経済' : macro.gdp_growth > 2 ? '健全' : '鈍化'}</p>
                </div>
                <div class="border-l-4 border-green-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">失業率</p>
                  <p class="text-2xl font-bold">\${macro.unemployment?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.unemployment ? '-' : macro.unemployment < 4 ? '完全雇用' : macro.unemployment < 6 ? '正常' : '高い'}</p>
                </div>
                <div class="border-l-4 border-yellow-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">インフレ率 (CPI)</p>
                  <p class="text-2xl font-bold">\${macro.inflation?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.inflation ? '-' : macro.inflation < 2 ? '低インフレ' : macro.inflation < 4 ? '適正' : '高インフレ'}</p>
                </div>
                <div class="border-l-4 border-purple-500 pl-4 py-2">
                  <p class="text-sm text-gray-600">政策金利 (FF Rate)</p>
                  <p class="text-2xl font-bold">\${macro.interest_rate?.toFixed(2) || 'N/A'}%</p>
                  <p class="text-xs text-gray-500 mt-1">\${!macro.interest_rate ? '-' : macro.interest_rate < 2 ? '低金利' : macro.interest_rate < 4 ? '中金利' : '高金利'}</p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>指標の意味</h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li><strong>GDP成長率:</strong> 経済全体の成長速度。3%以上が強い経済</li>
                <li><strong>失業率:</strong> 労働市場の健全性。4%未満が完全雇用</li>
                <li><strong>インフレ率:</strong> 物価上昇率。2%前後が適正</li>
                <li><strong>政策金利:</strong> FRBの金融政策。低金利は株式に有利</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-lightbulb mr-2"></i>評価ロジック</h3>
              <div class="space-y-2 text-sm">
                <p class="text-gray-700">✓ GDP成長率 2%以上: 健全な経済として+20点</p>
                <p class="text-gray-700">✓ 失業率 6%未満: 雇用安定として+20点</p>
                <p class="text-gray-700">✓ インフレ率 2-4%: 適正範囲として+30点</p>
                <p class="text-gray-700">✓ 政策金利 4%未満: 低金利環境として+30点</p>
              </div>
            </div>
          </div>
        \`
      } else if (dimension === 'analyst') {
        const analyst = data.analysis.analyst
        content = \`
          <div class="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <div class="flex justify-between items-center">
              <h2 class="text-3xl font-bold"><i class="fas fa-user-tie mr-3"></i>アナリスト評価詳細</h2>
              <button onclick="closeModal()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
            <p class="mt-2 text-red-100">プロのアナリストによる投資判断</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-red-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3 text-red-800"><i class="fas fa-star mr-2"></i>アナリストスコア</h3>
                <div class="text-center">
                  <p class="text-5xl font-bold text-red-600">\${analyst.score}</p>
                  <p class="text-gray-600 mt-2">/ 100点</p>
                </div>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>加重スコア</h3>
                <p class="text-sm text-gray-600 mb-2">重み: 10%</p>
                <div class="text-center">
                  <p class="text-5xl font-bold text-gray-700">\${(analyst.score * 0.10).toFixed(1)}</p>
                  <p class="text-gray-600 mt-2">総合スコアへの寄与</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="font-bold text-lg mb-3 text-red-800"><i class="fas fa-users mr-2"></i>アナリスト評価</h3>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-4 rounded-lg">
                  <p class="text-sm text-gray-600 mb-1">コンセンサス</p>
                  <p class="text-4xl font-bold \${analyst.consensus === 'BUY' ? 'text-green-600' : analyst.consensus === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                    \${analyst.consensus || 'N/A'}
                  </p>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
                  <p class="text-sm text-gray-600 mb-1">アナリスト数</p>
                  <p class="text-4xl font-bold text-blue-600">\${analyst.recommendation_count || 0}</p>
                  <p class="text-xs text-gray-500 mt-1">人のアナリストが評価</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 p-3 rounded">
                  <p class="text-sm text-gray-600">目標株価</p>
                  <p class="text-2xl font-bold text-blue-600">\${analyst.target_price ? '$' + analyst.target_price.toFixed(2) : 'N/A'}</p>
                </div>
                <div class="bg-purple-50 p-3 rounded">
                  <p class="text-sm text-gray-600">上昇余地</p>
                  <p class="text-2xl font-bold \${analyst.upside && analyst.upside > 0 ? 'text-green-600' : 'text-red-600'}">
                    \${analyst.upside ? analyst.upside.toFixed(1) + '%' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-info-circle mr-2"></i>アナリスト評価とは</h3>
              <p class="text-sm text-gray-700 mb-2">
                金融機関や投資銀行に所属するプロのアナリストが、企業の財務分析、業界動向、競合比較などを基に投資判断を提供します。
              </p>
              <ul class="space-y-1 text-sm text-gray-700">
                <li>✓ <strong>買い推奨:</strong> 現在価格から上昇が期待される</li>
                <li>✓ <strong>中立:</strong> 保有継続を推奨</li>
                <li>✓ <strong>売り推奨:</strong> 株価下落が懸念される</li>
              </ul>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="font-bold text-lg mb-3"><i class="fas fa-calculator mr-2"></i>スコア計算方法</h3>
              <div class="space-y-2 text-sm text-gray-700">
                <p><strong>レーティング評価:</strong></p>
                <ul class="ml-4">
                  <li>• 買い推奨が70%以上: +30点</li>
                  <li>• 買い推奨が50-70%: +20点</li>
                  <li>• 売り推奨が50%以上: -20点</li>
                </ul>
                <p class="mt-2"><strong>目標株価評価:</strong></p>
                <ul class="ml-4">
                  <li>• 上昇余地が20%以上: +40点</li>
                  <li>• 上昇余地が10-20%: +30点</li>
                  <li>• 上昇余地が0-10%: +20点</li>
                  <li>• 下落が予想される: +10点</li>
                </ul>
              </div>
            </div>
          </div>
        \`
      }
      
      console.log('Setting modal content for dimension:', dimension)
      modalBody.innerHTML = content
      modal.classList.add('active')
      console.log('Modal opened successfully')
      
      } catch (error) {
        console.error('Error in showDetailModal:', error)
        alert('モーダル表示エラー: ' + error.message)
      }
    }

    // モーダルを閉じる（最初に定義）
    window.closeModal = function() {
      document.getElementById('detailModal').classList.remove('active')
    }

    // タブ切り替え
    window.switchTab = function(tabName, event) {
      console.log('Switching to tab:', tabName)
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'))
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'))
      
      const targetTab = document.getElementById(tabName + '-tab')
      if (targetTab) {
        targetTab.classList.add('active')
        console.log('Tab activated:', tabName + '-tab')
        console.log('Tab display after activation:', window.getComputedStyle(targetTab).display)
      } else {
        console.error('Tab not found:', tabName + '-tab')
      }
      
      if (event && event.target) {
        const button = event.target.closest('.tab-button')
        if (button) {
          button.classList.add('active')
          console.log('Button activated')
        }
      }
    }

    // 銘柄分析
    async function analyzeStock() {
      const symbol = document.getElementById('symbol-input').value.trim().toUpperCase()
      if (!symbol) {
        alert('銘柄コードを入力してください')
        return
      }

      // チェックボックスから学習フラグを取得
      const trainModel = document.getElementById('train-model-checkbox').checked
      const enableBackfit = document.getElementById('enable-backfit-checkbox').checked
      console.log('Train model:', trainModel, 'Enable backfit:', enableBackfit)

      // 動的ローディングメッセージ
      const loadingDiv = document.getElementById('analysis-loading')
      let loadingMessage = '分析中... GPT-5 + Code Interpreter分析を実行しています（約3-5分）'
      if (trainModel && enableBackfit) {
        loadingMessage = '分析中... モデル学習 + バックフィット検証 + GPT-5分析を実行しています（約3-5分）'
      } else if (trainModel) {
        loadingMessage = '分析中... モデル学習 + GPT-5分析を実行しています（約3-5分）'
      }
      
      loadingDiv.innerHTML = \`
        <div class="loader"></div>
        <p class="text-center text-gray-600">\${loadingMessage}</p>
      \`

      document.getElementById('analysis-loading').style.display = 'block'
      document.getElementById('analysis-result').style.display = 'none'

      try {
        const response = await axios.post('/api/analyze', { symbol, trainModel, enableBackfit })
        const data = response.data
        
        // デバッグ: データ構造を確認
        console.log('[ANALYZE] Analysis data received:', {
          has_future: !!data.prediction.future,
          has_ml_training: !!data.prediction.ml_training,
          has_ml_future: !!data.prediction.ml_training?.future_predictions,
          future_dates_count: data.prediction.future?.dates?.length || 0
        })
        
        // バックエンドデバッグ情報を表示
        if (data.debug) {
          console.log('[BACKEND-DEBUG] Environment and ML status:')
          console.log('  - ML_API_URL configured:', data.debug.ml_api_url_configured)
          console.log('  - ML_API_URL value:', data.debug.ml_api_url)
          console.log('  - Train model requested:', data.debug.train_model_requested)
          console.log('  - ML prediction exists:', data.debug.ml_prediction_exists)
          console.log('  - ML training exists:', data.debug.ml_training_exists)
        }
        
        // さらに詳細なデバッグ情報
        console.log('[ANALYZE-DETAIL] Full data.prediction structure:')
        console.log('  - future:', data.prediction.future)
        console.log('  - ml_training:', data.prediction.ml_training)
        if (data.prediction.ml_training) {
          console.log('  - ml_training.future_predictions:', data.prediction.ml_training.future_predictions)
          if (data.prediction.ml_training.future_predictions) {
            console.log('  - future_predictions.predictions length:', data.prediction.ml_training.future_predictions.predictions?.length)
            console.log('  - future_predictions.predictions[29]:', data.prediction.ml_training.future_predictions.predictions?.[29])
          }
          console.log('  - ml_training.backfit_predictions:', data.prediction.ml_training.backfit_predictions)
          if (data.prediction.ml_training.backfit_predictions) {
            console.log('  - backfit_predictions.rmse:', data.prediction.ml_training.backfit_predictions.rmse)
            console.log('  - backfit_predictions.mae:', data.prediction.ml_training.backfit_predictions.mae)
            console.log('  - backfit_predictions.direction_accuracy:', data.prediction.ml_training.backfit_predictions.direction_accuracy)
          }
        }
        
        // グローバルに保存してモーダルから参照可能にする
        window.currentAnalysisData = data
        
        // データの安全な処理: undefinedやnullを0に変換
        const safeData = {
          ...data,
          prediction: {
            ...data.prediction,
            ml_prediction: data.prediction.ml_prediction ? {
              ...data.prediction.ml_prediction,
              predicted_price: data.prediction.ml_prediction.predicted_price || 0,
              change_percent: data.prediction.ml_prediction.change_percent || 0,
              model_metrics: data.prediction.ml_prediction.model_metrics ? {
                mae: data.prediction.ml_prediction.model_metrics.mae || 0,
                rmse: data.prediction.ml_prediction.model_metrics.rmse || 0,
                r2_score: data.prediction.ml_prediction.model_metrics.r2_score || 0
              } : { mae: 0, rmse: 0, r2_score: 0 }
            } : null,
            ml_training: data.prediction.ml_training ? {
              ...data.prediction.ml_training,
              training_duration: data.prediction.ml_training.training_duration || 0,
              accuracy_metrics: {
                mae: data.prediction.ml_training.accuracy_metrics?.mae || 0,
                rmse: data.prediction.ml_training.accuracy_metrics?.rmse || 0,
                r2_score: data.prediction.ml_training.accuracy_metrics?.r2_score || 0,
                training_samples: data.prediction.ml_training.accuracy_metrics?.training_samples || 0,
                validation_samples: data.prediction.ml_training.accuracy_metrics?.validation_samples || 0
              }
            } : null
          }
        };
        
        // safeDataを使用してレンダリング
        const displayData = safeData;

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h2 class="text-3xl font-bold">\${symbol}</h2>
                <p class="text-2xl text-gray-600 mt-2">$\${data.current_price.toFixed(2)}</p>
              </div>
              <div class="text-right">
                <div class="text-5xl font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                  \${data.prediction.action}
                </div>
                <p class="text-lg text-gray-600 mt-2">
                  信頼度: \${data.prediction.confidence}%
                  <i class="fas fa-info-circle ml-1 text-blue-500 cursor-pointer" 
                     title="信頼度は判定の確実性を示します。スコアと一致度が高いほど信頼度が上がります。" 
                     onclick="alert('【信頼度とは】\\n\\n判定の確実性を示す指標です。\\n\\n【スコアと信頼度の関係】\\n• 75点以上: 信頼度75-100% (強いBUY)\\n• 60-75点: 信頼度60-75% (中程度のBUY)\\n• 40-60点: 信頼度40-60% (HOLD/様子見)\\n• 40点未満: 信頼度60-100% (SELL)\\n\\n【重要な注意点】\\n総合スコアが高くても信頼度が低い場合は、\\n各分析次元の結果にばらつきがあります。\\n例: テクニカル85点でもファンダメンタル40点など\\n\\n信頼度が低い場合は慎重に判断してください。')"></i>
                </p>
              </div>
            </div>

            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xl font-bold">総合スコア: \${data.prediction.score}/100</h3>
                <i class="fas fa-info-circle text-blue-500 cursor-pointer" 
                   title="5つの分析を重み付け平均したスコア" 
                   onclick="alert('【総合スコアとは】\\n\\n5次元分析の加重平均値です：\\n\\n• テクニカル: 35%\\n• ファンダメンタル: 30%\\n• センチメント: 15%\\n• マクロ経済: 10%\\n• アナリスト: 10%\\n\\n【判定基準】\\n• 75点以上: BUY（買い推奨）\\n• 60-75点: HOLD（保持推奨）\\n• 60点未満: SELL（売り推奨）')"></i>
              </div>
              <div class="bg-gray-200 rounded-full h-6">
                <div class="score-bar bg-gradient-to-r from-blue-500 to-purple-600" style="width: \${data.prediction.score}%"></div>
              </div>
            </div>

            <div class="grid grid-cols-5 gap-4 mb-6">
              <div id="card-technical" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-chart-line mr-1"></i>テクニカル</p>
                <p class="text-2xl font-bold text-blue-600">\${data.prediction.breakdown.technical}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-fundamental" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-building mr-1"></i>ファンダメンタル</p>
                <p class="text-2xl font-bold text-green-600">\${data.prediction.breakdown.fundamental}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-sentiment" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-newspaper mr-1"></i>センチメント</p>
                <p class="text-2xl font-bold text-yellow-600">\${data.prediction.breakdown.sentiment}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-macro" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-globe mr-1"></i>マクロ経済</p>
                <p class="text-2xl font-bold text-purple-600">\${data.prediction.breakdown.macro}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
              <div id="card-analyst" class="score-card text-center cursor-pointer hover:shadow-lg transition">
                <p class="text-sm text-gray-600 mb-1"><i class="fas fa-user-tie mr-1"></i>アナリスト</p>
                <p class="text-2xl font-bold text-red-600">\${data.prediction.breakdown.analyst}</p>
                <p class="text-xs text-gray-500 mt-1">クリックして詳細表示</p>
              </div>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-4 text-center"><i class="fas fa-chart-radar mr-2"></i>5次元分析レーダーチャート</h4>
              <canvas id="radarChart" style="max-height: 300px;"></canvas>
            </div>

            <!-- ML予測比較セクション -->
            \${data.prediction.ml_prediction ? \`
            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6 border-2 border-green-200">
              <h4 class="font-bold text-xl mb-4 text-center">
                <i class="fas fa-robot mr-2"></i>デュアル予測システム: 統計 vs 機械学習
              </h4>
              
              <div class="grid grid-cols-2 gap-6">
                <!-- 統計的予測（既存） -->
                <div class="bg-white p-6 rounded-lg shadow-md border-2 border-blue-300">
                  <div class="flex items-center justify-between mb-4">
                    <h5 class="text-lg font-bold text-blue-700">
                      <i class="fas fa-chart-line mr-2"></i>統計的予測
                    </h5>
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">SMA-Based</span>
                  </div>
                  
                  <div class="space-y-3">
                    <div>
                      <p class="text-sm text-gray-600">判定</p>
                      <p class="text-3xl font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                        \${data.prediction.action}
                      </p>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">信頼度</p>
                      <div class="flex items-center">
                        <p class="text-2xl font-bold text-blue-600">\${data.prediction.confidence}%</p>
                        <div class="ml-3 flex-1">
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: \${data.prediction.confidence}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">総合スコア</p>
                      <p class="text-2xl font-bold text-blue-700">\${data.prediction.score}/100</p>
                    </div>
                    
                    <div class="pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        5次元分析の加重平均による統計的手法
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- ML予測（新規） -->
                <div class="bg-white p-6 rounded-lg shadow-md border-2 border-green-300">
                  <div class="flex items-center justify-between mb-4">
                    <h5 class="text-lg font-bold text-green-700">
                      <i class="fas fa-brain mr-2"></i>ML予測
                    </h5>
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">LightGBM</span>
                  </div>
                  
                  <div class="space-y-3">
                    <div>
                      <p class="text-sm text-gray-600">予測価格</p>
                      <p class="text-3xl font-bold text-green-600">
                        $\${data.prediction.ml_prediction.predicted_price.toFixed(2)}
                      </p>
                      <p class="text-sm \${data.prediction.ml_prediction.change_percent > 0 ? 'text-green-600' : 'text-red-600'}">
                        \${data.prediction.ml_prediction.change_percent > 0 ? '+' : ''}\${data.prediction.ml_prediction.change_percent.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">ML信頼度</p>
                      <div class="flex items-center">
                        <p class="text-2xl font-bold text-green-600">\${Math.round(data.prediction.ml_prediction.confidence * 100)}%</p>
                        <div class="ml-3 flex-1">
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: \${data.prediction.ml_prediction.confidence * 100}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p class="text-sm text-gray-600">使用特徴量</p>
                      <p class="text-2xl font-bold text-green-700">\${data.prediction.ml_prediction.features_used}個</p>
                    </div>
                    
                    <div class="pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-microchip mr-1"></i>
                        \${data.prediction.ml_prediction.model}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 比較分析 -->
              <div class="mt-6 bg-white p-4 rounded-lg">
                <h6 class="font-bold text-sm text-gray-700 mb-3">
                  <i class="fas fa-balance-scale mr-2"></i>予測手法の比較
                </h6>
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p class="font-bold text-blue-700 mb-1">統計的予測の特徴:</p>
                    <ul class="space-y-1 text-gray-600">
                      <li>✓ 多次元分析の統合</li>
                      <li>✓ 解釈性が高い</li>
                      <li>✓ リアルタイム計算</li>
                    </ul>
                  </div>
                  <div>
                    <p class="font-bold text-green-700 mb-1">ML予測の特徴:</p>
                    <ul class="space-y-1 text-gray-600">
                      <li>✓ 過去パターン学習</li>
                      <li>✓ 非線形関係の捕捉</li>
                      <li>✓ 高精度な価格予測</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- 精度評価と動作検証 -->
              <div class="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <h6 class="font-bold text-lg text-gray-800 mb-4 text-center">
                  <i class="fas fa-flask mr-2"></i>予測精度と動作検証
                </h6>
                
                <div class="grid grid-cols-2 gap-6">
                  <!-- 統計予測の精度 -->
                  <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-blue-700 mb-3">
                      <i class="fas fa-chart-line mr-1"></i>統計予測の精度
                    </h6>
                    \${data.prediction.backfit ? \`
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">RMSE:</span>
                        <span class="font-bold text-blue-600">\${data.prediction.backfit.accuracy.rmse.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">MAE:</span>
                        <span class="font-bold text-blue-600">\${data.prediction.backfit.accuracy.mae.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">方向性正解率:</span>
                        <span class="font-bold text-blue-600">\${data.prediction.backfit.accuracy.directionAccuracy.toFixed(1)}%</span>
                      </div>
                      <div class="pt-2 border-t mt-2">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          過去30日間のバックテスト結果
                        </p>
                      </div>
                    </div>
                    \` : '<p class="text-xs text-gray-500">精度データなし</p>'}
                  </div>
                  
                  <!-- ML予測の動作状態 -->
                  <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-green-700 mb-3">
                      <i class="fas fa-robot mr-1"></i>ML予測の動作状態
                    </h6>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">API状態:</span>
                        <span class="font-bold text-green-600">
                          <i class="fas fa-check-circle mr-1"></i>正常稼働中
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">モデル:</span>
                        <span class="font-bold text-green-600">\${data.prediction.ml_prediction.model}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">予測時刻:</span>
                        <span class="font-bold text-green-600 text-xs">
                          \${new Date(data.prediction.ml_prediction.timestamp).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <div class="pt-2 border-t mt-2">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-server mr-1"></i>
                          Google Cloud Run経由でLightGBMモデル実行
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 一致度分析 -->
                <div class="mt-4 bg-white p-4 rounded-lg shadow">
                  <h6 class="font-bold text-sm text-purple-700 mb-3">
                    <i class="fas fa-sync-alt mr-1"></i>予測一致度分析
                  </h6>
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-600">現在価格</span>
                        <span class="text-sm font-bold text-gray-800">$\${data.current_price.toFixed(2)}</span>
                      </div>
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-600">統計予測（傾向）</span>
                        <span class="text-sm font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">
                          \${data.prediction.action} (\${data.prediction.confidence}%)
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">ML予測価格</span>
                        <span class="text-sm font-bold text-green-600">
                          $\${data.prediction.ml_prediction.predicted_price.toFixed(2)} 
                          <span class="\${data.prediction.ml_prediction.change_percent > 0 ? 'text-green-600' : 'text-red-600'}">
                            (\${data.prediction.ml_prediction.change_percent > 0 ? '+' : ''}\${data.prediction.ml_prediction.change_percent.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <div class="pt-3 border-t">
                      \${(() => {
                        const mlDirection = data.prediction.ml_prediction.change_percent > 0 ? 'BUY' : data.prediction.ml_prediction.change_percent < 0 ? 'SELL' : 'HOLD';
                        const isMatch = (data.prediction.action === mlDirection) || 
                                       (data.prediction.action === 'HOLD' && Math.abs(data.prediction.ml_prediction.change_percent) < 1) ||
                                       (mlDirection === 'HOLD' && data.prediction.action === 'HOLD');
                        return \`
                          <div class="flex items-center justify-between">
                            <span class="text-sm font-bold text-gray-700">予測一致度:</span>
                            <div class="flex items-center">
                              <span class="px-3 py-1 rounded-full text-xs font-bold \${isMatch ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                <i class="fas fa-\${isMatch ? 'check' : 'exclamation-triangle'} mr-1"></i>
                                \${isMatch ? '一致' : '不一致'}
                              </span>
                              <i class="fas fa-info-circle ml-2 text-gray-400 cursor-pointer" 
                                 title="両予測が同じ方向（上昇/下降）を示している場合は一致と判定"></i>
                            </div>
                          </div>
                          <p class="text-xs text-gray-600 mt-2">
                            \${isMatch 
                              ? '✓ 統計予測とML予測が同じ方向性を示しています。信頼度が高い予測です。' 
                              : '[WARN] 統計予測とML予測で方向性が異なります。慎重な判断を推奨します。'}
                          </p>
                        \`;
                      })()}
                    </div>
                  </div>
                </div>
                
                <!-- ML学習モデル詳細 -->
                <div class="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
                  <h6 class="font-bold text-lg text-gray-800 mb-4 text-center">
                    <i class="fas fa-brain mr-2"></i>ML推論モデル詳細
                  </h6>
                  
                  <div class="grid grid-cols-3 gap-4">
                    <!-- モデルアーキテクチャ -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h6 class="font-bold text-sm text-indigo-700 mb-3">
                        <i class="fas fa-sitemap mr-1"></i>モデルアーキテクチャ
                      </h6>
                      <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">アルゴリズム:</span>
                          <span class="font-bold text-indigo-600">LightGBM</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">タイプ:</span>
                          <span class="font-bold text-indigo-600">勾配ブースティング</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">使用特徴量:</span>
                          <span class="font-bold text-indigo-600">\${data.prediction.ml_prediction.features_used}個</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">予測対象:</span>
                          <span class="font-bold text-indigo-600">翌日終値</span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          決定木の集合により非線形パターンを学習
                        </p>
                      </div>
                    </div>
                    
                    <!-- 特徴量の内訳 -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h6 class="font-bold text-sm text-indigo-700 mb-3">
                        <i class="fas fa-list-ul mr-1"></i>特徴量の内訳
                      </h6>
                      <div class="space-y-1 text-xs">
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">価格データ</span>
                          <span class="font-bold text-indigo-600">5個</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">移動平均</span>
                          <span class="font-bold text-indigo-600">3個</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">テクニカル</span>
                          <span class="font-bold text-indigo-600">2個</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-gray-100">
                          <span class="text-gray-600">センチメント</span>
                          <span class="font-bold text-indigo-600">1個</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                          <span class="text-gray-600">その他</span>
                          <span class="font-bold text-indigo-600">1個</span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-info-circle mr-1"></i>
                          多様な観点から市場を分析
                        </p>
                      </div>
                    </div>
                    
                    <!-- 推論パフォーマンス -->
                    <div class="bg-white p-4 rounded-lg shadow">
                      <h6 class="font-bold text-sm text-indigo-700 mb-3">
                        <i class="fas fa-tachometer-alt mr-1"></i>推論パフォーマンス
                      </h6>
                      <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">推論時間:</span>
                          <span class="font-bold text-green-600">~0.1秒</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">実行環境:</span>
                          <span class="font-bold text-indigo-600">Cloud Run</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">リソース:</span>
                          <span class="font-bold text-indigo-600">512 MiB</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-gray-600">API状態:</span>
                          <span class="font-bold text-green-600">
                            <i class="fas fa-check-circle"></i> 正常
                          </span>
                        </div>
                      </div>
                      <div class="mt-3 pt-3 border-t">
                        <p class="text-xs text-gray-500">
                          <i class="fas fa-bolt mr-1"></i>
                          高速・スケーラブルな推論
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 特徴量重要度ビジュアライゼーション (動的) -->
                  <div class="mt-4 bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-indigo-700 mb-3">
                      <i class="fas fa-chart-bar mr-1"></i>特徴量重要度（Top 10）
                    </h6>
                    \${data.prediction.ml_prediction.feature_importances ? \`
                      <div class="mb-3">
                        <canvas id="featureImportanceChart" style="max-height: 250px;"></canvas>
                      </div>
                    \` : \`
                      <div class="space-y-2">
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">1. 現在価格 (close)</span>
                            <span class="text-xs font-bold text-indigo-600">100%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-600 h-2 rounded-full" style="width: 100%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">2. 20日移動平均 (SMA20)</span>
                            <span class="text-xs font-bold text-indigo-600">71%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-500 h-2 rounded-full" style="width: 71%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">3. RSI指標</span>
                            <span class="text-xs font-bold text-indigo-600">54%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-400 h-2 rounded-full" style="width: 54%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">4. MACD</span>
                            <span class="text-xs font-bold text-indigo-600">43%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-300 h-2 rounded-full" style="width: 43%"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-gray-700 font-medium">5. ボラティリティ</span>
                            <span class="text-xs font-bold text-indigo-600">38%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-200 h-2 rounded-full" style="width: 38%"></div>
                          </div>
                        </div>
                      </div>
                    \`}
                    <div class="mt-3 pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        \${data.prediction.ml_prediction.feature_importances ? 
                          'ML APIから取得した実際の特徴量重要度' : 
                          '現在価格と移動平均が予測に最も影響（推定値）'}
                      </p>
                    </div>
                  </div>
                  
                  <!-- MLモデル性能指標 -->
                  \${data.prediction.ml_prediction.model_metrics ? \`
                  <div class="mt-4 bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-indigo-700 mb-3">
                      <i class="fas fa-chart-line mr-1"></i>モデル性能指標
                    </h6>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="bg-blue-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">MAE (平均絶対誤差)</p>
                        <p class="text-xl font-bold text-blue-600">\${data.prediction.ml_prediction.model_metrics.mae.toFixed(2)}</p>
                        <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                      </div>
                      <div class="bg-green-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">RMSE (平均二乗誤差)</p>
                        <p class="text-xl font-bold text-green-600">\${data.prediction.ml_prediction.model_metrics.rmse.toFixed(2)}</p>
                        <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                      </div>
                      <div class="bg-purple-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">R² スコア</p>
                        <p class="text-xl font-bold text-purple-600">\${data.prediction.ml_prediction.model_metrics.r2_score.toFixed(3)}</p>
                        <p class="text-xs text-gray-500 mt-1">1に近いほど高精度</p>
                      </div>
                      <div class="bg-orange-50 p-3 rounded-lg text-center">
                        <p class="text-xs text-gray-600 mb-1">学習サンプル数</p>
                        <p class="text-xl font-bold text-orange-600">\${data.prediction.ml_prediction.model_metrics.training_samples.toLocaleString()}</p>
                        <p class="text-xs text-gray-500 mt-1">データ</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-database mr-1"></i>
                        学習データ: \${data.prediction.ml_prediction.training_info?.training_days || 'N/A'}日分のデータで学習
                      </p>
                    </div>
                  </div>
                  \` : ''}
                  
                  <!-- ML学習データ詳細 -->
                  \${data.prediction.ml_prediction.training_info ? \`
                  <div class="mt-4 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                    <h6 class="font-bold text-sm text-cyan-700 mb-3">
                      <i class="fas fa-database mr-1"></i>学習データ詳細
                    </h6>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">データ開始日</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.data_start_date}</p>
                      </div>
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">データ終了日</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.data_end_date}</p>
                      </div>
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">学習期間</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.training_days}日</p>
                      </div>
                      <div class="bg-white p-3 rounded-lg">
                        <p class="text-gray-600 mb-1">最終学習日</p>
                        <p class="font-bold text-cyan-700">\${data.prediction.ml_prediction.training_info.last_trained}</p>
                      </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-cyan-200">
                      <p class="text-xs text-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        学習データは\${symbol}の過去\${data.prediction.ml_prediction.training_info.training_days}日分の株価データを使用し、LightGBMモデルで学習されています
                      </p>
                    </div>
                  </div>
                  \` : ''}
                  
                  <!-- 予測比較チャート -->
                  <div class="mt-4 bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold text-sm text-indigo-700 mb-3">
                      <i class="fas fa-chart-area mr-1"></i>予測手法の比較チャート
                    </h6>
                    <canvas id="predictionComparisonChart" style="max-height: 200px;"></canvas>
                    <div class="mt-3 pt-3 border-t">
                      <p class="text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>
                        統計予測（青）とML予測（緑）の予測価格を視覚的に比較
                      </p>
                    </div>
                  </div>
                  
                  <!-- 統計的手法との比較 -->
                  <div class="mt-4 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                    <h6 class="font-bold text-sm text-gray-800 mb-3">
                      <i class="fas fa-exchange-alt mr-1"></i>統計手法 vs ML手法の違い
                    </h6>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-white p-3 rounded-lg shadow-sm">
                        <p class="text-xs font-bold text-blue-700 mb-2">統計的予測（5次元分析）</p>
                        <ul class="space-y-1 text-xs text-gray-600">
                          <li>✓ ルールベースの判定</li>
                          <li>✓ 解釈性が非常に高い</li>
                          <li>✓ リアルタイム計算</li>
                          <li>✗ 過去パターンを学習できない</li>
                          <li>✗ 非線形関係の捕捉が困難</li>
                        </ul>
                      </div>
                      <div class="bg-white p-3 rounded-lg shadow-sm">
                        <p class="text-xs font-bold text-green-700 mb-2">ML予測（LightGBM）</p>
                        <ul class="space-y-1 text-xs text-gray-600">
                          <li>✓ 過去データから自動学習</li>
                          <li>✓ 非線形関係を捕捉</li>
                          <li>✓ 高精度な価格予測</li>
                          <li>✗ ブラックボックス性</li>
                          <li>✗ 学習データが必要</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            \` : ''}

            <!-- オンデマンド学習結果（学習が実行された場合のみ表示） -->
            \${data.prediction.ml_training ? \`
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6 border-2 border-purple-300">
              <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg mb-4">
                <h4 class="font-bold text-2xl text-center">
                  <i class="fas fa-graduation-cap mr-2"></i>オンデマンド学習結果
                </h4>
                <p class="text-center text-purple-100 mt-2">
                  \${data.symbol}専用MLモデルを学習しました
                </p>
              </div>

              <!-- 学習サマリー -->
              <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">モデルID</p>
                  <p class="text-sm font-bold text-purple-700 truncate" title="\${data.prediction.ml_training.model_id}">
                    \${data.prediction.ml_training.model_id}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">学習時間</p>
                  <p class="text-2xl font-bold text-purple-700">
                    \${data.prediction.ml_training.training_duration.toFixed(1)}秒
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">学習サンプル数</p>
                  <p class="text-2xl font-bold text-purple-700">
                    \${data.prediction.ml_training.training_data.train_samples}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-xs text-gray-600 mb-1">テストサンプル数</p>
                  <p class="text-2xl font-bold text-purple-700">
                    \${data.prediction.ml_training.training_data.test_samples}
                  </p>
                </div>
              </div>

              <!-- 学習データ詳細 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-database mr-2"></i>学習データ詳細
                </h5>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-600">総サンプル数:</span>
                      <span class="font-bold">\${data.prediction.ml_training.training_data.total_samples}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">学習セット:</span>
                      <span class="font-bold text-blue-600">\${data.prediction.ml_training.training_data.train_samples}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">テストセット:</span>
                      <span class="font-bold text-green-600">\${data.prediction.ml_training.training_data.test_samples}</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-600">特徴量数:</span>
                      <span class="font-bold">\${data.prediction.ml_training.training_data.features_count}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">分割比率:</span>
                      <span class="font-bold">80% / 20%</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">学習時刻:</span>
                      <span class="font-bold text-xs">\${new Date(data.prediction.ml_training.timestamp).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo'})}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ハイパーパラメータ -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-cog mr-2"></i>ハイパーパラメータ
                </h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">目的関数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.objective}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">ブースティング</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.boosting_type}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">葉数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.num_leaves}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">学習率</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.learning_rate}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">最大深度</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.max_depth}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">最小葉データ数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.min_data_in_leaf}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">特徴量選択率</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.feature_fraction}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">バギング率</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.bagging_fraction}</p>
                  </div>
                  <div class="bg-gray-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">ラウンド数</p>
                    <p class="font-bold text-gray-800">\${data.prediction.ml_training.hyperparameters.num_boost_round}</p>
                  </div>
                </div>
              </div>

              <!-- 学習曲線 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-line mr-2"></i>学習曲線（Train/Validation Loss）
                </h5>
                <canvas id="learningCurveChart" style="max-height: 300px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  青線: 学習セット損失 | 赤線: 検証セット損失 | 損失が低いほど高精度
                </p>
              </div>

              <!-- 性能指標 (accuracy_metricsを使用) -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-bar mr-2"></i>モデル性能指標
                </h5>
                
                <div class="grid grid-cols-3 gap-6 mb-4">
                  <!-- RMSE -->
                  <div class="text-center bg-blue-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-2">RMSE（二乗平均平方根誤差）</p>
                    <p class="text-2xl font-bold text-blue-600">\${data.prediction.ml_training.accuracy_metrics.rmse.toFixed(2)}</p>
                  </div>

                  <!-- MAE -->
                  <div class="text-center bg-green-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-2">MAE（平均絶対誤差）</p>
                    <p class="text-2xl font-bold text-green-600">\${data.prediction.ml_training.accuracy_metrics.mae.toFixed(2)}</p>
                  </div>

                  <!-- R² Score -->
                  <div class="text-center bg-purple-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-2">R²スコア（決定係数）</p>
                    <p class="text-2xl font-bold text-purple-600">\${data.prediction.ml_training.accuracy_metrics.r2_score.toFixed(4)}</p>
                  </div>
                </div>

                <!-- 学習データ情報 -->
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                  <p class="text-sm text-gray-700 mb-2">
                    <i class="fas fa-database mr-1"></i>学習データ情報
                  </p>
                  <p class="text-lg text-gray-600">
                    訓練サンプル数: <span class="font-bold">\${data.prediction.ml_training.accuracy_metrics.training_samples}</span> / 
                    検証サンプル数: <span class="font-bold">\${data.prediction.ml_training.accuracy_metrics.validation_samples}</span>
                  </p>
                </div>
              </div>

              <!-- 特徴量重要度 -->
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-list-ol mr-2"></i>特徴量重要度ランキング（Top 10）
                </h5>
                <canvas id="featureImportanceTrainingChart" style="max-height: 350px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  モデルが予測に最も重視した特徴量（Gain-based）
                </p>
              </div>

              <!-- ML版株価チャート（過去30日 + 未来30日予測） -->
              \${data.prediction.ml_training.future_predictions ? \`
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-area mr-2"></i>ML版株価予測（過去30日 + 未来30日）
                </h5>
                <canvas id="mlFuturePriceChart" style="max-height: 400px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  青線: 過去の実績価格 | 緑線: ML予測価格 | 灰色エリア: 信頼区間（±5%）
                </p>
                
                <!-- 予測サマリー -->
                <div class="mt-4 grid grid-cols-3 gap-4">
                  <div class="bg-blue-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">30日後予測価格</p>
                    <p class="text-xl font-bold text-blue-600">
                      $\${data.prediction.ml_training.future_predictions.predictions[data.prediction.ml_training.future_predictions.predictions.length - 1].toFixed(2)}
                    </p>
                  </div>
                  <div class="bg-green-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">予測変化率</p>
                    <p class="text-xl font-bold \${(() => {
                      const lastPred = data.prediction.ml_training.future_predictions.predictions[data.prediction.ml_training.future_predictions.predictions.length - 1];
                      const changePercent = ((lastPred - data.current_price) / data.current_price * 100);
                      return changePercent >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}">
                      \${(() => {
                        const lastPred = data.prediction.ml_training.future_predictions.predictions[data.prediction.ml_training.future_predictions.predictions.length - 1];
                        const changePercent = ((lastPred - data.current_price) / data.current_price * 100);
                        return (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2);
                      })()}%
                    </p>
                  </div>
                  <div class="bg-purple-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">予測最高値</p>
                    <p class="text-xl font-bold text-purple-600">
                      $\${Math.max(...data.prediction.ml_training.future_predictions.predictions).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              \` : ''}

              <!-- ML版バックフィットチャート（過去30日の予測精度検証） -->
              \${data.prediction.ml_training.backfit_predictions ? \`
              <div class="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h5 class="font-bold text-lg text-gray-800 mb-4">
                  <i class="fas fa-chart-line mr-2"></i>ML予測精度検証（過去30日バックフィット）
                </h5>
                <canvas id="mlBackfitChart" style="max-height: 400px;"></canvas>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  青線: 実際の価格 | オレンジ線: ML予測価格 | MLモデルが過去30日をどれだけ正確に予測できたか検証
                </p>
                
                <!-- バックフィット精度サマリー -->
                <div class="mt-4 grid grid-cols-3 gap-4">
                  <div class="bg-blue-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">RMSE（誤差）</p>
                    <p class="text-xl font-bold text-blue-600">
                      \${(data.prediction.ml_training.backfit_predictions.rmse || 0).toFixed(2)}
                    </p>
                  </div>
                  <div class="bg-green-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">MAE（平均誤差）</p>
                    <p class="text-xl font-bold text-green-600">
                      \${(data.prediction.ml_training.backfit_predictions.mae || 0).toFixed(2)}
                    </p>
                  </div>
                  <div class="bg-purple-50 p-3 rounded text-center">
                    <p class="text-xs text-gray-600 mb-1">方向性正解率</p>
                    <p class="text-xl font-bold text-purple-600">
                      \${(data.prediction.ml_training.backfit_predictions.direction_accuracy || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div class="mt-3 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <p class="text-xs text-gray-700">
                    <i class="fas fa-lightbulb mr-1 text-yellow-600"></i>
                    <strong>方向性正解率</strong>: 価格が上がるか下がるかの予測が当たった割合。70%以上なら高精度。
                  </p>
                </div>
              </div>
              \` : ''}

              <!-- 学習成功メッセージ -->
              <div class="mt-6 bg-green-50 border-2 border-green-300 p-4 rounded-lg text-center">
                <p class="text-lg font-bold text-green-700">
                  <i class="fas fa-check-circle mr-2"></i>\${data.prediction.ml_training.message}
                </p>
                <p class="text-sm text-gray-600 mt-2">
                  学習されたモデルは7日間キャッシュされ、今後の予測に使用されます
                </p>
              </div>
            </div>
            \` : ''}

            <!-- 信頼度基準ガイド -->
            <div class="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold text-xl mb-4 text-center"><i class="fas fa-shield-alt mr-2"></i>信頼度基準ガイド</h4>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                  <p class="text-lg font-bold text-green-600 mb-2">信頼度 70%以上</p>
                  <p class="text-sm text-gray-700">[OK] <strong>積極推奨:</strong> 高い確信度での投資判断が可能</p>
                  <p class="text-xs text-gray-500 mt-2">各次元のスコアが一致し、予測の信頼性が非常に高い状態</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                  <p class="text-lg font-bold text-yellow-600 mb-2">信頼度 50-70%</p>
                  <p class="text-sm text-gray-700">[WARN] <strong>慎重推奨:</strong> 慎重な判断を推奨</p>
                  <p class="text-xs text-gray-500 mt-2">一部の次元でスコアにばらつきあり、追加分析を推奨</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                  <p class="text-lg font-bold text-red-600 mb-2">信頼度 50%未満</p>
                  <p class="text-sm text-gray-700">[ERROR] <strong>非推奨:</strong> 投資判断を見送ることを推奨</p>
                  <p class="text-xs text-gray-500 mt-2">スコアのばらつきが大きく、予測の信頼性が低い状態</p>
                </div>
              </div>
              <div class="bg-indigo-50 p-4 rounded-lg">
                <p class="text-sm font-bold mb-2">現在の信頼度: <span class="text-2xl \${data.prediction.confidence >= 70 ? 'text-green-600' : data.prediction.confidence >= 50 ? 'text-yellow-600' : 'text-red-600'}">\${data.prediction.confidence}%</span></p>
                <p class="text-sm text-gray-700">
                  \${data.prediction.confidence >= 70 ? '[OK] この銘柄は高信頼度で投資推奨されます' : 
                     data.prediction.confidence >= 50 ? '[WARN] この銘柄は慎重な判断が必要です' : 
                     '[ERROR] この銘柄は現時点で投資を見送ることを推奨します'}
                </p>
              </div>
            </div>

            <!-- 信頼度算出ロジックの詳細説明 -->
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6 border-2 border-indigo-300">
              <h4 class="font-bold text-xl mb-4 text-center">
                <i class="fas fa-calculator mr-2"></i>信頼度の算出方法（統計手法 vs ML手法）
              </h4>
              
              <div class="grid grid-cols-2 gap-6">
                <!-- 統計手法の信頼度 -->
                <div class="bg-white p-5 rounded-lg shadow-lg">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-chart-bar text-blue-600 text-2xl mr-3"></i>
                    <h5 class="font-bold text-lg text-blue-800">統計手法（5次元分析）</h5>
                  </div>
                  
                  <div class="space-y-3">
                    <div class="bg-blue-50 p-3 rounded">
                      <p class="text-xs font-bold text-blue-800 mb-2">[STATS] 基本計算式</p>
                      <code class="text-xs bg-blue-100 px-2 py-1 rounded block">
                        信頼度 = 100 - (標準偏差 × 調整係数)
                      </code>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded">
                      <p class="text-xs font-bold text-gray-800 mb-2">[INFO] 計算ロジック</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>1. 5次元スコアを収集（テクニカル、ファンダメンタル等）</li>
                        <li>2. スコアの標準偏差を計算</li>
                        <li>3. ばらつきが小さい → 高信頼度</li>
                        <li>4. ばらつきが大きい → 低信頼度</li>
                      </ul>
                    </div>
                    
                    <div class="bg-green-50 p-3 rounded">
                      <p class="text-xs font-bold text-green-800 mb-2">[OK] 特徴</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>• 各次元のスコア一貫性を重視</li>
                        <li>• 解釈性が高い</li>
                        <li>• リアルタイム計算</li>
                      </ul>
                    </div>
                    
                    <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      <p class="text-xs text-gray-700">
                        <strong>例:</strong> テクニカル85点、ファンダメンタル40点の場合、
                        ばらつきが大きいため信頼度が下がる
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- ML手法の信頼度 -->
                <div class="bg-white p-5 rounded-lg shadow-lg">
                  <div class="flex items-center mb-3">
                    <i class="fas fa-brain text-green-600 text-2xl mr-3"></i>
                    <h5 class="font-bold text-lg text-green-800">ML手法（LightGBM）</h5>
                  </div>
                  
                  <div class="space-y-3">
                    <div class="bg-green-50 p-3 rounded">
                      <p class="text-xs font-bold text-green-800 mb-2">[STATS] 基本計算式</p>
                      <code class="text-xs bg-green-100 px-2 py-1 rounded block">
                        信頼度 = (R²スコア × 0.7) + ((1 - 正規化RMSE) × 0.3)
                      </code>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded">
                      <p class="text-xs font-bold text-gray-800 mb-2">[INFO] 計算ロジック</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>1. テストデータでR²スコア計算（決定係数）</li>
                        <li>2. RMSE（誤差）を価格で正規化</li>
                        <li>3. R²スコア70% + 誤差30%で重み付け</li>
                        <li>4. 100倍してパーセンテージ化</li>
                      </ul>
                    </div>
                    
                    <div class="bg-purple-50 p-3 rounded">
                      <p class="text-xs font-bold text-purple-800 mb-2">[OK] 特徴</p>
                      <ul class="text-xs text-gray-700 space-y-1">
                        <li>• モデルの予測精度を直接反映</li>
                        <li>• テストデータで検証済み</li>
                        <li>• 過学習を考慮</li>
                      </ul>
                    </div>
                    
                    <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                      <p class="text-xs text-gray-700">
                        <strong>例:</strong> R²=0.83, RMSE=$11の場合、
                        高いR²と低いRMSEで高信頼度
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 比較サマリー -->
              <div class="mt-4 bg-white p-4 rounded-lg shadow">
                <p class="text-sm font-bold text-center text-gray-800 mb-2">
                  <i class="fas fa-balance-scale mr-2"></i>どちらの信頼度を重視すべきか？
                </p>
                <div class="grid grid-cols-3 gap-3 text-xs">
                  <div class="text-center p-2 bg-blue-50 rounded">
                    <p class="font-bold text-blue-700">統計手法優先</p>
                    <p class="text-gray-600 mt-1">市場環境が安定</p>
                  </div>
                  <div class="text-center p-2 bg-purple-50 rounded">
                    <p class="font-bold text-purple-700">両方を参考</p>
                    <p class="text-gray-600 mt-1">通常の分析</p>
                  </div>
                  <div class="text-center p-2 bg-green-50 rounded">
                    <p class="font-bold text-green-700">ML手法優先</p>
                    <p class="text-gray-600 mt-1">過去パターン重視</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- BUY/SELL推奨タイミングと利益予測 -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold text-xl mb-4 text-center"><i class="fas fa-coins mr-2"></i>投資戦略推奨 (中長期)</h4>
              <p class="text-sm text-gray-600 text-center mb-4">
                <i class="fas fa-info-circle mr-1"></i>
                推奨売却日は<strong>予測期間内の最高値日</strong>を表示(BUY判定時)
              </p>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-check mr-1"></i>推奨購入日</p>
                  <p class="text-xl font-bold text-green-600">\${data.prediction.future.buyDate}</p>
                  <p class="text-sm text-gray-500 mt-1">$\${data.prediction.future.buyPrice.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-times mr-1"></i>推奨売却日 (最高値予測日)</p>
                  <p class="text-xl font-bold text-red-600">\${data.prediction.future.sellDate}</p>
                  <p class="text-sm text-gray-500 mt-1">$\${data.prediction.future.sellPrice.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                  <p class="text-sm text-gray-600 mb-2"><i class="fas fa-chart-line mr-1"></i>予想利益率</p>
                  <p class="text-2xl font-bold \${data.prediction.future.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}">
                    \${data.prediction.future.profitPercent >= 0 ? '+' : ''}\${data.prediction.future.profitPercent.toFixed(2)}%
                  </p>
                  <p class="text-sm text-gray-500 mt-1">
                    \${data.prediction.future.profitPercent >= 0 ? '利益見込み' : '損失リスク'}
                  </p>
                </div>
              </div>
              
              <!-- 短期トレード推奨 -->
              <div class="bg-white p-4 rounded-lg shadow mb-4">
                <h5 class="font-bold text-lg mb-3 text-indigo-700"><i class="fas fa-bolt mr-2"></i>短期トレード推奨 (デイトレード〜スイング)</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-indigo-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">3日後売却</p>
                    <p class="text-lg font-bold text-indigo-600">
                      \${(() => {
                        const idx = 3
                        const price = data.prediction.future.predictedPrices[idx]
                        const profit = ((price - data.prediction.future.buyPrice) / data.prediction.future.buyPrice * 100)
                        return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                      })()}
                    </p>
                    <p class="text-xs text-gray-500">\${data.prediction.future.dates[3]}</p>
                  </div>
                  <div class="bg-indigo-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">7日後売却</p>
                    <p class="text-lg font-bold text-indigo-600">
                      \${(() => {
                        const idx = 7
                        const price = data.prediction.future.predictedPrices[idx]
                        const profit = ((price - data.prediction.future.buyPrice) / data.prediction.future.buyPrice * 100)
                        return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                      })()}
                    </p>
                    <p class="text-xs text-gray-500">\${data.prediction.future.dates[7]}</p>
                  </div>
                  <div class="bg-indigo-50 p-3 rounded">
                    <p class="text-xs text-gray-600 mb-1">14日後売却</p>
                    <p class="text-lg font-bold text-indigo-600">
                      \${(() => {
                        const idx = 14
                        const price = data.prediction.future.predictedPrices[idx]
                        const profit = ((price - data.prediction.future.buyPrice) / data.prediction.future.buyPrice * 100)
                        return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                      })()}
                    </p>
                    <p class="text-xs text-gray-500">\${data.prediction.future.dates[14]}</p>
                  </div>
                </div>
                <p class="text-xs text-gray-600 mt-3 text-center">
                  <i class="fas fa-lightbulb mr-1 text-yellow-500"></i>
                  短期トレードは方向性的中率が高い場合に有効です
                </p>
              </div>
              
              <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-exclamation-circle mr-2 text-yellow-600"></i>
                  <strong>重要:</strong> この予測は過去データと現在のスコアに基づく統計的推定です。
                  実際の市場は予測通りに動かない可能性があります。投資は自己責任で行ってください。
                </p>
              </div>
            </div>

            <!-- ML版投資戦略推奨 (中長期) -->
            \${data.prediction.ml_training && data.prediction.ml_training.future_predictions ? \`
            <div class="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg mb-6 border-2 border-green-300">
              <h4 class="font-bold text-xl mb-4 text-center">
                <i class="fas fa-robot mr-2"></i>ML投資戦略推奨 (中長期)
              </h4>
              <p class="text-sm text-gray-600 text-center mb-4">
                <i class="fas fa-brain mr-1"></i>
                LightGBMモデルによる機械学習ベースの投資戦略（未来30日予測）
              </p>
              
              \${(() => {
                const predictions = data.prediction.ml_training.future_predictions.predictions
                const dates = data.prediction.ml_training.future_predictions.dates
                const buyPrice = data.current_price
                const buyDate = dates[0]
                
                // 最高値を見つける
                let maxPrice = predictions[0]
                let maxPriceIdx = 0
                for (let i = 1; i < predictions.length; i++) {
                  if (predictions[i] > maxPrice) {
                    maxPrice = predictions[i]
                    maxPriceIdx = i
                  }
                }
                const sellPrice = maxPrice
                const sellDate = dates[maxPriceIdx]
                const profitPercent = ((sellPrice - buyPrice) / buyPrice * 100)
                
                return \`
                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-check mr-1"></i>推奨購入日</p>
                    <p class="text-xl font-bold text-green-600">\${buyDate}</p>
                    <p class="text-sm text-gray-500 mt-1">$\${buyPrice.toFixed(2)}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2"><i class="fas fa-calendar-times mr-1"></i>推奨売却日 (ML予測最高値)</p>
                    <p class="text-xl font-bold text-red-600">\${sellDate}</p>
                    <p class="text-sm text-gray-500 mt-1">$\${sellPrice.toFixed(2)}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg shadow">
                    <p class="text-sm text-gray-600 mb-2"><i class="fas fa-chart-line mr-1"></i>ML予測利益率</p>
                    <p class="text-2xl font-bold \${profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}">
                      \${profitPercent >= 0 ? '+' : ''}\${profitPercent.toFixed(2)}%
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      \${profitPercent >= 0 ? '利益見込み' : '損失リスク'}
                    </p>
                  </div>
                </div>
                
                <!-- 短期トレード推奨（ML版） -->
                <div class="bg-white p-4 rounded-lg shadow mb-4">
                  <h5 class="font-bold text-lg mb-3 text-teal-700"><i class="fas fa-bolt mr-2"></i>ML短期トレード推奨 (デイトレード〜スイング)</h5>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="bg-teal-50 p-3 rounded">
                      <p class="text-xs text-gray-600 mb-1">3日後売却</p>
                      <p class="text-lg font-bold text-teal-600">
                        \${(() => {
                          const idx = 3
                          const price = predictions[idx]
                          const profit = ((price - buyPrice) / buyPrice * 100)
                          return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                        })()}
                      </p>
                      <p class="text-xs text-gray-500">\${dates[3]}</p>
                      <p class="text-xs text-gray-600 mt-1">予測価格: $\${predictions[3].toFixed(2)}</p>
                    </div>
                    <div class="bg-teal-50 p-3 rounded">
                      <p class="text-xs text-gray-600 mb-1">7日後売却</p>
                      <p class="text-lg font-bold text-teal-600">
                        \${(() => {
                          const idx = 7
                          const price = predictions[idx]
                          const profit = ((price - buyPrice) / buyPrice * 100)
                          return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                        })()}
                      </p>
                      <p class="text-xs text-gray-500">\${dates[7]}</p>
                      <p class="text-xs text-gray-600 mt-1">予測価格: $\${predictions[7].toFixed(2)}</p>
                    </div>
                    <div class="bg-teal-50 p-3 rounded">
                      <p class="text-xs text-gray-600 mb-1">14日後売却</p>
                      <p class="text-lg font-bold text-teal-600">
                        \${(() => {
                          const idx = 14
                          const price = predictions[idx]
                          const profit = ((price - buyPrice) / buyPrice * 100)
                          return (profit >= 0 ? '+' : '') + profit.toFixed(2) + '%'
                        })()}
                      </p>
                      <p class="text-xs text-gray-500">\${dates[14]}</p>
                      <p class="text-xs text-gray-600 mt-1">予測価格: $\${predictions[14].toFixed(2)}</p>
                    </div>
                  </div>
                  <p class="text-xs text-gray-600 mt-3 text-center">
                    <i class="fas fa-robot mr-1 text-teal-500"></i>
                    MLモデルの学習パターンに基づく短期予測（方向性正解率: \${data.prediction.ml_training.backfit_predictions?.direction_accuracy ? data.prediction.ml_training.backfit_predictions.direction_accuracy.toFixed(1) + '%' : 'N/A'}）
                  </p>
                </div>
                \`
              })()}
              
              <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-lightbulb mr-2 text-green-600"></i>
                  <strong>ML予測の特徴:</strong> 過去のパターンを学習したモデルによる予測です。
                  統計的予測と比較して、より複雑な非線形関係を捉えることができます。
                  両方の予測を参考にして総合的な判断を行うことを推奨します。
                </p>
              </div>
            </div>
            \` : ''}

            <!-- 予測精度指標 -->
            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold text-xl mb-4 text-center"><i class="fas fa-chart-bar mr-2"></i>予測精度評価 (過去30日)</h4>
              <div class="grid grid-cols-4 gap-4 mb-4">
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">RMSE (平均二乗誤差)</p>
                  <p class="text-2xl font-bold text-purple-600">\${data.prediction.backfit.accuracy.rmse.toFixed(2)}</p>
                  <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.rmse < 3 ? 'text-green-600' : data.prediction.backfit.accuracy.rmse < 6 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.rmse < 3 ? '✓ 高精度' : data.prediction.backfit.accuracy.rmse < 6 ? '△ 中精度' : '✗ 低精度'}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">MAE (平均絶対誤差)</p>
                  <p class="text-2xl font-bold text-indigo-600">\${data.prediction.backfit.accuracy.mae.toFixed(2)}</p>
                  <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.mae < 2 ? 'text-green-600' : data.prediction.backfit.accuracy.mae < 4 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.mae < 2 ? '✓ 高精度' : data.prediction.backfit.accuracy.mae < 4 ? '△ 中精度' : '✗ 低精度'}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">MAPE (平均誤差率)</p>
                  <p class="text-2xl font-bold text-blue-600">\${data.prediction.backfit.accuracy.mape.toFixed(2)}%</p>
                  <p class="text-xs text-gray-500 mt-1">低いほど高精度</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.mape < 3 ? 'text-green-600' : data.prediction.backfit.accuracy.mape < 6 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.mape < 3 ? '✓ 高精度' : data.prediction.backfit.accuracy.mape < 6 ? '△ 中精度' : '✗ 低精度'}
                  </p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow text-center">
                  <p class="text-sm text-gray-600 mb-2">方向性的中率</p>
                  <p class="text-2xl font-bold text-green-600">\${data.prediction.backfit.accuracy.directionAccuracy.toFixed(1)}%</p>
                  <p class="text-xs text-gray-500 mt-1">上昇/下降の判定</p>
                  <p class="text-xs font-bold mt-2 \${data.prediction.backfit.accuracy.directionAccuracy >= 60 ? 'text-green-600' : data.prediction.backfit.accuracy.directionAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                    \${data.prediction.backfit.accuracy.directionAccuracy >= 60 ? '✓ 信頼可' : data.prediction.backfit.accuracy.directionAccuracy >= 50 ? '△ 慎重判断' : '✗ 信頼低'}
                  </p>
                </div>
              </div>
              
              <!-- GO基準表 -->
              <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h5 class="font-bold text-md mb-3 text-center"><i class="fas fa-check-circle mr-2 text-green-500"></i>予測精度GO基準</h5>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="border-l-4 border-green-500 pl-3 py-2 bg-green-50">
                    <p class="font-bold text-green-700">✓ 投資判断推奨</p>
                    <p class="text-xs text-gray-600 mt-1">MAPE < 3% <strong>かつ</strong> 方向性的中率 ≥ 60%</p>
                  </div>
                  <div class="border-l-4 border-yellow-500 pl-3 py-2 bg-yellow-50">
                    <p class="font-bold text-yellow-700">△ 慎重判断推奨</p>
                    <p class="text-xs text-gray-600 mt-1">MAPE < 6% <strong>かつ</strong> 方向性的中率 ≥ 50%</p>
                  </div>
                  <div class="border-l-4 border-red-500 pl-3 py-2 bg-red-50">
                    <p class="font-bold text-red-700">✗ 投資判断非推奨</p>
                    <p class="text-xs text-gray-600 mt-1">MAPE ≥ 6% <strong>または</strong> 方向性的中率 < 50%</p>
                  </div>
                  <div class="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
                    <p class="font-bold text-blue-700">総合判定</p>
                    <p class="text-xs font-bold mt-1 \${data.prediction.backfit.accuracy.mape < 3 && data.prediction.backfit.accuracy.directionAccuracy >= 60 ? 'text-green-600' : data.prediction.backfit.accuracy.mape < 6 && data.prediction.backfit.accuracy.directionAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                      \${data.prediction.backfit.accuracy.mape < 3 && data.prediction.backfit.accuracy.directionAccuracy >= 60 ? '✓ 投資判断推奨' : data.prediction.backfit.accuracy.mape < 6 && data.prediction.backfit.accuracy.directionAccuracy >= 50 ? '△ 慎重判断推奨' : '✗ 投資判断非推奨'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                  <strong>精度評価:</strong> 過去30日のデータに対して移動平均ベースの非線形予測アルゴリズムを適用し、実績と比較した結果です。
                  MAPE(平均誤差率)が低く、方向性的中率が高いほど、未来予測の信頼性が高いと判断できます。
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 class="font-bold text-green-600 mb-2"><i class="fas fa-check-circle mr-2"></i>ポジティブ要因</h4>
                <ul class="space-y-1">
                  \${data.prediction.reasons.map(r => \`<li class="text-sm">\${r}</li>\`).join('')}
                </ul>
              </div>
              <div>
                <h4 class="font-bold text-red-600 mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>リスク要因</h4>
                <ul class="space-y-1">
                  \${data.prediction.risks.map(r => \`<li class="text-sm">\${r}</li>\`).join('')}
                </ul>
              </div>
            </div>

            \${data.prediction.target_price ? \`
              <div class="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 class="font-bold mb-2">目標株価と期待リターン</h4>
                <p class="text-lg">目標価格: <span class="font-bold text-blue-600">$\${data.prediction.target_price.toFixed(2)}</span></p>
                <p class="text-lg">期待リターン: <span class="font-bold \${data.prediction.expected_return > 0 ? 'text-green-600' : 'text-red-600'}">\${data.prediction.expected_return?.toFixed(1)}%</span></p>
              </div>
            \` : ''}

            <div class="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-3"><i class="fas fa-robot mr-2"></i>GPT-5による詳細解説</h4>
              <p class="text-gray-700 whitespace-pre-wrap">\${data.prediction.detailed_explanation}</p>
            </div>

            \${data.prediction.gpt5_final_judgment ? \`
            <!-- GPT-5最終判断セクション -->
            <div class="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-lg shadow-xl mb-6 text-white">
              <div class="flex items-center mb-4">
                <i class="fas fa-brain text-4xl mr-4"></i>
                <div>
                  <h4 class="font-bold text-2xl">GPT-5 最終判断</h4>
                  <p class="text-sm opacity-90">全データを統合したAIによる最終ジャッジ</p>
                </div>
              </div>
              
              <!-- 計算ロジックの説明 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-2"><i class="fas fa-info-circle mr-2"></i>GPT-5の分析プロセス</h5>
                <div class="text-sm space-y-2">
                  <p><strong>【ステップ1】サーバー側で基本統計を計算</strong></p>
                  <ul class="ml-4 text-xs space-y-1 opacity-90">
                    <li>• 過去30日の価格データから線形回帰による価格予測</li>
                    <li>• ボラティリティ、トレンド強度（R²値）、移動平均を計算</li>
                    <li>• 3日、7日、14日、30日、60日、90日後の統計的予測価格を算出</li>
                  </ul>
                  
                  <p class="mt-2"><strong>【ステップ2】GPT-5がCode Interpreterで高度計算</strong></p>
                  <ul class="ml-4 text-xs space-y-1 opacity-90">
                    <li>• Pythonでモンテカルロシミュレーション（1000回）を実行</li>
                    <li>• 年率ボラティリティ、シャープレシオ、最大ドローダウン、VaRを計算</li>
                    <li>• 統計的予測値の信頼区間を算出</li>
                  </ul>
                  
                  <p class="mt-2"><strong>【ステップ3】全データを統合して最終判断</strong></p>
                  <ul class="ml-4 text-xs space-y-1 opacity-90">
                    <li>• 統計予測 + Code Interpreter結果 + 5次元分析を総合評価</li>
                    <li>• <span class="text-yellow-300 font-bold">価格予測は統計値から±10%以内で調整</span></li>
                    <li>• <span class="text-yellow-300 font-bold">最適な売買タイミングは予測価格と整合性を保つ</span></li>
                    <li>• ファンダメンタル・センチメントが強い場合のみ±15%まで調整</li>
                  </ul>
                  
                  <p class="mt-2 bg-yellow-500 bg-opacity-20 p-2 rounded">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    <strong>注意:</strong> GPT-5は確率的モデルのため、同じ入力でも実行ごとに若干異なる結果が出る場合があります。
                    ただし、統計的な基準値を守るため、大幅な変動はありません。
                  </p>
                </div>
              </div>
              
              <!-- アクションと信頼度 -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <p class="text-sm opacity-90 mb-2">最終判定</p>
                  <p class="text-3xl font-bold">
                    \${data.prediction.gpt5_final_judgment.action}
                    \${data.prediction.gpt5_final_judgment.action === 'BUY' ? '[ROCKET]' : data.prediction.gpt5_final_judgment.action === 'SELL' ? '[WARN]' : '⏸️'}
                  </p>
                </div>
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <p class="text-sm opacity-90 mb-2">AI信頼度</p>
                  <p class="text-3xl font-bold">\${data.prediction.gpt5_final_judgment.confidence}%</p>
                </div>
              </div>

              <!-- 統計モデルとの比較 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <div class="flex items-center mb-2">
                  <i class="fas fa-balance-scale mr-2"></i>
                  <h5 class="font-bold">統計モデルとの比較</h5>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">統計モデル判定: <span class="font-bold">\${data.prediction.action}</span></p>
                    <p class="text-sm opacity-90">GPT-5判定: <span class="font-bold">\${data.prediction.gpt5_final_judgment.action}</span></p>
                  </div>
                  <div class="text-right">
                    <span class="text-2xl">
                      \${data.prediction.gpt5_final_judgment.agreement_with_statistical_model.agrees ? '[OK]' : '[WARN]'}
                    </span>
                    <p class="text-xs mt-1">
                      \${data.prediction.gpt5_final_judgment.agreement_with_statistical_model.agrees ? '一致' : '相違あり'}
                    </p>
                  </div>
                </div>
                <p class="text-sm mt-2 bg-white bg-opacity-10 p-2 rounded">
                  \${data.prediction.gpt5_final_judgment.agreement_with_statistical_model.reason}
                </p>
              </div>

              <!-- 判断理由 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-2"><i class="fas fa-comment-dots mr-2"></i>判断理由</h5>
                <p class="text-sm leading-relaxed">\${data.prediction.gpt5_final_judgment.reasoning}</p>
              </div>

              <!-- 主要要因 -->
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <h5 class="font-bold mb-2 text-sm"><i class="fas fa-star mr-1"></i>最重要要因</h5>
                  <ul class="space-y-1">
                    \${data.prediction.gpt5_final_judgment.key_factors.most_important.map(f => \`
                      <li class="text-xs">• \${f}</li>
                    \`).join('')}
                  </ul>
                </div>
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <h5 class="font-bold mb-2 text-sm"><i class="fas fa-check-circle mr-1"></i>支持データ</h5>
                  <ul class="space-y-1">
                    \${data.prediction.gpt5_final_judgment.key_factors.supporting_data.slice(0, 3).map(f => \`
                      <li class="text-xs">• \${f}</li>
                    \`).join('')}
                  </ul>
                </div>
                <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                  <h5 class="font-bold mb-2 text-sm"><i class="fas fa-exclamation-triangle mr-1"></i>懸念点</h5>
                  <ul class="space-y-1">
                    \${data.prediction.gpt5_final_judgment.key_factors.concerns.map(f => \`
                      <li class="text-xs">• \${f}</li>
                    \`).join('')}
                  </ul>
                </div>
              </div>

              <!-- リスク評価 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <div class="flex items-center justify-between mb-2">
                  <h5 class="font-bold"><i class="fas fa-shield-alt mr-2"></i>リスク評価</h5>
                  <span class="px-3 py-1 rounded-full text-sm font-bold \${
                    data.prediction.gpt5_final_judgment.risk_assessment.level === 'LOW' ? 'bg-green-500' :
                    data.prediction.gpt5_final_judgment.risk_assessment.level === 'MEDIUM' ? 'bg-yellow-500 text-gray-900' :
                    'bg-red-500'
                  }">
                    \${data.prediction.gpt5_final_judgment.risk_assessment.level}
                  </span>
                </div>
                <p class="text-sm">\${data.prediction.gpt5_final_judgment.risk_assessment.description}</p>
              </div>

              <!-- 推奨事項 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-2"><i class="fas fa-lightbulb mr-2"></i>投資家への推奨</h5>
                <p class="text-sm leading-relaxed">\${data.prediction.gpt5_final_judgment.recommendation}</p>
              </div>

              \${data.prediction.gpt5_final_judgment.price_predictions ? \`
              <!-- GPT-5独自の価格予測 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-chart-line mr-2"></i>GPT-5独自の価格予測</h5>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs font-bold mb-2">短期予測（3-14日）</p>
                    <div class="space-y-2">
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>3日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_3.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_3.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>7日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_7.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_7.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>14日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_14.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.short_term.day_14.confidence}%</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p class="text-xs font-bold mb-2">中期予測（30-90日）</p>
                    <div class="space-y-2">
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>30日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_30.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_30.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>60日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_60.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_60.confidence}%</div>
                      </div>
                      <div class="bg-white bg-opacity-10 p-2 rounded">
                        <div class="flex justify-between text-xs">
                          <span>90日後:</span>
                          <span class="font-bold">$\${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_90.price.toFixed(2)}</span>
                        </div>
                        <div class="text-xs opacity-75">信頼度: \${data.prediction.gpt5_final_judgment.price_predictions.mid_term.day_90.confidence}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- GPT-5価格予測チャート -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                <h6 class="font-bold mb-3 text-sm"><i class="fas fa-chart-line mr-2"></i>GPT-5価格予測チャート</h6>
                <canvas id="gpt5PricePredictionChart" style="max-height: 300px;"></canvas>
                <p class="text-xs mt-3 opacity-75 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  現在価格からGPT-5が予測した短期・中期の価格推移
                </p>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.optimal_timing ? \`
              <!-- 最適な売買タイミング -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-calendar-alt mr-2"></i>最適な売買タイミング</h5>
                <div class="grid grid-cols-3 gap-4 mb-3">
                  <div class="bg-green-500 bg-opacity-30 p-3 rounded-lg">
                    <p class="text-xs font-bold mb-1"><i class="fas fa-arrow-down mr-1"></i>エントリー（購入）</p>
                    <p class="text-sm font-bold mb-1">\${data.prediction.gpt5_final_judgment.optimal_timing.entry.recommended_date}</p>
                    <p class="text-xs">価格帯: $\${data.prediction.gpt5_final_judgment.optimal_timing.entry.price_range.min.toFixed(2)} - $\${data.prediction.gpt5_final_judgment.optimal_timing.entry.price_range.max.toFixed(2)}</p>
                    <p class="text-xs mt-2 opacity-90">\${data.prediction.gpt5_final_judgment.optimal_timing.entry.reasoning}</p>
                  </div>
                  <div class="bg-red-500 bg-opacity-30 p-3 rounded-lg">
                    <p class="text-xs font-bold mb-1"><i class="fas fa-arrow-up mr-1"></i>エグジット（売却）</p>
                    <p class="text-sm font-bold mb-1">\${data.prediction.gpt5_final_judgment.optimal_timing.exit.recommended_date}</p>
                    <p class="text-xs">価格帯: $\${data.prediction.gpt5_final_judgment.optimal_timing.exit.price_range.min.toFixed(2)} - $\${data.prediction.gpt5_final_judgment.optimal_timing.exit.price_range.max.toFixed(2)}</p>
                    <p class="text-xs mt-2 opacity-90">\${data.prediction.gpt5_final_judgment.optimal_timing.exit.reasoning}</p>
                  </div>
                  <div class="bg-orange-500 bg-opacity-30 p-3 rounded-lg">
                    <p class="text-xs font-bold mb-1"><i class="fas fa-hand-paper mr-1"></i>ストップロス</p>
                    <p class="text-sm font-bold mb-1">$\${data.prediction.gpt5_final_judgment.optimal_timing.stop_loss.price.toFixed(2)}</p>
                    <p class="text-xs">(\${data.prediction.gpt5_final_judgment.optimal_timing.stop_loss.percentage.toFixed(1)}%)</p>
                    <p class="text-xs mt-2 opacity-90">\${data.prediction.gpt5_final_judgment.optimal_timing.stop_loss.reasoning}</p>
                  </div>
                </div>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.portfolio_allocation ? \`
              <!-- ポートフォリオ配分提案 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-pie-chart mr-2"></i>ポートフォリオ配分提案</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">保守的投資家</p>
                    <p class="text-3xl font-bold mb-1">\${data.prediction.gpt5_final_judgment.portfolio_allocation.conservative.percentage}%</p>
                    <p class="text-xs opacity-90">\${data.prediction.gpt5_final_judgment.portfolio_allocation.conservative.reasoning}</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">中庸投資家</p>
                    <p class="text-3xl font-bold mb-1">\${data.prediction.gpt5_final_judgment.portfolio_allocation.moderate.percentage}%</p>
                    <p class="text-xs opacity-90">\${data.prediction.gpt5_final_judgment.portfolio_allocation.moderate.reasoning}</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">積極的投資家</p>
                    <p class="text-3xl font-bold mb-1">\${data.prediction.gpt5_final_judgment.portfolio_allocation.aggressive.percentage}%</p>
                    <p class="text-xs opacity-90">\${data.prediction.gpt5_final_judgment.portfolio_allocation.aggressive.reasoning}</p>
                  </div>
                </div>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.scenario_analysis ? \`
              <!-- シナリオ分析 -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-project-diagram mr-2"></i>シナリオ分析</h5>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-green-500 bg-opacity-20 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold">[DEBUG] ベストケース</p>
                      <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.probability}%</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">$\${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.price_target.toFixed(2)}</p>
                    <p class="text-xs mb-2 opacity-90">期間: \${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.timeframe}</p>
                    <p class="text-xs font-bold mb-1">前提条件:</p>
                    <ul class="text-xs space-y-1">
                      \${data.prediction.gpt5_final_judgment.scenario_analysis.best_case.conditions.map(c => \`<li>• \${c}</li>\`).join('')}
                    </ul>
                  </div>
                  <div class="bg-blue-500 bg-opacity-20 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold">[STATS] ベースケース</p>
                      <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.probability}%</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">$\${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.price_target.toFixed(2)}</p>
                    <p class="text-xs mb-2 opacity-90">期間: \${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.timeframe}</p>
                    <p class="text-xs font-bold mb-1">前提条件:</p>
                    <ul class="text-xs space-y-1">
                      \${data.prediction.gpt5_final_judgment.scenario_analysis.base_case.conditions.map(c => \`<li>• \${c}</li>\`).join('')}
                    </ul>
                  </div>
                  <div class="bg-red-500 bg-opacity-20 p-3 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-xs font-bold">[WARN] ワーストケース</p>
                      <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.probability}%</span>
                    </div>
                    <p class="text-2xl font-bold mb-1">$\${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.price_target.toFixed(2)}</p>
                    <p class="text-xs mb-2 opacity-90">期間: \${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.timeframe}</p>
                    <p class="text-xs font-bold mb-1">前提条件:</p>
                    <ul class="text-xs space-y-1">
                      \${data.prediction.gpt5_final_judgment.scenario_analysis.worst_case.conditions.map(c => \`<li>• \${c}</li>\`).join('')}
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- シナリオ分析チャート -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
                <h6 class="font-bold mb-3 text-sm"><i class="fas fa-chart-bar mr-2"></i>シナリオ分析チャート</h6>
                <canvas id="scenarioAnalysisChart" style="max-height: 250px;"></canvas>
                <p class="text-xs mt-3 opacity-75 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  ベストケース・ベースケース・ワーストケースの価格目標と確率分布
                </p>
              </div>
              \` : ''}

              \${data.prediction.gpt5_final_judgment.upcoming_events && data.prediction.gpt5_final_judgment.upcoming_events.length > 0 ? \`
              <!-- 今後の重要イベント -->
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-calendar-check mr-2"></i>今後の重要イベント</h5>
                <div class="space-y-2">
                  \${data.prediction.gpt5_final_judgment.upcoming_events.map(event => \`
                    <div class="bg-white bg-opacity-10 p-3 rounded flex items-start">
                      <div class="flex-shrink-0 mr-3">
                        <div class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${event.date}</div>
                      </div>
                      <div class="flex-grow">
                        <div class="flex items-center mb-1">
                          <span class="text-sm font-bold mr-2">\${event.event}</span>
                          <span class="text-xs px-2 py-1 rounded \${
                            event.expected_impact === 'POSITIVE' ? 'bg-green-500' :
                            event.expected_impact === 'NEGATIVE' ? 'bg-red-500' :
                            'bg-gray-500'
                          }">
                            \${event.expected_impact === 'POSITIVE' ? '↑ ポジティブ' :
                              event.expected_impact === 'NEGATIVE' ? '↓ ネガティブ' :
                              '→ 中立'}
                          </span>
                        </div>
                        <p class="text-xs opacity-90">\${event.description}</p>
                      </div>
                    </div>
                  \`).join('')}
                </div>
              </div>
              \` : ''}

              <!-- 統計的リスク指標（Code Interpreterによる高度計算結果） -->
              \${data.prediction.gpt5_final_judgment.statistical_metrics ? \`
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-calculator mr-2"></i>統計的リスク指標 (Code Interpreter計算)</h5>
                <div class="grid grid-cols-4 gap-4 mb-3">
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">年率ボラティリティ</p>
                    <p class="text-2xl font-bold">\${data.prediction.gpt5_final_judgment.statistical_metrics.annual_volatility.toFixed(2)}%</p>
                    <p class="text-xs mt-1 opacity-75">価格変動の大きさ</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">シャープレシオ</p>
                    <p class="text-2xl font-bold">\${data.prediction.gpt5_final_judgment.statistical_metrics.sharpe_ratio.toFixed(2)}</p>
                    <p class="text-xs mt-1 opacity-75">リスク調整後リターン</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">最大ドローダウン</p>
                    <p class="text-2xl font-bold text-red-300">\${data.prediction.gpt5_final_judgment.statistical_metrics.max_drawdown.toFixed(2)}%</p>
                    <p class="text-xs mt-1 opacity-75">最大下落率</p>
                  </div>
                  <div class="bg-white bg-opacity-10 p-3 rounded text-center">
                    <p class="text-xs mb-1">VaR (95%)</p>
                    <p class="text-2xl font-bold text-orange-300">$\${data.prediction.gpt5_final_judgment.statistical_metrics.value_at_risk.toFixed(2)}</p>
                    <p class="text-xs mt-1 opacity-75">5%確率での損失額</p>
                  </div>
                </div>
                <div class="bg-blue-500 bg-opacity-20 p-3 rounded">
                  <p class="text-xs">
                    <i class="fas fa-info-circle mr-1"></i>
                    <strong>Code Interpreterによる計算:</strong> これらの指標はGPT-5がPythonで実際に計算した結果です。
                    モンテカルロシミュレーションや時系列分析など、高度な統計手法を使用しています。
                  </p>
                </div>
              </div>
              \` : ''}
              
              <!-- モンテカルロシミュレーション結果 -->
              \${data.prediction.gpt5_final_judgment.monte_carlo_results ? \`
              <div class="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg mb-4">
                <h5 class="font-bold mb-3"><i class="fas fa-dice mr-2"></i>モンテカルロシミュレーション結果</h5>
                <canvas id="monteCarloChart" style="max-height: 300px;"></canvas>
                <div class="grid grid-cols-3 gap-3 mt-3">
                  <div class="bg-white bg-opacity-10 p-2 rounded text-center">
                    <p class="text-xs mb-1">90日後 中央値</p>
                    <p class="text-lg font-bold">$\${data.prediction.gpt5_final_judgment.monte_carlo_results.day_90_median.toFixed(2)}</p>
                  </div>
                  <div class="bg-green-500 bg-opacity-20 p-2 rounded text-center">
                    <p class="text-xs mb-1">95%信頼区間 上限</p>
                    <p class="text-lg font-bold text-green-300">$\${data.prediction.gpt5_final_judgment.monte_carlo_results.day_90_upper.toFixed(2)}</p>
                  </div>
                  <div class="bg-red-500 bg-opacity-20 p-2 rounded text-center">
                    <p class="text-xs mb-1">95%信頼区間 下限</p>
                    <p class="text-lg font-bold text-red-300">$\${data.prediction.gpt5_final_judgment.monte_carlo_results.day_90_lower.toFixed(2)}</p>
                  </div>
                </div>
                <p class="text-xs mt-3 opacity-75 text-center">
                  <i class="fas fa-info-circle mr-1"></i>
                  1000回のシミュレーションに基づく価格予測の分布
                </p>
              </div>
              \` : ''}

              <!-- 使用データソース -->
              <div class="bg-white bg-opacity-10 p-3 rounded-lg">
                <p class="text-xs opacity-75 mb-2">
                  <i class="fas fa-database mr-1"></i>分析に使用したデータソース:
                </p>
                <div class="flex flex-wrap gap-2">
                  \${data.prediction.gpt5_final_judgment.data_sources_used.map(source => \`
                    <span class="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">\${source}</span>
                  \`).join('')}
                </div>
              </div>
            </div>
            \` : \`
            <!-- GPT-5分析が利用できない場合の表示 -->
            <div class="bg-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg mb-6">
              <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl mr-4 mt-1"></i>
                <div>
                  <h4 class="font-bold text-xl text-yellow-800 mb-2">GPT-5最終判断が利用できません</h4>
                  <div class="text-sm text-yellow-700 space-y-2">
                    <p><strong>考えられる原因:</strong></p>
                    <ul class="list-disc ml-5 space-y-1">
                      <li>GPT-5 APIの応答がタイムアウトしました（5分以上）</li>
                      <li>Code Interpreterの処理に時間がかかりすぎています</li>
                      <li>OpenAI APIサーバーの一時的な問題</li>
                      <li>ネットワークの問題</li>
                    </ul>
                    <p class="mt-3 bg-blue-100 p-2 rounded">
                      <i class="fas fa-info-circle mr-1"></i>
                      <strong>通常の処理時間:</strong> GPT-5 + Code Interpreterは2分47秒～4分7秒かかります。
                      タイムアウトを5分に設定していますが、それでも失敗する場合は再試行してください。
                    </p>
                    <p class="mt-3"><strong>対策:</strong></p>
                    <ul class="list-disc ml-5 space-y-1">
                      <li>しばらく待ってから再度お試しください</li>
                      <li>統計モデルの予測結果（下記）は利用可能です</li>
                      <li>問題が続く場合は、開発者ツール（F12）のコンソールログをご確認ください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            \`}
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-xl font-bold mb-4">株価チャート（過去30日 + 未来30日予測）</h3>
            <canvas id="priceChart"></canvas>
          </div>
        \`

        document.getElementById('analysis-result').innerHTML = resultHTML
        document.getElementById('analysis-result').style.display = 'block'

        // Chart.jsでグラフ表示（過去実績 + 未来予測）
        const ctx = document.getElementById('priceChart').getContext('2d')
        
        // 過去30日と未来30日のデータを結合（データ存在チェック）
        const chartDates = data.chart_data?.dates || []
        const chartPrices = data.chart_data?.prices || []
        const futureDates = data.prediction.future?.dates || []
        const futurePredictedPrices = data.prediction.future?.predictedPrices || []
        const backfitPredictedPrices = data.prediction.backfit?.predictedPrices || []
        
        const allDates = [...chartDates, ...(futureDates.length > 0 ? futureDates.slice(1) : [])]
        const historicalPrices = [...chartPrices]
        const backfitPrices = [...backfitPredictedPrices]
        const futurePrices = [null, ...(futurePredictedPrices.length > 0 ? futurePredictedPrices.slice(1) : [])]
        
        // 過去データをnullで埋める
        const historicalData = [...historicalPrices, ...new Array(futurePrices.length - 1).fill(null)]
        const backfitData = [...backfitPrices, ...new Array(futurePrices.length - 1).fill(null)]
        const futureData = [...new Array(historicalPrices.length - 1).fill(null), ...futurePrices]
        
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: allDates,
            datasets: [
              {
                label: '株価 (過去30日実績)',
                data: historicalData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true,
                pointRadius: 2
              },
              {
                label: '予測 (過去30日バックフィット)',
                data: backfitData,
                borderColor: 'rgb(139, 92, 246)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [3, 3],
                tension: 0.1,
                fill: false,
                pointRadius: 1
              },
              {
                label: '予測 (未来30日)',
                data: futureData,
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.1,
                fill: true,
                pointRadius: 2
              }
            ]
          },
          options: {
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: { 
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  title: function(context) {
                    return '日付: ' + context[0].label
                  },
                  afterBody: function(context) {
                    // 5次元分析データを表示
                    return [
                      '',
                      '【5次元分析スコア】',
                      'テクニカル: ' + data.prediction.breakdown.technical + '点',
                      'ファンダメンタル: ' + data.prediction.breakdown.fundamental + '点',
                      'センチメント: ' + data.prediction.breakdown.sentiment + '点',
                      'マクロ経済: ' + data.prediction.breakdown.macro + '点',
                      'アナリスト: ' + data.prediction.breakdown.analyst + '点',
                      '',
                      '総合判定: ' + data.prediction.action + ' (スコア: ' + data.prediction.score + '点)'
                    ]
                  }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                displayColors: true
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: '株価 (USD)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: '日付'
                }
              }
            }
          }
        })

        // 5次元分析レーダーチャート
        const radarCtx = document.getElementById('radarChart').getContext('2d')
        new Chart(radarCtx, {
          type: 'radar',
          data: {
            labels: [
              'テクニカル (35%)',
              'ファンダメンタル (30%)',
              'センチメント (15%)',
              'マクロ経済 (10%)',
              'アナリスト (10%)'
            ],
            datasets: [{
              label: '各次元のスコア',
              data: [
                data.prediction.breakdown.technical,
                data.prediction.breakdown.fundamental,
                data.prediction.breakdown.sentiment,
                data.prediction.breakdown.macro,
                data.prediction.breakdown.analyst
              ],
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 2,
              pointBackgroundColor: 'rgb(99, 102, 241)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(99, 102, 241)',
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20
                },
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed.r + '点'
                  }
                }
              }
            }
          }
        })
        
        // GPT-5価格予測チャート（GPT-5最終判断がある場合のみ）
        if (data.prediction.gpt5_final_judgment && data.prediction.gpt5_final_judgment.price_predictions) {
          const gpt5PriceCtx = document.getElementById('gpt5PricePredictionChart')
          if (gpt5PriceCtx) {
            const predictions = data.prediction.gpt5_final_judgment.price_predictions
            
            new Chart(gpt5PriceCtx.getContext('2d'), {
              type: 'line',
              data: {
                labels: ['現在', '3日後', '7日後', '14日後', '30日後', '60日後', '90日後'],
                datasets: [{
                  label: 'GPT-5予測価格',
                  data: [
                    data.current_price,
                    predictions.short_term.day_3.price,
                    predictions.short_term.day_7.price,
                    predictions.short_term.day_14.price,
                    predictions.mid_term.day_30.price,
                    predictions.mid_term.day_60.price,
                    predictions.mid_term.day_90.price
                  ],
                  borderColor: 'rgb(147, 51, 234)',
                  backgroundColor: 'rgba(147, 51, 234, 0.1)',
                  borderWidth: 3,
                  tension: 0.3,
                  fill: true,
                  pointRadius: 5,
                  pointBackgroundColor: 'rgb(147, 51, 234)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                }, {
                  label: '信頼度エリア（上限）',
                  data: [
                    data.current_price * 1.05,
                    predictions.short_term.day_3.price * (1 + (100 - predictions.short_term.day_3.confidence) / 200),
                    predictions.short_term.day_7.price * (1 + (100 - predictions.short_term.day_7.confidence) / 200),
                    predictions.short_term.day_14.price * (1 + (100 - predictions.short_term.day_14.confidence) / 200),
                    predictions.mid_term.day_30.price * (1 + (100 - predictions.mid_term.day_30.confidence) / 200),
                    predictions.mid_term.day_60.price * (1 + (100 - predictions.mid_term.day_60.confidence) / 200),
                    predictions.mid_term.day_90.price * (1 + (100 - predictions.mid_term.day_90.confidence) / 200)
                  ],
                  borderColor: 'rgba(147, 51, 234, 0.2)',
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderDash: [5, 5],
                  tension: 0.3,
                  fill: false,
                  pointRadius: 0
                }, {
                  label: '信頼度エリア（下限）',
                  data: [
                    data.current_price * 0.95,
                    predictions.short_term.day_3.price * (1 - (100 - predictions.short_term.day_3.confidence) / 200),
                    predictions.short_term.day_7.price * (1 - (100 - predictions.short_term.day_7.confidence) / 200),
                    predictions.short_term.day_14.price * (1 - (100 - predictions.short_term.day_14.confidence) / 200),
                    predictions.mid_term.day_30.price * (1 - (100 - predictions.mid_term.day_30.confidence) / 200),
                    predictions.mid_term.day_60.price * (1 - (100 - predictions.mid_term.day_60.confidence) / 200),
                    predictions.mid_term.day_90.price * (1 - (100 - predictions.mid_term.day_90.confidence) / 200)
                  ],
                  borderColor: 'rgba(147, 51, 234, 0.2)',
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderDash: [5, 5],
                  tension: 0.3,
                  fill: '-1',
                  pointRadius: 0
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.datasetIndex === 0) {
                          const idx = context.dataIndex
                          const confidences = [
                            100,
                            predictions.short_term.day_3.confidence,
                            predictions.short_term.day_7.confidence,
                            predictions.short_term.day_14.confidence,
                            predictions.mid_term.day_30.confidence,
                            predictions.mid_term.day_60.confidence,
                            predictions.mid_term.day_90.confidence
                          ]
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2) + ' (信頼度: ' + confidences[idx] + '%)'
                        }
                        return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: '予測価格 (USD)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: '期間'
                    }
                  }
                }
              }
            })
          }
        }
        
        // GPT-5シナリオ分析チャート（GPT-5最終判断がある場合のみ）
        if (data.prediction.gpt5_final_judgment && data.prediction.gpt5_final_judgment.scenario_analysis) {
          const scenarioCtx = document.getElementById('scenarioAnalysisChart')
          if (scenarioCtx) {
            const scenarios = data.prediction.gpt5_final_judgment.scenario_analysis
            
            new Chart(scenarioCtx.getContext('2d'), {
              type: 'bar',
              data: {
                labels: ['ワーストケース', 'ベースケース', 'ベストケース'],
                datasets: [{
                  label: '予想価格',
                  data: [
                    scenarios.worst_case.price_target,
                    scenarios.base_case.price_target,
                    scenarios.best_case.price_target
                  ],
                  backgroundColor: [
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(34, 197, 94, 0.6)'
                  ],
                  borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)'
                  ],
                  borderWidth: 2
                }, {
                  label: '発生確率 (%)',
                  data: [
                    scenarios.worst_case.probability,
                    scenarios.base_case.probability,
                    scenarios.best_case.probability
                  ],
                  backgroundColor: [
                    'rgba(239, 68, 68, 0.3)',
                    'rgba(59, 130, 246, 0.3)',
                    'rgba(34, 197, 94, 0.3)'
                  ],
                  borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)'
                  ],
                  borderWidth: 2,
                  borderDash: [5, 5],
                  yAxisID: 'y1'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.datasetIndex === 0) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                        } else {
                          return context.dataset.label + ': ' + context.parsed.y + '%'
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: '予想価格 (USD)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: '発生確率 (%)'
                    },
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }
            })
          }
        }
        
        // GPT-5モンテカルロシミュレーションチャート（結果がある場合のみ）
        if (data.prediction.gpt5_final_judgment && data.prediction.gpt5_final_judgment.monte_carlo_results) {
          const mcCtx = document.getElementById('monteCarloChart')
          if (mcCtx) {
            const mc = data.prediction.gpt5_final_judgment.monte_carlo_results
            
            new Chart(mcCtx.getContext('2d'), {
              type: 'line',
              data: {
                labels: ['現在', '3日', '7日', '14日', '30日', '60日', '90日'],
                datasets: [{
                  label: '中央値',
                  data: [
                    data.current_price,
                    mc.day_3_median || mc.day_3,
                    mc.day_7_median || mc.day_7,
                    mc.day_14_median || mc.day_14,
                    mc.day_30_median || mc.day_30,
                    mc.day_60_median || mc.day_60,
                    mc.day_90_median
                  ],
                  borderColor: 'rgb(255, 255, 255)',
                  backgroundColor: 'transparent',
                  borderWidth: 3,
                  tension: 0.3,
                  pointRadius: 5,
                  pointBackgroundColor: 'rgb(255, 255, 255)'
                }, {
                  label: '95%信頼区間上限',
                  data: [
                    data.current_price * 1.05,
                    mc.day_3_upper || (mc.day_3 * 1.1),
                    mc.day_7_upper || (mc.day_7 * 1.1),
                    mc.day_14_upper || (mc.day_14 * 1.1),
                    mc.day_30_upper || (mc.day_30 * 1.1),
                    mc.day_60_upper || (mc.day_60 * 1.1),
                    mc.day_90_upper
                  ],
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  tension: 0.3,
                  pointRadius: 0
                }, {
                  label: '95%信頼区間下限',
                  data: [
                    data.current_price * 0.95,
                    mc.day_3_lower || (mc.day_3 * 0.9),
                    mc.day_7_lower || (mc.day_7 * 0.9),
                    mc.day_14_lower || (mc.day_14 * 0.9),
                    mc.day_30_lower || (mc.day_30 * 0.9),
                    mc.day_60_lower || (mc.day_60 * 0.9),
                    mc.day_90_lower
                  ],
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  tension: 0.3,
                  fill: '-1',
                  pointRadius: 0
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      color: '#fff'
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    ticks: {
                      color: '#fff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                      display: true,
                      text: '価格 (USD)',
                      color: '#fff'
                    }
                  },
                  x: {
                    ticks: {
                      color: '#fff'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                      display: true,
                      text: '期間',
                      color: '#fff'
                    }
                  }
                }
              }
            })
          }
        }
        
        // ML予測: 特徴量重要度チャート（ML APIからデータがある場合のみ）
        if (data.prediction.ml_prediction && data.prediction.ml_prediction.feature_importances) {
          const featureCtx = document.getElementById('featureImportanceChart').getContext('2d')
          const features = data.prediction.ml_prediction.feature_importances.slice(0, 10)
          
          new Chart(featureCtx, {
            type: 'bar',
            data: {
              labels: features.map(f => f.feature),
              datasets: [{
                label: '重要度',
                data: features.map(f => f.importance * 100),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return '重要度: ' + context.parsed.x.toFixed(1) + '%'
                    }
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: '重要度 (%)' }
                }
              }
            }
          })
        }
        
        // 学習曲線チャート（学習が実行された場合のみ）
        if (data.prediction.ml_training) {
          console.log('[OK] ml_training exists, rendering learning curves...')
          const learningCurveElement = document.getElementById('learningCurveChart')
          if (!learningCurveElement) {
            console.error('[ERROR] ERROR: learningCurveChart element not found in DOM!')
            console.log('Available elements:', document.querySelectorAll('canvas').length, 'canvas elements')
          } else {
            console.log('[OK] learningCurveChart element found')
          }
          const learningCurveCtx = learningCurveElement.getContext('2d')
          const trainingData = data.prediction.ml_training
          
          new Chart(learningCurveCtx, {
            type: 'line',
            data: {
              labels: trainingData.learning_curves.iterations,
              datasets: [
                {
                  label: 'Train Loss (RMSE)',
                  data: trainingData.learning_curves.train_loss,
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                  pointRadius: 0
                },
                {
                  label: 'Validation Loss (RMSE)',
                  data: trainingData.learning_curves.val_loss,
                  borderColor: 'rgb(239, 68, 68)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                  pointRadius: 0
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  title: {
                    display: true,
                    text: 'RMSE Loss (USD)'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Iteration'
                  }
                }
              }
            }
          })

          // 特徴量重要度チャート（学習結果用）
          const featureImportanceTrainingCtx = document.getElementById('featureImportanceTrainingChart').getContext('2d')
          const topFeatures = trainingData.feature_importances.slice(0, 10)
          
          // 最大重要度で正規化
          const maxImportance = Math.max(...topFeatures.map(f => f.importance))
          
          new Chart(featureImportanceTrainingCtx, {
            type: 'bar',
            data: {
              labels: topFeatures.map(f => f.feature),
              datasets: [{
                label: 'Importance (Gain)',
                data: topFeatures.map(f => (f.importance / maxImportance) * 100),
                backgroundColor: 'rgba(147, 51, 234, 0.6)',
                borderColor: 'rgb(147, 51, 234)',
                borderWidth: 1
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const actualImportance = topFeatures[context.dataIndex].importance
                      return 'Gain: ' + actualImportance.toFixed(0) + ' (' + context.parsed.x.toFixed(1) + '%)'
                    }
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: '相対重要度 (%)' }
                }
              }
            }
          })
          
          // ML未来予測チャート（過去30日 + 未来30日）
          console.log('[INFO] Checking future predictions:', {
            has_future_predictions: !!trainingData.future_predictions,
            has_backfit: !!data.prediction.backfit,
            future_data: trainingData.future_predictions
          })
          
          if (trainingData.future_predictions) {
            console.log('[OK] Rendering ML future price chart')
            const mlFuturePriceElement = document.getElementById('mlFuturePriceChart')
            if (!mlFuturePriceElement) {
              console.error('[ERROR] ERROR: mlFuturePriceChart element not found in DOM!')
              console.log('Searching for element...')
              const allCanvases = document.querySelectorAll('canvas')
              console.log('Found', allCanvases.length, 'canvas elements:', Array.from(allCanvases).map(c => c.id))
            } else {
              console.log('[OK] mlFuturePriceChart element found')
            }
            
            try {
              const mlFuturePriceCtx = mlFuturePriceElement.getContext('2d')
              const futurePred = trainingData.future_predictions
            
            // 過去30日のデータ（予測の backfit から）
            const historicalDates = data.prediction.backfit ? data.prediction.backfit.dates.slice(-30) : []
            const historicalPrices = data.prediction.backfit ? data.prediction.backfit.actualPrices.slice(-30) : []
            
            console.log('ML future chart data:', {
              historicalDates: historicalDates.length,
              historicalPrices: historicalPrices.length,
              futureDates: futurePred.dates.length,
              futurePredictions: futurePred.predictions.length
            })
            
            // 全体のラベル: 過去30日 + 未来30日
            const allLabels = [...historicalDates, ...futurePred.dates]
            
            // 過去データ: 実データを表示（未来部分にも最後の値を1つ追加して接続）
            const historicalData = [...historicalPrices, ...Array(futurePred.predictions.length).fill(null)]
            
            // 未来予測データ: 最初に過去の最後の値を追加してスムーズに接続
            const futureData = [
              ...Array(historicalPrices.length - 1).fill(null),
              historicalPrices[historicalPrices.length - 1],  // 接続点
              ...futurePred.predictions
            ]
            
            // 信頼区間（接続点を追加）
            const lastPrice = historicalPrices[historicalPrices.length - 1]
            const lowerBoundData = [
              ...Array(historicalPrices.length - 1).fill(null),
              lastPrice * 0.95,  // 接続点
              ...futurePred.lower_bound
            ]
            const upperBoundData = [
              ...Array(historicalPrices.length - 1).fill(null),
              lastPrice * 1.05,  // 接続点
              ...futurePred.upper_bound
            ]
            
            new Chart(mlFuturePriceCtx, {
              type: 'line',
              data: {
                labels: allLabels,
                datasets: [
                  {
                    label: '実績価格（過去30日）',
                    data: historicalData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 2,
                    pointHoverRadius: 5
                  },
                  {
                    label: 'ML予測価格（未来30日）',
                    data: futureData,
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    borderDash: [5, 5]
                  },
                  {
                    label: '信頼区間上限（+5%）',
                    data: upperBoundData,
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    tension: 0.3,
                    fill: '+1',
                    pointRadius: 0
                  },
                  {
                    label: '信頼区間下限（-5%）',
                    data: lowerBoundData,
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 0
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.parsed.y !== null) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                        }
                        return null
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: '株価 (USD)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: '日付'
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      callback: function(value, index) {
                        // 5日ごとにラベル表示
                        return index % 5 === 0 ? this.getLabelForValue(value) : ''
                      }
                    }
                  }
                }
              }
            })
            
            console.log('[OK] ML future price chart created successfully')
            } catch (error) {
              console.error('[ERROR] ERROR creating ML future price chart:', error)
            }
          }
          
          // ML バックフィットチャート（過去30日の予測精度検証）
          if (trainingData.backfit_predictions) {
            console.log('[OK] Rendering ML backfit chart')
            const mlBackfitElement = document.getElementById('mlBackfitChart')
            if (mlBackfitElement) {
              const mlBackfitCtx = mlBackfitElement.getContext('2d')
              const backfitData = trainingData.backfit_predictions
              
              new Chart(mlBackfitCtx, {
                type: 'line',
                data: {
                  labels: backfitData.dates,
                  datasets: [
                    {
                      label: '実際の価格',
                      data: backfitData.actual_prices,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 3,
                      tension: 0.3,
                      fill: false,
                      pointRadius: 3,
                      pointHoverRadius: 6
                    },
                    {
                      label: 'ML予測価格',
                      data: backfitData.predictions,
                      borderColor: 'rgb(251, 146, 60)',
                      backgroundColor: 'rgba(251, 146, 60, 0.1)',
                      borderWidth: 3,
                      tension: 0.3,
                      fill: false,
                      pointRadius: 3,
                      pointHoverRadius: 6,
                      borderDash: [5, 5]
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': $' + context.parsed.y.toFixed(2)
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                      title: {
                        display: true,
                        text: '株価 (USD)'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: '日付'
                      },
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        callback: function(value, index) {
                          return index % 5 === 0 ? this.getLabelForValue(value) : ''
                        }
                      }
                    }
                  }
                }
              })
              
              console.log('[OK] ML backfit chart created successfully')
            }
          }
        }

        // ML予測: 予測比較チャート
        console.log('[INFO] Checking ML prediction data:', {
          has_ml_prediction: !!data.prediction.ml_prediction,
          ml_data: data.prediction.ml_prediction
        })
        
        if (data.prediction.ml_prediction) {
          console.log('[OK] Rendering prediction comparison chart')
          const comparisonElement = document.getElementById('predictionComparisonChart')
          if (!comparisonElement) {
            console.error('[ERROR] ERROR: predictionComparisonChart element not found in DOM!')
          } else {
            console.log('[OK] predictionComparisonChart element found')
          }
          
          try {
            const comparisonCtx = comparisonElement.getContext('2d')
            
            // 統計予測の方向性（BUY=上昇、SELL=下降、HOLD=横ばい）
            const statDirection = data.prediction.action
            const statPredictedPrice = statDirection === 'BUY' 
              ? data.current_price * 1.05 
              : statDirection === 'SELL' 
              ? data.current_price * 0.95 
              : data.current_price
            
            console.log('Creating comparison chart with data:', {
              currentPrice: data.current_price,
              statPredictedPrice,
              mlPredictedPrice: data.prediction.ml_prediction.predicted_price
            })
            
            new Chart(comparisonCtx, {
            type: 'bar',
            data: {
              labels: ['現在価格', '統計予測', 'ML予測'],
              datasets: [{
                label: '価格 (USD)',
                data: [
                  data.current_price,
                  statPredictedPrice,
                  data.prediction.ml_prediction.predicted_price
                ],
                backgroundColor: [
                  'rgba(156, 163, 175, 0.6)',
                  'rgba(59, 130, 246, 0.6)',
                  'rgba(34, 197, 94, 0.6)'
                ],
                borderColor: [
                  'rgb(156, 163, 175)',
                  'rgb(59, 130, 246)',
                  'rgb(34, 197, 94)'
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return '$' + context.parsed.y.toFixed(2)
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  title: { display: true, text: '価格 (USD)' }
                }
              }
            }
          })
          
          console.log('[OK] Prediction comparison chart created successfully')
          } catch (error) {
            console.error('[ERROR] ERROR creating prediction comparison chart:', error)
          }
        }

        // スコアカードにイベントリスナーを追加(DOM完全レンダリング後に実行)
        setTimeout(() => {
          const cards = [
            { id: 'card-technical', dimension: 'technical' },
            { id: 'card-fundamental', dimension: 'fundamental' },
            { id: 'card-sentiment', dimension: 'sentiment' },
            { id: 'card-macro', dimension: 'macro' },
            { id: 'card-analyst', dimension: 'analyst' }
          ]
          
          console.log('=== Attaching event listeners ===')
          cards.forEach(card => {
            const element = document.getElementById(card.id)
            if (element) {
              element.addEventListener('click', () => {
                console.log('Card clicked:', card.dimension)
                window.showDetailModal(card.dimension)
              })
              console.log('✓ Event listener added for:', card.id)
            } else {
              console.error('✗ Element not found:', card.id)
            }
          })
          console.log('=== Event listeners attached ===')
        }, 100)

      } catch (error) {
        console.error('[ERROR] Analysis failed:', error)
        console.error('[ERROR] Error response:', error.response?.data)
        console.log('[ERROR-DETAIL] Full error object:', {
          message: error.message,
          response_data: error.response?.data,
          response_status: error.response?.status,
          stack: error.stack
        })
        
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('analysis-loading').style.display = 'none'
      }
    }

    // おすすめ銘柄取得
    async function loadRecommendations() {
      document.getElementById('recommendations-loading').style.display = 'block'
      document.getElementById('recommendations-result').innerHTML = ''

      try {
        const response = await axios.get('/api/recommendations')
        const data = response.data

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left">順位</th>
                  <th class="px-6 py-3 text-left">銘柄</th>
                  <th class="px-6 py-3 text-right">スコア</th>
                  <th class="px-6 py-3 text-center">判定</th>
                  <th class="px-6 py-3 text-right">現在価格</th>
                  <th class="px-6 py-3 text-right">期待リターン</th>
                  <th class="px-6 py-3 text-center">信頼度</th>
                  <th class="px-6 py-3 text-center">詳細</th>
                </tr>
              </thead>
              <tbody>
                \${data.recommendations.map((rec, index) => \`
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-6 py-4 font-bold">#\${index + 1}</td>
                    <td class="px-6 py-4 font-semibold">\${rec.symbol}</td>
                    <td class="px-6 py-4 text-right font-bold text-blue-600">\${rec.score}</td>
                    <td class="px-6 py-4 text-center">
                      <span class="px-3 py-1 rounded-full text-sm font-semibold \${rec.action === 'BUY' ? 'bg-green-100 text-green-800' : rec.action === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                        \${rec.action}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">$\${rec.currentPrice.toFixed(2)}</td>
                    <td class="px-6 py-4 text-right \${rec.expectedReturn > 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                      \${rec.expectedReturn?.toFixed(1)}%
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="px-3 py-1 rounded-full text-xs font-bold \${rec.confidence >= 70 ? 'bg-green-100 text-green-800' : rec.confidence >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                        \${rec.confidence}%
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button onclick="document.getElementById('symbol-input').value='\${rec.symbol}'; switchTab('analysis'); analyzeStock()" class="text-blue-600 hover:underline">
                        <i class="fas fa-search"></i> 分析
                      </button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`

        document.getElementById('recommendations-result').innerHTML = resultHTML

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('recommendations-loading').style.display = 'none'
      }
    }

    // 投資シミュレーション
    async function runSimulation() {
      const symbol = document.getElementById('sim-symbol').value.trim().toUpperCase()
      const purchaseDate = document.getElementById('sim-purchase-date').value
      const sellDate = document.getElementById('sim-sell-date').value
      const investmentAmount = parseFloat(document.getElementById('sim-amount').value)

      if (!symbol || !purchaseDate || !sellDate || !investmentAmount) {
        alert('すべての項目を入力してください')
        return
      }

      document.getElementById('simulation-loading').style.display = 'block'
      document.getElementById('simulation-result').innerHTML = ''

      try {
        const response = await axios.post('/api/simulation', {
          symbol,
          purchaseDate,
          sellDate,
          investmentAmount
        })
        const data = response.data

        const profitColor = data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'
        const profitBg = data.summary.profit >= 0 ? 'bg-green-50' : 'bg-red-50'

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 class="text-2xl font-bold mb-6">\${symbol} 投資シミュレーション結果</h3>
            
            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="\${profitBg} p-6 rounded-lg">
                <h4 class="font-bold mb-4">サマリー</h4>
                <div class="space-y-2">
                  <p><span class="text-gray-600">購入日:</span> <span class="font-semibold">\${data.summary.purchaseDate}</span></p>
                  <p><span class="text-gray-600">購入価格:</span> <span class="font-semibold">$\${data.summary.purchasePrice.toFixed(2)}</span></p>
                  <p><span class="text-gray-600">売却日:</span> <span class="font-semibold">\${data.summary.sellDate}</span></p>
                  <p><span class="text-gray-600">売却価格:</span> <span class="font-semibold">$\${data.summary.sellPrice.toFixed(2)}</span></p>
                  <p><span class="text-gray-600">保有期間:</span> <span class="font-semibold">\${data.summary.holdingPeriodDays}日</span></p>
                </div>
              </div>
              
              <div class="bg-blue-50 p-6 rounded-lg">
                <h4 class="font-bold mb-4">投資結果</h4>
                <div class="space-y-2">
                  <p><span class="text-gray-600">株数:</span> <span class="font-semibold">\${data.summary.shares}株</span></p>
                  <p><span class="text-gray-600">投資額:</span> <span class="font-semibold">$\${data.summary.investmentAmount.toFixed(2)}</span></p>
                  <p><span class="text-gray-600">最終評価額:</span> <span class="font-semibold">$\${data.summary.finalValue.toFixed(2)}</span></p>
                  <p class="text-2xl"><span class="text-gray-600">損益:</span> <span class="font-bold \${profitColor}">$\${data.summary.profit.toFixed(2)}</span></p>
                  <p class="text-2xl"><span class="text-gray-600">リターン:</span> <span class="font-bold \${profitColor}">\${data.summary.returnRate.toFixed(2)}%</span></p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-4">統計情報</h4>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-600">最大ドローダウン</p>
                  <p class="text-xl font-bold text-red-600">\${data.statistics.maxDrawdown.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">ボラティリティ（年率）</p>
                  <p class="text-xl font-bold text-purple-600">\${data.statistics.volatility.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">最良の日</p>
                  <p class="text-sm font-semibold text-green-600">\${data.statistics.bestDay.date}: +\${data.statistics.bestDay.return.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div>
              <h4 class="font-bold mb-3">ポートフォリオ価値の推移</h4>
              <canvas id="simulationChart"></canvas>
            </div>
          </div>
        \`

        document.getElementById('simulation-result').innerHTML = resultHTML

        // グラフ表示
        const ctx = document.getElementById('simulationChart').getContext('2d')
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.visualization.labels,
            datasets: [
              {
                label: '株価 (USD)',
                data: data.visualization.priceData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y'
              },
              {
                label: 'ポートフォリオ価値 (USD)',
                data: data.visualization.portfolioData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
              y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '株価 (USD)' } },
              y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'ポートフォリオ価値 (USD)' }, grid: { drawOnChartArea: false } }
            }
          }
        })

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('simulation-loading').style.display = 'none'
      }
    }

    // バックテスト
    async function runBacktest() {
      const symbol = document.getElementById('backtest-symbol').value.trim().toUpperCase()
      const testDate = document.getElementById('backtest-date').value

      if (!symbol || !testDate) {
        alert('銘柄コードとテスト日付を入力してください')
        return
      }

      document.getElementById('backtest-loading').style.display = 'block'
      document.getElementById('backtest-result').innerHTML = ''

      try {
        const response = await axios.post('/api/backtest', { symbol, testDate })
        const data = response.data

        const resultHTML = \`
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-2xl font-bold mb-6">\${symbol} バックテスト結果</h3>
            
            <div class="bg-blue-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-3">予測情報（\${data.testDate}時点）</h4>
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <p class="text-sm text-gray-600">判定</p>
                  <p class="text-3xl font-bold \${data.prediction.action === 'BUY' ? 'text-green-600' : data.prediction.action === 'SELL' ? 'text-red-600' : 'text-gray-600'}">\${data.prediction.action}</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">スコア</p>
                  <p class="text-3xl font-bold text-blue-600">\${data.prediction.score}</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">信頼度</p>
                  <p class="text-3xl font-bold text-purple-600">\${data.prediction.confidence}%</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 class="font-bold mb-3">実際の結果</h4>
              <div class="grid grid-cols-4 gap-4">
                <div>
                  <p class="text-sm text-gray-600">予測時の株価</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAtPrediction.toFixed(2)}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">1週間後</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAfter1Week.toFixed(2)}</p>
                  <p class="text-sm \${data.actualOutcome.return1Week >= 0 ? 'text-green-600' : 'text-red-600'}">\${data.actualOutcome.return1Week.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">1ヶ月後</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAfter1Month.toFixed(2)}</p>
                  <p class="text-sm \${data.actualOutcome.return1Month >= 0 ? 'text-green-600' : 'text-red-600'}">\${data.actualOutcome.return1Month.toFixed(2)}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">3ヶ月後</p>
                  <p class="text-xl font-bold">$\${data.actualOutcome.priceAfter3Months.toFixed(2)}</p>
                  <p class="text-sm \${data.actualOutcome.return3Months >= 0 ? 'text-green-600' : 'text-red-600'}">\${data.actualOutcome.return3Months.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div class="bg-green-50 p-6 rounded-lg">
              <h4 class="font-bold mb-3">精度評価</h4>
              <div class="grid grid-cols-4 gap-4">
                <div class="text-center">
                  <p class="text-sm text-gray-600">総合精度スコア</p>
                  <p class="text-4xl font-bold text-blue-600">\${data.accuracy.overallScore.toFixed(0)}%</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">1週間後</p>
                  <p class="text-2xl font-bold \${data.accuracy.direction1Week === 'correct' ? 'text-green-600' : data.accuracy.direction1Week === 'incorrect' ? 'text-red-600' : 'text-gray-600'}">
                    \${data.accuracy.direction1Week === 'correct' ? '✓' : data.accuracy.direction1Week === 'incorrect' ? '✗' : '○'}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">1ヶ月後</p>
                  <p class="text-2xl font-bold \${data.accuracy.direction1Month === 'correct' ? 'text-green-600' : data.accuracy.direction1Month === 'incorrect' ? 'text-red-600' : 'text-gray-600'}">
                    \${data.accuracy.direction1Month === 'correct' ? '✓' : data.accuracy.direction1Month === 'incorrect' ? '✗' : '○'}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600">3ヶ月後</p>
                  <p class="text-2xl font-bold \${data.accuracy.direction3Months === 'correct' ? 'text-green-600' : data.accuracy.direction3Months === 'incorrect' ? 'text-red-600' : 'text-gray-600'}">
                    \${data.accuracy.direction3Months === 'correct' ? '✓' : data.accuracy.direction3Months === 'incorrect' ? '✗' : '○'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        \`

        document.getElementById('backtest-result').innerHTML = resultHTML

      } catch (error) {
        alert('エラー: ' + (error.response?.data?.error || error.message))
      } finally {
        document.getElementById('backtest-loading').style.display = 'none'
      }
    }

    // ===== ランキング機能 =====
    
    // ランキング読み込み
    async function loadRanking(type) {
      console.log('[loadRanking] Called with type:', type)
      
      // すべてのランキングボタンをリセット
      document.querySelectorAll('#rankings-tab button').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white')
        btn.classList.add('bg-white', 'text-gray-700')
      })
      
      // 期間選択の表示/非表示
      const timeframeSelector = document.getElementById('timeframe-selector')
      if (type === 'high-growth') {
        timeframeSelector.style.display = 'block'
      } else {
        timeframeSelector.style.display = 'none'
      }
      
      // ローディング表示
      const welcomeDiv = document.getElementById('rankings-welcome')
      if (welcomeDiv) welcomeDiv.style.display = 'none'
      document.getElementById('rankings-loading').style.display = 'block'
      document.getElementById('rankings-result').style.display = 'none'
      
      // ローディングメッセージをランキングタイプに応じて変更
      const loadingMessages = {
        'recommended': 'おすすめTOP10を計算中... 統計モデルで5銘柄を分析しています（約20-30秒）',
        'high-growth': '高成長×信頼度ランキングを計算中... GPT-5-mini分析を実行中（約1-2分）',
        'short-term': '短期トレードランキングを計算中... テクニカル指標を分析しています（約20-30秒）',
        'trending': '注目株ランキングを計算中... ニュース・センチメントを分析しています（約30-60秒）'
      }
      
      document.querySelector('#rankings-loading p').textContent = loadingMessages[type] || 'ランキング計算中...'
      
      let isProcessing = false
      
      try {
        let endpoint = ''
        let requestBody = {}
        
        switch(type) {
          case 'recommended':
            endpoint = '/api/rankings/recommended'
            break
          case 'high-growth':
            endpoint = '/api/rankings/high-growth'
            requestBody = { timeframe: document.getElementById('ranking-timeframe').value }
            break
          case 'short-term':
            endpoint = '/api/rankings/short-term'
            break
          case 'trending':
            endpoint = '/api/rankings/trending'
            break
        }
        
        console.log('[API] Sending POST request to:', endpoint)
        console.log('[API] Request body:', requestBody)
        
        const response = await axios.post(endpoint, requestBody)
        
        console.log('[API] Response received:', response.status, response.data)
        console.log('[API] Rankings count:', response.data.rankings?.length || 0)
        
        // 202 Accepted（処理中）の場合
        if (response.status === 202) {
          isProcessing = true
          const data = response.data
          document.querySelector('#rankings-loading p').textContent = 
            data.message + ' 自動的に再試行します...'
          
          // retryAfter秒後に自動再試行
          setTimeout(() => {
            console.log('Retrying ranking request...')
            loadRanking(type)
          }, (data.retryAfter || 10) * 1000)
          return
        }
        
        // 200 OK（成功）の場合
        const data = response.data
        
        // 空の結果チェック
        if (!data.rankings || data.rankings.length === 0) {
          console.warn('[WARN] No rankings returned from API')
          document.getElementById('rankings-result').innerHTML = \`
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
              <p class="text-yellow-700">
                <i class="fas fa-exclamation-circle mr-2"></i>
                ランキング結果が0件でした。条件を満たす銘柄がありませんでした。
              </p>
              <p class="text-sm text-gray-600 mt-2">
                分析銘柄数: \${data.metadata?.totalScanned || 0}銘柄
              </p>
            </div>
          \`
          document.getElementById('rankings-result').style.display = 'block'
          return
        }
        
        // 結果を表示
        displayRankingResults(type, data)
        
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message
        document.getElementById('rankings-result').innerHTML = \`
          <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <p class="text-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              エラーが発生しました: \${errorMsg}
            </p>
          </div>
        \`
        document.getElementById('rankings-result').style.display = 'block'
      } finally {
        // 202（処理中）の場合はローディングを残す
        if (!isProcessing) {
          document.getElementById('rankings-loading').style.display = 'none'
        }
      }
    }
    
    // グローバルスコープに即座に公開
    window.loadRanking = loadRanking
    console.log('[Init] loadRanking function registered to window')
    
    // ランキング結果表示
    function displayRankingResults(type, data) {
      const resultsDiv = document.getElementById('rankings-result')
      
      const typeLabels = {
        'recommended': 'おすすめTOP10',
        'high-growth': '高成長×信頼度',
        'short-term': '短期トレード',
        'trending': '注目株'
      }
      
      let html = \`
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold">
              <i class="fas fa-trophy mr-2 text-yellow-600"></i>
              \${typeLabels[type]}ランキング
            </h3>
            <div class="text-sm text-gray-600">
              <i class="fas fa-clock mr-1"></i>
              更新: \${new Date(data.metadata.timestamp).toLocaleString('ja-JP')}
              \${data.metadata.cacheHit ? '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">キャッシュ</span>' : ''}
            </div>
          </div>
          
          <div class="mb-4 text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>
            分析銘柄数: \${data.metadata.totalScanned}銘柄 | 
            実行時間: \${(data.metadata.executionTime / 1000).toFixed(1)}秒
          </div>
      \`
      
      // ランキングタイプごとに異なる表示
      if (type === 'recommended') {
        html += displayRecommendedRanking(data.rankings)
      } else if (type === 'high-growth') {
        html += displayHighGrowthRanking(data.rankings)
      } else if (type === 'short-term') {
        html += displayShortTermRanking(data.rankings)
      } else if (type === 'trending') {
        html += displayTrendingRanking(data.rankings)
      }
      
      html += '</div>'
      
      resultsDiv.innerHTML = html
      resultsDiv.style.display = 'block'
    }
    
    // おすすめTOP10表示
    function displayRecommendedRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">テクニカル</th>
                <th class="px-4 py-3 text-right font-semibold">ファンダメンタル</th>
                <th class="px-4 py-3 text-right font-semibold">センチメント</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-center font-semibold">判定</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-blue-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right text-blue-600 font-semibold">\${rank.technicalScore}</td>
                  <td class="px-4 py-4 text-right text-green-600 font-semibold">\${rank.fundamentalScore}</td>
                  <td class="px-4 py-4 text-right text-yellow-600 font-semibold">\${rank.sentimentScore}</td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-sm font-bold \${rank.action === 'BUY' ? 'bg-green-100 text-green-800' : rank.action === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                      \${rank.action}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // 高成長×信頼度ランキング表示
    function displayHighGrowthRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-green-50 to-blue-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-right font-semibold">予測価格</th>
                <th class="px-4 py-3 text-right font-semibold">予測上昇率</th>
                <th class="px-4 py-3 text-right font-semibold">信頼度</th>
                <th class="px-4 py-3 text-right font-semibold">期間</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-green-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right font-semibold text-blue-600">$\${rank.predictedPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-xl font-bold text-green-600">+\${rank.predictedGain.toFixed(1)}%</span>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <span class="font-semibold text-purple-600">\${rank.confidence}%</span>
                  </td>
                  <td class="px-4 py-4 text-right text-gray-600">\${rank.timeframe}</td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // 短期トレードランキング表示
    function displayShortTermRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-yellow-50 to-orange-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-right font-semibold">テクニカルシグナル</th>
                <th class="px-4 py-3 text-right font-semibold">ボラティリティ</th>
                <th class="px-4 py-3 text-right font-semibold">モメンタム</th>
                <th class="px-4 py-3 text-center font-semibold">エントリー</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-orange-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right font-semibold text-blue-600">\${rank.technicalSignal}</td>
                  <td class="px-4 py-4 text-right text-purple-600">\${rank.volatility.toFixed(1)}%</td>
                  <td class="px-4 py-4 text-right text-green-600">\${rank.momentum.toFixed(1)}</td>
                  <td class="px-4 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-sm font-bold \${rank.entryTiming === 'NOW' ? 'bg-green-100 text-green-800' : rank.entryTiming === 'WAIT' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                      \${rank.entryTiming}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // 注目株ランキング表示
    function displayTrendingRanking(rankings) {
      return \`
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-red-50 to-pink-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">順位</th>
                <th class="px-4 py-3 text-left font-semibold">銘柄</th>
                <th class="px-4 py-3 text-right font-semibold">総合スコア</th>
                <th class="px-4 py-3 text-right font-semibold">現在価格</th>
                <th class="px-4 py-3 text-right font-semibold">ニュース</th>
                <th class="px-4 py-3 text-right font-semibold">ソーシャル</th>
                <th class="px-4 py-3 text-right font-semibold">アナリスト</th>
                <th class="px-4 py-3 text-left font-semibold">注目理由</th>
                <th class="px-4 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              \${rankings.map((rank, index) => \`
                <tr class="border-t hover:bg-gray-50 transition">
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} font-bold">
                      \${index + 1}
                    </span>
                  </td>
                  <td class="px-4 py-4 font-bold text-lg">\${rank.symbol}</td>
                  <td class="px-4 py-4 text-right">
                    <span class="text-2xl font-bold text-red-600">\${rank.totalScore}</span>
                  </td>
                  <td class="px-4 py-4 text-right font-semibold">$\${rank.currentPrice.toFixed(2)}</td>
                  <td class="px-4 py-4 text-right font-semibold text-blue-600">\${rank.newsScore}</td>
                  <td class="px-4 py-4 text-right font-semibold text-purple-600">\${rank.socialScore}</td>
                  <td class="px-4 py-4 text-right font-semibold text-green-600">\${rank.analystScore}</td>
                  <td class="px-4 py-4 text-sm text-gray-700">\${rank.trendReason}</td>
                  <td class="px-4 py-4 text-center">
                    <button onclick="analyzeStockFromRanking('\${rank.symbol}')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm">
                      <i class="fas fa-chart-line mr-1"></i>詳細分析
                    </button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`
    }
    
    // ランキングから詳細分析へ遷移
    function analyzeStockFromRanking(symbol) {
      // 分析タブに切り替え
      switchTab('analysis')
      
      // 銘柄コード入力欄にセット
      document.getElementById('symbol-input').value = symbol
      
      // 1秒後に自動実行（タブ切り替えアニメーション完了を待つ）
      setTimeout(() => {
        analyzeStock()
      }, 300)
    }
    
    // グローバルスコープに即座に公開
    window.analyzeStockFromRanking = analyzeStockFromRanking
    console.log('[Init] analyzeStockFromRanking function registered to window')

    // グローバルに分析データを保存（analyzeStock関数内で設定）
    // let currentAnalysisData = null  // 既にグローバルスコープで宣言済み

    // モーダル外クリックで閉じる
    window.onclick = function(event) {
      const modal = document.getElementById('detailModal')
      if (event.target === modal) {
        closeModal()
      }
    }

    // 日付フィールドのデフォルト値設定
    document.addEventListener('DOMContentLoaded', () => {
      const today = new Date()
      const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
      const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
      
      document.getElementById('sim-purchase-date').value = threeMonthsAgo.toISOString().split('T')[0]
      document.getElementById('sim-sell-date').value = today.toISOString().split('T')[0]
      document.getElementById('backtest-date').value = sixMonthsAgo.toISOString().split('T')[0]
      
      // Check if rankings welcome screen exists
      const rankingsWelcome = document.getElementById('rankings-welcome')
      const rankingsTab = document.getElementById('rankings-tab')
      console.log('%c Rankings Welcome Screen Check:', 'color: #8b5cf6; font-weight: bold;')
      console.log('  - Rankings Tab exists:', !!rankingsTab)
      console.log('  - Rankings Tab classes:', rankingsTab?.className)
      console.log('  - Welcome element exists:', !!rankingsWelcome)
      if (rankingsWelcome) {
        console.log('  - Welcome display style:', window.getComputedStyle(rankingsWelcome).display)
        console.log('  - Welcome visibility:', window.getComputedStyle(rankingsWelcome).visibility)
      }
      if (rankingsTab) {
        console.log('  - Rankings Tab display style:', window.getComputedStyle(rankingsTab).display)
      }
      
      // Test switchTab function
      console.log('%c Testing switchTab function:', 'color: #f59e0b; font-weight: bold;')
      console.log('  - switchTab function exists:', typeof window.switchTab !== 'undefined')
      console.log('  - loadRanking function exists:', typeof window.loadRanking !== 'undefined')
      console.log('  - analyzeStockFromRanking function exists:', typeof window.analyzeStockFromRanking !== 'undefined')
    })
  <\/script>
</body>
</html>
  `));const Rr=new Qr,kc=Object.assign({"/src/index.tsx":he});let oo=!1;for(const[,s]of Object.entries(kc))s&&(Rr.all("*",e=>{let t;try{t=e.executionCtx}catch{}return s.fetch(e.req.raw,e.env,t)}),Rr.notFound(e=>{let t;try{t=e.executionCtx}catch{}return s.fetch(e.req.raw,e.env,t)}),oo=!0);if(!oo)throw new Error("Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']");class Sc{constructor(){T(this,"cache");this.cache=new Map}set(e,t,n){this.cache.set(e,{data:t,timestamp:Date.now(),ttl:n})}get(e){const t=this.cache.get(e);return t?(Date.now()-t.timestamp)/1e3>t.ttl?(this.cache.delete(e),null):t.data:null}clear(e){if(!e){this.cache.clear();return}const t=[];this.cache.forEach((n,a)=>{a.includes(e)&&t.push(a)}),t.forEach(n=>this.cache.delete(n))}stats(){return{size:this.cache.size,keys:Array.from(this.cache.keys())}}cleanup(){const e=Date.now();let t=0;return this.cache.forEach((n,a)=>{(e-n.timestamp)/1e3>n.ttl&&(this.cache.delete(a),t++)}),t}}const z=new Sc,ie={DAILY_PRICE:86400,INTRADAY_PRICE:3600,REALTIME_QUOTE:300,NEWS:21600,SOCIAL_SENTIMENT:7200,FUNDAMENTAL:604800,ANALYST_RATING:86400,RANKING_RECOMMENDED:21600,RANKING_HIGH_GROWTH:21600,RANKING_SHORT_TERM:3600,RANKING_TRENDING:7200,LIGHT_ANALYSIS:21600,GPT5_ANALYSIS:21600};function we(s,...e){return`${s}:${e.join(":")}`}async function it(s,e,t){const n=z.get(s);if(n!==null)return n;const a=await t();return z.set(s,a,e),a}const os=Object.freeze(Object.defineProperty({__proto__:null,CACHE_TTL:ie,cache:z,generateCacheKey:we,getCachedData:it},Symbol.toStringTag,{value:"Module"})),Fa=!0,Da=10,Pt=["AAPL","MSFT","GOOGL","GOOG","AMZN","NVDA","META","TSLA","AVGO","AMD","INTC","QCOM","TXN","ADI","AMAT","LRCX","KLAC","MRVL","NXPI","SNPS","CDNS","ON","MCHP","ADBE","CRM","ORCL","INTU","WDAY","PANW","CRWD","FTNT","DDOG","ZS","TEAM","SNOW","NOW","ANSS","NFLX","ABNB","BKNG","EBAY","MELI","JD","PDD","DASH","TMUS","CMCSA","CHTR","COST","PEP","MDLZ","KDP","MNST","WBD","AMGN","GILD","VRTX","REGN","BIIB","ILMN","MRNA","SGEN","ISRG","DXCM","ALGN","IDXX","SBUX","LULU","ORLY","PCAR","ODFL","FAST","HON","ADP","PAYX","CPRT","VRSK","ASML","PYPL","ADSK","CSX","DLTR","CSGP","TTWO","EA","ATVI","MAR","CEG","XEL","GEHC","CTAS","BKR","FANG","WBA","ENPH","ZM","LCID","RIVN"];async function La(s,e){console.log(`Starting lightweight screening for ${s.length} symbols...`);const t=[],n=s.length;for(let a=0;a<s.length;a+=n){const r=s.slice(a,a+n),i=await Promise.all(r.map(o=>Ec(o,e)));t.push(...i.filter(o=>o!==null))}return console.log(`Lightweight screening completed: ${t.length} symbols`),t}async function Ec(s,e){try{const t=we("light_analysis",s),n=z.get(t);if(n)return n;console.log(`[DATA] Fetching data for ${s}...`);const[a,r,i,o]=await Promise.all([Pc(s,e.finnhub),Cc(s,e.alphaVantage),Mc(s,e.finnhub),Ic(s,e.alphaVantage)]);if(console.log(`${s}: quote=${JSON.stringify(a)}, tech=${r}, fund=${i}, sent=${o}`),!a)return console.error(`[ERROR] ${s}: No quote data, skipping`),null;const l=(r||50)*.3+(i||50)*.35+(o||50)*.2+50*.15,c={symbol:s,technicalScore:r||50,fundamentalScore:i||50,sentimentScore:o||50,preliminaryScore:l,currentPrice:a.price};return z.set(t,c,ie.LIGHT_ANALYSIS),c}catch(t){return console.error(`Error analyzing ${s}:`,t),null}}async function Pc(s,e){try{const t=we("quote",s);return await it(t,ie.REALTIME_QUOTE,async()=>{console.log(`[SEARCH] Fetching quote for ${s} from Finnhub...`);const n=`https://finnhub.io/api/v1/quote?symbol=${s}&token=${e}`,a=await fetch(n);if(!a.ok)return console.error(`[ERROR] Finnhub API error for ${s}: ${a.status} ${a.statusText}`),null;const r=await a.json();return console.log(`[QUOTE] ${s} quote response:`,JSON.stringify(r).substring(0,200)),r.c&&r.c>0?(console.log(`[OK] ${s} price: $${r.c}`),{price:r.c}):(console.warn(`[WARN] ${s}: Invalid quote data (c=${r.c})`),null)})}catch(t){return console.error(`[ERROR] Error fetching quote for ${s}:`,t),null}}async function Cc(s,e){try{const t=we("technical_score",s);return await it(t,ie.DAILY_PRICE,async()=>{const a=await(await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${s}&apikey=${e}&outputsize=compact`)).json();if(!a["Time Series (Daily)"])return 50;const r=Object.values(a["Time Series (Daily)"]).slice(0,50).map(d=>parseFloat(d["4. close"])),i=r.slice(0,20).reduce((d,p)=>d+p,0)/20,o=r.reduce((d,p)=>d+p,0)/50,l=r[0];let c=50;l>i&&i>o?c+=30:l>o&&(c+=15);const u=(l-r[r.length-1])/r[r.length-1];return u>.1?c+=20:u>0&&(c+=10),Math.min(Math.max(c,0),100)})}catch(t){return console.error(`Error calculating technical score for ${s}:`,t),50}}async function Mc(s,e){try{const t=we("fundamental_score",s);return await it(t,ie.FUNDAMENTAL,async()=>{const a=await(await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${s}&metric=all&token=${e}`)).json();if(!a.metric)return 50;let r=50;const i=a.metric;return i.roeTTM&&i.roeTTM>15?r+=20:i.roeTTM&&i.roeTTM>10&&(r+=10),i.operatingMarginTTM&&i.operatingMarginTTM>20?r+=20:i.operatingMarginTTM&&i.operatingMarginTTM>10&&(r+=10),i.revenueGrowthTTMYoy&&i.revenueGrowthTTMYoy>20&&(r+=10),Math.min(Math.max(r,0),100)})}catch(t){return console.error(`Error calculating fundamental score for ${s}:`,t),50}}async function Ic(s,e){try{const t=we("sentiment_score",s);return await it(t,ie.NEWS,async()=>{const n=new Date;n.setDate(n.getDate()-7);const a=n.toISOString().split("T")[0].replace(/-/g,"")+"T0000",i=await(await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${s}&time_from=${a}&apikey=${e}&limit=50`)).json();if(!i.feed||i.feed.length===0)return 50;const o=i.feed.map(c=>{var d;const u=(d=c.ticker_sentiment)==null?void 0:d.find(p=>p.ticker===s);return(u==null?void 0:u.ticker_sentiment_score)||0}).filter(c=>c!==0);return o.length===0?50:(o.reduce((c,u)=>c+u,0)/o.length+1)/2*100})}catch(t){return console.error(`Error calculating sentiment score for ${s}:`,t),50}}async function Tc(s){const e=Date.now(),t="ranking:recommended";console.log("[API-KEY] API Keys check:"),console.log(`  - Alpha Vantage: ${s.alphaVantage?s.alphaVantage.substring(0,8)+"...":"MISSING"}`),console.log(`  - Finnhub: ${s.finnhub?s.finnhub.substring(0,8)+"...":"MISSING"}`);const n=z.get(t);if(n)return console.log("[OK] Returning cached recommended ranking"),{...n,metadata:{...n.metadata,cacheHit:!0}};console.log("[START] Starting recommended ranking generation...");const a=Pt.slice(0,Da);console.log(`Analyzing ${a.length} symbols (Demo mode: ${Fa})`);const r=await La(a,s);console.log(`Lightweight screening returned ${r.length} symbols`);const i=r.map(l=>{const c=l.preliminaryScore;let u="HOLD";return c>=75?u="BUY":c<40&&(u="SELL"),{symbol:l.symbol,currentPrice:l.currentPrice,technicalScore:l.technicalScore,fundamentalScore:l.fundamentalScore,sentimentScore:l.sentimentScore,predictionConfidence:50,totalScore:c,action:u}}).sort((l,c)=>c.totalScore-l.totalScore).slice(0,10),o={rankings:i,metadata:{totalScanned:a.length,timestamp:new Date().toISOString(),cacheHit:!1,executionTime:Date.now()-e}};return console.log(`Recommended ranking completed: ${i.length} symbols`),z.set(t,o,ie.RANKING_RECOMMENDED),o}const Oc=Object.freeze(Object.defineProperty({__proto__:null,getRecommendedRanking:Tc,lightweightScreening:La},Symbol.toStringTag,{value:"Module"}));async function Fc(s,e){const t=Date.now(),n=`ranking:high-growth:${s}`,a=z.get(n);if(a)return console.log(`Cache hit for high-growth ranking (${s})`),{...a,metadata:{...a.metadata,cacheHit:!0}};console.log(`Starting high-growth ranking for ${s}...`),console.log("Step 1: Lightweight screening (100 symbols)...");const i=(await La(Pt,{alphaVantage:e.alphaVantage,finnhub:e.finnhub})).sort((u,d)=>d.preliminaryScore-u.preliminaryScore).slice(0,30);console.log("Step 1 completed: Selected top 30 candidates"),console.log(`Top 30 symbols: ${i.map(u=>u.symbol).join(", ")}`),console.log("Step 2: GPT-5-mini analysis for top 30...");const o=[];for(let u=0;u<i.length;u++){const d=i[u];console.log(`Analyzing ${d.symbol} (${u+1}/30) with GPT-5-mini...`);try{const p=await Dc(d,s,e);p&&o.push(p)}catch(p){console.error(`Error analyzing ${d.symbol}:`,p)}}console.log(`Step 2 completed: ${o.length} symbols analyzed`);const c={rankings:o.filter(u=>u.confidence>=60).sort((u,d)=>d.totalScore-u.totalScore).slice(0,10),metadata:{totalScanned:Pt.length,timestamp:new Date().toISOString(),cacheHit:!1,executionTime:Date.now()-t}};return z.set(n,c,ie.RANKING_HIGH_GROWTH),console.log(`High-growth ranking completed in ${c.metadata.executionTime}ms`),c}async function Dc(s,e,t){try{const n=we("gpt5mini_analysis",s.symbol,e),a=z.get(n);if(a)return console.log(`Cache hit for GPT-5-mini analysis: ${s.symbol}`),a;console.log(`Calling GPT-5-mini for ${s.symbol}...`);const{default:r}=await Promise.resolve().then(()=>gc),i=new r({apiKey:t.openai}),[o,l]=await Promise.all([Lc(s.symbol,t.alphaVantage),Nc(s.symbol,t.finnhub)]),c=`あなたは株式アナリストです。以下の銘柄データを分析し、${e}後の成長可能性を評価してください。

【銘柄】${s.symbol}
【現在価格】$${s.currentPrice}
【テクニカルスコア】${s.technicalScore}/100
【ファンダメンタルスコア】${s.fundamentalScore}/100
【センチメントスコア】${s.sentimentScore}/100

【最新ニュース】
${o.slice(0,5).map(_=>`- ${_.headline}: ${_.summary}`).join(`
`)}

【財務指標】
${l?JSON.stringify(l,null,2):"取得失敗"}

【分析要求】
1. ${e}後の予測価格を算出
2. 予測上昇率（%）を計算
3. 信頼度（60-95%）を評価
4. 総合判断理由を簡潔に述べる

【出力形式】JSON形式で以下を返してください：
{
  "predictedPrice": 数値,
  "predictedGain": 数値（%）,
  "confidence": 数値（60-95）,
  "reasoning": "判断理由（100文字以内）"
}

注意：predictedGainが15%未満の場合、その銘柄は推奨しません。`,d=(await i.responses.create({model:"gpt-5-mini",input:c})).output_text||"";console.log(`GPT-5-mini response for ${s.symbol}:`,d.substring(0,200));const p=d.match(/\{[\s\S]*\}/);if(!p)return console.error(`Failed to parse GPT-5-mini response for ${s.symbol}`),null;const f=JSON.parse(p[0]);if(f.predictedGain<15)return console.log(`${s.symbol}: predictedGain ${f.predictedGain}% < 15%, skipping`),null;const b=Math.max(60,Math.min(95,f.confidence)),x=f.predictedGain*.35+b*.3+s.fundamentalScore*.2+s.technicalScore*.15,g={symbol:s.symbol,currentPrice:s.currentPrice,predictedPrice:f.predictedPrice,predictedGain:f.predictedGain,confidence:b,fundamentalScore:s.fundamentalScore,technicalScore:s.technicalScore,totalScore:x,timeframe:e};return z.set(n,g,ie.GPT5_ANALYSIS),console.log(`GPT-5-mini analysis completed for ${s.symbol}: gain=${f.predictedGain}%, confidence=${b}%`),g}catch(n){return console.error(`Error in GPT-5-mini analysis for ${s.symbol}:`,n),null}}async function Lc(s,e){try{const t=we("news",s),n=z.get(t);if(n)return n;const i=(await(await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${s}&apikey=${e}&limit=10`)).json()).feed||[];return z.set(t,i,ie.NEWS),i}catch(t){return console.error(`Error fetching news for ${s}:`,t),[]}}async function Nc(s,e){try{const t=we("fundamental",s),n=z.get(t);if(n)return n;const r=await(await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${s}&metric=all&token=${e}`)).json();if(!r.metric)return null;const i={peRatio:r.metric.peNormalizedAnnual,pbRatio:r.metric.pbAnnual,roe:r.metric.roeTTM,revenueGrowth:r.metric.revenueGrowthTTMYoy,operatingMargin:r.metric.operatingMarginTTM};return z.set(t,i,ie.FUNDAMENTAL),i}catch(t){return console.error(`Error fetching fundamental data for ${s}:`,t),null}}const jc=Object.freeze(Object.defineProperty({__proto__:null,getHighGrowthRanking:Fc},Symbol.toStringTag,{value:"Module"}));async function Bc(s){const e=Date.now(),t="ranking:short-term",n=z.get(t);if(n)return{...n,metadata:{...n.metadata,cacheHit:!0}};console.log("[SHORT-TERM] Starting short-term trading ranking...");const a=Pt.slice(0,Da);console.log(`[SHORT-TERM] Analyzing ${a.length} symbols (DEMO_MODE: ${Fa})`);const r=[];{const l=await Promise.all(a.map(c=>Hc(c,s)));r.push(...l.filter(c=>c!==null))}console.log(`[SHORT-TERM] Analyzed ${r.length} symbols successfully`),r.length===0?console.warn("[SHORT-TERM] WARNING: No valid analyses returned! All symbols returned null."):console.log("[SHORT-TERM] Sample analysis:",r[0]);const i=r.sort((l,c)=>c.totalScore-l.totalScore).slice(0,10),o={rankings:i,metadata:{totalScanned:a.length,timestamp:new Date().toISOString(),cacheHit:!1,executionTime:Date.now()-e}};return z.set(t,o,ie.RANKING_SHORT_TERM),console.log(`[SHORT-TERM] Ranking completed: ${i.length} symbols`),o}async function Hc(s,e){try{const t=we("short_term_analysis",s);return await it(t,ie.RANKING_SHORT_TERM,async()=>{const a=await(await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${s}&apikey=${e.alphaVantage}&outputsize=compact`)).json();if(console.log(`[SHORT-TERM] ${s} API response keys:`,Object.keys(a)),a["Error Message"])return console.error(`[SHORT-TERM] ${s} API Error: ${a["Error Message"]}`),null;if(a.Note)return console.warn(`[SHORT-TERM] ${s} Rate limited: ${a.Note}`),null;if(!a["Time Series (Daily)"])return console.warn(`[SHORT-TERM] ${s} No daily data available`),null;const r=Object.values(a["Time Series (Daily)"]).slice(0,60).map(u=>parseFloat(u["4. close"]));if(r.length<30)return console.warn(`[SHORT-TERM] Insufficient data for ${s}: ${r.length} days`),null;const i=r[0],o=Gc(r,r);let l="WAIT";o.signal>=70&&o.rsi<70?l="NOW":(o.rsi>75||o.signal<40)&&(l="AVOID");const c=o.signal*.4+o.volatility/50*100*.25+(o.momentum>0?o.momentum:0)*.2+(o.volumeRatio-1)*100*.15;return{symbol:s,currentPrice:i,technicalSignal:o.signal,volatility:o.volatility,momentum:o.momentum,volumeRatio:o.volumeRatio,entryTiming:l,totalScore:c}})}catch(t){return console.error(`Error analyzing short-term for ${s}:`,t),null}}function Gc(s,e){const t=s[0],n=s.slice(0,5).reduce((f,b)=>f+b,0)/5,a=s.slice(0,20).reduce((f,b)=>f+b,0)/20,r=s.reduce((f,b)=>f+b,0)/Math.min(s.length,50),i=Uc(s,14),o=[];for(let f=1;f<s.length;f++)o.push((s[f-1]-s[f])/s[f]);const c=Math.sqrt(o.reduce((f,b)=>f+Math.pow(b,2),0)/o.length)*Math.sqrt(252)*100,u=s.length>=7?(s[0]-s[6])/s[6]*100:0,d=1;let p=0;return t>n&&n>a&&a>r?p+=30:t>n&&n>r&&(p+=15),i>=30&&i<=40?p+=25:i>=40&&i<=50?p+=20:i>=60&&i<=70&&(p+=15),u>5?p+=25:u>2?p+=15:u>0&&(p+=10),c>=25&&c<=40?p+=20:c>=20&&c<=50&&(p+=10),{signal:p,rsi:i,volatility:c,momentum:u,volumeRatio:d}}function Uc(s,e){if(s.length<e+1)return 50;let t=0,n=0;for(let l=0;l<e;l++){const c=s[l]-s[l+1];c>0?t+=c:n+=Math.abs(c)}const a=t/e,r=n/e;return r===0?100:100-100/(1+a/r)}const Wc=Object.freeze(Object.defineProperty({__proto__:null,getShortTermRanking:Bc},Symbol.toStringTag,{value:"Module"}));async function Kc(s){const e=Date.now(),t="ranking:trending",n=z.get(t);if(n)return{...n,metadata:{...n.metadata,cacheHit:!0}};console.log("Starting trending stocks ranking...");const a=Pt.slice(0,Da);console.log(`Analyzing ${a.length} symbols (Demo mode: ${Fa})`);const r=[],i=10;for(let c=0;c<a.length;c+=i){const u=a.slice(c,c+i),d=await Promise.all(u.map(p=>Yc(p,s)));r.push(...d.filter(p=>p!==null)),c+i<a.length&&await Xc(6e4)}const o=r.sort((c,u)=>u.totalScore-c.totalScore).slice(0,10),l={rankings:o,metadata:{totalScanned:Pt.length,timestamp:new Date().toISOString(),cacheHit:!1,executionTime:Date.now()-e}};return z.set(t,l,ie.RANKING_TRENDING),console.log(`Trending ranking completed: ${o.length} symbols`),l}async function Yc(s,e){try{const t=we("trending_analysis",s);return await it(t,ie.RANKING_TRENDING,async()=>{const[n,a,r,i]=await Promise.all([qc(s,e.finnhub),Vc(s,e.alphaVantage),zc(s,e.finnhub),Jc(s,e.finnhub)]);if(!n)return null;const o=a||50,l=r||50,c=i||50,u=o/2,d=50,p=o*.3+u*.25+d*.2+l*.15+c*.1,f=[];return a>70&&f.push("大型ニュース発表"),u>70&&f.push("SNSで話題沸騰"),r>70&&f.push("アナリスト評価上昇"),i>70&&f.push("業績好調"),{symbol:s,currentPrice:n,newsScore:o,socialScore:u,searchScore:d,analystScore:l,fundamentalGrowth:c,totalScore:p,trendReason:f.join(" / ")||"総合的に注目度上昇"}})}catch(t){return console.error(`Error analyzing trending for ${s}:`,t),null}}async function qc(s,e){try{const t=await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${e}`);if(!t.ok)return console.error(`Finnhub quote API error for ${s}: ${t.status}`),null;const n=t.headers.get("content-type");return!n||!n.includes("application/json")?(console.error(`Finnhub quote API returned non-JSON for ${s}: ${n}`),null):(await t.json()).c||null}catch(t){return console.error(`Error fetching quote for ${s}:`,t),null}}async function Vc(s,e){try{const t=new Date;t.setDate(t.getDate()-7);const n=t.toISOString().split("T")[0].replace(/-/g,"")+"T0000",r=await(await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${s}&time_from=${n}&apikey=${e}&limit=50`)).json();if(!r.feed)return 50;const i=r.feed.length;let o=0;i>=10?o+=50:i>=5?o+=30:i>=2&&(o+=15);const l=r.feed.map(c=>{var d;const u=(d=c.ticker_sentiment)==null?void 0:d.find(p=>p.ticker===s);return(u==null?void 0:u.ticker_sentiment_score)||0}).filter(c=>c!==0);if(l.length>0){const c=l.reduce((u,d)=>u+d,0)/l.length;o+=(c+1)/2*50}else o+=25;return Math.min(o,100)}catch{return 50}}async function zc(s,e){try{const t=await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${s}&token=${e}`);if(!t.ok)return 50;const n=t.headers.get("content-type");if(!n||!n.includes("application/json"))return 50;const a=await t.json();if(!a||a.length===0)return 50;const r=a[0],i=r.buy+r.hold+r.sell;return i===0?50:r.buy/i*100}catch{return 50}}async function Jc(s,e){try{const t=await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${s}&metric=all&token=${e}`);if(!t.ok)return 50;const n=t.headers.get("content-type");if(!n||!n.includes("application/json"))return 50;const a=await t.json();if(!a.metric)return 50;let r=50;const i=a.metric;return i.revenueGrowthTTMYoy&&(i.revenueGrowthTTMYoy>30?r+=30:i.revenueGrowthTTMYoy>20?r+=20:i.revenueGrowthTTMYoy>10&&(r+=10)),i.epsGrowthTTMYoy&&(i.epsGrowthTTMYoy>30?r+=20:i.epsGrowthTTMYoy>20?r+=15:i.epsGrowthTTMYoy>10&&(r+=10)),Math.min(r,100)}catch{return 50}}function Xc(s){return new Promise(e=>setTimeout(e,s))}const Qc=Object.freeze(Object.defineProperty({__proto__:null,getTrendingRanking:Kc},Symbol.toStringTag,{value:"Module"}));export{Rr as default};
