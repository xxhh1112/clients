use anyhow::Result;
use std::io::{self, Read, Write};

/// Write a message to stdout. The message is prefixed with its length.
///
/// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
pub(crate) fn write(message: String) {
    let bytes = message.as_bytes();
    let header: [u8; 4] = (bytes.len() as u32).to_ne_bytes();
    io::stdout().write(&header).ok();
    io::stdout().write(bytes).ok();
    io::stdout().flush().ok();
}

/// Read input from stdin. The input is expected to be prefixed with its length.
///
/// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
pub(crate) fn read<R: Read>(mut input: R) -> Result<Vec<u8>> {
    let mut buf = [0; 4];
    let length = input
        .read_exact(&mut buf)
        .map(|()| u32::from_ne_bytes(buf))?;

    let mut buffer = vec![0; length as usize];
    input.read_exact(&mut buffer)?;
    Ok(buffer)
}
