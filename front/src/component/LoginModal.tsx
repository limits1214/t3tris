import { Box, Button, Dialog, Flex, TextField, Text } from '@radix-ui/themes'
import { GoogleLoginButton } from 'react-social-login-buttons'
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';
import { guestLogin } from '../api/auth';

const LoginModal = ({isOpen, setIsOpen, loginSuccessCallback}: {isOpen: boolean, setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, loginSuccessCallback?: ()=>void }) => {
  const {setAuth} = useAuthStore();
  const [nickName, setNickName] = useState('');
  const handleGuestLogin = async () =>  {
    if (nickName === '') {
      return;
    }
    try {
      const token = await guestLogin(nickName);
      setAuth(token)
      if (loginSuccessCallback) {
        loginSuccessCallback();
      }
    } catch (e) {
      console.error('e', e);
    }
  }
  return (
    <Dialog.Root open={isOpen} defaultOpen={false} onOpenChange={setIsOpen}>
      <Dialog.Content>
        <Dialog.Title>로그인</Dialog.Title>
        <Dialog.Description>
          <Text>닉네임만으로 게스트로 로그인할수 있습니다.</Text>
          <br/>
          <Text>또는, 소셜로그인 회원으로 가입 할수있습니다.</Text>
        </Dialog.Description>
        <Box>
          <Flex direction="column">
            <TextField.Root radius="none" placeholder="nickName" onChange={e=>setNickName(e.target.value)}></TextField.Root>
            <Flex justify="end">
              <Button onClick={handleGuestLogin}>게스트 로그인</Button>
            </Flex>
          </Flex>
        </Box>
        <Box>
          <Flex justify="center">
            <Text>-OR-</Text>
          </Flex>
        </Box>
        <Box>
          <GoogleLoginButton  onClick={() => {}}/>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default LoginModal