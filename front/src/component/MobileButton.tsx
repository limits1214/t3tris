/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Button, Flex } from "@radix-ui/themes";
import { useEffect, useRef } from "react";

export const MobileButton = () => {
  const dispatch = (key: string, keyEvent: string) => {
    const event = new KeyboardEvent(keyEvent, {
      key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const moveRightKeydownDispatch = () => {
    dispatch("ArrowRight", "keydown");
  };

  const moveRightKeyupDispatch = () => {
    dispatch("ArrowRight", "keyup");
  };

  const moveLeftKeydownDispatch = () => {
    dispatch("ArrowLeft", "keydown");
  };

  const moveLeftKeyupDispatch = () => {
    dispatch("ArrowLeft", "keyup");
  };

  const rotateRightKeydownDispatch = () => {
    dispatch("w", "keydown");
  };

  const rotateRightKeyupDispatch = () => {
    dispatch("w", "keyup");
  };

  const rotateLeftKeydownDispatch = () => {
    dispatch("z", "keydown");
  };

  const rotateLeftKeyupDispatch = () => {
    dispatch("z", "keyup");
  };

  const softDropKeydownDispatch = () => {
    dispatch("ArrowDown", "keydown");
  };

  const softDropKeyupDispatch = () => {
    dispatch("ArrowDown", "keyup");
  };

  const hardDropKeydownDispatch = () => {
    dispatch(" ", "keydown");
  };

  const hardDropKeyupDispatch = () => {
    dispatch(" ", "keyup");
  };

  const holdKeydownDispatch = () => {
    dispatch("Shift", "keydown");
  };

  const holdKeyupDispatch = () => {
    dispatch("Shift", "keyup");
  };

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent zoom
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);
  return (
    <Flex
      ref={ref}
      direction="column"
      css={css`
        /* position: absolute; */
        /* width: 50wh; */
        /* max-width: 100dvw; */
        /* transform: translate(-50%, 0%); */
        /* bottom: 0%; */
        /* left: 50%; */

        display: none;
        border: 1px solid black;
        border-radius: 30px;
        padding: 0.5rem;
        @media (max-width: 768px) {
          display: block;
        }
      `}
    >
      <Flex>
        <Flex
          css={css`
            align-items: center;
            margin: 0.5rem;
          `}
        >
          {/* Hold */}
          <Button
            onPointerDown={holdKeydownDispatch}
            onPointerUp={holdKeyupDispatch}
            onPointerCancel={holdKeyupDispatch}
            onPointerLeave={holdKeyupDispatch}
            variant="classic"
            css={css`
              padding: 1.5rem;
              height: 100%;
            `}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Button>
        </Flex>
        <Flex direction="column" css={css``}>
          <Flex
            css={css`
              justify-content: space-between;
              margin-bottom: 0.5rem;
            `}
          >
            {/* rotateLeft */}
            <Button
              onPointerDown={rotateLeftKeydownDispatch}
              onPointerUp={rotateLeftKeyupDispatch}
              onPointerCancel={rotateLeftKeyupDispatch}
              onPointerLeave={rotateLeftKeyupDispatch}
              variant="classic"
              css={css`
                padding: 1.5rem;
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.3536 11.3536C11.5488 11.1583 11.5488 10.8417 11.3536 10.6465L4.70711 4L9 4C9.27614 4 9.5 3.77614 9.5 3.5C9.5 3.22386 9.27614 3 9 3L3.5 3C3.36739 3 3.24021 3.05268 3.14645 3.14645C3.05268 3.24022 3 3.36739 3 3.5L3 9.00001C3 9.27615 3.22386 9.50001 3.5 9.50001C3.77614 9.50001 4 9.27615 4 9.00001V4.70711L10.6464 11.3536C10.8417 11.5488 11.1583 11.5488 11.3536 11.3536Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>

            {/* rotateRight */}
            <Button
              onPointerDown={rotateRightKeydownDispatch}
              onPointerUp={rotateRightKeyupDispatch}
              onPointerCancel={rotateRightKeyupDispatch}
              onPointerLeave={rotateRightKeyupDispatch}
              variant="classic"
              css={css`
                padding: 1.5rem;
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </Flex>
          <Flex>
            {/* moveLeft */}
            <Button
              onPointerDown={moveLeftKeydownDispatch}
              onPointerUp={moveLeftKeyupDispatch}
              onPointerCancel={moveLeftKeyupDispatch}
              onPointerLeave={moveLeftKeyupDispatch}
              variant="classic"
              css={css`
                margin-right: 0.5rem;
                padding: 1.5rem;
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>

            {/* softDrop */}
            <Button
              onPointerDown={softDropKeydownDispatch}
              onPointerUp={softDropKeyupDispatch}
              onPointerCancel={softDropKeyupDispatch}
              onPointerLeave={softDropKeyupDispatch}
              variant="classic"
              css={css`
                padding: 1.5rem;
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>

            {/* moveRight */}
            <Button
              onPointerDown={moveRightKeydownDispatch}
              onPointerUp={moveRightKeyupDispatch}
              onPointerCancel={moveRightKeyupDispatch}
              onPointerLeave={moveRightKeyupDispatch}
              variant="classic"
              css={css`
                margin-left: 0.5rem;
                padding: 1.5rem;
              `}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </Flex>
        </Flex>

        <Flex
          css={css`
            align-items: center;
            margin: 0.5rem;
          `}
        >
          {/* hardDrop */}
          <Button
            onPointerDown={hardDropKeydownDispatch}
            onPointerUp={hardDropKeyupDispatch}
            onPointerCancel={hardDropKeyupDispatch}
            onPointerLeave={hardDropKeyupDispatch}
            variant="classic"
            css={css`
              padding: 1.5rem;
              height: 100%;
            `}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.85355 2.14645C3.65829 1.95118 3.34171 1.95118 3.14645 2.14645C2.95118 2.34171 2.95118 2.65829 3.14645 2.85355L7.14645 6.85355C7.34171 7.04882 7.65829 7.04882 7.85355 6.85355L11.8536 2.85355C12.0488 2.65829 12.0488 2.34171 11.8536 2.14645C11.6583 1.95118 11.3417 1.95118 11.1464 2.14645L7.5 5.79289L3.85355 2.14645ZM3.85355 8.14645C3.65829 7.95118 3.34171 7.95118 3.14645 8.14645C2.95118 8.34171 2.95118 8.65829 3.14645 8.85355L7.14645 12.8536C7.34171 13.0488 7.65829 13.0488 7.85355 12.8536L11.8536 8.85355C12.0488 8.65829 12.0488 8.34171 11.8536 8.14645C11.6583 7.95118 11.3417 7.95118 11.1464 8.14645L7.5 11.7929L3.85355 8.14645Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
