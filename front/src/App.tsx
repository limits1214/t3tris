import { BrowserRouter, Route, Routes } from "react-router-dom";
import DefaultLayout from "./layout/DefaultLayout.tsx";
import HomePage from "./page/HomePage.tsx";
import React from "react";

const LazyRoomPage = React.lazy(() => import("./page/RoomPage.tsx"));
const LazyRoom2Page = React.lazy(() => import("./page/Room2Page.tsx"));

const LazyTestPage = React.lazy(() => import("./page/test/TestPage.tsx"));
const LazyTestAuthPage = React.lazy(
  () => import("./page/test/TestAuthPage.tsx")
);
const LazyTestWsPage = React.lazy(() => import("./page/test/TestWsPage.tsx"));
const LazyTestR3fOptPage = React.lazy(
  () => import("./page/test/TestR3fOptPage.tsx")
);
const LazyTestR3fCliPage = React.lazy(
  () => import("./page/test/TestR3fCliPage.tsx")
);
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<DefaultLayout />}>
          <Route index element={<HomePage />}></Route>
          <Route path="room/:roomId">
            <Route index element={<LazyRoomPage />}></Route>
          </Route>
          <Route path="room2/:roomId">
            <Route index element={<LazyRoom2Page />}></Route>
          </Route>
        </Route>
        <Route path="test">
          <Route index element={<LazyTestPage />}></Route>
          <Route path="auth" element={<LazyTestAuthPage />}></Route>
          <Route path="ws" element={<LazyTestWsPage />}></Route>
          <Route path="r3fopt" element={<LazyTestR3fOptPage />}></Route>
          <Route path="r3fcli" element={<LazyTestR3fCliPage />}></Route>
        </Route>
        {/* {import.meta.env.VITE_IS_PRD === 'false' && ()} */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
