import { EncString } from "@bitwarden/common/models/domain/enc-string";

export class Secret {
  id: string;
  organizationId: string;
  name: EncString;
  value: EncString;
  note: EncString;
  creationDate: Date;
  revisionDate: Date;

  keyIdentifier(): string | null {
    return this.organizationId;
  }
}
