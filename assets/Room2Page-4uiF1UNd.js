import{c as ie,r as a,a as $e,j as y,u as le,P as j,b as N,d as He,e as ue,f as de,g as Ke,h as Ve,o as ze,i as We,v as Q,k as ee,y as K,l as V,m as z,n as P,p as I,q as me,s as fe,t as Je,w as f,x as C,z as _,A as e,C as Ye,B as Ze,V as oe,D as Xe,O as qe,E as Qe,T as re,M as se,F as et,G as W,H as T,I as F,J as G,K as tt,L as nt,N as ot,Q as rt,R as Z,S as st,U as he,W as at,X as pe,Y as ge,Z as be,_ as ct,$ as ae,a0 as O,a1 as it,a2 as lt,a3 as B,a4 as ut,a5 as ve,a6 as Ce,a7 as ce}from"./index-DerzuGn7.js";import{C as dt}from"./ClientTetris-kaDMEsh_.js";import{M as mt}from"./MobileButton-DDOThao3.js";var X="rovingFocusGroup.onEntryFocus",ft={bubbles:!1,cancelable:!0},U="RovingFocusGroup",[q,Ie,ht]=$e(U),[pt,we]=ie(U,[ht]),[gt,bt]=pt(U),Te=a.forwardRef((t,o)=>y.jsx(q.Provider,{scope:t.__scopeRovingFocusGroup,children:y.jsx(q.Slot,{scope:t.__scopeRovingFocusGroup,children:y.jsx(vt,{...t,ref:o})})}));Te.displayName=U;var vt=a.forwardRef((t,o)=>{const{__scopeRovingFocusGroup:r,orientation:n,loop:l=!1,dir:c,currentTabStopId:u,defaultCurrentTabStopId:p,onCurrentTabStopIdChange:h,onEntryFocus:g,preventScrollOnEntryFocus:d=!1,...s}=t,w=a.useRef(null),D=He(o,w),x=ue(c),[L,b]=de({prop:u,defaultProp:p??null,onChange:h,caller:U}),[i,R]=a.useState(!1),v=Ke(g),m=Ie(r),E=a.useRef(!1),[k,A]=a.useState(0);return a.useEffect(()=>{const S=w.current;if(S)return S.addEventListener(X,v),()=>S.removeEventListener(X,v)},[v]),y.jsx(gt,{scope:r,orientation:n,dir:x,loop:l,currentTabStopId:L,onItemFocus:a.useCallback(S=>b(S),[b]),onItemShiftTab:a.useCallback(()=>R(!0),[]),onFocusableItemAdd:a.useCallback(()=>A(S=>S+1),[]),onFocusableItemRemove:a.useCallback(()=>A(S=>S-1),[]),children:y.jsx(j.div,{tabIndex:i||k===0?-1:0,"data-orientation":n,...s,ref:D,style:{outline:"none",...t.style},onMouseDown:N(t.onMouseDown,()=>{E.current=!0}),onFocus:N(t.onFocus,S=>{const Pe=!E.current;if(S.target===S.currentTarget&&Pe&&!i){const ne=new CustomEvent(X,ft);if(S.currentTarget.dispatchEvent(ne),!ne.defaultPrevented){const Y=m().filter(M=>M.focusable),_e=Y.find(M=>M.active),Ue=Y.find(M=>M.id===L),Be=[_e,Ue,...Y].filter(Boolean).map(M=>M.ref.current);Se(Be,d)}}E.current=!1}),onBlur:N(t.onBlur,()=>R(!1))})})}),ye="RovingFocusGroupItem",Re=a.forwardRef((t,o)=>{const{__scopeRovingFocusGroup:r,focusable:n=!0,active:l=!1,tabStopId:c,children:u,...p}=t,h=le(),g=c||h,d=bt(ye,r),s=d.currentTabStopId===g,w=Ie(r),{onFocusableItemAdd:D,onFocusableItemRemove:x,currentTabStopId:L}=d;return a.useEffect(()=>{if(n)return D(),()=>x()},[n,D,x]),y.jsx(q.ItemSlot,{scope:r,id:g,focusable:n,active:l,children:y.jsx(j.span,{tabIndex:s?0:-1,"data-orientation":d.orientation,...p,ref:o,onMouseDown:N(t.onMouseDown,b=>{n?d.onItemFocus(g):b.preventDefault()}),onFocus:N(t.onFocus,()=>d.onItemFocus(g)),onKeyDown:N(t.onKeyDown,b=>{if(b.key==="Tab"&&b.shiftKey){d.onItemShiftTab();return}if(b.target!==b.currentTarget)return;const i=wt(b,d.orientation,d.dir);if(i!==void 0){if(b.metaKey||b.ctrlKey||b.altKey||b.shiftKey)return;b.preventDefault();let v=w().filter(m=>m.focusable).map(m=>m.ref.current);if(i==="last")v.reverse();else if(i==="prev"||i==="next"){i==="prev"&&v.reverse();const m=v.indexOf(b.currentTarget);v=d.loop?Tt(v,m+1):v.slice(m+1)}setTimeout(()=>Se(v))}}),children:typeof u=="function"?u({isCurrentTabStop:s,hasTabStop:L!=null}):u})})});Re.displayName=ye;var Ct={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function It(t,o){return o!=="rtl"?t:t==="ArrowLeft"?"ArrowRight":t==="ArrowRight"?"ArrowLeft":t}function wt(t,o,r){const n=It(t.key,r);if(!(o==="vertical"&&["ArrowLeft","ArrowRight"].includes(n))&&!(o==="horizontal"&&["ArrowUp","ArrowDown"].includes(n)))return Ct[n]}function Se(t,o=!1){const r=document.activeElement;for(const n of t)if(n===r||(n.focus({preventScroll:o}),document.activeElement!==r))return}function Tt(t,o){return t.map((r,n)=>t[(o+n)%t.length])}var yt=Te,Rt=Re,J="Tabs",[St,qt]=ie(J,[we]),xe=we(),[xt,te]=St(J),Ee=a.forwardRef((t,o)=>{const{__scopeTabs:r,value:n,onValueChange:l,defaultValue:c,orientation:u="horizontal",dir:p,activationMode:h="automatic",...g}=t,d=ue(p),[s,w]=de({prop:n,onChange:l,defaultProp:c??"",caller:J});return y.jsx(xt,{scope:r,baseId:le(),value:s,onValueChange:w,orientation:u,dir:d,activationMode:h,children:y.jsx(j.div,{dir:d,"data-orientation":u,...g,ref:o})})});Ee.displayName=J;var Ne="TabsList",Ge=a.forwardRef((t,o)=>{const{__scopeTabs:r,loop:n=!0,...l}=t,c=te(Ne,r),u=xe(r);return y.jsx(yt,{asChild:!0,...u,orientation:c.orientation,dir:c.dir,loop:n,children:y.jsx(j.div,{role:"tablist","aria-orientation":c.orientation,...l,ref:o})})});Ge.displayName=Ne;var Fe="TabsTrigger",De=a.forwardRef((t,o)=>{const{__scopeTabs:r,value:n,disabled:l=!1,...c}=t,u=te(Fe,r),p=xe(r),h=je(u.baseId,n),g=ke(u.baseId,n),d=n===u.value;return y.jsx(Rt,{asChild:!0,...p,focusable:!l,active:d,children:y.jsx(j.button,{type:"button",role:"tab","aria-selected":d,"aria-controls":g,"data-state":d?"active":"inactive","data-disabled":l?"":void 0,disabled:l,id:h,...c,ref:o,onMouseDown:N(t.onMouseDown,s=>{!l&&s.button===0&&s.ctrlKey===!1?u.onValueChange(n):s.preventDefault()}),onKeyDown:N(t.onKeyDown,s=>{[" ","Enter"].includes(s.key)&&u.onValueChange(n)}),onFocus:N(t.onFocus,()=>{const s=u.activationMode!=="manual";!d&&!l&&s&&u.onValueChange(n)})})})});De.displayName=Fe;var Le="TabsContent",Me=a.forwardRef((t,o)=>{const{__scopeTabs:r,value:n,forceMount:l,children:c,...u}=t,p=te(Le,r),h=je(p.baseId,n),g=ke(p.baseId,n),d=n===p.value,s=a.useRef(d);return a.useEffect(()=>{const w=requestAnimationFrame(()=>s.current=!1);return()=>cancelAnimationFrame(w)},[]),y.jsx(Ve,{present:l||d,children:({present:w})=>y.jsx(j.div,{"data-state":d?"active":"inactive","data-orientation":p.orientation,role:"tabpanel","aria-labelledby":h,hidden:!w,id:g,tabIndex:0,...u,ref:o,style:{...t.style,animationDuration:s.current?"0s":void 0},children:w&&c})})});Me.displayName=Le;function je(t,o){return`${t}-trigger-${o}`}function ke(t,o){return`${t}-content-${o}`}var Et=Ee,Nt=Ge,Gt=De,Ft=Me;const Dt=["1","2"],Lt=["nowrap","wrap","wrap-reverse"],Mt=["start","center","end"],jt={size:{type:"enum",className:"rt-r-size",values:Dt,default:"2",responsive:!0},wrap:{type:"enum",className:"rt-r-fw",values:Lt,responsive:!0},justify:{type:"enum",className:"rt-r-jc",values:Mt,responsive:!0},...We,...ze},Ae=a.forwardRef((t,o)=>{const{className:r,...n}=Q(t,ee);return a.createElement(Et,{...n,ref:o,className:K("rt-TabsRoot",r)})});Ae.displayName="Tabs.Root";const Oe=a.forwardRef((t,o)=>{const{className:r,color:n,...l}=Q(t,jt,ee);return a.createElement(Nt,{"data-accent-color":n,...l,asChild:!1,ref:o,className:K("rt-BaseTabList","rt-TabsList",r)})});Oe.displayName="Tabs.List";const $=a.forwardRef((t,o)=>{const{className:r,children:n,...l}=t;return a.createElement(Gt,{...l,asChild:!1,ref:o,className:K("rt-reset","rt-BaseTabListTrigger","rt-TabsTrigger",r)},a.createElement("span",{className:"rt-BaseTabListTriggerInner rt-TabsTriggerInner"},n),a.createElement("span",{className:"rt-BaseTabListTriggerInnerHidden rt-TabsTriggerInnerHidden"},n))});$.displayName="Tabs.Trigger";const H=a.forwardRef((t,o)=>{const{className:r,...n}=Q(t,ee);return a.createElement(Ft,{...n,ref:o,className:K("rt-TabsContent",r)})});H.displayName="Tabs.Content";const Qt=()=>{const{roomId:t}=V(),o=z(h=>h.isInitialWsLoginEnd),r=P(h=>h.send),n=I(h=>h.clear),l=I(h=>h.setRoomGameResult),c=me(h=>h.setServerGameMsg),u=P(h=>h.readyState),p=fe();return a.useEffect(()=>{u===Je.ReadyState.CLOSED&&p("/")},[p,u]),a.useEffect(()=>(o&&t&&(g=>{r(JSON.stringify({type:"roomEnter",data:{roomId:g}}))})(t),()=>{o&&t&&(d=>{r(JSON.stringify({type:"roomLeave",data:{roomId:d}})),n(),l([]),c(null)})(t)}),[t,o]),f(_,{css:C`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `,children:[e(kt,{}),e(Ot,{})]})},kt=()=>{const[t]=a.useState(!0);return e(Ye,{orthographic:t,children:e(At,{isOrth:t})})},At=({isOrth:t})=>{const{roomId:o}=V(),r=a.useRef(null),n=a.useRef(null),l=a.useRef(null),c=a.useRef(null),u=me(i=>i.setGameRef),p=z(i=>i.wsId),[h,g]=a.useState(0),d=P(i=>i.send),{camera:s}=Ze(),w=new oe(-20,-20),D=new oe(20,20);a.useEffect(()=>{const i=c.current;if(!i)return;const R=new Xe().subVectors(s.position,i.target),v=()=>{const m=i.target,E=ce.clamp(m.x,w.x,D.x),k=ce.clamp(m.y,w.y,D.y);m.x===E&&m.y===k||(m.set(E,k,m.z),s.position.set(m.x+R.x,m.y+R.y,m.z+R.z),s.updateProjectionMatrix(),i.update())};return i.addEventListener("change",v),()=>i.removeEventListener("change",v)},[s]),a.useEffect(()=>{u(r)},[u]);const x=I(i=>i.games),L=I(i=>i.roomStatus);a.useEffect(()=>{const i=r.current;if(L==="Gaming"){const R=x[x.length-1];R&&i?.setWsSenderGameId(R)}else i?.setWsSenderGameId(void 0)},[x,L]);const b=I(i=>i.users);return a.useEffect(()=>{const i=r.current,R=b.map(m=>({wsId:m.wsId,nickName:m.nickName})),v={...i?.getBoards()};for(const[,{wsId:m,nickName:E}]of R.entries())v[m]?delete v[m]:(m===p?i?.createMulitPlayerBoard(m,E):i?.createMultiSubBoard(m,E),m===p&&(()=>{if(o){const A=x[x.length-1];A&&d(JSON.stringify({type:"gameSync",data:{gameId:A,roomId:o}}))}})());for(const[m]of Object.entries(v))console.log("delete",m),i?.deleteBoard(m)},[p,b]),a.useEffect(()=>{b.length===1?g(0):g(13)},[b]),f(W,{children:[t?e(qe,{makeDefault:!0,ref:l,position:[h,0,10],near:1,far:12,zoom:20}):e(Qe,{makeDefault:!0,ref:n,position:[13,0,100],near:.1,far:5e3}),e(et,{ref:c,target:[h,0,0],enableRotate:!1,mouseButtons:{LEFT:se.PAN,RIGHT:se.PAN},touches:{ONE:re.PAN,TWO:re.DOLLY_PAN}}),e("ambientLight",{intensity:1}),[0,Math.PI/2,Math.PI,3*Math.PI/2].map((i,R)=>{const v=Math.cos(i)*100,m=Math.sin(i)*100;return e("directionalLight",{position:[v,100,m],intensity:1},R)}),e(dt,{ref:r,send:d})]})},Ot=()=>{const[t,o]=a.useState(!1);return f(W,{children:[f(T,{direction:"column",css:C`
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
            `,children:t?e("svg",{width:"15",height:"15",viewBox:"0 0 15 15",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:e("path",{d:"M14.7649 6.07596C14.9991 6.22231 15.0703 6.53079 14.9239 6.76495C14.4849 7.46743 13.9632 8.10645 13.3702 8.66305L14.5712 9.86406C14.7664 10.0593 14.7664 10.3759 14.5712 10.5712C14.3759 10.7664 14.0593 10.7664 13.8641 10.5712L12.6011 9.30817C11.805 9.90283 10.9089 10.3621 9.93375 10.651L10.383 12.3277C10.4544 12.5944 10.2961 12.8685 10.0294 12.94C9.76267 13.0115 9.4885 12.8532 9.41704 12.5865L8.95917 10.8775C8.48743 10.958 8.00036 10.9999 7.50001 10.9999C6.99965 10.9999 6.51257 10.958 6.04082 10.8775L5.58299 12.5864C5.51153 12.8532 5.23737 13.0115 4.97064 12.94C4.7039 12.8686 4.5456 12.5944 4.61706 12.3277L5.06625 10.651C4.09111 10.3621 3.19503 9.90282 2.3989 9.30815L1.1359 10.5712C0.940638 10.7664 0.624058 10.7664 0.428798 10.5712C0.233537 10.3759 0.233537 10.0593 0.428798 9.86405L1.62982 8.66303C1.03682 8.10643 0.515113 7.46742 0.0760677 6.76495C-0.0702867 6.53079 0.000898544 6.22231 0.235065 6.07596C0.469231 5.9296 0.777703 6.00079 0.924058 6.23496C1.40354 7.00213 1.989 7.68057 2.66233 8.2427C2.67315 8.25096 2.6837 8.25972 2.69397 8.26898C4.00897 9.35527 5.65537 9.99991 7.50001 9.99991C10.3078 9.99991 12.6564 8.5063 14.076 6.23495C14.2223 6.00079 14.5308 5.9296 14.7649 6.07596Z",fill:"currentColor","fill-rule":"evenodd","clip-rule":"evenodd"})}):e("svg",{width:"15",height:"15",viewBox:"0 0 15 15",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:e("path",{d:"M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z",fill:"currentColor","fill-rule":"evenodd","clip-rule":"evenodd"})})})}),f(T,{direction:"column",css:C`
            display: ${t?"none":"block"};
            pointer-events: none;
            /* z-index: 1; */
          `,children:[e(Pt,{}),e($t,{})]}),e(Bt,{})]}),e(zt,{}),e(Vt,{})]})},Pt=()=>{const t=I(n=>n.isGameResultOpen),[o,r]=a.useState("roomInfo");return a.useEffect(()=>{t&&r("results")},[t]),e(_,{css:C`
        width: 100%;
        /* height: 250px; */
        max-height: 250px;
        min-height: 200px;
        overflow: auto;
      `,children:f(Ae,{defaultValue:"roomInfo",value:o,onValueChange:r,css:C`
          pointer-events: auto;
        `,children:[f(Oe,{children:[e($,{value:"roomInfo",children:"Room"}),e($,{value:"userInfo",children:"User"}),e($,{value:"results",children:"Result"})]}),f(_,{pt:"3",children:[e(H,{value:"roomInfo",children:e(_t,{})}),e(H,{value:"userInfo",children:e(Ut,{})}),e(H,{value:"results",children:e(Ht,{})})]})]})})},_t=()=>{const{roomId:t}=V(),o=P(s=>s.send),r=I(s=>s.roomName),n=I(s=>s.users),l=I(s=>s.roomStatus),c=I(s=>s.gameType),u=I(s=>s.hostUser),p=z(s=>s.wsId),h=u?.wsId===p,g=()=>{c==="MultiBattle"&&n.length===1||t&&o(JSON.stringify({type:"roomGameStart",data:{roomId:t}}))},d=s=>{t&&o(JSON.stringify({type:"roomGameTypeChange",data:{roomId:t,gameType:s}}))};return f(T,{direction:"column",children:[f(G,{children:["방제목: ",r]}),f(G,{children:["방상태: ",l]}),f(G,{children:["방장: ",u?.nickName]}),f(G,{children:["게임모드: ",c??""]}),h&&f(tt,{defaultValue:c??"MultiScore",onValueChange:d,disabled:l!=="Waiting",children:[e(nt,{}),e(st,{children:f(ot,{children:[e(rt,{children:"GameType"}),e(Z,{value:"MultiScore",children:"Score"}),e(Z,{value:"Multi40Line",children:"40Line"}),e(Z,{value:"MultiBattle",children:"Battle(최소 2명)"})]})})]}),h&&l==="Waiting"?e(F,{variant:"classic",onClick:g,children:"GAME START"}):e(W,{})]})},Ut=()=>{const t=I(n=>n.users),o=z(n=>n.wsId),r=I(n=>n.hostUser);return e(T,{direction:"column",children:t.sort((n,l)=>n.wsId===o?-1:l.wsId===o?1:0).map(n=>f(G,{children:["- ",n.nickName," ",n.wsId==o?"(본인)":""," ",r?.wsId==n.wsId?"(방장)":""]},n.wsId))})},Bt=()=>{const t=fe();return f(T,{css:C`
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `,children:[e(F,{onClick:()=>t("/"),children:"나가기"}),e(Wt,{})]})},$t=()=>{const t=I(s=>s.chats),{roomId:o}=V(),[r,n]=a.useState(""),l=P(s=>s.send),c=a.useRef(null),[u,p]=a.useState(!1),h=a.useRef(null);a.useEffect(()=>{h.current?.scrollIntoView({behavior:"smooth",block:"nearest"})},[t]);const g=()=>{if(o){const s=r.trim();console.log("Send: ",s),l(JSON.stringify({type:"roomChat",data:{msg:r,roomId:o}})),n(""),c.current?.focus()}},d=s=>{s.key==="Enter"&&!u&&(s.preventDefault(),g())};return f(_,{css:C`
        margin-top: 1rem;
        pointer-events: auto;
      `,children:[e(T,{direction:"column",css:C`
          height: 20vh;
          overflow: auto;
          overflow-wrap: break-word;
          word-break: break-word;
          white-space: pre-wrap;
        `,children:f(T,{direction:"column",css:C`
            flex: 1;
            font-size: 12px;
          `,children:[t.map((s,w)=>f(T,{css:C`
                width: 10wh;
              `,children:[f(G,{children:["[",he(new Date(s.timestamp),"HH:mm:ss"),"]"]}),f(G,{children:["<",s.user.nickName,">",": "]}),e(G,{children:s.msg})]},`${s.timestamp}_${w}`)),e("div",{ref:h})]})}),f(T,{css:C`
          width: 100%;
        `,children:[e(at,{css:C`
            flex: 1;
            width: 100%;
          `,ref:c,placeholder:"message...",value:r,onChange:s=>n(s.target.value),onKeyDown:d,onCompositionStart:()=>p(!0),onCompositionEnd:()=>p(!1),maxLength:100}),e(F,{onClick:g,children:"전송"})]})]})},Ht=()=>{const t=I(o=>o.gameResult);return e(T,{direction:"column",css:C`
        /* width: 15vw; */
        max-height: 400px;
        overflow-y: auto;
      `,children:t.map((o,r)=>e(Kt,{idx:r,gameResult:o},r))})},Kt=({idx:t,gameResult:o})=>{const r=I(c=>c.isGameResultOpen),n=I(c=>c.setIsGameResultOpen),l=I(c=>c.gameResult);return f(Ce,{open:l.length===t+1?r:void 0,onOpenChange:l.length===t+1?n:void 0,children:[e(pe,{children:f(F,{variant:"classic",color:"bronze",onKeyDown:c=>{c.code==="Space"&&c.preventDefault()},css:C`
            margin-top: 3px;
          `,children:["#",t+1," ",o.gameType]})}),f(ge,{children:[f(be,{children:["#",t+1," ",o.gameType," Result"]}),f(ct,{css:C`
            max-height: 400px;
            overflow-y: auto;
          `,children:[e(it,{children:f(ae,{children:[e(O,{children:"No"}),e(O,{children:"NickName"}),e(O,{children:"Elapsed"}),e(O,{children:"Score"}),e(O,{children:"Line"})]})}),e(ut,{children:o.gameResultInfo.map((c,u)=>f(ae,{children:[e(lt,{children:u+1}),e(B,{children:c.nickName}),e(B,{children:`${he(new Date(c.elapsed??0),"mm:ss:SS")}`}),e(B,{children:c.score}),e(B,{children:c.clearLine})]},u))})]}),e(T,{gap:"3",mt:"4",justify:"end",children:e(ve,{children:e(F,{children:"Close"})})})]})]})},Vt=()=>e(_,{css:C`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `,children:e(mt,{})}),zt=()=>{const t=I(o=>o.gameStartTimer);return e(W,{children:t!==0&&e(T,{css:C`
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
            `,children:t})})})},Wt=()=>f(Ce,{children:[e(pe,{children:e(F,{variant:"classic",color:"cyan",onKeyDown:t=>{t.code==="Space"&&t.preventDefault()},children:"Help"})}),f(ge,{maxWidth:"450px",children:[e(be,{children:"Help"}),e("strong",{children:"게임모드"}),e("br",{}),"Score: 스코어가 가장 높은 사람이 1등 ",e("br",{}),"40Line: 40라인을 가장 먼저 만드는 사람이 1등 ",e("br",{}),"Battle: 서로에게 공격 및 방어하며 최후의 1인이 1등 ",e("br",{}),"(게임모드는 방장만 조작 가능)",e("br",{}),e("br",{}),e("br",{}),e("strong",{children:"조작법"})," ",e("br",{}),"블럭 왼쪽 움직이기: 화살표 왼키 ",e("br",{}),"블럭 오른쪽 움직이기: 화살표 오른키 ",e("br",{}),"블럭 시계방향 회전: 화살표 위키 ",e("br",{}),"블럭 반시계방향 회전: Z 키 ",e("br",{}),"블럭 소프트 드랍: 화살표 아래키 ",e("br",{}),"블럭 하드 드랍: 스페이스바 ",e("br",{}),"블럭 홀드: 시프트키 ",e("br",{}),e("br",{}),e("br",{}),e("strong",{children:"마우스"}),e("br",{}),"휠: 카메라 줌 인아웃",e("br",{}),"좌,우: 카메라 이동",e("br",{}),e(T,{gap:"3",mt:"4",justify:"end",children:e(ve,{children:e(F,{children:"Close"})})})]})]});export{Qt as default};
