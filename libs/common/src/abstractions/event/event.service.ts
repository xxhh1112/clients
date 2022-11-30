import { EventType } from "../../enums/eventType";

export abstract class EventService {
  collect: (
    eventType: EventType,
    cipherId?: string,
    uploadImmediately?: boolean,
    organizationId?: string
  ) => Promise<any>;
}
