import { Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipherBulkShareRequest";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipherShareRequest";
import { AttachmentResponse } from "@bitwarden/common/models/response/attachmentResponse";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachmentUploadDataResponse";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { CipherAttachmentApiService } from "@bitwarden/common/services/cipher/cipher-attachment-api.service";

import { Cipher } from "./../../src/models/domain/cipher";
jest.mock("@bitwarden/common/abstractions/api.service");

describe("Cipher Attachment Service", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let apiServiceSpy: any;
  let cipherService: SubstituteOf<CipherService>;
  let logService: SubstituteOf<LogService>;

  let cipherAttachmentApiService: CipherAttachmentApiService;

  const cipher: CipherView = new CipherView();

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    logService = Substitute.for<LogService>();
    cipherService = Substitute.for<CipherService>();

    apiServiceSpy = {
      send: jest.fn(),
    };

    cipherAttachmentApiService = new CipherAttachmentApiService(
      cipherService,
      apiServiceSpy,
      cryptoService,
      logService
    );
  });

  it("Should test deleteAttachmentWithServer", async () => {
    const id = "test1";
    const attachmentId = "attachmentId";

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    await cipherAttachmentApiService.deleteAttachmentWithServer(id, attachmentId);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "DELETE",
      "/ciphers/" + id + "/attachment/" + attachmentId,
      null,
      true,
      false
    );
  });

  it("Should test putShareCipher", async () => {
    cipher.id = "test1";
    cipher.organizationId = "organizationId";
    const encCipher = await cipherService.encrypt(cipher);
    const request = new CipherShareRequest(encCipher);

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.putShareCipher(cipher.id, request);
    const expectedResponse = new CipherResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "PUT",
      "/ciphers/test1/share",
      request,
      true,
      true
    );
    expect(result).toEqual(expectedResponse);
  });

  it("Should test putShareCiphers", async () => {
    const encCiphers: Cipher[] = [];
    const collectionIds: string[] = ["collectionIds"];
    const request = new CipherBulkShareRequest(encCiphers, collectionIds);

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.putShareCiphers(request);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith("PUT", "/ciphers/share", request, true, false);
    expect(result).toEqual(response);
  });

  it("Should test postCipherAttachmentLegacy", async () => {
    const id = "test1";
    const data: FormData = new FormData();

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.postCipherAttachmentLegacy(id, data);
    const expectedResponse = new CipherResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "POST",
      "/ciphers/" + id + "/attachment",
      data,
      true,
      true
    );
    expect(result).toEqual(expectedResponse);
  });

  it("Should test postCipherAttachmentAdminLegacy", async () => {
    const id = "test1";
    const data: FormData = new FormData();

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.postCipherAttachmentAdminLegacy(id, data);
    const expectedResponse = new CipherResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "POST",
      "/ciphers/" + id + "/attachment-admin",
      data,
      true,
      true
    );
    expect(result).toEqual(expectedResponse);
  });

  it("Should test deleteCipherAttachment", async () => {
    const id = "test1";
    const attachmentId = "attachmentId";

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.deleteCipherAttachment(id, attachmentId);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "DELETE",
      "/ciphers/" + id + "/attachment/" + attachmentId,
      null,
      true,
      false
    );
    expect(result).toEqual(response);
  });

  it("Should test deleteCipherAttachmentAdmin", async () => {
    const id = "test1";
    const attachmentId = "attachmentId";

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.deleteCipherAttachmentAdmin(id, attachmentId);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "DELETE",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/admin",
      null,
      true,
      false
    );
    expect(result).toEqual(response);
  });

  it("Should test postShareCipherAttachment", async () => {
    const id = "test1";
    const attachmentId = "attachmentId";
    const data: FormData = new FormData();
    const organizationId = "organizationId";

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.postShareCipherAttachment(
      id,
      attachmentId,
      data,
      organizationId
    );

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "POST",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/share?organizationId=" + organizationId,
      data,
      true,
      false
    );
    expect(result).toEqual(response);
  });

  it("Should test postCipherAttachment", async () => {
    const id = "test1";
    const request: AttachmentRequest = new AttachmentRequest();

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.postCipherAttachment(id, request);
    const expectedResponse = new AttachmentUploadDataResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "POST",
      "/ciphers/" + id + "/attachment/v2",
      request,
      true,
      true
    );
    expect(result).toEqual(expectedResponse);
  });

  it("Should test postAttachmentFile", async () => {
    const id = "test1";
    const attachmentId = "attachmentId";
    const data: FormData = new FormData();

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.postAttachmentFile(id, attachmentId, data);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "POST",
      "/ciphers/" + id + "/attachment/" + attachmentId,
      data,
      true,
      false
    );
    expect(result).toEqual(response);
  });

  it("Should test renewAttachmentUploadUrl", async () => {
    const id = "test1";
    const attachmentId = "attachmentId";

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.renewAttachmentUploadUrl(id, attachmentId);
    const expectedResponse = new AttachmentUploadDataResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "GET",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/renew",
      null,
      true,
      true
    );
    expect(result).toEqual(expectedResponse);
  });

  it("Should test getAttachmentData", async () => {
    const cipherId = "test1";
    const attachmentId = "attachmentId";
    const emergencyAccessId = "emergencyAccessId";

    const path =
      (emergencyAccessId != null ? "/emergency-access/" + emergencyAccessId + "/" : "/ciphers/") +
      cipherId +
      "/attachment/" +
      attachmentId;

    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAttachmentApiService.getAttachmentData(
      cipherId,
      attachmentId,
      emergencyAccessId
    );
    const expectedResponse = new AttachmentResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith("GET", path, null, true, true);
    expect(result).toEqual(expectedResponse);
  });

  it("Should test shareManyWithServer", async () => {
    const ciphers: CipherView[] = [];
    const organizationId = "organizationId";
    const collectionIds: string[] = ["collectionIds", "collectionIds1"];
    const encCiphers: Cipher[] = [];
    const request = new CipherBulkShareRequest(encCiphers, collectionIds);
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    await cipherAttachmentApiService.shareManyWithServer(ciphers, organizationId, collectionIds);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith("PUT", "/ciphers/share", request, true, false);
  });

  it("Should test shareManyWithServer", async () => {
    const ciphers: CipherView[] = [];
    const organizationId = "organizationId";
    const collectionIds: string[] = ["collectionIds", "collectionIds1"];
    const encCiphers: Cipher[] = [];
    const request = new CipherBulkShareRequest(encCiphers, collectionIds);
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    await cipherAttachmentApiService.shareManyWithServer(ciphers, organizationId, collectionIds);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(apiServiceSpy.send).toHaveBeenCalledWith("PUT", "/ciphers/share", request, true, false);
  });
});
