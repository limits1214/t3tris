/** @jsxImportSource @emotion/react */

import { Outlet, useNavigate } from "react-router-dom"
import WebSocketInitializer from "../component/WebSocketInitializer";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { getWsToken, tokenRefresh } from "../api/auth";
import { useWsStore } from "../store/useWsStore";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { ReadyState } from "react-use-websocket";
import { readyStateString } from "../util/ws";

const DefaultLayout = () => {
  const isInitialRefreshDone = useAuthStore(s=>s.isInitialRefreshDone);
  const setIsInitialRefeshDone = useAuthStore(s=>s.setIsInitialRefeshDone);
  const setAuth = useAuthStore(s=>s.setAuth);
  
  useEffect(() => {
    (async() => {
      try {
        const token = await tokenRefresh();
        setAuth(token);
      } catch (e) {
        console.error(e);
      }
      setIsInitialRefeshDone();
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const readyState = useWsStore(s=>s.readyState);

  if (!isInitialRefreshDone) {
    return <></>
  }
  
  return (
    <>
      <WebSocketInitializer/>
      <WsDisconnectedDiaglog readyState={readyState} />
      <Outlet/>
    </>
  )
}

export default DefaultLayout



const WsDisconnectedDiaglog = ({readyState}: {readyState: ReadyState}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    console.log('WsDisconnectedDiaglog, readystate:', readyStateString(readyState))
    if (readyState === ReadyState.CLOSED) {
      navigate('/')
      setOpen(true)
    } else if (readyState === ReadyState.OPEN) {
      setOpen(false)
    }
  }, [readyState])

  const setWsToken = useWsStore(s=>s.setWsToken);

  return <Dialog.Root open={open} onOpenChange={()=>{}}>
    <Dialog.Content maxWidth="450px">
      <Dialog.Title>연결이 끊어졌습니다.</Dialog.Title>
      <Dialog.Description size="2" mb="4">
        재연결 하세요
      </Dialog.Description>

      <Flex direction="column" gap="3">
        
      </Flex>

      <Flex gap="3" mt="4" justify="end">
        <Button variant="soft" onClick={()=>{
          const connect = async () => {
          
            try {
              const wsToken = await getWsToken();
              setWsToken(wsToken)
            } catch (e) {
              console.error(e)
            }
          }
          connect()
        }}>
          재연결
        </Button>
      </Flex>
    </Dialog.Content>
  </Dialog.Root>
}