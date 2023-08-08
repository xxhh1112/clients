import mock from "jest-mock-extended/lib/Mock";

import { BrowserApi } from "../browser/browser-api";

import { ForegroundBitSubject } from "./foreground-bit-subject";

jest.mock("../browser/browser-api", () => {
  return {
    BrowserApi: mock<BrowserApi>(),
  };
});

describe("ForegroundBitSubject", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("it should set up a message listener", () => {
    new ForegroundBitSubject<string>("serviceObservableName", (json) => json);
    expect(BrowserApi.messageListener).toHaveBeenCalled();
  });

  it("should send a message when next is called", () => {
    const subject = new ForegroundBitSubject<string>("serviceObservableName", (json) => json);
    subject.next("test");
    expect(BrowserApi.sendMessage).toHaveBeenCalled();
  });

  it("should not emit when next is called", () => {
    const subject = new ForegroundBitSubject<string>("serviceObservableName", (json) => json);
    const spy = jest.spyOn(subject["_subject"], "next");
    subject.next("test");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should emit when a message is received from background", () => {
    const subject = new ForegroundBitSubject<string>("serviceObservableName", (json) => json);
    const spy = jest.spyOn(subject["_subject"], "next");
    (BrowserApi.messageListener as jest.Mock).mock.calls[0][1]({
      command: subject["fromBackgroundMessageName"],
      data: "test",
    });
    expect(spy).toHaveBeenCalled();
  });
});
