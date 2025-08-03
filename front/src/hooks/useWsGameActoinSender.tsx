import { useEffect, useRef, useState } from "react";
import { useWsStore } from "../store/useWsStore";

const useWsGameActoinSender = () => {
  const send = useWsStore(s=>s.send);

  type InputType = 'press' | 'release';
  type ActionType = 'left' | 'right' | 'rotateLeft' | 'rotateRight' | 'hardDrop' | 'softDrop' | "hold";
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
    pressHold: (gameId: string) => sendGameAction("press", "hold", gameId),
    
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
    pressLeft, pressRight, pressRotateLeft, pressRotateRight, pressHardDrop, pressSoftDrop, pressHold,
    // releaseLeft, releaseRight, releaseRotateLeft, releaseRotateRight, releaseHardDrop, releaseSoftDrop
  } = useWsGameActoinSender();

  const [gameId, setGameId] =  useState<string | null>(null);

  const moveLRSet = useRef<Set<"left"|"right">>(new Set());
  const moveLInterval = useRef<number>(null);
  const moveRInterval = useRef<number>(null);
  const moveLTimeout = useRef<number>(null);
  const moveRTimeout = useRef<number>(null);

  const softDropInterval = useRef<number>(null);
  const rotating = useRef(false);
 
  const keydown = (e: KeyboardEvent) => {
    if (gameId) {
      switch (e.key) {
        case 'a':
        case 'ArrowLeft':
          if (moveLRSet.current.has("left")) {
            return;
          }
          moveLRSet.current.add("left")
          if (moveLInterval.current) {
            window.clearInterval(moveLInterval.current)
          }
          if (moveLTimeout.current) {
            window.clearTimeout(moveLTimeout.current)
          }
          moveLTimeout.current = window.setTimeout(()=>{
            pressLeft(gameId);
            moveLInterval.current = window.setInterval(()=>{
              const lr = [...moveLRSet.current];
              const size = moveLRSet.current.size - 1
              if (lr[size] === "left") {
                pressLeft(gameId);
              }
            }, 30)
          }, 150)
          pressLeft(gameId);
          break;
        case 'd':
        case 'ArrowRight':
          if (moveLRSet.current.has("right")) {
            return;
          }
          moveLRSet.current.add("right")

          if (moveRInterval.current) {
            window.clearInterval(moveRInterval.current)
          }
          if (moveRTimeout.current) {
            window.clearTimeout(moveRTimeout.current)
          }
          moveRTimeout.current = window.setTimeout(()=>{
            pressRight(gameId);
            moveRInterval.current = window.setInterval(()=>{
              const lr = [...moveLRSet.current];
              const size = moveLRSet.current.size - 1
              if (lr[size] === "right") {
                pressRight(gameId);
              }
            }, 30)
          }, 150)
          pressRight(gameId);
          break;
        case 'w':
        case 'ArrowUp':
          if(rotating.current) {
            return;
          }
          rotating.current = true;
          pressRotateRight(gameId);
          break;
        case 'z':
          if(rotating.current) {
            return;
          }
          rotating.current = true;
          pressRotateLeft(gameId);
          break;
        case 's':
        case 'ArrowDown':
          if (softDropInterval.current) {
            window.clearInterval(softDropInterval.current);
          }
          softDropInterval.current = window.setInterval(()=>{
            pressSoftDrop(gameId);
          }, 50);
          break;
        case ' ':
          pressHardDrop(gameId);
          break;
        case 'Shift':
          pressHold(gameId);
          break;
        default:
          break;
      }
    }
  };

  const keyup = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'a':
      case 'ArrowLeft':
        moveLRSet.current.delete("left")
        if (moveLInterval.current) {
          window.clearInterval(moveLInterval.current);
        }
        if (moveLTimeout.current) {
          window.clearTimeout(moveLTimeout.current)
        }
        break;
      case 'd':
      case 'ArrowRight':
        moveLRSet.current.delete("right")
         if (moveRInterval.current) {
          window.clearInterval(moveRInterval.current);
        }
        if (moveRTimeout.current) {
          window.clearTimeout(moveRTimeout.current)
        }
        break;
      case 'w':
      case 'ArrowUp':
        rotating.current = false;
        break;
      case 'z':
        rotating.current = false;
        break;
      case 's':
      case 'ArrowDown':
        if (softDropInterval.current) {
          window.clearInterval(softDropInterval.current);
        }
        break;
      case ' ':
        break;
      case 'Shift':
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    }
  }, [gameId])
  
  return setGameId;
}