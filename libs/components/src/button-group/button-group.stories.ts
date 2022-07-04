import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { ButtonModule } from "../button/button.module";

import { ButtonGroupElementComponent } from "./button-group-element.component";
import { ButtonGroupComponent } from "./button-group.component";

export default {
  title: "Component Library/Button Group",
  component: ButtonGroupComponent,
  decorators: [
    moduleMetadata({
      declarations: [ButtonGroupComponent, ButtonGroupElementComponent],
      imports: [ButtonModule],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A17157",
    },
  },
} as Meta;

const Template: Story<ButtonGroupComponent> = () => ({
  template: `
    <bit-button-group>
      <bit-button-group-element>
        Left
      </bit-button-group-element>

      <bit-button-group-element>
        Center
      </bit-button-group-element>

      <bit-button-group-element>
        Right
      </bit-button-group-element>
    </bit-button-group>
  `,
});

export const Standard = Template.bind({});
