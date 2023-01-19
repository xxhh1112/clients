use std::{collections::VecDeque, path::PathBuf, sync::Arc};

use futures::StreamExt as _;

use anyhow::Result;
use once_cell::sync::Lazy;
use parity_tokio_ipc::{Endpoint, SecurityAttributes};
use tokio::{
    io::{split, AsyncReadExt, AsyncWrite, AsyncWriteExt},
    sync::Mutex,
};

#[derive(Debug)]
pub struct Message {
    pub client_id: u32,
    pub kind: MessageType,
    pub message: String,
}

#[derive(Debug)]
pub enum MessageType {
    Connected,
    Disconnected,
    Message,
}

pub struct IpcContext {
    messages: VecDeque<String>,
}

trait Ty: AsyncWrite + Unpin + Send {}
impl<T: AsyncWrite + Unpin + Send> Ty for T {}

static INSTANCE: Lazy<Mutex<IpcContext>> = Lazy::new(|| {
    Mutex::new(IpcContext {
        messages: VecDeque::new(),
    })
});

/// Start the IPC server.
///
/// TODO: Detangle this mess
pub async fn start(tx: tokio::sync::mpsc::Sender<Message>) {
    let path = path();

    let mut endpoint = Endpoint::new(path.to_string_lossy().to_string());
    endpoint.set_security_attributes(SecurityAttributes::allow_everyone_create().unwrap());

    let incoming = endpoint.incoming().expect("failed to open new socket");
    futures::pin_mut!(incoming);

    let connections: Arc<Mutex<Vec<Arc<Mutex<Box<dyn Ty>>>>>> = Arc::new(Mutex::new(Vec::new()));

    let c = connections.clone();
    tokio::spawn(async move {
        loop {
            let msg = INSTANCE.lock().await.messages.pop_front();
            if let Some(msg) = msg {
                print!("Sending message2: {}", msg);
                for connection in c.lock().await.iter_mut() {
                    // Ignore errors, typically caused by a disconnected client.
                    connection.lock().await.write_all(msg.as_bytes()).await.ok();
                }
            }
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    });

    let mut next_client_id = 1;
    while let Some(result) = incoming.next().await {
        match result {
            Ok(stream) => {
                let (mut reader, writer) = split(stream);
                let client_id = next_client_id;
                next_client_id += 1;

                let mutex: Arc<Mutex<Box<dyn Ty>>> = Arc::new(Mutex::new(Box::new(writer)));

                connections.lock().await.push(mutex.clone());
                let tx = tx.clone();

                tx.send(Message {
                    client_id: client_id,
                    kind: MessageType::Connected,
                    message: "Connected".to_owned(),
                })
                .await
                .unwrap();

                tokio::spawn(async move {
                    loop {
                        let mut buf = vec![0u8; 4096].into_boxed_slice();
                        match reader.read(&mut buf).await {
                            Err(_) | Ok(0) => {
                                tx.send(Message {
                                    client_id: client_id,
                                    kind: MessageType::Disconnected,
                                    message: "Disconnected".to_owned(),
                                })
                                .await
                                .unwrap();
                                break;
                            }
                            Ok(n) => {
                                let msg = std::str::from_utf8(&buf[..n]);
                                println!("Sending message: {}", msg.unwrap());

                                tx.send(Message {
                                    client_id: client_id,
                                    kind: MessageType::Message,
                                    message: msg.unwrap().to_owned(),
                                })
                                .await
                                .unwrap();
                            }
                        }
                    }
                });
            }
            _ => unreachable!("ideally"),
        }
    }
}

pub fn stop() -> Result<()> {
    // TODO: Close the socket.
    Ok(())
}

/// Enqueue a message to be sent over the IPC socket.
pub async fn send(message: String) -> Result<()> {
    INSTANCE.lock().await.messages.push_back(message);
    Ok(())
}

/// Resolve the path to the IPC socket.
pub fn path() -> PathBuf {
    if cfg!(windows) {
        PathBuf::from(r"\\.\pipe\bitwarden.sock")
    } else {
        dirs::home_dir().unwrap().join("tmp").join("bitwarden.sock")
    }
}
