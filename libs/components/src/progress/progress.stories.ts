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
  args: {
    barWidth: 0,
    type: "strength",
    text: "Hello World",
  },
} as Meta;

const Template: Story<ProgressComponent> = (args: ProgressComponent) => ({
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  barWidth: 0,
};

export const _20 = Template.bind({});
_20.args = {
  barWidth: 20,
};

export const _40 = Template.bind({});
_40.args = {
  barWidth: 40,
};

export const _60 = Template.bind({});
_60.args = {
  barWidth: 60,
};

export const _80 = Template.bind({});
_80.args = {
  barWidth: 80,
};

export const Full = Template.bind({});
Full.args = {
  barWidth: 100,
};
