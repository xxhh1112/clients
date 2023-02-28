import { Injectable } from "@angular/core";

import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";

@Injectable()
export class InPopupMessagingService implements MessagingService {
  async send(subscriber: string, arg?: any) {
    // eslint-disable-next-line no-console
    console.log("InPopupMessagingService.send", subscriber, arg);
  }
}
