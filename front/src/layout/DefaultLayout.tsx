import { Outlet } from "react-router-dom"


const DefaultLayout = () => {
  return (
    <div>
      <Outlet></Outlet>
    </div>
  )
}

export default DefaultLayout