import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PasswordGenerationService } from "@bitwarden/common/abstractions/passwordGeneration.service";

import { ProgressComponent } from "./progress.component";

export default {
  title: "Component Library/Progress",
  component: ProgressComponent,
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: () => {
              return;
            },
          },
        },
        {
          provide: PasswordGenerationService,
          useValue: {
            passwordStrength: () => {
              return;
            },
          },
        },
      ],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1717%3A15868",
    },
  },
  args: {
    showText: true,
    email: "johndoe@mail.com",
    name: "John Doe",
    password: "",
  },
} as Meta;

const Template: Story<ProgressComponent> = (args: ProgressComponent) => ({
  props: args,
});

export const Empty = Template.bind({});
Empty.args = {};

export const Weak = Template.bind({});
Weak.args = {
  password: "2j&$P$QC",
};

export const Good = Template.bind({});
Good.args = {
  password: "BF^t6%b4zV",
};

export const Strong = Template.bind({});
Strong.args = {
  password: "$BuA2%p7Mt#avU7J",
};
