use std::{io::stdin, time::Duration};

use env_logger::Env;
use log::debug;
use tokio::time::sleep;

mod ipc;
mod native_messaging;

/// Bitwarden IPC Proxy.
///
/// This proxy allows browser extensions to communicate with a desktop application using Native
/// Messaging. This method allows an extension to send and receive messages through the use of
/// stdin/stdout streams.
///
/// However, this also requires the browser to start the process in order for the communication to
/// occur. To overcome this limitation, we implement Inter-Process Communication (IPC) to establish
/// a stable communication channel between the proxy and the running desktop application.
///
/// Browser extension <-[native messaging]-> proxy <-[ipc]-> desktop
///
#[tokio::main]
async fn main() {
    env_logger::Builder::from_env(Env::default().default_filter_or("debug")).init();

    eprintln!(r" ____  _ _                         _            ");
    eprintln!(r"| __ )(_) |___      ____ _ _ __ __| | ___ _ __  ");
    eprintln!(r"|  _ \| | __\ \ /\ / / _` | '__/ _` |/ _ \ '_ \ ");
    eprintln!(r"| |_) | | |_ \ V  V / (_| | | | (_| |  __/ | | |");
    eprintln!(r"|____/|_|\__| \_/\_/ \__,_|_|  \__,_|\___|_| |_|");
    eprintln!();
    eprintln!("Starting Bitwarden IPC Proxy.");

    // Setup two channels, one for sending messages to the desktop application and one for receiving messages
    let (in_tx, in_rx) = tokio::sync::mpsc::channel(32);
    let (out_tx, mut out_rx) = tokio::sync::mpsc::channel(32);

    tokio::spawn(async move {
        ipc::start(out_tx, in_rx).await;
    });

    // Receive messages from IPC and print to STDOUT.
    tokio::spawn(async move {
        loop {
            if let Some(msg) = out_rx.recv().await {
                debug!("OUT: {}", msg);
                native_messaging::write(msg);
            }
            sleep(Duration::from_millis(100)).await;
        }
    });

    // Listen to stdin and send messages to ipc processor.
    loop {
        match native_messaging::read(stdin()) {
            Ok(msg) => {
                if msg.len() == 0 {
                    sleep(Duration::from_secs(1)).await;
                    continue;
                }

                let m = String::from_utf8(msg).unwrap();
                debug!("IN: {}", m);
                in_tx.send(m).await.unwrap();
            }
            Err(e) => {
                // Unexpected error, exit.
                eprintln!("Error parsing input: {}", e);
                break;
            }
        }
    }

    eprintln!("Exiting.");
}
