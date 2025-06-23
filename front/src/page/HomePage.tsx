/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import { Text, Avatar, Flex, Grid, TextField, Button } from "@radix-ui/themes"

const HomePage = () => {
  return (
    <Flex direction="column" css={css`height: 100vh; padding: 1rem; min-height: 0`}>
      <Flex css={css`border: 1px solid black; flex: 1; `}>
        <Flex css={css`border: 1px solid red; flex: 2.5;`}>
          <LobbyHeader/>
        </Flex>
        <Flex css={css`border: 1px solid red; flex: 1;`}>
          <UserInfo/>
        </Flex>
      </Flex>
      <Flex css={css`border: 1px solid black; flex: 2.5; min-height: 0; `}>
        <Flex css={css`border: 1px solid red; flex: 2.5;`}>
          <RoomList/>
        </Flex>
        <Flex css={css`border: 1px solid red; flex: 1;`}>
          <CurrentUser/>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default HomePage;

const LobbyHeader = () => {
  return (
    <Flex justify="between" css={css`width: 100%`}>
      <Flex css={css`flex: 1;`}>Logo</Flex>
      <Flex direction="column" css={css`flex: 1;`}>
        <Text>방만들기</Text>
      </Flex>
    </Flex>
  );
};

const UserInfo = () => {
  return (
    <Flex direction="row" css={css`flex: 1; padding: 1rem`}>
      <Avatar fallback="A" css={css`flex: 1; height: 100%`}>asdf</Avatar>
      <Flex css={css`flex: 1;`} direction="column" align="center" justify="center">
        <Text>#asdfasdf</Text>
        <Text>별명: ㅁㅁㅁ</Text>
        <Text>승률: 1%</Text>
      </Flex>
    </Flex>
  );
};

const RoomList = () => {
  return (
    <Flex direction="column" css={css`padding: 1rem; width:100%;`}>
      <Flex css={css`border: 1px solid black; flex: 1; width: 100%;`} justify="between">
        <Flex  css={css`flex: 1;`}>
          <Text>sort1</Text>
          <Text>sort2</Text>
          <Text>sort3</Text>
        </Flex>
        <Flex css={css`flex: 1;`}>
          <Text>공지</Text>
        </Flex>
      </Flex>
      <Flex direction="column" css={css`border: 1px solid black; flex: 10; padding: 1rem;`} overflowY={"auto"}>
        <Grid rows="2" columns="2">
          <RoomListItem/>
          <RoomListItem/>
          <RoomListItem/>
          <RoomListItem/>
          <RoomListItem/>
        </Grid>
      </Flex>
    </Flex>
  );
};

const RoomListItem = () => {
  return (
    <Flex direction="column" css={css`border: 1px solid black; flex: 1;`}>
      <Flex>
        <Text>001</Text>
        <Text>방제목방제목</Text>
      </Flex>
      <Flex>
        <Text>대기중</Text>
        <Text>노템전</Text>
        <Text>개인전</Text>
      </Flex>
    </Flex>
  )
}

const CurrentUser = () => {
  return (
    <Flex direction="column" css={css`width: 100%;`}>
      <Text >접속자</Text>

      <Flex direction="column" css={css`flex: 1; border: 1px solid black;`}>
        <Flex>
          <Text>닉</Text><Text>등급</Text>
        </Flex>
        <Flex>
          <Text>닉</Text><Text>등급</Text>
        </Flex>
        <Flex>
          <Text>닉</Text><Text>등급</Text>
        </Flex>
      </Flex>

      
      <Flex direction="column" css={css`flex: 1; border: 1px solid black;`}>
        <Flex direction="column" css={css`flex: 1;`} >
          <Flex>Msg1</Flex>
          <Flex>Msg2</Flex>
        </Flex>
        <Flex>
          <TextField.Root css={css`flex: 1;`} />
          <Button css={css``}>보내기</Button>
        </Flex>
      </Flex>

    </Flex>
  );
}