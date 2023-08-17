import { A11yModule } from "@angular/cdk/a11y";
import { OverlayModule } from "@angular/cdk/overlay";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { PopoverTriggerForDirective } from "./popover-trigger-for.directive";
import { PopoverComponent } from "./popover.component";

export default {
  title: "Component Library/Popover",
  component: PopoverTriggerForDirective,
  decorators: [
    moduleMetadata({
      imports: [A11yModule, OverlayModule, PopoverComponent],
      declarations: [PopoverTriggerForDirective],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1717-15868",
    },
  },
} as Meta;

type Story = StoryObj<PopoverTriggerForDirective>;

const popoverContent = `
  <bit-popover [header]="'Example Header'" #myPopover>
    <div>Lorem ipsum dolor <a href="#">adipisicing elit</a>.</div>
    <ul class="tw-mt-2 tw-mb-0 tw-pl-4">
      <li>Dolor sit amet consectetur</li>
      <li>Esse labore veniam tempora</li>
      <li>Adipisicing elit ipsum <a href="#">iustolaborum</a></li>
    </ul>
  </bit-popover>
`;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const RightStart: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'right-start'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const RightCenter: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'right-center'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const RightEnd: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'right-end'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const LeftStart: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-end">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'left-start'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const LeftCenter: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-end">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'left-center'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};
export const LeftEnd: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-end">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'left-end'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const BelowStart: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'below-start'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const BelowCenter: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'below-center'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const BelowEnd: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'below-end'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const AboveStart: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'above-start'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const AboveCenter: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'above-center'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const AboveEnd: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'above-end'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};
