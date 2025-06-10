import { Link } from "react-router-dom"

const HomePage = () => {
  return <div>
    HomePage
    <Link to={"/test"}>testpage</Link>
  </div>
}

export default HomePage