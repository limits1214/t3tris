
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DefaultLayout from './layout/DefaultLayout.tsx'
import HomePage from './page/HomePage.tsx'
import SinglePlayPage from './page/SinglePlayPage.tsx'
// import RoomPage from './page/RoomPage.tsx'
import React from 'react'

const LazyRoomPage = React.lazy(() => import('./page/RoomPage.tsx'));

const LazyTestPage = React.lazy(() => import('./page/test/TestPage.tsx'));
const LazyTestAuthPage = React.lazy(() => import('./page/test/TestAuthPage.tsx'));
const LazyTestWsPage = React.lazy(() => import('./page/test/TestWsPage.tsx'));
const LazyTestR3fOptPage = React.lazy(() => import('./page/test/TestR3fOptPage.tsx'));
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<DefaultLayout/>}>
          <Route index element={<HomePage/>}></Route>
          <Route path="room/:roomId">
            <Route index element={
              <LazyRoomPage/>
            }></Route>
          </Route>
          <Route path='singleplay' element={<SinglePlayPage/>}></Route>
        </Route>
        

       
        <Route path='test'>
          <Route index element={<LazyTestPage/>}></Route>
          <Route path='auth' element={<LazyTestAuthPage/>}></Route>
          <Route path='ws' element={<LazyTestWsPage/>}></Route>
          <Route path='r3fopt' element={<LazyTestR3fOptPage/>}></Route>
        </Route>
        {/* {import.meta.env.VITE_IS_PRD === 'false' && ()} */}
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
