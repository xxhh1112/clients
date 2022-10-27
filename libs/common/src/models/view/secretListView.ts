import { ProjectsMappedToSecretResponse } from "../../../../../bitwarden_license/bit-web/src/app/sm/secrets/responses/projects-mapped-to-secret-response";

import { View } from "./view";

export class SecretListView implements View {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
  projects: ProjectsMappedToSecretResponse[];
}
