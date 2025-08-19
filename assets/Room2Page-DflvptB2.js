import{c as ie,r as a,a as Be,j as y,u as le,P as j,b as N,d as $e,e as ue,f as de,g as He,h as Ke,o as Ve,i as ze,v as Q,k as ee,y as H,l as K,m as V,n as z,p as I,q as me,s as m,t as C,w as P,x as e,C as We,z as Je,V as oe,A as Ye,O as Ze,B as Xe,T as re,M as se,D as qe,F as W,E as T,G as F,H as G,I as Qe,J as et,K as tt,L as nt,N as Z,Q as ot,R as rt,S as fe,U as st,W as he,X as pe,Y as ge,Z as at,_ as ae,$ as O,a0 as ct,a1 as it,a2 as U,a3 as lt,a4 as be,a5 as ve,a6 as ce}from"./index-BOwiaHXp.js";import{C as ut}from"./ClientTetris-CKcAKz96.js";import{M as dt}from"./MobileButton-ulhEZ7cn.js";var X="rovingFocusGroup.onEntryFocus",mt={bubbles:!1,cancelable:!0},_="RovingFocusGroup",[q,Ce,ft]=Be(_),[ht,Ie]=ie(_,[ft]),[pt,gt]=ht(_),we=a.forwardRef((t,o)=>y.jsx(q.Provider,{scope:t.__scopeRovingFocusGroup,children:y.jsx(q.Slot,{scope:t.__scopeRovingFocusGroup,children:y.jsx(bt,{...t,ref:o})})}));we.displayName=_;var bt=a.forwardRef((t,o)=>{const{__scopeRovingFocusGroup:r,orientation:n,loop:u=!1,dir:i,currentTabStopId:c,defaultCurrentTabStopId:h,onCurrentTabStopIdChange:p,onEntryFocus:g,preventScrollOnEntryFocus:f=!1,...s}=t,w=a.useRef(null),D=$e(o,w),x=ue(i),[L,b]=de({prop:c,defaultProp:h??null,onChange:p,caller:_}),[l,R]=a.useState(!1),v=He(g),d=Ce(r),E=a.useRef(!1),[k,A]=a.useState(0);return a.useEffect(()=>{const S=w.current;if(S)return S.addEventListener(X,v),()=>S.removeEventListener(X,v)},[v]),y.jsx(pt,{scope:r,orientation:n,dir:x,loop:u,currentTabStopId:L,onItemFocus:a.useCallback(S=>b(S),[b]),onItemShiftTab:a.useCallback(()=>R(!0),[]),onFocusableItemAdd:a.useCallback(()=>A(S=>S+1),[]),onFocusableItemRemove:a.useCallback(()=>A(S=>S-1),[]),children:y.jsx(j.div,{tabIndex:l||k===0?-1:0,"data-orientation":n,...s,ref:D,style:{outline:"none",...t.style},onMouseDown:N(t.onMouseDown,()=>{E.current=!0}),onFocus:N(t.onFocus,S=>{const Oe=!E.current;if(S.target===S.currentTarget&&Oe&&!l){const ne=new CustomEvent(X,mt);if(S.currentTarget.dispatchEvent(ne),!ne.defaultPrevented){const Y=d().filter(M=>M.focusable),Pe=Y.find(M=>M.active),_e=Y.find(M=>M.id===L),Ue=[Pe,_e,...Y].filter(Boolean).map(M=>M.ref.current);Re(Ue,f)}}E.current=!1}),onBlur:N(t.onBlur,()=>R(!1))})})}),Te="RovingFocusGroupItem",ye=a.forwardRef((t,o)=>{const{__scopeRovingFocusGroup:r,focusable:n=!0,active:u=!1,tabStopId:i,children:c,...h}=t,p=le(),g=i||p,f=gt(Te,r),s=f.currentTabStopId===g,w=Ce(r),{onFocusableItemAdd:D,onFocusableItemRemove:x,currentTabStopId:L}=f;return a.useEffect(()=>{if(n)return D(),()=>x()},[n,D,x]),y.jsx(q.ItemSlot,{scope:r,id:g,focusable:n,active:u,children:y.jsx(j.span,{tabIndex:s?0:-1,"data-orientation":f.orientation,...h,ref:o,onMouseDown:N(t.onMouseDown,b=>{n?f.onItemFocus(g):b.preventDefault()}),onFocus:N(t.onFocus,()=>f.onItemFocus(g)),onKeyDown:N(t.onKeyDown,b=>{if(b.key==="Tab"&&b.shiftKey){f.onItemShiftTab();return}if(b.target!==b.currentTarget)return;const l=It(b,f.orientation,f.dir);if(l!==void 0){if(b.metaKey||b.ctrlKey||b.altKey||b.shiftKey)return;b.preventDefault();let v=w().filter(d=>d.focusable).map(d=>d.ref.current);if(l==="last")v.reverse();else if(l==="prev"||l==="next"){l==="prev"&&v.reverse();const d=v.indexOf(b.currentTarget);v=f.loop?wt(v,d+1):v.slice(d+1)}setTimeout(()=>Re(v))}}),children:typeof c=="function"?c({isCurrentTabStop:s,hasTabStop:L!=null}):c})})});ye.displayName=Te;var vt={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function Ct(t,o){return o!=="rtl"?t:t==="ArrowLeft"?"ArrowRight":t==="ArrowRight"?"ArrowLeft":t}function It(t,o,r){const n=Ct(t.key,r);if(!(o==="vertical"&&["ArrowLeft","ArrowRight"].includes(n))&&!(o==="horizontal"&&["ArrowUp","ArrowDown"].includes(n)))return vt[n]}function Re(t,o=!1){const r=document.activeElement;for(const n of t)if(n===r||(n.focus({preventScroll:o}),document.activeElement!==r))return}function wt(t,o){return t.map((r,n)=>t[(o+n)%t.length])}var Tt=we,yt=ye,J="Tabs",[Rt,Xt]=ie(J,[Ie]),Se=Ie(),[St,te]=Rt(J),xe=a.forwardRef((t,o)=>{const{__scopeTabs:r,value:n,onValueChange:u,defaultValue:i,orientation:c="horizontal",dir:h,activationMode:p="automatic",...g}=t,f=ue(h),[s,w]=de({prop:n,onChange:u,defaultProp:i??"",caller:J});return y.jsx(St,{scope:r,baseId:le(),value:s,onValueChange:w,orientation:c,dir:f,activationMode:p,children:y.jsx(j.div,{dir:f,"data-orientation":c,...g,ref:o})})});xe.displayName=J;var Ee="TabsList",Ne=a.forwardRef((t,o)=>{const{__scopeTabs:r,loop:n=!0,...u}=t,i=te(Ee,r),c=Se(r);return y.jsx(Tt,{asChild:!0,...c,orientation:i.orientation,dir:i.dir,loop:n,children:y.jsx(j.div,{role:"tablist","aria-orientation":i.orientation,...u,ref:o})})});Ne.displayName=Ee;var Ge="TabsTrigger",Fe=a.forwardRef((t,o)=>{const{__scopeTabs:r,value:n,disabled:u=!1,...i}=t,c=te(Ge,r),h=Se(r),p=Me(c.baseId,n),g=je(c.baseId,n),f=n===c.value;return y.jsx(yt,{asChild:!0,...h,focusable:!u,active:f,children:y.jsx(j.button,{type:"button",role:"tab","aria-selected":f,"aria-controls":g,"data-state":f?"active":"inactive","data-disabled":u?"":void 0,disabled:u,id:p,...i,ref:o,onMouseDown:N(t.onMouseDown,s=>{!u&&s.button===0&&s.ctrlKey===!1?c.onValueChange(n):s.preventDefault()}),onKeyDown:N(t.onKeyDown,s=>{[" ","Enter"].includes(s.key)&&c.onValueChange(n)}),onFocus:N(t.onFocus,()=>{const s=c.activationMode!=="manual";!f&&!u&&s&&c.onValueChange(n)})})})});Fe.displayName=Ge;var De="TabsContent",Le=a.forwardRef((t,o)=>{const{__scopeTabs:r,value:n,forceMount:u,children:i,...c}=t,h=te(De,r),p=Me(h.baseId,n),g=je(h.baseId,n),f=n===h.value,s=a.useRef(f);return a.useEffect(()=>{const w=requestAnimationFrame(()=>s.current=!1);return()=>cancelAnimationFrame(w)},[]),y.jsx(Ke,{present:u||f,children:({present:w})=>y.jsx(j.div,{"data-state":f?"active":"inactive","data-orientation":h.orientation,role:"tabpanel","aria-labelledby":p,hidden:!w,id:g,tabIndex:0,...c,ref:o,style:{...t.style,animationDuration:s.current?"0s":void 0},children:w&&i})})});Le.displayName=De;function Me(t,o){return`${t}-trigger-${o}`}function je(t,o){return`${t}-content-${o}`}var xt=xe,Et=Ne,Nt=Fe,Gt=Le;const Ft=["1","2"],Dt=["nowrap","wrap","wrap-reverse"],Lt=["start","center","end"],Mt={size:{type:"enum",className:"rt-r-size",values:Ft,default:"2",responsive:!0},wrap:{type:"enum",className:"rt-r-fw",values:Dt,responsive:!0},justify:{type:"enum",className:"rt-r-jc",values:Lt,responsive:!0},...ze,...Ve},ke=a.forwardRef((t,o)=>{const{className:r,...n}=Q(t,ee);return a.createElement(xt,{...n,ref:o,className:H("rt-TabsRoot",r)})});ke.displayName="Tabs.Root";const Ae=a.forwardRef((t,o)=>{const{className:r,color:n,...u}=Q(t,Mt,ee);return a.createElement(Et,{"data-accent-color":n,...u,asChild:!1,ref:o,className:H("rt-BaseTabList","rt-TabsList",r)})});Ae.displayName="Tabs.List";const B=a.forwardRef((t,o)=>{const{className:r,children:n,...u}=t;return a.createElement(Nt,{...u,asChild:!1,ref:o,className:H("rt-reset","rt-BaseTabListTrigger","rt-TabsTrigger",r)},a.createElement("span",{className:"rt-BaseTabListTriggerInner rt-TabsTriggerInner"},n),a.createElement("span",{className:"rt-BaseTabListTriggerInnerHidden rt-TabsTriggerInnerHidden"},n))});B.displayName="Tabs.Trigger";const $=a.forwardRef((t,o)=>{const{className:r,...n}=Q(t,ee);return a.createElement(Gt,{...n,ref:o,className:H("rt-TabsContent",r)})});$.displayName="Tabs.Content";const qt=()=>{const{roomId:t}=K(),o=V(c=>c.isInitialWsLoginEnd),r=z(c=>c.send),n=I(c=>c.clear),u=I(c=>c.setRoomGameResult),i=me(c=>c.setServerGameMsg);return a.useEffect(()=>(o&&t&&(h=>{r(JSON.stringify({type:"roomEnter",data:{roomId:h}}))})(t),()=>{o&&t&&(p=>{r(JSON.stringify({type:"roomLeave",data:{roomId:p}})),n(),u([]),i(null)})(t)}),[t,o]),m(P,{css:C`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `,children:[e(jt,{}),e(At,{})]})},jt=()=>{const[t]=a.useState(!0);return e(We,{orthographic:t,children:e(kt,{isOrth:t})})},kt=({isOrth:t})=>{const{roomId:o}=K(),r=a.useRef(null),n=a.useRef(null),u=a.useRef(null),i=a.useRef(null),c=me(l=>l.setGameRef),h=V(l=>l.wsId),[p,g]=a.useState(0),f=z(l=>l.send),{camera:s}=Je(),w=new oe(-20,-20),D=new oe(20,20);a.useEffect(()=>{const l=i.current;if(!l)return;const R=new Ye().subVectors(s.position,l.target),v=()=>{const d=l.target,E=ce.clamp(d.x,w.x,D.x),k=ce.clamp(d.y,w.y,D.y);d.x===E&&d.y===k||(d.set(E,k,d.z),s.position.set(d.x+R.x,d.y+R.y,d.z+R.z),s.updateProjectionMatrix(),l.update())};return l.addEventListener("change",v),()=>l.removeEventListener("change",v)},[s]),a.useEffect(()=>{c(r)},[c]);const x=I(l=>l.games),L=I(l=>l.roomStatus);a.useEffect(()=>{const l=r.current;if(L==="Gaming"){const R=x[x.length-1];R&&l?.setWsSenderGameId(R)}else l?.setWsSenderGameId(void 0)},[x,L]);const b=I(l=>l.users);return a.useEffect(()=>{const l=r.current,R=b.map(d=>({wsId:d.wsId,nickName:d.nickName})),v={...l?.getBoards()};for(const[,{wsId:d,nickName:E}]of R.entries())v[d]?delete v[d]:(d===h?l?.createMulitPlayerBoard(d,E):l?.createMultiSubBoard(d,E),d===h&&(()=>{if(o){const A=x[x.length-1];A&&f(JSON.stringify({type:"gameSync",data:{gameId:A,roomId:o}}))}})());for(const[d]of Object.entries(v))console.log("delete",d),l?.deleteBoard(d)},[h,b]),a.useEffect(()=>{b.length===1?g(0):g(13)},[b]),m(W,{children:[t?e(Ze,{makeDefault:!0,ref:u,position:[p,0,10],near:1,far:12,zoom:20}):e(Xe,{makeDefault:!0,ref:n,position:[13,0,100],near:.1,far:5e3}),e(qe,{ref:i,target:[p,0,0],enableRotate:!1,mouseButtons:{LEFT:se.PAN,RIGHT:se.PAN},touches:{ONE:re.PAN,TWO:re.DOLLY_PAN}}),e("ambientLight",{intensity:1}),[0,Math.PI/2,Math.PI,3*Math.PI/2].map((l,R)=>{const v=Math.cos(l)*100,d=Math.sin(l)*100;return e("directionalLight",{position:[v,100,d],intensity:1},R)}),e(ut,{ref:r,send:f})]})},At=()=>{const[t,o]=a.useState(!1);return m(W,{children:[m(T,{direction:"column",css:C`
          background-color: rgba(255, 255, 255, 0.7);
          position: absolute;
          padding: 0.5rem;
          left: 0;
          top: 0;
          width: 250px;
          /* height: 300px; */
          border: 1px solid black;
          pointer-events: none;
          /* z-index: 1; */
        `,children:[e(T,{css:C`
            justify-content: end;
          `,children:e(F,{onClick:()=>o(!t),onKeyDown:r=>{r.code==="Space"&&r.preventDefault()},css:C`
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1;
              pointer-events: auto;
            `,children:t?e("svg",{width:"15",height:"15",viewBox:"0 0 15 15",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:e("path",{d:"M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z",fill:"currentColor","fill-rule":"evenodd","clip-rule":"evenodd"})}):e("svg",{width:"15",height:"15",viewBox:"0 0 15 15",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:e("path",{d:"M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z",fill:"currentColor","fill-rule":"evenodd","clip-rule":"evenodd"})})})}),m(T,{direction:"column",css:C`
            display: ${t?"none":"block"};
            pointer-events: none;
            /* z-index: 1; */
          `,children:[e(Ot,{}),e(Bt,{})]}),e(Ut,{})]}),e(Vt,{}),e(Kt,{})]})},Ot=()=>{const t=I(n=>n.isGameResultOpen),[o,r]=a.useState("roomInfo");return a.useEffect(()=>{t&&r("results")},[t]),e(P,{css:C`
        width: 100%;
        /* height: 250px; */
        max-height: 250px;
        min-height: 200px;
        overflow: auto;
      `,children:m(ke,{defaultValue:"roomInfo",value:o,onValueChange:r,css:C`
          pointer-events: auto;
        `,children:[m(Ae,{children:[e(B,{value:"roomInfo",children:"Room"}),e(B,{value:"userInfo",children:"User"}),e(B,{value:"results",children:"Result"})]}),m(P,{pt:"3",children:[e($,{value:"roomInfo",children:e(Pt,{})}),e($,{value:"userInfo",children:e(_t,{})}),e($,{value:"results",children:e($t,{})})]})]})})},Pt=()=>{const{roomId:t}=K(),o=z(s=>s.send),r=I(s=>s.roomName),n=I(s=>s.users),u=I(s=>s.roomStatus),i=I(s=>s.gameType),c=I(s=>s.hostUser),h=V(s=>s.wsId),p=c?.wsId===h,g=()=>{i==="MultiBattle"&&n.length===1||t&&o(JSON.stringify({type:"roomGameStart",data:{roomId:t}}))},f=s=>{t&&o(JSON.stringify({type:"roomGameTypeChange",data:{roomId:t,gameType:s}}))};return m(T,{direction:"column",children:[m(G,{children:["방제목: ",r]}),m(G,{children:["방상태: ",u]}),m(G,{children:["방장: ",c?.nickName]}),m(G,{children:["게임모드: ",i??""]}),p&&m(Qe,{defaultValue:i??"MultiScore",onValueChange:f,disabled:u!=="Waiting",children:[e(et,{}),e(ot,{children:m(tt,{children:[e(nt,{children:"GameType"}),e(Z,{value:"MultiScore",children:"Score"}),e(Z,{value:"Multi40Line",children:"40Line"}),e(Z,{value:"MultiBattle",children:"Battle(최소 2명)"})]})})]}),p&&u==="Waiting"?e(F,{variant:"classic",onClick:g,children:"GAME START"}):e(W,{})]})},_t=()=>{const t=I(n=>n.users),o=V(n=>n.wsId),r=I(n=>n.hostUser);return e(T,{direction:"column",children:t.sort((n,u)=>n.wsId===o?-1:u.wsId===o?1:0).map(n=>m(G,{children:["- ",n.nickName," ",n.wsId==o?"(본인)":""," ",r?.wsId==n.wsId?"(방장)":""]},n.wsId))})},Ut=()=>{const t=rt();return m(T,{css:C`
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `,children:[e(F,{onClick:()=>t("/"),children:"나가기"}),e(zt,{})]})},Bt=()=>{const t=I(s=>s.chats),{roomId:o}=K(),[r,n]=a.useState(""),u=z(s=>s.send),i=a.useRef(null),[c,h]=a.useState(!1),p=a.useRef(null);a.useEffect(()=>{p.current?.scrollIntoView({behavior:"smooth",block:"nearest"})},[t]);const g=()=>{if(o){const s=r.trim();console.log("Send: ",s),u(JSON.stringify({type:"roomChat",data:{msg:r,roomId:o}})),n(""),i.current?.focus()}},f=s=>{s.key==="Enter"&&!c&&(s.preventDefault(),g())};return m(P,{css:C`
        margin-top: 1rem;
        pointer-events: auto;
      `,children:[e(T,{direction:"column",css:C`
          height: 20vh;
          overflow: auto;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
        `,children:m(T,{direction:"column",css:C`
            flex: 1;
            font-size: 12px;
          `,children:[t.map((s,w)=>m(T,{css:C`
                width: 10wh;
              `,children:[m(G,{children:["[",fe(new Date(s.timestamp),"HH:mm:ss"),"]"]}),m(G,{children:["<",s.user.nickName,">",": "]}),e(G,{children:s.msg})]},`${s.timestamp}_${w}`)),e("div",{ref:p})]})}),m(T,{css:C`
          width: 100%;
        `,children:[e(st,{css:C`
            flex: 1;
            width: 100%;
          `,ref:i,placeholder:"message...",value:r,onChange:s=>n(s.target.value),onKeyDown:f,onCompositionStart:()=>h(!0),onCompositionEnd:()=>h(!1),maxLength:100}),e(F,{onClick:g,children:"전송"})]})]})},$t=()=>{const t=I(o=>o.gameResult);return e(T,{direction:"column",css:C`
        /* width: 15vw; */
        max-height: 400px;
        overflow-y: auto;
      `,children:t.map((o,r)=>e(Ht,{idx:r,gameResult:o},r))})},Ht=({idx:t,gameResult:o})=>{const r=I(i=>i.isGameResultOpen),n=I(i=>i.setIsGameResultOpen),u=I(i=>i.gameResult);return m(ve,{open:u.length===t+1?r:void 0,onOpenChange:u.length===t+1?n:void 0,children:[e(he,{children:m(F,{variant:"classic",color:"bronze",onKeyDown:i=>{i.code==="Space"&&i.preventDefault()},css:C`
            margin-top: 3px;
          `,children:["#",t+1," ",o.gameType]})}),m(pe,{children:[m(ge,{children:["#",t+1," ",o.gameType," Result"]}),m(at,{css:C`
            max-height: 400px;
            overflow-y: auto;
          `,children:[e(ct,{children:m(ae,{children:[e(O,{children:"No"}),e(O,{children:"NickName"}),e(O,{children:"Elapsed"}),e(O,{children:"Score"}),e(O,{children:"Line"})]})}),e(lt,{children:o.gameResultInfo.map((i,c)=>m(ae,{children:[e(it,{children:c+1}),e(U,{children:i.nickName}),e(U,{children:`${fe(new Date(i.elapsed??0),"mm:ss:SS")}`}),e(U,{children:i.score}),e(U,{children:i.clearLine})]},c))})]}),e(T,{gap:"3",mt:"4",justify:"end",children:e(be,{children:e(F,{children:"Close"})})})]})]})},Kt=()=>e(P,{css:C`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `,children:e(dt,{})}),Vt=()=>{const t=I(o=>o.gameStartTimer);return e(W,{children:t!==0&&e(T,{css:C`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          `,children:e(T,{css:C`
              border: 1px solid black;
              width: 100px;
              height: 100px;
              background: white;
              justify-content: center;
              align-items: center;
              font-size: 50px;
              border-radius: 10px;
            `,children:t})})})},zt=()=>m(ve,{children:[e(he,{children:e(F,{variant:"classic",color:"cyan",onKeyDown:t=>{t.code==="Space"&&t.preventDefault()},children:"Help"})}),m(pe,{maxWidth:"450px",children:[e(ge,{children:"Help"}),e("strong",{children:"게임모드"}),e("br",{}),"Score: 스코어가 가장 높은 사람이 1등 ",e("br",{}),"40Line: 40라인을 가장 먼저 만드는 사람이 1등 ",e("br",{}),"Battle: 서로에게 공격 및 방어하며 최후의 1인이 1등 ",e("br",{}),"(게임모드는 방장만 조작 가능)",e("br",{}),e("br",{}),e("br",{}),e("strong",{children:"조작법"})," ",e("br",{}),"블럭 왼쪽 움직이기: 화살표 왼키 ",e("br",{}),"블럭 오른쪽 움직이기: 화살표 오른키 ",e("br",{}),"블럭 시계방향 회전: 화살표 위키 ",e("br",{}),"블럭 반시계방향 회전: Z 키 ",e("br",{}),"블럭 소프트 드랍: 화살표 아래키 ",e("br",{}),"블럭 하드 드랍: 스페이스바 ",e("br",{}),"블럭 홀드: 시프트키 ",e("br",{}),e("br",{}),e("br",{}),e("strong",{children:"마우스"}),e("br",{}),"휠: 카메라 줌 인아웃",e("br",{}),"좌,우: 카메라 이동",e("br",{}),e(T,{gap:"3",mt:"4",justify:"end",children:e(be,{children:e(F,{children:"Close"})})})]})]});export{qt as default};
