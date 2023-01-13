import { concatMap, filter, firstValueFrom, Observable } from "rxjs";

import { Message } from "./message";

type PostMessageFunction = (message: MessageWithMetadata) => void;

type Channel = {
  messages$: Observable<MessageWithMetadata>;
  postMessage: PostMessageFunction;
};

type Metadata = { requestId: string };
type MessageWithMetadata = Message & { metadata: Metadata };

// TODO: This class probably duplicates functionality but I'm not especially familiar with
// the inner workings of the browser extension yet.
// If you see this in a code review please comment on it!

export class Messenger {
  static forDOMCommunication(window: Window) {
    return new Messenger({
      postMessage: window.postMessage.bind(window),
      messages$: new Observable((subscriber) => {
        const eventListener = (event: MessageEvent<MessageWithMetadata>) => {
          subscriber.next(event.data);
        };

        window.addEventListener("message", eventListener);

        return () => window.removeEventListener("message", eventListener);
      }),
    });
  }

  private constructor(private channel: Channel) {}

  request(request: Message): Promise<Message> {
    const requestId = Date.now().toString();
    const metadata: Metadata = { requestId };

    const promise = firstValueFrom(
      this.channel.messages$.pipe(
        filter(
          (m) => m != undefined && m.metadata?.requestId === requestId && m.type !== request.type
        )
      )
    );

    this.channel.postMessage({ ...request, metadata });

    return promise;
  }

  addHandler(handler: (message: Message) => Promise<Message | undefined>) {
    this.channel.messages$
      .pipe(
        concatMap(async (message) => {
          const handlerResponse = await handler(message);

          if (handlerResponse === undefined) {
            return;
          }

          const metadata: Metadata = { requestId: message.metadata.requestId };
          this.channel.postMessage({ ...handlerResponse, metadata });
        })
      )
      .subscribe();
  }
}
