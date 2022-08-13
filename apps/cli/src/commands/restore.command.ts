import { CipherApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api.service.abstraction";
import { CipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { Response } from "@bitwarden/node/cli/models/response";

export class RestoreCommand {
  constructor(
    private cipherService: CipherService,
    private cipherApiService: CipherApiServiceAbstraction
  ) {}

  async run(object: string, id: string): Promise<Response> {
    if (id != null) {
      id = id.toLowerCase();
    }

    switch (object.toLowerCase()) {
      case "item":
        return await this.restoreCipher(id);
      default:
        return Response.badRequest("Unknown object.");
    }
  }

  private async restoreCipher(id: string) {
    const cipher = await this.cipherService.get(id);
    if (cipher == null) {
      return Response.notFound();
    }
    if (cipher.deletedDate == null) {
      return Response.badRequest("Cipher is not in trash.");
    }

    try {
      await this.cipherApiService.restoreWithServer(id);
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }
}
