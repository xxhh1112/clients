import { SecretProjectView } from "./secret-project.view";

export class SecretView {
  id: string;
  organizationId: string;
  name: string;
  value: string;
  note: string;
  creationDate: Date;
  revisionDate: Date;
  projects: SecretProjectView[];
}
