
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DefaultLayout from './layout/DefaultLayout.tsx'
import HomePage from './page/HomePage.tsx'
import TestPage from './page/test/TestPage.tsx'
import TestAuthPage from './page/test/TestAuthPage.tsx'
import TestWsPage from './page/test/TestWsPage.tsx'
import TestR3fPage from './page/test/TestR3fPage.tsx'
import { useAuthStore } from './store/useAuthStore.ts'
import { useEffect } from 'react'
import { tokenRefresh } from './api/auth.ts'
import SinglePlayPage from './page/SinglePlayPage.tsx'
import RoomPage from './page/RoomPage.tsx'
import TestPixiPage from './page/test/TestPixiPage.tsx'

function App() {
  const {isInitialRefreshDone, setIsInitialRefeshDone, setAuth} = useAuthStore();
  
  useEffect(() => {
    (async() => {
      try {
        const token = await tokenRefresh();
        setAuth(token);
      } catch (e) {
        console.error(e);
      }
      setIsInitialRefeshDone();
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isInitialRefreshDone) {
    return <></>
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<DefaultLayout/>}>
          <Route index element={<HomePage/>}></Route>
          <Route path="room/:roomId">
            <Route index element={<RoomPage/>}></Route>
          </Route>
          <Route path='singleplay' element={<SinglePlayPage/>}></Route>
          
        </Route>
        <Route path='test'>
          <Route index element={<TestPage/>}></Route>
          <Route path='auth' element={<TestAuthPage/>}></Route>
          <Route path='ws' element={<TestWsPage/>}></Route>
          <Route path='r3f' element={<TestR3fPage/>}></Route>
          <Route path='pixi' element={<TestPixiPage/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
