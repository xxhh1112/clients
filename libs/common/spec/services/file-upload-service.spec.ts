import { mock, mockReset } from "jest-mock-extended";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachment-upload-data.response";
import { FileUploadService } from "@bitwarden/common/services/fileUpload.service";

describe("File Upload Service", () => {
  const apiService = mock<ApiService>();
  const logService = mock<LogService>();
  let fileUploadService: FileUploadService;

  beforeEach(() => {
    mockReset(apiService);
    mockReset(logService);

    fileUploadService = new FileUploadService(logService, apiService);
  });

  describe("postAttachmentFile", () => {
    it("it should send Post with attachment data to the server", async () => {
      const id = "test1";
      const attachmentId = "attachmentId";
      const data: FormData = new FormData();

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await fileUploadService.postAttachmentFile(id, attachmentId, data);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "POST",
        "/ciphers/" + id + "/attachment/" + attachmentId,
        data,
        true,
        false
      );
      expect(result).toEqual(response);
    });
  });

  describe("renewAttachmentUploadUrl", () => {
    it("it should send get request to Server for renew AttachmentUploaded Url ", async () => {
      const id = "test1";
      const attachmentId = "attachmentId";

      const response: any = {};
      apiService.send.mockReturnValue(response);
      const result = await fileUploadService.renewAttachmentUploadUrl(id, attachmentId);
      const expectedResponse = new AttachmentUploadDataResponse(response);

      expect(apiService.send).toBeCalledTimes(1);
      expect(apiService.send).toHaveBeenCalledWith(
        "GET",
        "/ciphers/" + id + "/attachment/" + attachmentId + "/renew",
        null,
        true,
        true
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
