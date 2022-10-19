import { mock, mockReset } from "jest-mock-extended";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { FileUploadService } from "@bitwarden/common/abstractions/fileUpload.service";
import { CipherAttachmentApiService } from "@bitwarden/common/services/cipher/cipher-attachment-api.service";

import { Cipher } from "../../src/models/domain/cipher";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipher-share.request";
import { CipherResponse } from "@bitwarden/common/models/response/cipher.response";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipher-bulk-share.request";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachment.request";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachment-upload-data.response";
import { AttachmentResponse } from "@bitwarden/common/models/response/attachment.response";

describe("Cipher Attachment Service", () => {
  const cryptoService = mock<CryptoService>();
  const apiService = mock<ApiService>();
  const cipherService = mock<CipherService>();
  const fileUploadService = mock<FileUploadService>();
  const logService = mock<LogService>();

  let cipherAttachmentApiService: CipherAttachmentApiService;

  const cipher: CipherView = new CipherView();

  beforeEach(() => {
    mockReset(apiService);
    mockReset(cryptoService);
    mockReset(logService);
    mockReset(cipherService);
    mockReset(fileUploadService);

    cipherAttachmentApiService = new CipherAttachmentApiService(
      cipherService,
      apiService,
      cryptoService,
      fileUploadService,
      logService
    );
  });
  describe("deleteAttachmentWithServer", () => {
    it("it should send delete call to server", async () => {
      const id = "test1";
      const attachmentId = "attachmentId";

      const response: any = {};
      apiService.send.mockReturnValue(response);
      await cipherAttachmentApiService.deleteAttachmentWithServer(id, attachmentId);
      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "DELETE",
        "/ciphers/" + id + "/attachment/" + attachmentId,
        null,
        true,
        false
      );
    });
  });

  describe("deleteCipherAttachment", () => {
    it("it should send delete call to server", async () => {
      const id = "test1";
      const attachmentId = "attachmentId";

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.deleteCipherAttachment(id, attachmentId);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "DELETE",
        "/ciphers/" + id + "/attachment/" + attachmentId,
        null,
        true,
        false
      );
      expect(result).toEqual(response);
    });
  });

  describe("deleteCipherAttachmentAdmin", () => {
    it("it should send delete call to server for admin", async () => {
      const id = "test1";
      const attachmentId = "attachmentId";

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.deleteCipherAttachmentAdmin(id, attachmentId);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "DELETE",
        "/ciphers/" + id + "/attachment/" + attachmentId + "/admin",
        null,
        true,
        false
      );
      expect(result).toEqual(response);
    });
  });

  describe("putShareCipher", () => {
    it("it should send put call to server for a cipher sharing", async () => {
      cipher.id = "test1";
      cipher.organizationId = "organizationId";
      const request = new CipherShareRequest(new Cipher());

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.putShareCipher(cipher.id, request);
      const expectedResponse = new CipherResponse(response);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "PUT",
        "/ciphers/test1/share",
        request,
        true,
        true
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe("putShareCiphers", () => {
    it("it should send put call to server for bulk cipher sharing", async () => {
      const encCiphers: Cipher[] = [];
      const collectionIds: string[] = ["collectionIds"];
      const request = new CipherBulkShareRequest(encCiphers, collectionIds);

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.putShareCiphers(request);
      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith("PUT", "/ciphers/share", request, true, false);
      expect(result).toEqual(response);
    });
  });

  describe("postShareCipherAttachment", () => {
    it("it should send Post call to server for a cipher sharing", async () => {
      const id = "test1";
      const attachmentId = "attachmentId";
      const data: FormData = new FormData();
      const organizationId = "organizationId";

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.postShareCipherAttachment(
        id,
        attachmentId,
        data,
        organizationId
      );

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "POST",
        "/ciphers/" +
          id +
          "/attachment/" +
          attachmentId +
          "/share?organizationId=" +
          organizationId,
        data,
        true,
        false
      );
      expect(result).toEqual(response);
    });
  });

  describe("postCipherAttachment", () => {
    it("it should send Post call to server", async () => {
      const id = "test1";
      const request: AttachmentRequest = new AttachmentRequest();

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.postCipherAttachment(id, request);
      const expectedResponse = new AttachmentUploadDataResponse(response);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "POST",
        "/ciphers/" + id + "/attachment/v2",
        request,
        true,
        true
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe("getAttachmentData", () => {
    it("it should send get request to Server to emergency-access attachment ", async () => {
      const cipherId = "test1";
      const attachmentId = "attachmentId";
      const emergencyAccessId = "emergencyAccessId";

      const path =
        (emergencyAccessId != null ? "/emergency-access/" + emergencyAccessId + "/" : "/ciphers/") +
        cipherId +
        "/attachment/" +
        attachmentId;

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAttachmentApiService.getAttachmentData(
        cipherId,
        attachmentId,
        emergencyAccessId
      );
      const expectedResponse = new AttachmentResponse(response);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith("GET", path, null, true, true);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe("shareManyWithServer", () => {
    it("it should send Put request to Serve with list of collectionIds", async () => {
      const ciphers: CipherView[] = [];
      const organizationId = "organizationId";
      const collectionIds: string[] = ["collectionIds", "collectionIds1"];
      const encCiphers: Cipher[] = [];
      const request = new CipherBulkShareRequest(encCiphers, collectionIds);
      const response: any = {};
      apiService.send.mockReturnValue(response);
      await cipherAttachmentApiService.shareManyWithServer(ciphers, organizationId, collectionIds);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith("PUT", "/ciphers/share", request, true, false);
    });
  });
});
