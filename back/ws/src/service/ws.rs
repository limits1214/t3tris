use std::collections::HashSet;

use redis::AsyncCommands;

use crate::model::{WsConnUserId, WsConnWsId, WsRecvCtx, ws_msg::ServerToClientWsMsg};

pub async fn create_ws_conn_user(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    let mut rconn = ctx.rpool.get().await?;

    // 해당 user_id가 존재하는데
    // user_id가 있으면 ws_id에 ws_id push 하고 전송
    // user_id가 없으면 새로만들어서 전송

    let ws_conn_user_id_str = rconn
        .get::<String, Option<String>>(format!("ws_conn:user_id:{}", ctx.user_id))
        .await?;

    if let Some(ws_conn_user_id_str) = ws_conn_user_id_str {
        let mut ws_conn_user_id = serde_json::from_str::<WsConnUserId>(&ws_conn_user_id_str)?;
        ws_conn_user_id.ws_ids.insert(ctx.ws_id.to_string());
        let new_ws_conn_user_id_str = serde_json::to_string(&ws_conn_user_id)?;
        rconn
            .set::<String, String, ()>(
                format!("ws_conn:user_id:{}", ctx.user_id),
                new_ws_conn_user_id_str,
            )
            .await?;
    } else {
        let ws_conn_user_id = WsConnUserId {
            user_id: ctx.user_id.to_string(),
            ws_ids: vec![ctx.ws_id.to_string()].into_iter().map(|s| s).collect(),
        };
        let new_ws_conn_user_id_str = serde_json::to_string(&ws_conn_user_id)?;
        rconn
            .set::<String, String, ()>(
                format!("ws_conn:user_id:{}", ctx.user_id),
                new_ws_conn_user_id_str,
            )
            .await?;
    }

    // ws_id 만들어서 전송
    let ws_conn_ws_id = WsConnWsId {
        ws_id: ctx.ws_id.to_string(),
        user_id: ctx.user_id.to_string(),
        topics: HashSet::new(),
    };
    let ws_conn_ws_id_str = serde_json::to_string(&ws_conn_ws_id)?;
    rconn
        .set::<String, String, ()>(format!("ws_conn:ws_id:{}", ctx.ws_id), ws_conn_ws_id_str)
        .await?;
    Ok(())
}

