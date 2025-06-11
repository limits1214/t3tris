import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DefaultLayout from './layout/DefaultLayout.tsx'
import HomePage from './page/HomePage.tsx'
import 'normalize.css'
import TestPage from './page/TestPage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout/>}>
          <Route index element={<HomePage/>}></Route>
        </Route>
        <Route path='/test'>
          <Route index element={<TestPage/>}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
