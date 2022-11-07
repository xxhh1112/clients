import { Meta, Story } from "@storybook/angular";

import { FiltersComponent } from "./filters.component";

export default {
  title: "Component Library/Filters",
  component: FiltersComponent,
} as Meta;

const Template: Story<FiltersComponent> = (args: FiltersComponent) => ({
  props: args,
  template: `<bit-filters></bit-filters>`,
});

export const Default = Template.bind({});
