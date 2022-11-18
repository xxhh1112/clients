export enum MessageType {
  CredentialCreationRequest,
  CredentialCreationResponse,
  CredentialGetRequest,
  CredentialGetResponse,
  AbortRequest,
  AbortResponse,
}

export type CredentialCreationRequest = {
  type: MessageType.CredentialCreationRequest;
  rpId: string;
};

export type CredentialCreationResponse = {
  type: MessageType.CredentialCreationResponse;
  approved: boolean;
};

export type CredentialGetRequest = {
  type: MessageType.CredentialGetRequest;
};

export type CredentialGetResponse = {
  type: MessageType.CredentialGetResponse;
};

export type AbortRequest = {
  type: MessageType.AbortRequest;
};

export type AbortResponse = {
  type: MessageType.AbortResponse;
};

export type Message =
  | CredentialCreationRequest
  | CredentialCreationResponse
  | CredentialGetRequest
  | CredentialGetResponse
  | AbortRequest
  | AbortResponse;
