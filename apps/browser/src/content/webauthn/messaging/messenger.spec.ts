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
    messengerA.addHandler(handlerA.handler);
    messengerB.addHandler(handlerB.handler);
  });

  it("should deliver message to B when sending request to A", () => {
    const message = createMessage();
    messengerA.request(message);

    const received = handlerB.recieve();

    expect(received.length).toBe(1);
    expect(received[0].message).toMatchObject(message);
  });
});

type TestMessage = Message & { testId: string };

function createMessage(): TestMessage {
  return { testId: Utils.newGuid(), type: "TestMessage" } as any;
}

class TestChannelPair {
  readonly channelA: Channel;
  readonly channelB: Channel;

  constructor() {
    const subjectA = new Subject<MessageWithMetadata>();
    const subjectB = new Subject<MessageWithMetadata>();

    this.channelA = {
      messages$: subjectA,
      postMessage: (message) => subjectB.next(message),
    };

    this.channelB = {
      messages$: subjectB,
      postMessage: (message) => subjectB.next(message),
    };
  }
}

class TestMessageHandler {
  readonly handler: (message: TestMessage) => Promise<Message | undefined>;

  private recievedMessages: { message: TestMessage; respond: (response: TestMessage) => void }[] =
    [];

  constructor() {
    this.handler = (message) =>
      new Promise((resolve, reject) => {
        this.recievedMessages.push({
          message,
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
