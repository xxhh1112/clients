import { View } from "./view";

export class ProjectView implements View {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}
