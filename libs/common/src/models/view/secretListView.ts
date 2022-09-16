import { View } from "./view";

export class SecretListView implements View {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}
