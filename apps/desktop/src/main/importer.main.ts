import { spawn } from "child_process";
import { platform as osPlatform } from "os";
import * as path from "path";

import { app } from "electron";


export class ImporterMain {
  async import(service: string, args: string[]): Promise<string> {
    if (service === "lastpass") {
      return this.importLastpass(args[0], args[1], args[2]);
    } else {
      throw "Import service provider not supported.";
    }
  }

  private async importLastpass(email: string, password: string,
    twoFactorCode: string): Promise<string> {
    const output = await this.execBinary("lastpass-importer",
      [email, password, twoFactorCode]);
    return output;
  }

  private async execBinary(binaryName: string, args: string[]): Promise<string> {
    const path = this.getExecPath(binaryName);
    const child = spawn(path, args, {});
    return new Promise((resolve, reject) => {
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (data) => {
        resolve(data.toString());
      });

      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (data) => {
        reject(data.toString());
      });
    });
  }

  private getExecPath(binaryName: string): string {
    const platform = this.getPlatform();
    const binaryFilename = platform === "win" ? binaryName + ".exe" : binaryName;
    const binariesPath =
      process.env.NODE_ENV === "production" && app.isPackaged
        ? path.join(path.dirname(app.getAppPath()), "..", "./Resources", "./bin")
        : path.join(process.cwd(), "./resources", "./bin", platform);
    return path.resolve(path.join(binariesPath, "./" + binaryFilename));
  }

  private getPlatform(): string {
    switch (osPlatform()) {
      case "aix":
      case "freebsd":
      case "linux":
      case "openbsd":
        return "linux";
      case "darwin":
        return "mac";
      case "win32":
        return "windows";
    }
  }
}
