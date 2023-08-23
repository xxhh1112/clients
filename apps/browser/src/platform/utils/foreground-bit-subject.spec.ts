import mock from "jest-mock-extended/lib/Mock";

import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";

import { makePort } from "../../../test.setup";
import { BrowserApi } from "../browser/browser-api";

import { ForegroundBitSubject } from "./foreground-bit-subject";

jest.mock("../browser/browser-api", () => {
  return {
    BrowserApi: mock<BrowserApi>(),
  };
});

describe("ForegroundBitSubject", () => {
  let sut: ForegroundBitSubject<string>;
  const port = makePort("serviceObservableName_port");

  beforeEach(() => {
    (chrome.runtime.connect as jest.Mock).mockReturnValue(port);
    sut = new ForegroundBitSubject<string>("serviceObservableName", (json) => json);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("constructor", () => {
    it("should connect to the background", () => {
      expect(chrome.runtime.connect).toHaveBeenCalledWith({ name: "serviceObservableName_port" });
    });

    it("should set up a message listener on the port", () => {
      expect(port.onMessage.addListener).toHaveBeenCalled();
    });
  });

  describe("next", () => {
    it("should send a message to the background", () => {
      sut.next("test");
      expect(port.postMessage).toHaveBeenCalledWith({
        expectedId: undefined,
        data: JSON.stringify("test"),
      });
    });

    it("should not next the subject", () => {
      const subjectSpy = jest.spyOn(sut["_subject"], "next");
      const superSpy = jest.spyOn(BitSubject.prototype, "next");
      sut.next("test");
      expect(subjectSpy).not.toHaveBeenCalled();
      expect(superSpy).not.toHaveBeenCalled();
    });
  });

  describe("onMessageFromBackground", () => {
    let messageReceiveCallback: (message: { id: string; data: string }) => void;
    const message = {
      id: "expected",
      data: JSON.stringify("test"),
    };

    beforeEach(() => {
      messageReceiveCallback = (port.onMessage.addListener as jest.Mock).mock.calls[0]?.[0];
    });

    it("should store the id", () => {
      messageReceiveCallback(message);
      expect(sut["_lastId"]).toBe("expected");
    });

    it("should next the subject", () => {
      const subjectSpy = jest.spyOn(sut["_subject"], "next");
      messageReceiveCallback(message);
      expect(subjectSpy).toHaveBeenCalledWith("test");
    });
  });
});
