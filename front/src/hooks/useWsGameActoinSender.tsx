import { useEffect, useState } from "react";
import { useWsStore } from "../store/useWsStore";

const useWsGameActoinSender = () => {
  const send = useWsStore(s=>s.send);

  type InputType = 'press' | 'release';
  type ActionType = 'left' | 'right' | 'rotateLeft' | 'rotateRight' | 'hardDrop' | 'softDrop';
  const sendGameAction = (input: InputType, action: ActionType, gameId: string) => {
    const obj = {
      type: 'gameAction',
      data: {
        input, action, gameId
      }
    }
    send(JSON.stringify(obj))
  }

  return {
    pressLeft: (gameId: string) => sendGameAction("press", "left", gameId),
    pressRight: (gameId: string) => sendGameAction("press", "right", gameId),
    pressRotateLeft: (gameId: string) => sendGameAction("press", "rotateLeft", gameId),
    pressRotateRight: (gameId: string) => sendGameAction("press", "rotateRight", gameId),
    pressSoftDrop: (gameId: string) => sendGameAction("press", "softDrop", gameId),
    pressHardDrop: (gameId: string) => sendGameAction("press", "hardDrop", gameId),
    
    releaseLeft: (gameId: string) => sendGameAction("release", "left", gameId),
    releaseRight: (gameId: string) => sendGameAction("release", "right", gameId),
    releaseRotateLeft: (gameId: string) => sendGameAction("release", "rotateLeft", gameId),
    releaseRotateRight: (gameId: string) => sendGameAction("release", "rotateRight", gameId),
    releaseSoftDrop: (gameId: string) => sendGameAction("release", "softDrop", gameId),
    releaseHardDrop: (gameId: string) => sendGameAction("release", "hardDrop", gameId),
  };
}

export default useWsGameActoinSender

 /*
   * ['w', 'a', 's', 'd']
   * ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',]
   * [' ']
   */ 
export const useKeyboardActionSender = () => {
  const {
    pressLeft, pressRight, pressRotateLeft, pressRotateRight, pressHardDrop, pressSoftDrop,
    // releaseLeft, releaseRight, releaseRotateLeft, releaseRotateRight, releaseHardDrop, releaseSoftDrop
  } = useWsGameActoinSender();

  const [gameId, setGameId] =  useState<string | null>(null);
 
  const keydown = (e: KeyboardEvent) => {
    console.log('kd', gameId)
    if (gameId) {
      switch (e.key) {
        case 'a':
        case 'ArrowLeft':
          pressLeft(gameId);
          break;
        case 'd':
        case 'ArrowRight':
          pressRight(gameId);
          break;
        case 'w':
        case 'ArrowUp':
          pressRotateRight(gameId);
          break;
        case 'z':
          pressRotateLeft(gameId);
          break;
        case 's':
        case 'ArrowDown':
          pressSoftDrop(gameId);
          break;
        case ' ':
          pressHardDrop(gameId);
          break;
        default:
          break;
      }
    }
  };

  // const keyup = (e: KeyboardEvent) => {
  //   switch (e.key) {
  //     case 'a':
  //     case 'ArrowLeft':
  //       releaseLeft();
  //       break;
  //     case 'd':
  //     case 'ArrowRight':
  //       releaseRight();
  //       break;
  //     case 'w':
  //     case 'ArrowUp':
  //       releaseRotateRight();
  //       break;
  //     case 'z':
  //       releaseRotateLeft();
  //       break;
  //     case 's':
  //     case 'ArrowDown':
  //       releaseSoftDrop();
  //       break;
  //     case ' ':
  //       releaseHardDrop();
  //       break;
  //     default:
  //       break;
  //   }
  // };

  useEffect(() => {
    window.addEventListener("keydown", keydown);
    // window.addEventListener("keyup", keyup);
    return () => {
      window.removeEventListener("keydown", keydown);
      // window.removeEventListener("keyup", keyup)
    }
  }, [gameId])
  
  return setGameId;
}