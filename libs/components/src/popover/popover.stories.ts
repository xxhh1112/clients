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
  argTypes: {
    position: {
      options: [
        "right-start",
        "right-center",
        "right-end",
        "left-start",
        "left-center",
        "left-end",
        "below-start",
        "below-center",
        "below-end",
        "above-start",
        "above-center",
        "above-end",
      ],
      control: { type: "select" },
    },
  },
  args: {
    position: "right-start",
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
  args: {
    position: "right-start",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const RightCenter: Story = {
  args: {
    position: "right-center",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const RightEnd: Story = {
  args: {
    position: "right-end",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const LeftStart: Story = {
  args: {
    position: "left-start",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-end">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const LeftCenter: Story = {
  args: {
    position: "left-center",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-end">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};
export const LeftEnd: Story = {
  args: {
    position: "left-end",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-end">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const BelowStart: Story = {
  args: {
    position: "below-start",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const BelowCenter: Story = {
  args: {
    position: "below-center",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const BelowEnd: Story = {
  args: {
    position: "below-end",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const AboveStart: Story = {
  args: {
    position: "above-start",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const AboveCenter: Story = {
  args: {
    position: "above-center",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};

export const AboveEnd: Story = {
  args: {
    position: "above-end",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="tw-mt-32 tw-flex tw-justify-center">
        <button
          type="button"
          class="tw-border-none tw-bg-transparent tw-text-primary-500"
          [bitPopoverTriggerFor]="myPopover"
          [position]="'${args.position}'"
        >
          <i class="bwi bwi-question-circle"></i>
        </button>
      </div>
      ${popoverContent}
      `,
  }),
};
