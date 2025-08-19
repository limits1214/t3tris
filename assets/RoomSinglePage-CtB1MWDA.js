import{r,w as u,x as c,z as P,A as e,C as E,B as T,V as b,D as k,O as z,E as A,T as v,M as C,F as B,G as R,H as h,I as y,s as S,a7 as M}from"./index-CiXcBVMD.js";import{C as D}from"./ClientTetris-C3Hz5_Bq.js";import{M as L}from"./MobileButton-CLxMrHP4.js";const W=()=>{const o=r.useRef(null);return u(P,{css:c`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `,children:[e(H,{tetrisRef:o}),e(U,{tetrisRef:o})]})},H=({tetrisRef:o})=>{const[s]=r.useState(!0);return e(E,{orthographic:s,children:e(N,{isOrth:s,tetrisRef:o})})},N=({isOrth:o,tetrisRef:s})=>{const w=r.useRef(null),O=r.useRef(null),d=r.useRef(null),[m]=r.useState(0),{camera:i}=T(),p=new b(-20,-20),f=new b(20,20);return r.useEffect(()=>{const t=d.current;if(!t)return;const a=new k().subVectors(i.position,t.target),l=()=>{const n=t.target,g=M.clamp(n.x,p.x,f.x),x=M.clamp(n.y,p.y,f.y);n.x===g&&n.y===x||(n.set(g,x,n.z),i.position.set(n.x+a.x,n.y+a.y,n.z+a.z),i.updateProjectionMatrix(),t.update())};return t.addEventListener("change",l),()=>t.removeEventListener("change",l)},[i]),r.useEffect(()=>{const t=s.current;return t?.createPlayerBoard("Player",""),()=>{t?.deleteBoard("Player")}},[]),u(R,{children:[o?e(z,{makeDefault:!0,ref:O,position:[m,0,10],near:1,far:12,zoom:20}):e(A,{makeDefault:!0,ref:w,position:[13,0,100],near:.1,far:5e3}),e(B,{ref:d,target:[m,0,0],enableRotate:!1,mouseButtons:{LEFT:C.PAN,RIGHT:C.PAN},touches:{ONE:v.PAN,TWO:v.DOLLY_PAN}}),e("ambientLight",{intensity:1}),[0,Math.PI/2,Math.PI,3*Math.PI/2].map((t,a)=>{const l=Math.cos(t)*100,n=Math.sin(t)*100;return e("directionalLight",{position:[l,100,n],intensity:1},a)}),e(D,{ref:s})]})},U=({tetrisRef:o})=>u(R,{children:[u(h,{direction:"column",css:c`
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
        `,children:[e(h,{direction:"column",css:c`
            pointer-events: auto;
            /* z-index: 1; */
          `,children:e(y,{variant:"classic",onClick:()=>{o.current?.gameStart()},children:"GAME START"})}),e(I,{})]}),e(j,{})]}),I=()=>{const o=S();return e(h,{css:c`
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `,children:e(y,{onClick:()=>o("/"),children:"나가기"})})},j=()=>e(P,{css:c`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `,children:e(L,{})});export{W as default};
