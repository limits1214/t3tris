
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DefaultLayout from './layout/DefaultLayout.tsx'
import HomePage from './page/HomePage.tsx'
import TestPage from './page/test/TestPage.tsx'
import TestAuthPage from './page/test/TestAuthPage.tsx'
import TestWsPage from './page/test/TestWsPage.tsx'
import TestR3fPage from './page/test/TestR3fPage.tsx'
import SinglePlayPage from './page/SinglePlayPage.tsx'
import RoomPage from './page/RoomPage.tsx'
import TestRapier from './page/test/TestRapier.tsx'
import TestR3fOptPage from './page/test/TestR3fOptPage.tsx'

function App() {
  
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
          <Route path='r3fopt' element={<TestR3fOptPage/>}></Route>
          <Route path='rapier' element={<TestRapier/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
