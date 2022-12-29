import { ClientType } from "../enums/clientType";
import { DeviceType } from "../enums/deviceType";

interface ToastOptions {
  timeout?: number;
}

export type ClipboardOptions = {
  allowHistory?: boolean;
  clearing?: boolean;
  clearMs?: number;
  window?: Window;
};

export abstract class PlatformUtilsService {
  getDevice: () => DeviceType;
  getDeviceString: () => string;
  getClientType: () => ClientType;
  isFirefox: () => boolean;
  isChrome: () => boolean;
  isEdge: () => boolean;
  isOpera: () => boolean;
  isVivaldi: () => boolean;
  isSafari: () => boolean;
  isMacAppStore: () => boolean;
  isViewOpen: () => Promise<boolean>;
  launchUri: (uri: string, options?: any) => void;
  getApplicationVersion: () => Promise<string>;
  getApplicationVersionNumber: () => Promise<string>;
  supportsWebAuthn: (win: Window) => boolean;
  supportsDuo: () => boolean;
  showToast: (
    type: "error" | "success" | "warning" | "info",
    title: string,
    text: string | string[],
    options?: ToastOptions
  ) => void;
  showDialog: (
    body: string,
    title?: string,
    confirmText?: string,
    cancelText?: string,
    type?: string,
    bodyIsHtml?: boolean,
    target?: string
  ) => Promise<boolean>;
  isDev: () => boolean;
  isSelfHost: () => boolean;
  copyToClipboard: (text: string, options?: ClipboardOptions) => void | boolean;
  readFromClipboard: () => Promise<string>;
  supportsBiometric: () => Promise<boolean>;
  authenticateBiometric: () => Promise<boolean>;
  supportsSecureStorage: () => boolean;
}
