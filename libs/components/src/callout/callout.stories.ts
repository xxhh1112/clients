import { Meta, moduleMetadata, StoryFn } from "@storybook/angular";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

import { I18nMockService } from "../utils/i18n-mock.service";

import { CalloutComponent } from "./callout.component";

export default {
  title: "Component Library/Callout",
  component: CalloutComponent,
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              warning: "Warning",
              error: "Error",
            });
          },
        },
      ],
    }),
  ],
  args: {
    type: "warning",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A17484",
    },
  },
} as Meta;

const Template: StoryFn<CalloutComponent> = (args: CalloutComponent) => ({
  props: args,
  template: `
    <bit-callout [type]="type" [title]="title">Content</bit-callout>
  `,
});

export const Success = {
  render: Template,

  args: {
    type: "success",
    title: "Success",
  },
};

export const Info = {
  render: Template,

  args: {
    type: "info",
    title: "Info",
  },
};

export const Warning = {
  render: Template,

  args: {
    type: "warning",
  },
};

export const Danger = {
  render: Template,

  args: {
    type: "danger",
  },
};
