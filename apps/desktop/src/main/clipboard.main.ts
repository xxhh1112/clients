import { ipcMain } from "electron";

import { clipboards } from "@bitwarden/desktop-native";

export class ClipboardMain {
  init() {
    ipcMain.handle("clipboard.read", async (event: any, message: any) => {
      return clipboards.read();
    });

    ipcMain.handle("clipboard.write", async (event: any, message: any) => {
      return clipboards.write(message.text, message.password ?? false);
    });
  }
}
