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

export const OpenRight: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-popover [header]="'Example Header'">
        <div>Lorem ipsum dolor <a href="#">adipisicing elit</a>.</div>
        <ul class="tw-mt-2 tw-mb-0 tw-pl-4">
          <li>Dolor sit amet consectetur</li>
          <li>Adipisicing elit. Ipsum <a href="#">iustolaborum</a></li>
        </ul>
      </bit-popover>
      `,
  }),
};

export const OpenLeft: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="text-align: right;">
        <bit-popover [header]="'Example Header'">
          <div>Lorem ipsum dolor sit <a href="#">adipisicing elit</a>.</div>
          <ul class="tw-mt-2 tw-mb-0 tw-pl-4">
            <li>Dolor sit amet consectetur</li>
            <li>Adipisicing elit ipsum <a href="#">iustolaborum</a></li>
          </ul>
        </bit-popover>
      </div>
      `,
  }),
};
