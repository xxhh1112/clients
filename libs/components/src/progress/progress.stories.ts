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
              weak: "Weak",
              good: "Good",
              strong: "Strong",
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
    showText: true,
    size: "default",
    type: "percent",
  },
} as Meta;

const Template: Story<ProgressComponent> = (args: ProgressComponent) => ({
  props: args,
});

export const Default = Template.bind({});
Default.args = {};

export const _25Percent = Template.bind({});
_25Percent.args = {
  barWidth: 25,
};

export const _50Percent = Template.bind({});
_50Percent.args = {
  barWidth: 50,
};

export const _75Percent = Template.bind({});
_75Percent.args = {
  barWidth: 75,
};

export const _100Percent = Template.bind({});
_100Percent.args = {
  barWidth: 100,
};

export const WeakDanger = Template.bind({});
WeakDanger.args = {
  barWidth: 25,
  type: "strength",
};

export const WeakWarning = Template.bind({});
WeakWarning.args = {
  barWidth: 50,
  type: "strength",
};

export const Good = Template.bind({});
Good.args = {
  barWidth: 75,
  type: "strength",
};

export const Strong = Template.bind({});
Strong.args = {
  barWidth: 100,
  type: "strength",
};
