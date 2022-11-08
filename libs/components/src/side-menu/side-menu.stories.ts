import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { Utils } from "@bitwarden/common/misc/utils";

import { Item } from "./item.model";
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
  template: `<bit-side-menu [collections]="collections"></bit-side-menu>`,
});

export const Default = Template.bind({});
Default.args = {
  collections: [
    {
      id: Utils.newGuid(),
      name: "Top Collection 1",
      children: [
        {
          id: Utils.newGuid(),
          name: "Sub Collection 1A",
          children: [{ id: Utils.newGuid(), name: "Sub Collection 1AX", children: [] }],
        },
        {
          id: Utils.newGuid(),
          name: "Sub Collection 1B",
          children: [{ id: Utils.newGuid(), name: "Sub Collection 1BY", children: [] }],
        },
      ],
    },
    {
      id: Utils.newGuid(),
      name: "Top Collection 2",
      children: [
        {
          id: Utils.newGuid(),
          name: "Sub Collection 2A",
          children: [{ id: Utils.newGuid(), name: "Sub Collection 2AX", children: [] }],
        },
        {
          id: Utils.newGuid(),
          name: "Sub Collection 2B",
          children: [{ id: Utils.newGuid(), name: "Sub Collection 2BY", children: [] }],
        },
      ],
    },
    { id: Utils.newGuid(), name: "Sub Collection 3", children: [] },
  ] as Item[],
  folders: [],
};
