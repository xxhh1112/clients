import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { BadgeModule } from "../badge";
import { ButtonModule } from "../button/button.module";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupComponent } from "./button-group.component";

export default {
  title: "Component Library/Button Group",
  component: ButtonGroupComponent,
  args: {
    size: "default",
    selected: "left",
  },
  decorators: [
    moduleMetadata({
      declarations: [ButtonGroupComponent, ButtonGroupElementComponent],
      imports: [ButtonModule, BadgeModule],
    }),
  ],
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
    <bit-button-group [size]="size" [(selected)]="selected" label="Example with 3 grouped buttons">
      <bit-button-group-element value="left">
        Left <span bitBadge badgeType="info">1</span>
      </bit-button-group-element>

      <bit-button-group-element value="center">
        Center
      </bit-button-group-element>

      <bit-button-group-element value="right">
        Right
      </bit-button-group-element>
    </bit-button-group>
  `,
});

export const Default = Template.bind({});
Default.args = {
  size: "default",
  selected: "left",
};

export const Small = Template.bind({});
Small.args = {
  size: "small",
  selected: "left",
};
