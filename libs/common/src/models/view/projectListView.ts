import { View } from "./view";

export class ProjectListView implements View {
  id: string;
  organizationId: string;
  name: string;
  creationDate: string;
  revisionDate: string;
}
