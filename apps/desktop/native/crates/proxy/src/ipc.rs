use std::{sync::Arc, time::Duration};

use anyhow::{anyhow, Result};
use log::info;
use parity_tokio_ipc::Endpoint;
use tokio::{
    io::{split, AsyncReadExt, AsyncWriteExt},
    sync::Mutex,
    time::sleep,
};

/// Connect to the IPC server and start listening for messages.
pub(crate) fn start(
    tx: tokio::sync::mpsc::Sender<String>,
    rx: tokio::sync::mpsc::Receiver<String>,
) {
    let path = desktop_core::ipc::path();
    let mrx = Arc::new(Mutex::new(rx));

    tokio::spawn(async move {
        loop {
            info!("Attempting to connect to {}", path.display());

            let client = Endpoint::connect(&path).await;

            let mrx = mrx.clone();

            if let Ok(c) = client {
                info!("Connected to {}", path.display());

                let (mut reader, mut writer) = split(c);

                tx.send("{\"command\":\"connected\"}".to_owned())
                    .await
                    .unwrap();

                // Send incoming messages to the IPC server
                let task = tokio::spawn(async move {
                    loop {
                        if let Some(msg) = mrx.lock().await.recv().await {
                            writer.write_all(msg.as_bytes()).await.unwrap();
                        }
                    }
                });

                // Listen to IPC messages
                loop {
                    let message = read_message(&mut reader).await;

                    match message {
                        Ok(s) => {
                            tx.send(s).await.unwrap();
                        }
                        Err(e) => {
                            tx.send("{\"command\":\"disconnected\"}".to_owned())
                                .await
                                .unwrap();
                            info!("Connection closed: {}", e);
                            task.abort();
                            break;
                        }
                    }

                    sleep(Duration::from_millis(100)).await;
                }
            } else {
                info!("Failed to connect to {}", path.display());
            }

            sleep(Duration::from_secs(5)).await;
        }
    });
}

async fn read_message(
    reader: &mut tokio::io::ReadHalf<parity_tokio_ipc::Connection>,
) -> Result<String> {
    let mut buffer = vec![0; 4096].into_boxed_slice();
    let n = reader.read(&mut buffer[..]).await?;

    if n == 0 {
        return Err(anyhow!("Connection closed"));
    }

    Ok(String::from_utf8_lossy(&buffer[..n]).to_string())
}
