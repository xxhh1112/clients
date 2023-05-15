import { Meta, StoryFn } from "@storybook/angular";

import { ProgressComponent } from "./progress.component";

export default {
  title: "Component Library/Progress",
  component: ProgressComponent,
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A18185&t=AM0acaIJ00BUhZKz-4",
    },
  },
  args: {
    showText: true,
    size: "default",
    bgColor: "primary",
  },
} as Meta;

const Template: StoryFn<ProgressComponent> = (args: ProgressComponent) => ({
  props: args,
});

export const Empty = {
  render: Template,

  args: {
    barWidth: 0,
  },
};

export const Full = {
  render: Template,

  args: {
    barWidth: 100,
  },
};

export const CustomText = {
  render: Template,

  args: {
    barWidth: 25,
    text: "Loading...",
  },
};
