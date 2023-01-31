import { InjectionToken } from "@angular/core";

export type ManifestVersion = chrome.runtime.Manifest["manifest_version"];

export const MANIFEST_VERSION = new InjectionToken<ManifestVersion>("MANIFEST_VERSION");
