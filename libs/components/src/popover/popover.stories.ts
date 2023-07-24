import { A11yModule } from "@angular/cdk/a11y";
import { OverlayModule } from "@angular/cdk/overlay";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { PopoverComponent } from "./popover.component";

export default {
  title: "Component Library/Popover",
  component: PopoverComponent,
  decorators: [
    moduleMetadata({
      imports: [A11yModule, OverlayModule],
    }),
  ],
} as Meta;

type Story = StoryObj<PopoverComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
  },
};
