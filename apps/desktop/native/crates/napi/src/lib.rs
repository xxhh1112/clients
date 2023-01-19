use desktop_core::ipc::MessageType;
use napi::bindgen_prelude::*;

#[macro_use]
extern crate napi_derive;

#[napi]
pub mod passwords {
    /// Fetch the stored password from the keychain.
    #[napi]
    pub async fn get_password(service: String, account: String) -> napi::Result<String> {
        desktop_core::password::get_password(&service, &account)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Fetch the stored password from the keychain that was stored with Keytar.
    #[napi]
    pub async fn get_password_keytar(service: String, account: String) -> napi::Result<String> {
        desktop_core::password::get_password_keytar(&service, &account)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Save the password to the keychain. Adds an entry if none exists otherwise updates the existing entry.
    #[napi]
    pub async fn set_password(
        service: String,
        account: String,
        password: String,
    ) -> napi::Result<()> {
        desktop_core::password::set_password(&service, &account, &password)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Delete the stored password from the keychain.
    #[napi]
    pub async fn delete_password(service: String, account: String) -> napi::Result<()> {
        desktop_core::password::delete_password(&service, &account)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub mod biometrics {
    // Prompt for biometric confirmation
    #[napi]
    pub async fn prompt(
        hwnd: napi::bindgen_prelude::Buffer,
        message: String,
    ) -> napi::Result<bool> {
        desktop_core::biometric::prompt(hwnd.into(), message)
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn available() -> napi::Result<bool> {
        desktop_core::biometric::available().map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[napi]
pub struct IpcMessage {
    pub client_id: u32,
    pub kind: IpcMessageType,
    pub message: String,
}

#[napi]
pub enum IpcMessageType {
    Connected,
    Disconnected,
    Message,
}

impl From<MessageType> for IpcMessageType {
    fn from(message_type: MessageType) -> Self {
        match message_type {
            MessageType::Connected => IpcMessageType::Connected,
            MessageType::Disconnected => IpcMessageType::Disconnected,
            MessageType::Message => IpcMessageType::Message,
        }
    }
}

#[napi]
pub mod ipc {
    /// Start the IPC server.
    #[napi(ts_args_type = "callback: (error: any, message: IpcMessage) => void")]
    pub fn listen(fn_out: napi::JsFunction) -> napi::Result<()> {
        let tsfn: napi::threadsafe_function::ThreadsafeFunction<crate::IpcMessage> = fn_out
            .create_threadsafe_function(0, |ctx| {
                let mut obj = ctx.env.create_object()?;
                let v: crate::IpcMessage = ctx.value;
                obj.set("kind", v.kind).ok();
                obj.set("message", v.message).ok();
                obj.set("client_id", v.client_id).ok();

                Ok(vec![obj])
            })?;

        let (tx, mut rx) = tokio::sync::mpsc::channel(32);

        tokio::spawn(async move {
            desktop_core::ipc::start(tx).await;
        });

        tokio::spawn(async move {
            while let Some(message) = rx.recv().await {
                tsfn.call(
                    Ok(crate::IpcMessage {
                        client_id: message.client_id,
                        message: message.message,
                        kind: message.kind.into(),
                    }),
                    napi::threadsafe_function::ThreadsafeFunctionCallMode::NonBlocking,
                );
            }
        });

        Ok(())
    }

    /// Stop the active IPC server.
    #[napi]
    pub fn stop() -> napi::Result<()> {
        desktop_core::ipc::stop().map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    /// Send a message over the IPC server.
    #[napi]
    pub async fn send(message: String) -> napi::Result<()> {
        desktop_core::ipc::send(message)
            .await
            .map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}
