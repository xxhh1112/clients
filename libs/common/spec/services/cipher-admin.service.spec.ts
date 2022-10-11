import { mock, mockReset } from "jest-mock-extended";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { CipherAdminService } from "@bitwarden/common/services/cipher/cipher-admin.service";

describe("Cipher Admin Service", () => {
  const apiService = mock<ApiService>();
  const i18nService = mock<I18nService>();

  let cipherAdminService: CipherAdminService;

  beforeEach(() => {
    mockReset(apiService);
    mockReset(i18nService);

    cipherAdminService = new CipherAdminService(apiService, i18nService);
  });
  describe("getOrganizationCipherViews", () => {
    it("it should send get call to server to retrieve cipher-views", async () => {
      const organizationId = "organizationId";

      const response: any = [];
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.getOrganizationCipherViews(organizationId);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(response);
      expect(apiService.send).toHaveBeenCalledWith(
        "GET",
        "/ciphers/organization-details?organizationId=" + organizationId,
        null,
        true,
        true
      );
    });
  });

  describe("putCipherCollectionsAdmin", () => {
    it("it should send put call to server to update cipherCollections", async () => {
      const id = "testId";
      const request = new CipherCollectionsRequest(["collectionIds"]);

      const response: any = [];
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.putCipherCollectionsAdmin(id, request);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(response);
      expect(apiService.send).toHaveBeenCalledWith(
        "PUT",
        "/ciphers/" + id + "/collections-admin",
        request,
        true,
        false
      );
    });
  });

  describe("getCipherAdmin", () => {
    it("it should send get call to server to retrieve cipher-admin", async () => {
      const id = "testId";
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.getCipherAdmin(id);
      const expectedResult = new CipherResponse(response);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(expectedResult);
      expect(apiService.send).toHaveBeenCalledWith(
        "GET",
        "/ciphers/" + id + "/admin",
        null,
        true,
        true
      );
    });
  });

  describe("postCipherAdmin", () => {
    it("it should send post call to server", async () => {
      const cipher: Cipher = new Cipher();
      const request = new CipherCreateRequest(cipher);
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.postCipherAdmin(request);
      const expectedResult = new CipherResponse(response);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(expectedResult);
      expect(apiService.send).toHaveBeenCalledWith("POST", "/ciphers/admin", request, true, true);
    });
  });

  describe("putCipherAdmin", () => {
    it("it should send put call to server", async () => {
      const id = "testId";
      const cipher: Cipher = new Cipher();
      const request = new CipherRequest(cipher);
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.putCipherAdmin(id, request);
      const expectedResult = new CipherResponse(response);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(expectedResult);
      expect(apiService.send).toHaveBeenCalledWith(
        "PUT",
        "/ciphers/" + id + "/admin",
        request,
        true,
        true
      );
    });
  });

  describe("deleteCipherAdmin", () => {
    it("it should send delete call to server", async () => {
      const id = "testId";
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.deleteCipherAdmin(id);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(response);
      expect(apiService.send).toHaveBeenCalledWith(
        "DELETE",
        "/ciphers/" + id + "/admin",
        null,
        true,
        false
      );
    });
  });

  describe("deleteManyCiphersAdmin", () => {
    it("it should send delete call to server to delete many cipher", async () => {
      const request: CipherBulkDeleteRequest = new CipherBulkDeleteRequest(["collectionIds"]);
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.deleteManyCiphersAdmin(request);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(response);
      expect(apiService.send).toHaveBeenCalledWith(
        "DELETE",
        "/ciphers/admin",
        request,
        true,
        false
      );
    });
  });

  describe("putDeleteCipherAdmin", () => {
    it("it should send put call to server to delete cipher", async () => {
      const id = "testId";
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.putDeleteCipherAdmin(id);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(response);
      expect(apiService.send).toHaveBeenCalledWith(
        "PUT",
        "/ciphers/" + id + "/delete-admin",
        null,
        true,
        false
      );
    });
  });

  describe("putDeleteManyCiphersAdmin", () => {
    it("it should send put call to server to delete many cipher", async () => {
      const request: CipherBulkDeleteRequest = new CipherBulkDeleteRequest(["collectionIds"]);
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.putDeleteManyCiphersAdmin(request);
      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(response);
      expect(apiService.send).toHaveBeenCalledWith(
        "PUT",
        "/ciphers/delete-admin",
        request,
        true,
        false
      );
    });
  });

  describe("putRestoreCipherAdmin", () => {
    it("it should send put call to server to restore cipher", async () => {
      const id = "testId";
      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await cipherAdminService.putRestoreCipherAdmin(id);
      const expectedResult = new CipherResponse(response);

      expect(apiService.send).toBeCalledTimes(1);
      expect(result).toEqual(expectedResult);
      expect(apiService.send).toHaveBeenCalledWith(
        "PUT",
        "/ciphers/" + id + "/restore-admin",
        null,
        true,
        true
      );
    });
  });
});
