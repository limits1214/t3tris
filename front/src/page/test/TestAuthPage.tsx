import { Link } from "react-router-dom"
import { useAuthStore } from "../../store/useAuthStore";
import { useState } from "react";
import { guestLogin, serverLogout, tokenRefresh } from "../../api/auth";
import { testCheckBeforeFetch, testOptionalSecureFetch, testSecureFetch } from "../../api/test";

const TestAuthPage = () => {
  return (
    <div>
      <div>
        <h1>TestAuthPage</h1>
        <Link to={"/test"} >Back</Link>
      </div>
      <AuthState/>
      <hr />
      <Logout/>
      <TokenRefresh/>
      <GuestLogin/>
      <EmailSignup/>
      <EmailLogin/>
      <GoogleLogin/>
      <SecureFetch/>
      <TestError/>
    </div>
  )
}

export default TestAuthPage

const GoogleLogin = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const googleLogin = () => {
    location.href = `${apiUrl}/api/auth/google/login`
  }
  return (
    <div>
      <h4>google login</h4>
      <button onClick={googleLogin}>login</button>
    </div>
  )
}

const EmailSignup = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const {setAuth} = useAuthStore();
  const [nickName, setNickName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const signup = async () => {
    try {
      const url = `${apiUrl}/api/auth/email/signup`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          nickName, email, pw
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const resJson = await res.json();
      setAuth(resJson.data.accessToken)
    } catch (e) {
      console.error('e', e);
    }
  }
  return (
    <div>
      <h4>Email Signup</h4>
      <label htmlFor="">nickname</label>
      <input type="text" onChange={e=>setNickName(e.target.value)}/>
      <label htmlFor="">email</label>
      <input type="email" onChange={e=>setEmail(e.target.value)}/>
      <label htmlFor="">password</label>
      <input type="password" onChange={e=>setPw(e.target.value)}/>
      <button onClick={signup}>singup</button>
    </div>
  )
}

const EmailLogin = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const {setAuth} = useAuthStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const emailLogin = async () => {
    try {
      const url = `${apiUrl}/api/auth/email/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          email, pw
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

     const resJson = await res.json();
      setAuth(resJson.data.accessToken)

    } catch (e) {
      console.error('e', e);
    }
  }
  return (
    <div>
      <h4>email login</h4>
      <input type="email" onChange={e=>setEmail(e.target.value)} />
      <input type="password" onChange={e=>setPw(e.target.value)} />
      <button onClick={emailLogin}>login</button>
    </div>
  )
}

const GuestLogin = () => {
  const {setAuth} = useAuthStore();
  const [nickName, setNickName] = useState('');
  const login = async () => {
    if (nickName === '') {
      return;
    }
    try {
      const token = await guestLogin(nickName);
      setAuth(token)
    } catch (e) {
      console.error('e', e);
    }
  } 
  return (
    <div>
      <h4>Guest Login</h4>
      <input type="text" onChange={e=>setNickName(e.target.value)}/>
      <button onClick={login}>login</button>
    </div>
  )
}

const Logout = () => {
  const {setAuth} = useAuthStore();
  const logout = async () => {
    try {
      await serverLogout();
      setAuth(null);
    } catch (e) {
      console.error('e', e);
    }
  }
  return (
    <div>
      <h4>logout</h4>
      <button onClick={logout}>logout</button>
    </div>
  )
}

const TokenRefresh = () => {
  const {setAuth} = useAuthStore();
  const refresh = async () => {
    const token = await tokenRefresh();
    setAuth(token)
  }
  return (
    <div>
      <h4>TokenRefresh</h4>
      <button onClick={refresh}>refresh</button>
    </div>
  )
}


const AuthState = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const {accessToken, isAuthenticated} = useAuthStore();
  return (
    <div>
      <h4>AuthState</h4>
      <p>apiUrl: {apiUrl}</p>
      <p>isAuthenticated: {JSON.stringify(isAuthenticated)}</p>
      <p>accessTokn: {JSON.stringify(accessToken)}</p>
    </div>
  )
}

const SecureFetch = () => {
  // const {accessToken, setAuth} = useAuthStore();
  const chcek = async () => {
    await testSecureFetch();
  }

  const optionalCheck = async () => {
    await testOptionalSecureFetch();
  }
  const expCheckBeforeFetch = async () => {
    await testCheckBeforeFetch();
  }
  return (
    <div>
      <h4>SecureFetch</h4>
      <button onClick={chcek}>check</button>
      <button onClick={optionalCheck}>optional check</button>
      <button onClick={expCheckBeforeFetch}>expCheckBeforeFetch</button>
    </div>
  )
}

const TestError = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const err = async () => {
    
    const res = await fetch(`${apiUrl}/api/test/error`, {
      method: 'GET'
    });
    console.log('status: ',res.status);
    console.log('statusText: ', res.statusText);
    console.log('header: ', res.headers);

    const j = await res.json();
    console.log('json: ', j)
  }
  return (
    <div>
      <h4>TestError</h4>
      <button onClick={err}>error</button>
    </div>
  )
}