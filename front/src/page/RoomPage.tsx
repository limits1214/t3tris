/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Button, Flex, Grid, Text, TextField } from "@radix-ui/themes"

const RoomPage = () => {
  return (
    <Flex direction="column" css={css`height: 100vh; padding: 1rem;`}>
      <Header/>
      <Flex css={css`height: 100%;`}>
        <OtherBoard/>
        <MyBoard/>
        <Infomation/>
      </Flex>
    </Flex>
  )
}

export default RoomPage

const Header = () => {
  return (
    <Flex>
      <Text>방제목11</Text>
    </Flex>
  )
}

const OtherBoard = () => {
  return (
    <Flex css={css`flex: 2; border: 1px solid black;`}>
      <Grid  columns="auto"
        rows="2"
        flow="column"
        
        >
        <Board/>
        <Board/>
        <Board/>
        <Board/>
        <Board/>
        <Board/>
        <Board/>
        <Board/>
        
      </Grid>
    </Flex>
  )
}


const MyBoard = () => {
  return (
    <Flex css={css`flex: 2; border: 1px solid black;`}>
      <Flex>hold</Flex>
      <Board/>
      <Flex>next</Flex>
    </Flex>
  )
}

const Board = () => {
  return (
    <Flex  css={css`flex:1; border: 1px solid black;`}>sdfsdsdf</Flex>
  )
}

const Infomation = () => {
  return (
    <Flex direction="column" css={css`flex: 1; border: 1px solid black; `}>
      <Flex css={css`flex: 1;`}></Flex>
      <Flex css={css`flex: 1;`}>
        asdfsdf
      </Flex>
      <Flex direction="column" css={css`flex: 2; border: 1px solid black;`}>
        <Flex direction="column" css={css`flex: 1;`} >
          <Flex>Msg1</Flex>
          <Flex>Msg2</Flex>
        </Flex>
        <Flex>
          <TextField.Root css={css`flex: 1;`} />
          <Button css={css``}>보내기</Button>
        </Flex>
      </Flex>
      <Flex css={css`flex: 1;`}>
        초대
      </Flex>
    </Flex>
  )
}

