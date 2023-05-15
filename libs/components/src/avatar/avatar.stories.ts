import { Meta, StoryFn } from "@storybook/angular";

import { AvatarComponent } from "./avatar.component";

export default {
  title: "Component Library/Avatar",
  component: AvatarComponent,
  args: {
    id: undefined,
    text: "Walt Walterson",
    size: "default",
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A16994",
    },
  },
} as Meta;

const Template: StoryFn<AvatarComponent> = (args: AvatarComponent) => ({
  props: args,
});

export const Default = {
  render: Template,

  args: {
    color: "#175ddc",
  },
};

export const Large = {
  render: Template,

  args: {
    size: "large",
  },
};

export const Small = {
  render: Template,

  args: {
    size: "small",
  },
};

export const LightBackground = {
  render: Template,

  args: {
    color: "#d2ffcf",
  },
};

export const Border = {
  render: Template,

  args: {
    border: true,
  },
};

export const ColorByID = {
  render: Template,

  args: {
    id: 236478,
  },
};

export const ColorByText = {
  render: Template,

  args: {
    text: "Jason Doe",
  },
};
