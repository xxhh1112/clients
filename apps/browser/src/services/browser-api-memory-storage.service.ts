import AbstractChromeStorageService from "./abstractChromeStorageApi.service";

export default class BrowserApiMemoryStorageService extends AbstractChromeStorageService {
  protected chromeStorageApi = chrome.storage.session;
}
