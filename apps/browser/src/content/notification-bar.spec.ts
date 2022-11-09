import { AccountSettings } from "../models/account";
import { FormData, PageDetail } from "../services/abstractions/autofill.service";

import { executeDomLoaded } from "./notificationBar";

describe("notification-bar", () => {
  const parser = new DOMParser();

  const clearTimeoutMock = jest.fn();
  const setTimeoutMock = jest.fn();

  const mockLocalStorage = (activeUser: string, userSettings: Partial<AccountSettings>) => {
    const obj: any = { activeUserId: activeUser };
    obj[activeUser] = { settings: userSettings };
    jest.spyOn(chrome.storage.local, "get").mockImplementation((_key, callback) => {
      callback(obj);
    });
  };

  afterEach(() => jest.resetAllMocks());

  it("shows the notification bar when a new login is submitted", async () => {
    // Arrange
    const html = `
    <html>
      <body>
        <form id="test-form">
          <input id="username" value="my_username" />
          <input type="password" id="password" value="my_password" />
        </form>
      </body>
    </html>
    `;
    const dom = parser.parseFromString(html, "text/html");

    mockLocalStorage("my-user-id", {
      neverDomains: [],
      disableAddLoginNotification: false,
      disableChangedPasswordNotification: false,
    });

    let onMessageCallback: Parameters<typeof chrome.runtime.onMessage.addListener>[0];
    jest
      .spyOn(chrome.runtime.onMessage, "addListener")
      .mockImplementation((callback) => (onMessageCallback = callback));

    const sendMessageSpy = jest.spyOn(chrome.runtime, "sendMessage");

    // Act
    executeDomLoaded(
      {
        document: dom,
        location: {
          hostname: "test.com",
        },
        clearTimeout: clearTimeoutMock,
        setTimeout: setTimeoutMock,
      } as any,
      dom
    );

    // addListener should have been called during exectuteDomLoaded()
    expect(onMessageCallback).toBeTruthy();

    const message = {
      command: "notificationBarPageDetails",
      data: {
        details: [] as PageDetail[],
        forms: [
          {
            form: {
              htmlID: "test-form",
            },
            username: {
              htmlID: "username",
            } as any,
            password: {
              htmlID: "password",
            } as any,
          },
        ] as FormData[],
      },
    };

    // Wait for message to be done
    await new Promise<void>((resolve) => onMessageCallback(message, null, resolve));

    const form = dom.querySelector("#test-form") as HTMLFormElement;
    form.submit();

    // Assert
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).toHaveBeenCalledWith({
      command: "bgAddLogin",
      login: {
        password: "my_password",
        url: "about:blank",
        username: "my_username",
      },
    });
  });

  it("should detect change password", async () => {
    const html = `
    <html>
      <body>
        <form id="test-form">
          <input id="old-password" type="password" value="my_old_password" />
          <input id="new-password" type="password" value="my_new_password" />
          <input type="submit" value="Change Password" />
        </form>
      </body>
    </html>
    `;

    const dom = parser.parseFromString(html, "text/html");

    mockLocalStorage("my-user-id", {
      disableAddLoginNotification: true,
      disableChangedPasswordNotification: false,
    });

    let onMessageCallback: Parameters<typeof chrome.runtime.onMessage.addListener>[0];
    jest
      .spyOn(chrome.runtime.onMessage, "addListener")
      .mockImplementation((callback) => (onMessageCallback = callback));

    const sendMessageSpy = jest.spyOn(chrome.runtime, "sendMessage");

    // Act
    executeDomLoaded(
      {
        document: dom,
        location: {
          hostname: "test.com",
        },
        clearTimeout: clearTimeoutMock,
        setTimeout: setTimeoutMock,
      } as any,
      dom
    );

    // addListener should have been called during exectuteDomLoaded()
    expect(onMessageCallback).toBeTruthy();

    const message = {
      command: "notificationBarPageDetails",
      data: {
        details: [] as PageDetail[],
        forms: [
          {
            form: {
              htmlID: "test-form",
            },
            passwords: [
              {
                htmlID: "old-password",
              },
              {
                htmlID: "new-password",
              },
            ],
          },
        ] as FormData[],
      },
    };

    // Wait for message to be done
    await new Promise<void>((resolve) => onMessageCallback(message, null, resolve));

    const form = dom.querySelector("#test-form") as HTMLFormElement;
    form.submit();

    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy).toHaveBeenCalledWith({
      command: "bgChangedPassword",
      data: {
        newPassword: "my_new_password",
        currentPassword: "my_old_password",
        url: "about:blank",
      },
    });
  });
});
