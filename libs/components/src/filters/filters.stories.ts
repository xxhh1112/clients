import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { Utils } from "@bitwarden/common/misc/utils";

import { FiltersComponent } from "./filters.component";
import { FiltersModule } from "./filters.module";
import { Item } from "./item.model";

export default {
  title: "Component Library/Filters",
  component: FiltersComponent,
  decorators: [
    moduleMetadata({
      imports: [FiltersModule],
    }),
  ],
} as Meta;

const Template: Story<FiltersComponent> = (args: FiltersComponent) => ({
  props: args,
  template: `<bit-filters [collections]="collections"></bit-filters>`,
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
