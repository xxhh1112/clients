import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

import { I18nMockService } from "../utils/i18n-mock.service";

import { ProgressComponent } from "./progress.component";

export default {
  title: "Component Library/Progress",
  component: ProgressComponent,
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              strong: "strong",
              good: "good",
              weak: "weak",
            });
          },
        },
      ],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      // TODO: Make sure this goes to the correct location in the figma file
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1717%3A15868",
    },
  },
} as Meta;

const Template: Story<ProgressComponent> = (args: ProgressComponent) => ({
  props: args,
});

export const Default = Template.bind({});
Default.args = {};
