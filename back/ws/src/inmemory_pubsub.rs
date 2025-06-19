use std::collections::HashMap;
use tokio::task::JoinHandle;

#[derive(Debug)]
pub enum InMemPubsubCommand<T> {
    Subscribe(
        (
            String,
            tokio::sync::oneshot::Sender<tokio::sync::broadcast::Receiver<T>>,
        ),
    ),
    Cleanup,
    Publish(String, T),
    PrintInfo,
}

pub struct InMemPubsub<T> {
    inner: HashMap<String, tokio::sync::broadcast::Sender<T>>,
}

impl<T> InMemPubsub<T>
where
    T: Send + 'static,
    T: Clone,
    T: std::fmt::Debug,
{
    pub fn init() -> (
        tokio::sync::mpsc::UnboundedSender<InMemPubsubCommand<T>>,
        JoinHandle<()>,
    ) {
        let (s, mut r) = tokio::sync::mpsc::unbounded_channel::<InMemPubsubCommand<T>>();
        let join_handle = tokio::spawn(async move {
            let mut cleanup_timer = tokio::time::interval(std::time::Duration::from_secs(10));
            let mut bus = InMemPubsub::<T>::new();
            loop {
                tokio::select! {
                    msg = r.recv() => {
                        if let Some(msg) = msg{
                            bus.process(msg);
                        } else {
                            // if all unbounded mpsc sender is drop, then this called
                            tracing::warn!("InMemPubsub received None msg, break!");
                            break;
                        }
                    }
                    _ = cleanup_timer.tick() => {
                        bus.cleanup();
                    }
                }
            }
        });
        (s, join_handle)
    }

    fn new() -> Self {
        Self {
            inner: HashMap::new(),
        }
    }

    fn process(&mut self, msg: InMemPubsubCommand<T>) {
        match msg {
            InMemPubsubCommand::Subscribe((topic, return_sender)) => {
                if let Some(broad_sender) = self.inner.get(&topic) {
                    let broad_receiver = broad_sender.subscribe();
                    if let Err(err) = return_sender.send(broad_receiver) {
                        tracing::warn!("Subscribe err: {err:?}");
                    }
                } else {
                    let (s, _) = tokio::sync::broadcast::channel::<T>(16);
                    let r = s.subscribe();
                    self.inner.insert(topic, s);
                    if let Err(err) = return_sender.send(r) {
                        tracing::warn!("Subscribe err: {err:?}");
                    }
                }
            }
            InMemPubsubCommand::Publish(topic, msg) => {
                if let Some(broad_sender) = self.inner.get(&topic) {
                    if let Err(err) = broad_sender.send(msg) {
                        tracing::warn!("Publish {err:?}");
                    }
                } else {
                    tracing::warn!("Publish tomic missing topoic:{topic}, msg: {msg:?}");
                }
            }
            InMemPubsubCommand::Cleanup => {
                self.cleanup();
            }
            InMemPubsubCommand::PrintInfo => {
                self.print_info();
            }
        }
    }

    fn cleanup(&mut self) {
        self.print_info();

        let mut cleanup_topics = vec![];
        for (topic, s) in self.inner.iter() {
            if s.receiver_count() == 0 {
                cleanup_topics.push(topic.clone());
            }
        }
        for topic in cleanup_topics {
            self.inner.remove(&topic);
        }
    }

    fn print_info(&self) {
        tracing::info!("-----");
        for (topic, s) in self.inner.iter() {
            tracing::info!("topic: {topic:?}, recever_count: {}", s.receiver_count());
        }
        tracing::info!("-----");
    }
}

#[tokio::test]
async fn tset() {
    #[derive(Debug, Clone)]
    enum Test {
        A(String),
    }
    let (message_bus_command_tx, _) = InMemPubsub::<Test>::init();

    let (ret_tx, ret_rx) =
        tokio::sync::oneshot::channel::<tokio::sync::broadcast::Receiver<Test>>();

    message_bus_command_tx
        .send(InMemPubsubCommand::Subscribe(("()".to_string(), ret_tx)))
        .unwrap();

    let mut receiver = ret_rx.await.unwrap();
    let jh1 = tokio::spawn(async move {
        loop {
            match receiver.recv().await.unwrap() {
                Test::A(zzz) => {
                    println!("zzz: {zzz:?}");
                }
            }
        }
    });

    let jh2 = tokio::spawn(async move {
        loop {
            message_bus_command_tx
                .send(InMemPubsubCommand::Publish(
                    "()".to_string(),
                    Test::A("asdf".to_string()),
                ))
                .unwrap();
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    });

    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    jh1.abort();
    jh2.abort();
}
