import { Meta, Story } from "@storybook/angular";

import { BitIconButtonComponent } from "./icon-button.component";

export default {
  title: "Component Library/Icon Button",
  component: BitIconButtonComponent,
  args: {
    icon: "reportExposedPasswords",
  },
} as Meta;

const Template: Story<BitIconButtonComponent> = (args: BitIconButtonComponent) => ({
  props: args,
  template: `
  <div class="tw-bg-primary-500 tw-p-5">
    <button bitIconButton="bwi-star"></button>
  </div>
  `,
});

export const ReportExposedPasswords = Template.bind({});
