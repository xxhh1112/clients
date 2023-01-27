import { concatMap, filter, firstValueFrom, Observable } from "rxjs";

import { Message, MessageType } from "./message";

type PostMessageFunction = (message: MessageWithMetadata) => void;

export type Channel = {
  messages$: Observable<MessageWithMetadata>;
  postMessage: PostMessageFunction;
};

export type Metadata = { requestId: string };
export type MessageWithMetadata = Message & { metadata: Metadata };
type Handler = (
  message: Message,
  abortController?: AbortController
) => Promise<Message | undefined>;

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

  handler?: Handler;
  abortControllers = new Map<string, AbortController>();

  constructor(private channel: Channel) {
    this.channel.messages$
      .pipe(
        concatMap(async (message) => {
          if (this.handler === undefined) {
            return;
          }

          const abortController = new AbortController();
          this.abortControllers.set(message.metadata.requestId, abortController);

          try {
            const handlerResponse = await this.handler(message, abortController);

            if (handlerResponse === undefined) {
              return;
            }

            const metadata: Metadata = { requestId: message.metadata.requestId };
            this.channel.postMessage({ ...handlerResponse, metadata });
          } catch (error) {
            const metadata: Metadata = { requestId: message.metadata.requestId };
            this.channel.postMessage({
              type: MessageType.ErrorResponse,
              metadata,
              error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            });
          } finally {
            this.abortControllers.delete(message.metadata.requestId);
          }
        })
      )
      .subscribe();

    this.channel.messages$.subscribe((message) => {
      if (message.type !== MessageType.AbortRequest) {
        return;
      }

      this.abortControllers.get(message.abortedRequestId)?.abort();
    });
  }

  async request(request: Message, abortController?: AbortController): Promise<Message> {
    const requestId = Date.now().toString();
    const metadata: Metadata = { requestId };

    const promise = firstValueFrom(
      this.channel.messages$.pipe(
        filter(
          (m) => m != undefined && m.metadata?.requestId === requestId && m.type !== request.type
        )
      )
    );

    const abortListener = () =>
      this.channel.postMessage({
        metadata: { requestId: `${requestId}-abort` },
        type: MessageType.AbortRequest,
        abortedRequestId: requestId,
      });
    abortController?.signal.addEventListener("abort", abortListener);

    this.channel.postMessage({ ...request, metadata });

    const response = await promise;
    abortController?.signal.removeEventListener("abort", abortListener);

    if (response.type === MessageType.ErrorResponse) {
      const error = new Error();
      Object.assign(error, JSON.parse(response.error));
      throw error;
    }

    return response;
  }
}
