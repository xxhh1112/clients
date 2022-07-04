import { Meta, Story } from "@storybook/angular";

import { ButtonGroupComponent } from "./button-group.component";

export default {
  title: "Component Library/Button Group",
  component: ButtonGroupComponent,
  args: {
    type: "primary",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A17157",
    },
  },
} as Meta;

const Template: Story<ButtonGroupComponent> = (args: ButtonGroupComponent) => ({
  props: args,
  template: `
    <bit-button-group [buttonType]="buttonType" [block]="block">
      Group
    </bit-button-group>
  `,
});

export const Primary = Template.bind({});
Primary.args = {
  type: "primary",
};
