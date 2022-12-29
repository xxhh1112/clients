use anyhow::Result;
use arboard::{Clipboard, Set};

#[cfg(target_os = "windows")]
use arboard::SetExtWindows;

pub fn read() -> Result<String> {
    let mut clipboard = Clipboard::new()?;

    Ok(clipboard.get_text()?)
}

pub fn write(text: String, password: bool) -> Result<()> {
    let mut clipboard = Clipboard::new()?;

    let mut set = clipboard.set();

    if password {
        set = exclude_from_history(set);
    }

    set.text(text)?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn exclude_from_history(set: Set) -> Set {
    set.exclude_from_history()
}

#[cfg(not(target_os = "windows"))]
fn exclude_from_history(set: Set) -> Set {
    set
}
