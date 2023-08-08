import mock from "jest-mock-extended/lib/Mock";

import { BrowserApi } from "../browser/browser-api";

import { BackgroundBitSubject } from "./background-bit-subject";

jest.mock("../browser/browser-api", () => {
  return {
    BrowserApi: mock<BrowserApi>(),
  };
});

describe("BackgroundBitSubject", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("it should set up a message listener", () => {
    new BackgroundBitSubject<string>("serviceObservableName", (json) => json);
    expect(BrowserApi.messageListener).toHaveBeenCalled();
  });

  it("should send a message when next is called", () => {
    const subject = new BackgroundBitSubject<string>("serviceObservableName", (json) => json);
    subject.next("test");
    expect(BrowserApi.sendMessage).toHaveBeenCalled();
  });

  it("should emit when next is called", () => {
    const subject = new BackgroundBitSubject<string>("serviceObservableName", (json) => json);
    const spy = jest.spyOn(subject, "next");
    subject.next("test");
    expect(spy).toHaveBeenCalled();
  });

  it("should send a message to the foreground when next is called", () => {
    const subject = new BackgroundBitSubject<string>("serviceObservableName", (json) => json);
    subject.next("test");
    expect(BrowserApi.sendMessage).toHaveBeenCalled();
  });

  it("should call next when a message is receied from the foreground", () => {
    const subject = new BackgroundBitSubject<string>("serviceObservableName", (json) => json);
    const spy = jest.spyOn(subject, "next");
    (BrowserApi.messageListener as jest.Mock).mock.calls[0][1]({
      command: subject["fromForegroundMessageName"],
      data: "test",
    });
    expect(spy).toHaveBeenCalled();
  });
});
