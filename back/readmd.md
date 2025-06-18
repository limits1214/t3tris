ws


ws_conn:user_id:<user_id>

ws_conn:ws_id:<ws_id>


room

host 는방장
users 는 방 참가자




room:<room_id>:info
<json>
room info
{
    host: <ws_id>
    users: [{},{},{}],
    
}

room:<room_id>:chats
<redis list,  json>
room chats{
    
}

room:<room_id>:events
<redis list,  json>
room even
{

}

방생성
방제거(방제거는 마지막 사람이 나가면)

유저 입장
유저 퇴장

호스트 변경

방 전부 나갈시 파괴

채팅