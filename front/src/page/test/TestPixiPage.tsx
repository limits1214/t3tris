import {Application, extend, useTick, } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useRef } from 'react';

extend({
  Container,
  Graphics,
  Text,
})


const CELL_SIZE = 30; // 각 셀의 크기 (픽셀)
const COLS = 10;
const ROWS = 20;

const TestPixiPage = () => {
 

  return (
    <div>TestPixiPage
      <hr />
      <Application height={CELL_SIZE * ROWS} width={CELL_SIZE * COLS} background={0xBFBFBF}>

          <BackGround/>
        <pixiContainer x={150} y={150}>
        <pixiText
          text="Hello World"
          anchor={{ x: 0.5, y: 0.5 }}
          style={{
            fill: 0x000000,
            fontSize: 32,
            fontWeight: 'bold',
          }}
        />
        </pixiContainer>
          {/* <Grid/> */}
          {/* <Component/> */}
      </Application>
    </div>
  )
}

export default TestPixiPage

const BackGround = () => {
  const drawCallback = useCallback((graphics: Graphics)=>{
    graphics.clear();
    graphics.setStrokeStyle({width: 4, color: 0xffffff, pixelLine: true});


    // 세로선
    for (let x = 0; x <= COLS; x++) {
      graphics.moveTo(x * CELL_SIZE, 0);
      graphics.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
    }

    // 가로선
    for (let y = 0; y <= ROWS; y++) {
      graphics.moveTo(0, y * CELL_SIZE);
      graphics.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
    }
    
    graphics.stroke();
  }, [])
  return <pixiContainer>
    <pixiGraphics draw={drawCallback}></pixiGraphics>
  </pixiContainer>
}
const Grid = () => {
  const draw = useCallback((g: Graphics) => {
    g.clear();
    // g.lineStyle(1, 0xffffff, 1);
    g.setStrokeStyle({width: 1, color: '0xffffff'});

    for (let i = 0; i <= 10; i++) {
      g.moveTo(i * 10, 0).lineTo(i * 10, 100);  // vertical
      g.moveTo(0, i * 10).lineTo(100, i * 10);  // horizontal
    }
  }, []);

  return <pixiContainer>
    <pixiGraphics draw={draw} />
  </pixiContainer>
};

const Component = () => {
  const ref = useRef<Container>(null);
   const drawCallback = useCallback((graphics: Graphics)=>{
    graphics.clear();
    graphics.setFillStyle({color: 'red'});
    graphics.rect(0, 0, 10, 10);
    graphics.fill();
  }, [])

  // useTick(delta=>{
  //   if (ref.current) {
      
  //   }
  // })
  return <pixiContainer ref={ref}>
          <pixiGraphics draw={drawCallback}></pixiGraphics>
        </pixiContainer>
}