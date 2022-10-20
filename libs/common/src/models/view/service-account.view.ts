import { View } from "./view";

export class ServiceAccountView implements View {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}
