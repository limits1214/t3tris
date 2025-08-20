/** @jsxImportSource @emotion/react */

import { Outlet } from "react-router-dom";
import WebSocketInitializer from "../component/WebSocketInitializer";

const DefaultLayout = () => {
  return (
    <>
      <WebSocketInitializer />
      {/* <WsDisconnectedDiaglog readyState={readyState} /> */}
      <Outlet />
    </>
  );
};

export default DefaultLayout;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const WsDisconnectedDiaglog = ({ readyState }: { readyState: ReadyState }) => {
//   const navigate = useNavigate();
//   const [open, setOpen] = useState(false);
//   useEffect(() => {
//     console.log(
//       "WsDisconnectedDiaglog, readystate:",
//       readyStateString(readyState)
//     );
//     if (readyState === ReadyState.CLOSED) {
//       navigate("/");
//       setOpen(true);
//     } else if (readyState === ReadyState.OPEN) {
//       setOpen(false);
//     }
//   }, [readyState]);

//   const setWsToken = useWsStore((s) => s.setWsToken);

//   return (
//     <Dialog.Root open={open} onOpenChange={() => {}}>
//       <Dialog.Content maxWidth="450px">
//         <Dialog.Title>연결이 끊어졌습니다.</Dialog.Title>
//         <Dialog.Description size="2" mb="4">
//           재연결 하세요
//         </Dialog.Description>

//         <Flex direction="column" gap="3"></Flex>

//         <Flex gap="3" mt="4" justify="end">
//           <Button
//             variant="soft"
//             onClick={() => {
//               const connect = async () => {
//                 try {
//                   const wsToken = await getWsToken();
//                   setWsToken(wsToken);
//                 } catch (e) {
//                   console.error(e);
//                 }
//               };
//               connect();
//             }}
//           >
//             재연결
//           </Button>
//         </Flex>
//       </Dialog.Content>
//     </Dialog.Root>
//   );
// };
