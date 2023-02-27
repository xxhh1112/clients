import { EncString } from "@bitwarden/common/models/domain/enc-string";

export class Project {
  id: string;
  organizationId: string;
  name: EncString;
  creationDate: Date;
  revisionDate: Date;

  keyIdentifier(): string | null {
    return this.organizationId;
  }
}
