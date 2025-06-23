/** @jsxImportSource @emotion/react */

import { Box, Button, Flex } from "@radix-ui/themes"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore";
import LoginModal from "../component/LoginModal";
import { useState } from "react";

const HomePage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {isAuthenticated} = useAuthStore();

  const handleMultiPlayRooms =  ()=> {
    if (isAuthenticated) {
      navigate('/multiplay');
    } else {
      setIsOpen(true)
    }
  }
  return (
    <Flex direction="column" justify="center" >
      <Box>
        <Button onClick={()=> navigate('/singleplay')}>싱글</Button>
      </Box>
      <Box>
        <Button onClick={handleMultiPlayRooms}>멀티</Button>
        <LoginModal isOpen={isOpen} setIsOpen={setIsOpen} loginSuccessCallback={() => {
          navigate('/multiplay');
        }}/>
      </Box>
    </Flex>
  )
}

export default HomePage
