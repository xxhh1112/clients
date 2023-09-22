import NotificationQueueMessage from "./notificationQueueMessage";
import { NotificationQueueMessageType } from "./notificationQueueMessageType";

export default class AddRequestLastPassImportQueueMessage extends NotificationQueueMessage {
  type: NotificationQueueMessageType.RequestLastPassImport;
}
