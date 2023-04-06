import { RequestUrlParts } from "../models/api/request-url-parts.model";
import { ErrorResponse } from "../models/response/error.response";

export abstract class ApiHelperService {
  //#region Http Request Creation

  // Note: createRequest && send here do not deal with auth.
  // For authed requests, the auth bearer token is attached in the api service
  // to avoid circular service dependencies
  createRequest: (
    method: "GET" | "POST" | "PUT" | "DELETE",
    requestUrlComponents: RequestUrlParts,
    body: any,
    hasResponse: boolean,
    alterHeaders?: (headers: Headers) => Promise<void> | void
  ) => Promise<Request>;

  //#endregion Http Request Creation

  //#region Http Request Execution

  fetch: (request: Request) => Promise<Response>;
  nativeFetch: (request: Request) => Promise<Response>;

  //#endregion Http Request Execution

  //#region Http Response Handling

  handleResponse: (response: Response, hasResponse: boolean, authed: boolean) => Promise<any>;

  handleError: (
    errorResponse: Response,
    tokenError: boolean,
    authed: boolean
  ) => Promise<ErrorResponse>;

  //#endregion Http Response Handling

  //#region Utility

  qsStringify: (params: any) => string;
  isJsonResponse: (response: Response) => boolean;
  getCredentials: () => RequestCredentials;

  //#endregion Utility
}
