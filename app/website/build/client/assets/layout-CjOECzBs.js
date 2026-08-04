import{a as n,p as e,q as c,L as j,w,O as N}from"./chunk-62JRHF6Z-nF-r9U12.js";/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),k=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(s,a,o)=>o?o.toUpperCase():a.toLowerCase()),x=t=>{const s=k(t);return s.charAt(0).toUpperCase()+s.slice(1)},h=(...t)=>t.filter((s,a,o)=>!!s&&s.trim()!==""&&o.indexOf(s)===a).join(" ").trim(),C=t=>{for(const s in t)if(s.startsWith("aria-")||s==="role"||s==="title")return!0};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var _={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=n.forwardRef(({color:t="currentColor",size:s=24,strokeWidth:a=2,absoluteStrokeWidth:o,className:i="",children:r,iconNode:u,...d},f)=>n.createElement("svg",{ref:f,..._,width:s,height:s,stroke:t,strokeWidth:o?Number(a)*24/Number(s):a,className:h("lucide",i),...!r&&!C(d)&&{"aria-hidden":"true"},...d},[...u.map(([g,v])=>n.createElement(g,v)),...Array.isArray(r)?r:[r]]));/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=(t,s)=>{const a=n.forwardRef(({className:o,...i},r)=>n.createElement(M,{ref:r,iconNode:s,className:h(`lucide-${y(x(t))}`,`lucide-${t}`,o),...i}));return a.displayName=x(t),a};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],$=l("book-open",L);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],P=l("download",A);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]],p=l("github",S);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 18h16",key:"19g7jn"}],["path",{d:"M4 6h16",key:"1o0s65"}]],G=l("menu",F);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],R=l("x",O),b="https://github.com/RolinShmily/SrP-CFG_ForCS2",m=[{href:"/",label:"首页"},{href:"/download",label:"下载"},{href:"/docs",label:"文档"},{href:"/commands",label:"指令"},{href:"/about",label:"关于"}];function E(){const[t,s]=n.useState(!1);return e.jsxs("nav",{className:"fixed inset-x-0 top-0 z-[100] border-b border-border bg-bg/95","aria-label":"主导航",children:[e.jsxs("div",{className:"mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-5 sm:px-7",children:[e.jsxs(c,{to:"/",className:"group flex min-h-11 items-center gap-3 no-underline","aria-label":"SrP-CFG 首页",children:[e.jsx("img",{src:"/favicon.ico",alt:"",width:"32",height:"32",className:"h-8 w-8 rounded-[7px]"}),e.jsxs("span",{className:"leading-none",children:[e.jsx("span",{className:"block font-display text-lg font-bold tracking-[0.08em] text-text group-hover:text-accent",children:"SrP-CFG"}),e.jsx("span",{className:"mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint",children:"v3 Runtime"})]})]}),e.jsxs("div",{className:"hidden items-center gap-1 md:flex",children:[m.map(a=>e.jsx(c,{to:a.href,end:a.href==="/",className:({isActive:o})=>`inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 font-display text-sm font-semibold no-underline transition-colors duration-200 ${o?"bg-accent-bg text-accent":"text-text-muted hover:bg-bg-hover hover:text-text"}`,children:a.label},a.href)),e.jsx("span",{className:"mx-2 h-5 w-px bg-border","aria-hidden":"true"}),e.jsxs("a",{href:b,target:"_blank",rel:"noopener",className:"inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-sm font-semibold text-text-muted no-underline transition-colors duration-200 hover:bg-bg-hover hover:text-text",children:[e.jsx(p,{className:"h-4 w-4"}),"GitHub"]})]}),e.jsx("button",{type:"button",className:"flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-card text-text-secondary transition-colors hover:border-border-highlight hover:text-text md:hidden","aria-label":t?"关闭主导航":"打开主导航","aria-expanded":t,"aria-controls":"mobile-menu",onClick:()=>s(a=>!a),children:t?e.jsx(R,{className:"h-5 w-5"}):e.jsx(G,{className:"h-5 w-5"})})]}),t&&e.jsx("div",{id:"mobile-menu",className:"border-t border-border bg-bg md:hidden",children:e.jsx("div",{className:"mx-auto flex max-w-[1280px] flex-col gap-1 px-5 py-3",children:m.map(a=>e.jsx(c,{to:a.href,end:a.href==="/",onClick:()=>s(!1),className:({isActive:o})=>`inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 font-display text-sm font-semibold no-underline transition-colors duration-200 ${o?"bg-accent-bg text-accent":"text-text-muted hover:bg-bg-hover hover:text-text"}`,children:a.label},a.href))})})]})}const I=[{to:"/docs",label:"项目文档",icon:$,external:!1},{to:"/download",label:"前往下载",icon:P,external:!1},{to:b,label:"GitHub",icon:p,external:!0}];function B(){return e.jsx("footer",{className:"border-t border-border py-9 sm:py-12",children:e.jsxs("div",{className:"mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-5 sm:px-7 md:flex-row md:items-center",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("img",{src:"/favicon.ico",alt:"",width:"28",height:"28",className:"h-7 w-7 rounded-md"}),e.jsxs("div",{children:[e.jsx("span",{className:"block font-display text-sm font-bold tracking-[0.08em] text-text-secondary",children:"SrP-CFG"}),e.jsx("span",{className:"block font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint",children:"CS2 configuration runtime"})]})]}),e.jsx("div",{className:"flex flex-wrap items-center gap-x-2 gap-y-1",children:I.map(t=>{const s=t.icon,a="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-sm font-semibold text-text-muted no-underline transition-colors duration-200 hover:bg-bg-hover hover:text-accent";return t.external?e.jsxs("a",{href:t.to,target:"_blank",rel:"noopener",className:a,children:[e.jsx(s,{className:"h-4 w-4"}),t.label]},t.label):e.jsxs(j,{to:t.to,className:a,children:[e.jsx(s,{className:"h-4 w-4"}),t.label]},t.label)})})]})})}const U=w(function(){return e.jsxs(e.Fragment,{children:[e.jsx(E,{}),e.jsx("main",{id:"main-content",tabIndex:-1,children:e.jsx(N,{})}),e.jsx(B,{})]})});export{U as default};
