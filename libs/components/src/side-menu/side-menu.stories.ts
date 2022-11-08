import { RouterModule } from "@angular/router";
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { Utils } from "@bitwarden/common/misc/utils";

import { Item } from "./item.model";
import { Organization } from "./organization.model";
import { SideMenuComponent } from "./side-menu.component";
import { FiltersModule } from "./side-menu.module";

const createOrganization = (
  name: string,
  collections: ReturnType<typeof createCollection>[]
): Organization => {
  const route = `organizations/${Utils.newGuid()}`;
  return {
    name,
    route,
    collections: collections.map((c) => c(route)),
  };
};

const createCollection =
  (name: string, children: ((parentRoute: string) => Item)[] = []) =>
  (parentRoute = ""): Item => {
    const route = `${parentRoute}/collections/${Utils.newGuid()}`;
    return {
      name,
      route,
      children: children.map<Item>((c) => c(route)),
    };
  };

export default {
  title: "Component Library/Side Menu",
  component: SideMenuComponent,
  decorators: [
    moduleMetadata({
      imports: [
        FiltersModule,
        RouterModule.forRoot(
          [
            { path: "", children: [] },
            { path: "**", children: [] },
          ],
          { useHash: true }
        ),
      ],
    }),
  ],
} as Meta;

const Template: Story<SideMenuComponent> = (args: SideMenuComponent) => ({
  props: args,
  template: `<bit-side-menu [collections]="collections" [organizations]="organizations"></bit-side-menu>`,
});

export const PersonalVault = Template.bind({});
PersonalVault.args = {
  organizations: [
    createOrganization("Acme", [
      createCollection("Top Collection 1", [
        createCollection("Sub Collection 1A", [createCollection("Sub Collection 1AX")]),
        createCollection("Sub Collection 1B", [createCollection("Sub Collection 1BX")]),
      ]),
      createCollection("Top Collection 2", [
        createCollection("Sub Collection 2A", [createCollection("Sub Collection 2AX")]),
        createCollection("Sub Collection 2B", [createCollection("Sub Collection 2BX")]),
      ]),
      createCollection("Top Collection 3"),
    ]),
    createOrganization("Initech", [
      createCollection("Top Collection 1", [
        createCollection("Sub Collection 1A", [createCollection("Sub Collection 1AX")]),
        createCollection("Sub Collection 1B", [createCollection("Sub Collection 1BX")]),
      ]),
      createCollection("Top Collection 2", [
        createCollection("Sub Collection 2A", [createCollection("Sub Collection 2AX")]),
        createCollection("Sub Collection 2B", [createCollection("Sub Collection 2BX")]),
      ]),
      createCollection("Top Collection 3"),
    ]),
  ],
  folders: [],
};

export const OrganizationVault = Template.bind({});
OrganizationVault.args = {
  collections: [
    createCollection("Top Collection 1", [
      createCollection("Sub Collection 1A", [createCollection("Sub Collection 1AX")]),
      createCollection("Sub Collection 1B", [createCollection("Sub Collection 1BX")]),
    ])(),
    createCollection("Top Collection 2", [
      createCollection("Sub Collection 2A", [createCollection("Sub Collection 2AX")]),
      createCollection("Sub Collection 2B", [createCollection("Sub Collection 2BX")]),
    ])(),
    createCollection("Top Collection 3")(),
  ],
  folders: [],
};