pub async fn get_ws_conn_ws_id(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<Option<WsConnWsId>> {
    let mut rconn = ctx.rpool.get().await?;

    let key = format!("ws_conn:ws_id:{}", ctx.ws_id);
    let ws_conn_ws_id_str = rconn.get::<&str, Option<String>>(&key).await?;
    if let Some(ws_conn_ws_id_str) = ws_conn_ws_id_str {
        let ws_conn_ws_id = serde_json::from_str::<WsConnWsId>(&ws_conn_ws_id_str)?;
        Ok(Some(ws_conn_ws_id))
    } else {
        Ok(None)
    }
}

pub async fn ws_conn_ws_id_topic_add(ctx: &mut WsRecvCtx<'_>, topic: &str) -> anyhow::Result<()> {
    let mut rconn = ctx.rpool.get().await?;
    let key = format!("ws_conn:ws_id:{}", ctx.ws_id);
    let ws_conn_ws_id_str = rconn.get::<&str, Option<String>>(&key).await?;
    if let Some(ws_conn_ws_id_str) = ws_conn_ws_id_str {
        let mut ws_conn_ws_id = serde_json::from_str::<WsConnWsId>(&ws_conn_ws_id_str)?;
        ws_conn_ws_id.topics.insert(topic.to_string());
        let new_ws_conn_ws_id_str = serde_json::to_string(&ws_conn_ws_id)?;
        rconn
            .set::<&str, String, ()>(&key, new_ws_conn_ws_id_str)
            .await?;
    }
    Ok(())
}

pub async fn ws_conn_ws_id_topic_del(ctx: &mut WsRecvCtx<'_>, topic: &str) -> anyhow::Result<()> {
    let mut rconn = ctx.rpool.get().await?;
    let key = format!("ws_conn:ws_id:{}", ctx.ws_id);
    let ws_conn_ws_id_str = rconn.get::<&str, Option<String>>(&key).await?;
    if let Some(ws_conn_ws_id_str) = ws_conn_ws_id_str {
        let mut ws_conn_ws_id = serde_json::from_str::<WsConnWsId>(&ws_conn_ws_id_str)?;
        ws_conn_ws_id.topics.remove(topic);
        let new_ws_conn_ws_id_str = serde_json::to_string(&ws_conn_ws_id)?;
        rconn
            .set::<&str, String, ()>(&key, new_ws_conn_ws_id_str)
            .await?;
    }
    Ok(())
}

pub async fn delete_ws_conn_user(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    // user_id 에 ws_id 에 해당하는거 있으면 지워줌
    // 만약 마지막 ws_id라면 user_id 제거
    let mut rconn = ctx.rpool.get().await?;
    let ws_id_key = format!("ws_conn:ws_id:{}", ctx.ws_id);
    rconn.del::<&str, ()>(&ws_id_key).await?;

    let user_id_key = format!("ws_conn:user_id:{}", ctx.user_id);
    let ws_conn_user_id_str = rconn.get::<&str, Option<String>>(&user_id_key).await?;
    if let Some(ws_conn_user_id_str) = ws_conn_user_id_str {
        let mut ws_conn_user_id = serde_json::from_str::<WsConnUserId>(&ws_conn_user_id_str)?;
        ws_conn_user_id.ws_ids.remove(ctx.ws_id);
        if ws_conn_user_id.ws_ids.is_empty() {
            rconn.del::<&str, ()>(&user_id_key).await?;
        } else {
            let new_ws_conn_user_id_str = serde_json::to_string(&ws_conn_user_id)?;
            rconn
                .set::<&str, String, ()>(&user_id_key, new_ws_conn_user_id_str)
                .await?;
        }
    }
    Ok(())
}

pub async fn ping(ctx: &mut WsRecvCtx<'_>) -> anyhow::Result<()> {
    let server_msg = ServerToClientWsMsg::Pong;
    let server_msg_str = serde_json::to_string(&server_msg)?;
    crate::util::redis::publish(ctx.rpool, &format!("ws_id:{}", ctx.ws_id), &server_msg_str)
        .await?;
    Ok(())
}

pub async fn echo(ctx: &mut WsRecvCtx<'_>, msg: String) -> anyhow::Result<()> {
    let server_msg = ServerToClientWsMsg::Echo { msg: msg };
    let server_msg_str = serde_json::to_string(&server_msg)?;
    crate::util::redis::publish(ctx.rpool, &format!("ws_id:{}", ctx.ws_id), &server_msg_str)
        .await?;
    Ok(())
}

pub async fn topic_echo(ctx: &mut WsRecvCtx<'_>, topic: &str, msg: String) -> anyhow::Result<()> {
    let server_msg = ServerToClientWsMsg::TopicEcho {
        topic: topic.to_owned(),
        msg,
    };
    let server_msg_str = serde_json::to_string(&server_msg)?;
    crate::util::redis::publish(ctx.rpool, &topic, &server_msg_str).await?;
    Ok(())
}

pub async fn subscribe_topic(ctx: &mut WsRecvCtx<'_>, topic: &str) -> anyhow::Result<()> {
    let ws_conn_ws_id = get_ws_conn_ws_id(ctx).await?;
    if let Some(ws_conn_ws_id) = ws_conn_ws_id {
        let has_topic = ws_conn_ws_id.topics.iter().find(|t| *t == topic);
        if has_topic.is_none() {
            ctx.ws_topic.subscribe(topic);
            crate::service::ws::ws_conn_ws_id_topic_add(ctx, &topic).await?;
        }
    }

    Ok(())
}

pub async fn unsubscribe_topic(ctx: &mut WsRecvCtx<'_>, topic: &str) -> anyhow::Result<()> {
    ctx.ws_topic.unsubscribe(topic);
    crate::service::ws::ws_conn_ws_id_topic_del(ctx, &topic).await?;
    Ok(())
}
