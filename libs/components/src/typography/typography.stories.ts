import { Meta, StoryFn } from "@storybook/angular";

import { TypographyDirective } from "./typography.directive";

export default {
  title: "Component Library/Typography",
  component: TypographyDirective,
  args: {
    bitTypography: "body1",
  },
} as Meta;

const Template: StoryFn = (args) => ({
  props: args,
  template: `<span [bitTypography]="bitTypography" class="tw-text-main">{{text}}</span>`,
});

export const H1 = {
  render: Template,

  args: {
    bitTypography: "h1",
    text: "h1. Page Title",
  },
};

export const H2 = {
  render: Template,

  args: {
    bitTypography: "h2",
    text: "h2. Page Section",
  },
};

export const H3 = {
  render: Template,

  args: {
    bitTypography: "h3",
    text: "h3. Page Section",
  },
};

export const H4 = {
  render: Template,

  args: {
    bitTypography: "h4",
    text: "h4. Page Section",
  },
};

export const H5 = {
  render: Template,

  args: {
    bitTypography: "h5",
    text: "h5. Page Section",
  },
};

export const H6 = {
  render: Template,

  args: {
    bitTypography: "h6",
    text: "h6. Page Section",
  },
};

export const Body1 = {
  render: Template,

  args: {
    bitTypography: "body1",
    text: "Body 1",
  },
};

export const Body2 = {
  render: Template,

  args: {
    bitTypography: "body2",
    text: "Body 2",
  },
};

export const Helper = {
  render: Template,

  args: {
    bitTypography: "helper",
    text: "Helper Text",
  },
};
