import { Meta, Story } from "@storybook/angular";

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
    size: "medium",
    bgColor: "primary",
  },
} as Meta;

const Template: Story<ProgressComponent> = (args: ProgressComponent) => ({
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  barWidth: 0,
};

export const _50Percent = Template.bind({});
_50Percent.args = {
  barWidth: 50,
};

export const _100Percent = Template.bind({});
_100Percent.args = {
  barWidth: 100,
};

export const CustomText = Template.bind({});
CustomText.args = {
  barWidth: 90,
  text: "Loading...",
};
