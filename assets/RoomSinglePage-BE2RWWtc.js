import{r as o,w as s,x as i,z as P,A as e,C as D,B as E,V as v,D as H,O as S,E as T,T as y,M as C,F as k,G as R,H as d,I as h,s as z,X as A,Y as B,Z as L,a5 as N,a6 as U,a7 as M}from"./index-DerzuGn7.js";import{C as j}from"./ClientTetris-kaDMEsh_.js";import{M as I}from"./MobileButton-DDOThao3.js";const _=()=>{const t=o.useRef(null);return s(P,{css:i`
        height: 100dvh;
        width: 100dwh;
        -webkit-touch-callout: none; /* iOS 컨텍스트 메뉴 막기 */
        -webkit-user-select: none; /* 텍스트 선택 막기 (iOS/Android) */
        user-select: none;
        /* touch-action: none;          터치 동작 막기 (스크롤/줌 등) */
        touch-action: manipulation; /* 더블탭 확대 방지 */
      `,children:[e(G,{tetrisRef:t}),e(F,{tetrisRef:t})]})},G=({tetrisRef:t})=>{const[a]=o.useState(!0);return e(D,{orthographic:a,children:e(V,{isOrth:a,tetrisRef:t})})},V=({isOrth:t,tetrisRef:a})=>{const w=o.useRef(null),O=o.useRef(null),p=o.useRef(null),[m]=o.useState(0),{camera:l}=E(),f=new v(-20,-20),b=new v(20,20);return o.useEffect(()=>{const n=p.current;if(!n)return;const c=new H().subVectors(l.position,n.target),u=()=>{const r=n.target,g=M.clamp(r.x,f.x,b.x),x=M.clamp(r.y,f.y,b.y);r.x===g&&r.y===x||(r.set(g,x,r.z),l.position.set(r.x+c.x,r.y+c.y,r.z+c.z),l.updateProjectionMatrix(),n.update())};return n.addEventListener("change",u),()=>n.removeEventListener("change",u)},[l]),o.useEffect(()=>{const n=a.current;return n?.createPlayerBoard("Player",""),()=>{n?.deleteBoard("Player")}},[]),s(R,{children:[t?e(S,{makeDefault:!0,ref:O,position:[m,0,10],near:1,far:12,zoom:20}):e(T,{makeDefault:!0,ref:w,position:[13,0,100],near:.1,far:5e3}),e(k,{ref:p,target:[m,0,0],enableRotate:!1,mouseButtons:{LEFT:C.PAN,RIGHT:C.PAN},touches:{ONE:y.PAN,TWO:y.DOLLY_PAN}}),e("ambientLight",{intensity:1}),[0,Math.PI/2,Math.PI,3*Math.PI/2].map((n,c)=>{const u=Math.cos(n)*100,r=Math.sin(n)*100;return e("directionalLight",{position:[u,100,r],intensity:1},c)}),e(j,{ref:a})]})},F=({tetrisRef:t})=>s(R,{children:[s(d,{direction:"column",css:i`
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
          `,children:e(h,{variant:"classic",onClick:()=>{t.current?.gameStart()},children:"GAME START"})}),e(W,{})]}),e(X,{})]}),W=()=>{const t=z();return s(d,{css:i`
        margin-top: 1rem;
        pointer-events: auto;
        justify-content: space-between;
      `,children:[e(h,{onClick:()=>t("/"),children:"나가기"}),e(Y,{})]})},X=()=>e(P,{css:i`
        position: absolute;
        pointer-events: auto;
        /* border: 1px solid red; */
        bottom: 1%;
        /* width: 100%; */
        /* height: 100%; */
        left: 50%;
        transform: translate(-50%, 0%);
      `,children:e(I,{})}),Y=()=>s(U,{children:[e(A,{children:e(h,{variant:"classic",color:"cyan",onKeyDown:t=>{t.code==="Space"&&t.preventDefault()},children:"Help"})}),s(B,{maxWidth:"450px",children:[e(L,{children:"Help"}),e("strong",{children:"조작법"})," ",e("br",{}),"블럭 왼쪽 움직이기: 화살표 왼키 ",e("br",{}),"블럭 오른쪽 움직이기: 화살표 오른키 ",e("br",{}),"블럭 시계방향 회전: 화살표 위키 ",e("br",{}),"블럭 반시계방향 회전: Z 키 ",e("br",{}),"블럭 소프트 드랍: 화살표 아래키 ",e("br",{}),"블럭 하드 드랍: 스페이스바 ",e("br",{}),"블럭 홀드: 시프트키 ",e("br",{}),e("br",{}),e("br",{}),e("strong",{children:"마우스"}),e("br",{}),"휠: 카메라 줌 인아웃",e("br",{}),"좌,우: 카메라 이동",e("br",{}),e(d,{gap:"3",mt:"4",justify:"end",children:e(N,{children:e(h,{children:"Close"})})})]})]});export{_ as default};
