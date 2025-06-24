/** @jsxImportSource @emotion/react */

import { Outlet } from "react-router-dom"
// import { useAuthStore } from "../store/useAuthStore";
// import { useState } from "react";
// import { type UserInfo } from "../api/user";
// import { Box, Button, } from "@radix-ui/themes";
// import { serverLogout } from "../api/auth";
// import LoginModal from "../component/LoginModal";
import WebSocketInitializer from "../component/WebSocketInitializer";


const DefaultLayout = () => {
  // const {isAuthenticated, accessToken} = useAuthStore();
  // const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  // useEffect(() => {
  //   if (isAuthenticated && accessToken) {
  //     const fetch = async () => {
  //       const userInfo = await getUserInfo(accessToken);
  //       console.log(userInfo)
  //       setUserInfo(userInfo);
  //     }
  //     fetch();
  //   } else {
  //     setUserInfo(null)
  //   }
  // }, [isAuthenticated, accessToken])
  return (
    <>
      <WebSocketInitializer/>
      <Outlet/>
    </>
  )
  // return (
  //   <Flex direction="column">
  //     <Flex direction="row" justify="between">
  //       <Flex>
  //         <HamburgerMenuIcon/>
  //       </Flex>
  //       <Flex>
  //         {isAuthenticated ? (
  //           <div> 
  //             <Authenticated userInfo={userInfo}/>
  //           </div>
  //         ) : (
  //           <div>
  //             {/* <Button>로그인</Button> */}
  //             <NotAuthenticated/>
  //           </div>
  //         )}
  //       </Flex>
  //     </Flex>
  //     <Box>
  //       <Outlet/>
  //     </Box>
  //     {/* <Flex direction="column">
        
  //     </Flex> */}
  //   </Flex>
  // )
}

export default DefaultLayout

// const Authenticated = ({userInfo}:{userInfo: UserInfo | null}) => {
//   const {logout} = useAuthStore();
//   const handleLogout = async () => {
//     try {
//       await serverLogout();
//       logout();
//     } catch (e) {
//       console.error('e', e);
//     }
//   }
//   return (
//     <div>
//       <span>{userInfo?.nickName}</span>
//       <Button onClick={handleLogout}>로그아웃</Button>
//     </div>
//   )
// }

// const NotAuthenticated = () => {
//   const [isOpen, setIsOpen] = useState(false);
  
//   return (
//     <Box>
//       <Button onClick={()=>setIsOpen(!isOpen)}>로그인</Button>
//       <LoginModal isOpen={isOpen} setIsOpen={setIsOpen} />
//     </Box>
//   )
// }