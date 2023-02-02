import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  skip,
  Subject,
  Subscription,
  switchMap,
} from "rxjs";

import { AbstractMemoryStorageService } from "@bitwarden/common/abstractions/storage.service";
import { skipFrom } from "@bitwarden/common/misc/skip-from.operator";
import { Utils } from "@bitwarden/common/misc/utils";

import { BrowserApi } from "../../browser/browserApi";

import { SyncedItemMetadata } from "./sync-item-metadata";

export class SessionSyncer {
  subscription: Subscription;
  id = Utils.newGuid();

  // ignore initial values
  private skip$ = new Subject<number>();

  constructor(
    private subject: Subject<any>,
    private memoryStorageService: AbstractMemoryStorageService,
    private metaData: SyncedItemMetadata
  ) {
    if (!(subject instanceof Subject)) {
      throw new Error("subject must inherit from Subject");
    }

    if (metaData.ctor == null && metaData.initializer == null) {
      throw new Error("ctor or initializer must be provided");
    }
  }

  async init() {
    let initialIgnore = 0;
    switch (this.subject.constructor) {
      case ReplaySubject:
        // ignore all updates currently in the buffer
        initialIgnore = (this.subject as any)._buffer.length;
        break;
      case BehaviorSubject:
        initialIgnore = 1;
        break;
      default:
        break;
    }

    await this.observe(initialIgnore);
    // must be synchronous
    const hasInSessionMemory = await this.memoryStorageService.has(this.metaData.sessionKey);
    if (hasInSessionMemory) {
      await this.update();
    }

    this.listenForUpdates();
  }

  private async observe(initialIgnore: number) {
    const stream = this.subject.pipe(skip(initialIgnore));

    // This may be a memory leak.
    // There is no good time to unsubscribe from this observable. Hopefully Manifest V3 clears memory from temporary
    // contexts. If so, this is handled by destruction of the context.
    this.subscription = stream
      .pipe(
        skipFrom(this.skip$),
        switchMap((next) => this.updateSession$(next))
      )
      .subscribe();
  }

  private listenForUpdates() {
    // This is an unawaited promise, but it will be executed asynchronously in the background.
    BrowserApi.messageListener(
      this.updateMessageCommand,
      async (message) => await this.updateFromMessage(message)
    );
  }

  async updateFromMessage(message: { command: string; id: string }) {
    if (message.command != this.updateMessageCommand || message.id === this.id) {
      return;
    }
    await this.update();
  }

  async update() {
    const builder = SyncedItemMetadata.builder(this.metaData);
    const value = await this.memoryStorageService.getBypassCache(this.metaData.sessionKey, {
      deserializer: builder,
    });
    this.skip$.next(1);
    this.subject.next(value);
  }

  private updateSession$(value: any) {
    return new Observable((subscriber) => {
      let isAborted = false;

      if (!isAborted) {
        this.memoryStorageService.save(this.metaData.sessionKey, value).then(() => {
          if (!isAborted) {
            BrowserApi.sendMessage(this.updateMessageCommand, { id: this.id });
            subscriber.next();
          }
        });
      }

      return () => {
        isAborted = true;
      };
    });
  }

  private get updateMessageCommand() {
    return `${this.metaData.sessionKey}_update`;
  }
}
