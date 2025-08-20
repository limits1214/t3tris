import{r as a,W as s,X as i,Y as e,Z as M,_ as d,$ as h,T as O,a3 as S,a4 as T,a5 as E,a6 as k,a7 as H}from"./index-B-syar4z.js";import{C as z,u as A,V as v,a as B,O as L,T as y,M as P,b as N,c as U,d as C}from"./ClientTetris-Dm3RJHDZ.js";import{p as R,P as j,M as I}from"./MobileButton-D7NuM8PD.js";const _=()=>{const t=a.useRef(null);return s(R,{css:i`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `,children:[e(V,{tetrisRef:t}),e(G,{tetrisRef:t})]})},V=({tetrisRef:t})=>{const[o]=a.useState(!0);return e(z,{orthographic:o,children:e(W,{isOrth:o,tetrisRef:t})})},W=({isOrth:t,tetrisRef:o})=>{const w=a.useRef(null),D=a.useRef(null),p=a.useRef(null),[m]=a.useState(0),{camera:l}=A(),f=new v(-20,-20),b=new v(20,20);return a.useEffect(()=>{const n=p.current;if(!n)return;const c=new B().subVectors(l.position,n.target),u=()=>{const r=n.target,g=C.clamp(r.x,f.x,b.x),x=C.clamp(r.y,f.y,b.y);r.x===g&&r.y===x||(r.set(g,x,r.z),l.position.set(r.x+c.x,r.y+c.y,r.z+c.z),l.updateProjectionMatrix(),n.update())};return n.addEventListener("change",u),()=>n.removeEventListener("change",u)},[l]),a.useEffect(()=>{const n=o.current;return n?.createPlayerBoard("Player",""),()=>{n?.deleteBoard("Player")}},[]),s(M,{children:[t?e(L,{makeDefault:!0,ref:D,position:[m,0,10],near:1,far:12,zoom:20}):e(j,{makeDefault:!0,ref:w,position:[13,0,100],near:.1,far:5e3}),e(N,{ref:p,target:[m,0,0],enableRotate:!1,mouseButtons:{LEFT:P.PAN,RIGHT:P.PAN},touches:{ONE:y.PAN,TWO:y.DOLLY_PAN}}),e("ambientLight",{intensity:1}),[0,Math.PI/2,Math.PI,3*Math.PI/2].map((n,c)=>{const u=Math.cos(n)*100,r=Math.sin(n)*100;return e("directionalLight",{position:[u,100,r],intensity:1},c)}),e(U,{ref:o})]})},G=({tetrisRef:t})=>s(M,{children:[s(d,{direction:"column",css:i`
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
        `,children:[e(d,{direction:"column",css:i`
            pointer-events: auto;
            /* z-index: 1; */
          `,children:e(h,{variant:"classic",onClick:()=>{t.current?.gameStart()},onKeyDown:o=>{o.code==="Space"&&o.preventDefault()},children:"GAME START"})}),e(X,{})]}),e(Y,{})]}),X=()=>{const t=O();return s(d,{css:i`
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `,children:[e(h,{color:"crimson",variant:"soft",onClick:()=>t("/"),children:"나가기"}),e($,{})]})},Y=()=>e(R,{css:i`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `,children:e(I,{})}),$=()=>s(H,{children:[e(S,{children:e(h,{variant:"classic",color:"cyan",onKeyDown:t=>{t.code==="Space"&&t.preventDefault()},children:"Help"})}),s(T,{maxWidth:"450px",children:[e(E,{children:"Help"}),e("strong",{children:"조작법"})," ",e("br",{}),"블럭 왼쪽 움직이기: 화살표 왼키 ",e("br",{}),"블럭 오른쪽 움직이기: 화살표 오른키 ",e("br",{}),"블럭 시계방향 회전: 화살표 위키 ",e("br",{}),"블럭 반시계방향 회전: Z 키 ",e("br",{}),"블럭 소프트 드랍: 화살표 아래키 ",e("br",{}),"블럭 하드 드랍: 스페이스바 ",e("br",{}),"블럭 홀드: 시프트키 ",e("br",{}),e("br",{}),e("br",{}),e("strong",{children:"마우스"}),e("br",{}),"휠: 카메라 줌 인아웃",e("br",{}),"좌,우: 카메라 이동",e("br",{}),e(d,{gap:"3",mt:"4",justify:"end",children:e(k,{children:e(h,{children:"Close"})})})]})]});export{_ as default};
