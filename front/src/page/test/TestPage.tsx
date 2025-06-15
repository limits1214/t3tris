import { Link } from "react-router-dom"

const TestPage = () => {
  return (
    <div>
      <div>
        <Link to={"/"}>Home</Link>
      </div>
      <br />
      <div>
        <Link to={"/test/auth"}>TestAuthPage</Link>
      </div>
      <div>
        <Link to={"/test/ws"}>TestWsPage</Link>
      </div>
      <div>
        <Link to={"/test/r3f"}>TestR3fPage</Link>
      </div>
    </div>
  )
}

export default TestPage