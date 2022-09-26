import Substitute, { SubstituteOf } from "@fluffy-spoon/substitute";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { CipherAdminService } from "@bitwarden/common/services/cipher/cipher-admin.service";

jest.mock("@bitwarden/common/abstractions/api.service");

describe("Cipher Admin Service", () => {
  let apiServiceSpy: any;
  let i18nService: SubstituteOf<I18nService>;

  let cipherAadminService: CipherAdminService;

  beforeEach(() => {
    i18nService = Substitute.for<I18nService>();

    apiServiceSpy = {
      send: jest.fn(),
    };

    cipherAadminService = new CipherAdminService(apiServiceSpy, i18nService);
  });

  it("Should test getOrganizationCipherViews", async () => {
    const organizationId = "organizationId";

    const response: any = [];
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.getOrganizationCipherViews(organizationId);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(response);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "GET",
      "/ciphers/organization-details?organizationId=" + organizationId,
      null,
      true,
      true
    );
  });

  it("Should test putCipherCollectionsAdmin", async () => {
    const id = "testId";
    const request = new CipherCollectionsRequest(["collectionIds"]);

    const response: any = [];
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.putCipherCollectionsAdmin(id, request);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(response);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "PUT",
      "/ciphers/" + id + "/collections-admin",
      request,
      true,
      false
    );
  });

  it("Should test getCipherAdmin", async () => {
    const id = "testId";
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.getCipherAdmin(id);
    const expectedResult = new CipherResponse(response);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(expectedResult);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "GET",
      "/ciphers/" + id + "/admin",
      null,
      true,
      true
    );
  });

  it("Should test postCipherAdmin", async () => {
    const cipher: Cipher = new Cipher();
    const request = new CipherCreateRequest(cipher);
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.postCipherAdmin(request);
    const expectedResult = new CipherResponse(response);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(expectedResult);
    expect(apiServiceSpy.send).toHaveBeenCalledWith("POST", "/ciphers/admin", request, true, true);
  });

  it("Should test putCipherAdmin", async () => {
    const id = "testId";
    const cipher: Cipher = new Cipher();
    const request = new CipherRequest(cipher);
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.putCipherAdmin(id, request);
    const expectedResult = new CipherResponse(response);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(expectedResult);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "PUT",
      "/ciphers/" + id + "/admin",
      request,
      true,
      true
    );
  });

  it("Should test deleteCipherAdmin", async () => {
    const id = "testId";
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.deleteCipherAdmin(id);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(response);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "DELETE",
      "/ciphers/" + id + "/admin",
      null,
      true,
      false
    );
  });

  it("Should test deleteManyCiphersAdmin", async () => {
    const request: CipherBulkDeleteRequest = new CipherBulkDeleteRequest(["collectionIds"]);
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.deleteManyCiphersAdmin(request);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(response);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "DELETE",
      "/ciphers/admin",
      request,
      true,
      false
    );
  });

  it("Should test putDeleteCipherAdmin", async () => {
    const id = "testId";
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.putDeleteCipherAdmin(id);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(response);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "PUT",
      "/ciphers/" + id + "/delete-admin",
      null,
      true,
      false
    );
  });

  it("Should test putDeleteManyCiphersAdmin", async () => {
    const request: CipherBulkDeleteRequest = new CipherBulkDeleteRequest(["collectionIds"]);
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.putDeleteManyCiphersAdmin(request);
    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(response);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "PUT",
      "/ciphers/delete-admin",
      request,
      true,
      false
    );
  });

  it("Should test putRestoreCipherAdmin", async () => {
    const id = "testId";
    const response: any = {};
    jest
      .spyOn(apiServiceSpy, "send")
      .mockImplementation(
        (method: string, path: string, body: any, authed: boolean, hasResponse: boolean) => {
          return response;
        }
      );
    const result = await cipherAadminService.putRestoreCipherAdmin(id);
    const expectedResult = new CipherResponse(response);

    expect(apiServiceSpy.send).toBeCalledTimes(1);
    expect(result).toEqual(expectedResult);
    expect(apiServiceSpy.send).toHaveBeenCalledWith(
      "PUT",
      "/ciphers/" + id + "/restore-admin",
      null,
      true,
      true
    );
  });
});
