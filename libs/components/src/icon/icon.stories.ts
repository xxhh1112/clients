import { Meta, StoryFn } from "@storybook/angular";

import { BitIconComponent } from "./icon.component";

export default {
  title: "Component Library/Icon",
  component: BitIconComponent,
  args: {
    icon: "reportExposedPasswords",
  },
} as Meta;

const Template: StoryFn<BitIconComponent> = (args: BitIconComponent) => ({
  props: args,
  template: `
  <div class="tw-bg-primary-500 tw-p-5">
    <bit-icon [icon]="icon" class="tw-text-primary-300"></bit-icon>
  </div>
  `,
});

export const ReportExposedPasswords = {
  render: Template,
};

export const UnknownIcon = {
  render: Template,

  args: {
    icon: "unknown",
  },
};
