use std::ops::ControlFlow;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        Path, WebSocketUpgrade,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use axum_extra::extract::CookieJar;
use futures::StreamExt;

use crate::app::state::ArcAppState;

pub fn test_ws_router(_state: ArcAppState) -> Router<ArcAppState> {
    Router::new().route("/ws/test/{id}", get(test_ws_upgrade))
}

pub async fn test_ws_upgrade(
    ws: WebSocketUpgrade,
    jar: CookieJar,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        let res = test_ws(socket, id).await;
        if let Err(err) = res {
            tracing::info!("test_ws_upgrade, err: {err:?}");
        }
    })
}

pub async fn test_ws(socket: WebSocket, id: i32) -> anyhow::Result<()> {
    tracing::info!("test_ws context start");

    // ws
    let (mut sender, mut receiver) = socket.split();

    // Spawn a task that will push several messages to the client (does not matter what client does)
    // let mut send_task = tokio::spawn(async move {
    //     let n_msg = 20;
    //     for i in 0..n_msg {
    //         // In case of any websocket error, we exit.
    //         if sender
    //             .send(Message::Text(format!("Server message {i} ...").into()))
    //             .await
    //             .is_err()
    //         {
    //             return i;
    //         }

    //         tokio::time::sleep(std::time::Duration::from_millis(300)).await;
    //     }

    //     println!("Sending close to ...");
    //     if let Err(e) = sender
    //         .send(Message::Close(Some(CloseFrame {
    //             code: axum::extract::ws::close_code::NORMAL,
    //             reason: Utf8Bytes::from_static("Goodbye"),
    //         })))
    //         .await
    //     {
    //         println!("Could not send Close due to {e}, probably it is ok?");
    //     }
    //     n_msg
    // });

    // This second task will receive messages from client and print them on server console
    let mut recv_task = tokio::spawn(async move {
        let mut cnt = 0;
        while let Some(Ok(msg)) = receiver.next().await {
            cnt += 1;
            // print message and break if instructed to do so
            if process_message(msg).is_break() {
                break;
            }
        }
        cnt
    });

    // If any one of the tasks exit, abort the other.
    tokio::select! {
        // rv_a = (&mut send_task) => {
        //     match rv_a {
        //         Ok(a) => println!("{a} messages sent to "),
        //         Err(a) => println!("Error sending messages {a:?}")
        //     }
        //     recv_task.abort();
        // },
        rv_b = (&mut recv_task) => {
            match rv_b {
                Ok(b) => println!("Received {b} messages"),
                Err(b) => println!("Error receiving messages {b:?}")
            }
            // send_task.abort();
        }
    }
    tracing::info!("Websocket context destroyed");
    Ok(())
}

/// helper to print contents of messages to stdout. Has special treatment for Close.
fn process_message(msg: Message) -> ControlFlow<(), ()> {
    match msg {
        Message::Text(t) => {
            println!(">>>  sent str: {t:?}");
        }
        Message::Binary(d) => {
            println!(">>> sent {} bytes: {d:?}", d.len());
        }
        Message::Close(c) => {
            if let Some(cf) = c {
                println!(
                    ">>>  sent close with code {} and reason `{}`",
                    cf.code, cf.reason
                );
            } else {
                println!(">>> somehow sent close message without CloseFrame");
            }
            return ControlFlow::Break(());
        }

        Message::Pong(v) => {
            println!(">>>  sent pong with {v:?}");
        }
        // You should never need to manually handle Message::Ping, as axum's websocket library
        // will do so for you automagically by replying with Pong and copying the v according to
        // spec. But if you need the contents of the pings you can see them here.
        Message::Ping(v) => {
            println!(">>>  sent ping with {v:?}");
        }
    }
    ControlFlow::Continue(())
}
