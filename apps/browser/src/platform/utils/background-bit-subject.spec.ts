import mock from "jest-mock-extended/lib/Mock";

import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";

import { makePort } from "../../../test.setup";
import { BrowserApi } from "../browser/browser-api";

import { BackgroundBitSubject } from "./background-bit-subject";

jest.mock("../browser/browser-api", () => {
  return {
    BrowserApi: mock<BrowserApi>(),
  };
});

describe("BackgroundBitSubject", () => {
  let sut: BackgroundBitSubject<string>;
  let port: chrome.runtime.Port;
  let onConnectListener: (port: chrome.runtime.Port) => void;

  beforeEach(() => {
    sut = new BackgroundBitSubject<string>("serviceObservableName", (data) => data);
    port = makePort("serviceObservableName_port");
    onConnectListener = (chrome.runtime.onConnect.addListener as jest.Mock).mock.calls[0]?.[0];
    onConnectListener(port); // connect a port
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("constructor", () => {
    it("should set up connection listener", () => {
      const onConnect = (chrome.runtime.onConnect.addListener as jest.Mock).mock.calls[0]?.[0];
      expect(onConnect).toBeDefined();
    });
  });

  describe("onConnectListener", () => {
    let subscribeSpy: jest.SpyInstance;

    beforeEach(() => {
      subscribeSpy = jest.spyOn(sut["_subject"], "subscribe");
    });

    it("should ignore connections that are not for this service", () => {
      jest.resetAllMocks(); // ignore calls from beforeEach
      const port = makePort("notServiceObservableName_port");
      onConnectListener(port);
      expect(port.onDisconnect.addListener).not.toHaveBeenCalled();
      expect(port.onMessage.addListener).not.toHaveBeenCalled();
    });

    it("should set up disconnect listener", () => {
      onConnectListener(port);
      expect(port.onDisconnect.addListener).toHaveBeenCalled();
    });

    it("should set up message listener", () => {
      onConnectListener(port);
      expect(port.onMessage.addListener).toHaveBeenCalled();
    });

    it("should subscribe the port to observable updates", () => {
      onConnectListener(port);
      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe("onDisconnectListener", () => {
    let onDisconnectListener: (port: chrome.runtime.Port) => void;
    let unsubscribeSpy: jest.SpyInstance;

    beforeEach(() => {
      unsubscribeSpy = jest.spyOn(sut["_portSubscriptions"].get(port), "unsubscribe");
      onDisconnectListener = (port.onDisconnect.addListener as jest.Mock).mock.calls[0]?.[0];
      onDisconnectListener(port);
    });

    it("should unsubscribe the port from observable updates", () => {
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it("should delete the port", () => {
      expect(sut["_portSubscriptions"].get(port)).toBeUndefined();
    });
  });

  describe("next", () => {
    it("should set a new message id", () => {
      sut.next("test");
      expect(sut["_lastId"]).toBeDefined();
    });

    it("should next the backing subject", () => {
      const spy = jest.spyOn(BitSubject.prototype, "next");
      sut.next("test");
      expect(spy).toHaveBeenCalled();
    });

    it("should post the value to listening ports", () => {
      sut.next("test");
      expect(port.postMessage).toHaveBeenCalledWith({
        id: sut["_lastId"],
        data: JSON.stringify("test"),
      });
    });
  });

  describe("onMessageFromForeground", () => {
    let nextSpy: jest.SpyInstance;
    let onMessageListener: (message: { expectedId: string; data: Required<string> }) => void;

    beforeEach(() => {
      sut["_lastId"] = "lastId";
      nextSpy = jest.spyOn(sut, "next");
      onMessageListener = (port.onMessage.addListener as jest.Mock).mock.calls[0]?.[0];
    });

    it("should ignore messages that are out of sync", () => {
      onMessageListener({
        expectedId: "notLastId",
        data: "test",
      });

      expect(nextSpy).not.toHaveBeenCalled();
    });

    it("should call next with the message data", () => {
      onMessageListener({
        expectedId: sut["_lastId"],
        data: JSON.stringify("test"),
      });
      expect(nextSpy).toHaveBeenCalledWith("test");
    });
  });
});
