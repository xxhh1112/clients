import { Meta, Story } from "@storybook/angular";

import { BitIconButtonComponent } from "./icon-button.component";

export default {
  title: "Component Library/Icon Button",
  component: BitIconButtonComponent,
  args: {
    bitIconButton: "bwi-plus",
    style: "primary",
    size: "default",
    disabled: false,
  },
} as Meta;

const ControlsTemplate: Story<BitIconButtonComponent> = (args: BitIconButtonComponent) => ({
  props: args,
  template: `
  <div class="tw-p-5" [class.tw-bg-primary-500]="style === 'contrast'">
    <button [bitIconButton]="bitIconButton" [style]="style" [size]="size" [disabled]="disabled"></button>
  </div>
  `,
});

export const Controls = ControlsTemplate.bind({});
