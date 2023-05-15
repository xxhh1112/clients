import { Meta, StoryFn } from "@storybook/angular";

import { ColorPasswordComponent } from "./color-password.component";

const examplePassword = "Wq$Jk😀7j  DX#rS5Sdi!z ";

export default {
  title: "Component Library/Color Password",
  component: ColorPasswordComponent,
  args: {
    password: examplePassword,
    showCount: false,
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/6fvTDa3zfvgWdizLQ7nSTP/Numbered-Password",
    },
  },
} as Meta;

const Template: StoryFn<ColorPasswordComponent> = (args: ColorPasswordComponent) => ({
  props: args,
  template: `
  <bit-color-password class="tw-text-base" [password]="password" [showCount]="showCount"></bit-color-password>
  `,
});

const WrappedTemplate: StoryFn<ColorPasswordComponent> = (args: ColorPasswordComponent) => ({
  props: args,
  template: `
  <div class="tw-max-w-32">
    <bit-color-password class="tw-text-base" [password]="password" [showCount]="showCount"></bit-color-password>
  </div>
  `,
});

export const ColorPassword = {
  render: Template,
};

export const WrappedColorPassword = {
  render: WrappedTemplate,
};

export const ColorPasswordCount = {
  render: Template,

  args: {
    password: examplePassword,
    showCount: true,
  },
};

export const WrappedColorPasswordCount = {
  render: WrappedTemplate,

  args: {
    password: examplePassword,
    showCount: true,
  },
};
