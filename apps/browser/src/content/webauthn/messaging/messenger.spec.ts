import { Subject } from "rxjs";

import { Utils } from "@bitwarden/common/misc/utils";

import { Message } from "./message";
import { Channel, MessageWithMetadata, Messenger } from "./messenger";

describe("Messenger", () => {
  let messengerA: Messenger;
  let messengerB: Messenger;
  let handlerA: TestMessageHandler;
  let handlerB: TestMessageHandler;

  beforeEach(() => {
    const channelPair = new TestChannelPair();
    messengerA = new Messenger(channelPair.channelA);
    messengerB = new Messenger(channelPair.channelB);

    handlerA = new TestMessageHandler();
    handlerB = new TestMessageHandler();
    messengerA.handler = handlerA.handler;
    messengerB.handler = handlerB.handler;
  });

  it("should deliver message to B when sending request from A", () => {
    const request = createRequest();
    messengerA.request(request);

    const received = handlerB.recieve();

    expect(received.length).toBe(1);
    expect(received[0].message).toMatchObject(request);
  });

  it("should return response from B when sending request from A", async () => {
    const request = createRequest();
    const response = createResponse();
    const requestPromise = messengerA.request(request);
    const received = handlerB.recieve();
    received[0].respond(response);

    const returned = await requestPromise;

    expect(returned).toMatchObject(response);
  });

  it("should deliver abort signal to B when requesting abort", () => {
    const abortController = new AbortController();
    messengerA.request(createRequest(), abortController);
    abortController.abort();

    const received = handlerB.recieve();

    expect(received[0].abortController.signal.aborted).toBe(true);
  });

  it.skip("should abort request and throw error when abort is requested from A", () => {
    const abortController = new AbortController();
    const requestPromise = messengerA.request(createRequest(), abortController);

    abortController.abort();

    expect(requestPromise).toThrow();
  });
});

type TestMessage = Message & { testId: string };

function createRequest(): TestMessage {
  return { testId: Utils.newGuid(), type: "TestRequest" } as any;
}

function createResponse(): TestMessage {
  return { testId: Utils.newGuid(), type: "TestResponse" } as any;
}

class TestChannelPair {
  readonly channelA: Channel;
  readonly channelB: Channel;

  constructor() {
    const subjectA = new Subject<MessageWithMetadata>();
    const subjectB = new Subject<MessageWithMetadata>();

    this.channelA = {
      messages$: subjectA,
      postMessage: (message) => {
        subjectB.next(message);
      },
    };

    this.channelB = {
      messages$: subjectB,
      postMessage: (message) => subjectA.next(message),
    };
  }
}

class TestMessageHandler {
  readonly handler: (
    message: TestMessage,
    abortController?: AbortController
  ) => Promise<Message | undefined>;

  private recievedMessages: {
    message: TestMessage;
    respond: (response: TestMessage) => void;
    abortController?: AbortController;
  }[] = [];

  constructor() {
    this.handler = (message, abortController) =>
      new Promise((resolve, reject) => {
        this.recievedMessages.push({
          message,
          abortController,
          respond: (response) => resolve(response),
        });
      });
  }

  recieve() {
    const received = this.recievedMessages;
    this.recievedMessages = [];
    return received;
  }
}
