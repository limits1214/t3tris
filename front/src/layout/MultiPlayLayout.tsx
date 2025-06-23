import WebSocketInitializer from '../component/WebSocketInitializer'
import { Outlet } from 'react-router-dom'

const MultiPlayLayout = () => {
  return (
    <>
      <WebSocketInitializer/>
      <Outlet/>
    </>
  )
}

export default MultiPlayLayout