import { EncString } from "@bitwarden/common/models/domain/enc-string";

export class AccessToken {
  id: string;
  name: EncString;
  scopes: string[];
  expireAt?: Date;
  creationDate: Date;
  revisionDate: Date;

  keyIdentifier(): string | null {
    return null;
  }
}
