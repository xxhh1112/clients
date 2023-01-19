use anyhow::Result;
use std::{
    io::{self, stdin, Read, Write},
    time::Duration,
};

use env_logger::Env;
use log::debug;
use tokio::time::sleep;

mod ipc;

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

    let (in_tx, in_rx) = tokio::sync::mpsc::channel(32);
    let (out_tx, mut out_rx) = tokio::sync::mpsc::channel(32);

    ipc::start(out_tx, in_rx);

    // Receive messages from IPC and print to STDOUT.
    tokio::spawn(async move {
        loop {
            if let Some(msg) = out_rx.recv().await {
                debug!("OUT: {}", msg);
                write(msg);
            }
            sleep(Duration::from_millis(100)).await;
        }
    });

    // Listen to stdin and send messages to ipc processor.
    loop {
        match read(stdin()) {
            Ok(msg) => {
                if msg.len() == 0 {
                    sleep(Duration::from_secs(5)).await;
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

/// Write a message to stdout. The message is prefixed with its length.
///
/// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
fn write(message: String) {
    let bytes = message.as_bytes();
    let header: [u8; 4] = (bytes.len() as u32).to_ne_bytes();
    io::stdout().write(&header).ok();
    io::stdout().write(bytes).ok();
    io::stdout().flush().ok();
}

/// Read input from stdin. The input is expected to be prefixed with its length.
///
/// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
pub fn read<R: Read>(mut input: R) -> Result<Vec<u8>> {
    let mut buf = [0; 4];
    let length = input
        .read_exact(&mut buf)
        .map(|()| u32::from_ne_bytes(buf))?;

    let mut buffer = vec![0; length as usize];
    input.read_exact(&mut buffer)?;
    Ok(buffer)
}
