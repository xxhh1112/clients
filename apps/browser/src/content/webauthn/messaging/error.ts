export enum MessageErrorType {
  RequestAborted,
}

export type RequestAbortedMessageError = {
  fallbackRequested: boolean;
  message: string;
};

export type MessageError = RequestAbortedMessageError;
