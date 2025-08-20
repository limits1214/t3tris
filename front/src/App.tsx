import { BrowserRouter, Route, Routes } from "react-router-dom";
import DefaultLayout from "./layout/DefaultLayout.tsx";
import HomePage from "./page/HomePage.tsx";
import React from "react";

const LazyRoomPage = React.lazy(() => import("./page/RoomPage.tsx"));

const LazyTestPage = React.lazy(() => import("./page/test/TestPage.tsx"));

const LazyTestR3fCliPage = React.lazy(
  () => import("./page/test/TestR3fCliPage.tsx")
);
const LazySinglePage = React.lazy(() => import("./page/RoomSinglePage.tsx"));
function App() {
  return (
    <BrowserRouter basename="/tetris">
      <Routes>
        <Route path="" element={<DefaultLayout />}>
          <Route index element={<HomePage />}></Route>
          <Route path="single">
            <Route index element={<LazySinglePage />}></Route>
          </Route>
          <Route path="room/:roomId">
            <Route index element={<LazyRoomPage />}></Route>
          </Route>
        </Route>
        <Route path="test">
          <Route index element={<LazyTestPage />}></Route>
          <Route path="r3fcli" element={<LazyTestR3fCliPage />}></Route>
        </Route>
        {/* {import.meta.env.VITE_IS_PRD === 'false' && ()} */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
