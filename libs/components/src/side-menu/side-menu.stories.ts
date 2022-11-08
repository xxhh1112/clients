import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { Utils } from "@bitwarden/common/misc/utils";

import { Item } from "./item.model";
import { Organization } from "./organization.model";
import { SideMenuComponent } from "./side-menu.component";
import { FiltersModule } from "./side-menu.module";

export default {
  title: "Component Library/Side Menu",
  component: SideMenuComponent,
  decorators: [
    moduleMetadata({
      imports: [FiltersModule],
    }),
  ],
} as Meta;

const Template: Story<SideMenuComponent> = (args: SideMenuComponent) => ({
  props: args,
  template: `<bit-side-menu [collections]="collections" [organizations]="organizations"></bit-side-menu>`,
});

export const PersonalVault = Template.bind({});
PersonalVault.args = {
  collections: [
    {
      route: Utils.newGuid(),
      name: "Top Collection 1",
      children: [
        {
          route: Utils.newGuid(),
          name: "Sub Collection 1A",
          children: [{ route: Utils.newGuid(), name: "Sub Collection 1AX", children: [] }],
        },
        {
          route: Utils.newGuid(),
          name: "Sub Collection 1B",
          children: [{ route: Utils.newGuid(), name: "Sub Collection 1BY", children: [] }],
        },
      ],
    },
    {
      route: Utils.newGuid(),
      name: "Top Collection 2",
      children: [
        {
          route: Utils.newGuid(),
          name: "Sub Collection 2A",
          children: [{ route: Utils.newGuid(), name: "Sub Collection 2AX", children: [] }],
        },
        {
          route: Utils.newGuid(),
          name: "Sub Collection 2B",
          children: [{ route: Utils.newGuid(), name: "Sub Collection 2BY", children: [] }],
        },
      ],
    },
    { route: Utils.newGuid(), name: "Sub Collection 3", children: [] },
  ] as Item[],
  folders: [],
};

export const OrganizationVault = Template.bind({});
OrganizationVault.args = {
  organizations: [
    {
      route: Utils.newGuid(),
      name: "Amce",
      collections: [
        {
          route: Utils.newGuid(),
          name: "Top Collection 1",
          children: [
            {
              route: Utils.newGuid(),
              name: "Sub Collection 1A",
              children: [{ route: Utils.newGuid(), name: "Sub Collection 1AX", children: [] }],
            },
            {
              route: Utils.newGuid(),
              name: "Sub Collection 1B",
              children: [{ route: Utils.newGuid(), name: "Sub Collection 1BY", children: [] }],
            },
          ],
        },
        {
          route: Utils.newGuid(),
          name: "Top Collection 2",
          children: [
            {
              route: Utils.newGuid(),
              name: "Sub Collection 2A",
              children: [{ route: Utils.newGuid(), name: "Sub Collection 2AX", children: [] }],
            },
            {
              route: Utils.newGuid(),
              name: "Sub Collection 2B",
              children: [{ route: Utils.newGuid(), name: "Sub Collection 2BY", children: [] }],
            },
          ],
        },
        { route: Utils.newGuid(), name: "Sub Collection 3", children: [] },
      ] as Item[],
    },
  ] as Organization[],
  folders: [],
};
