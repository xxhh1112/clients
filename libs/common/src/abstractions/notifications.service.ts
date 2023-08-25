import { Observable } from "rxjs";
import { NotificationResponse } from "../models/response/notification.response";

export abstract class NotificationsService {
  readonly notifications$: Observable<NotificationResponse>;

  init: () => Promise<void>;
  updateConnection: (sync?: boolean) => Promise<void>;
  reconnectFromActivity: () => Promise<void>;
  disconnectFromInactivity: () => Promise<void>;
}
