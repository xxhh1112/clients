import {
  CredentialAssertParams,
  CredentialAssertResult,
  CredentialRegistrationParams,
  CredentialRegistrationResult,
} from "@bitwarden/common/webauthn/abstractions/fido2.service.abstraction";

export enum MessageType {
  CredentialCreationRequest,
  CredentialCreationResponse,
  CredentialGetRequest,
  CredentialGetResponse,
  AbortRequest,
  AbortResponse,
  ErrorResponse,
}

export type CredentialCreationRequest = {
  type: MessageType.CredentialCreationRequest;
  data: CredentialRegistrationParams;
};

export type CredentialCreationResponse = {
  type: MessageType.CredentialCreationResponse;
  result?: CredentialRegistrationResult;
};

export type CredentialGetRequest = {
  type: MessageType.CredentialGetRequest;
  data: CredentialAssertParams;
};

export type CredentialGetResponse = {
  type: MessageType.CredentialGetResponse;
  result?: CredentialAssertResult;
};

export type AbortRequest = {
  type: MessageType.AbortRequest;
  abortedRequestId: string;
};

export type ErrorResponse = {
  type: MessageType.ErrorResponse;
  error: string;
};

export type AbortResponse = {
  type: MessageType.AbortResponse;
  abortedRequestId: string;
};

export type Message =
  | CredentialCreationRequest
  | CredentialCreationResponse
  | CredentialGetRequest
  | CredentialGetResponse
  | AbortRequest
  | AbortResponse
  | ErrorResponse;
