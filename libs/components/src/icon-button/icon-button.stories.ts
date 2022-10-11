import { Meta, Story } from "@storybook/angular";

import { BitIconButtonComponent, IconButtonType } from "./icon-button.component";

const buttonTypes: IconButtonType[] = [
  "contrast",
  "main",
  "muted",
  "primary",
  "secondary",
  "danger",
];

export default {
  title: "Component Library/Icon Button",
  component: BitIconButtonComponent,
  args: {
    bitIconButton: "bwi-plus",
    size: "default",
    disabled: false,
  },
  argTypes: {
    buttonTypes: { table: { disable: true } },
  },
} as Meta;

const Template: Story<BitIconButtonComponent> = (args: BitIconButtonComponent) => ({
  props: { ...args, buttonTypes },
  template: `
  <table class="tw-border-spacing-2 tw-text-center tw-text-main">
    <thead>
      <tr>
        <td></td>
        <td *ngFor="let buttonType of buttonTypes" class="tw-capitalize tw-font-bold tw-p-4"
          [class.tw-text-contrast]="buttonType === 'contrast'"
          [class.tw-bg-primary-500]="buttonType === 'contrast'">{{buttonType}}</td>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td class="tw-font-bold tw-p-4 tw-text-left">Default</td>
          <td *ngFor="let buttonType of buttonTypes" class="tw-p-2" [class.tw-bg-primary-500]="buttonType === 'contrast'">
            <button
              [bitIconButton]="bitIconButton"
              [buttonType]="buttonType"
              [size]="size"
              title="Example icon button"
              aria-label="Example icon button"></button>
          </td>
      </tr>

      <tr>
        <td class="tw-font-bold tw-p-4 tw-text-left">Disabled</td>
          <td *ngFor="let buttonType of buttonTypes" class="tw-p-2" [class.tw-bg-primary-500]="buttonType === 'contrast'">
            <button
              [bitIconButton]="bitIconButton"
              [buttonType]="buttonType"
              [size]="size"
              disabled
              title="Example icon button"
              aria-label="Example icon button"></button>
          </td>
      </tr>

      <tr>
        <td class="tw-font-bold tw-p-4 tw-text-left">Loading</td>
          <td *ngFor="let buttonType of buttonTypes" class="tw-p-2" [class.tw-bg-primary-500]="buttonType === 'contrast'">
            <button
              [bitIconButton]="bitIconButton"
              [buttonType]="buttonType"
              [size]="size"
              loading="true"
              title="Example icon button"
              aria-label="Example icon button"></button>
          </td>
      </tr>
    </tbody>
  </table>
  `,
});

export const AllDefault = Template.bind({});
AllDefault.args = {
  size: "default",
};

export const AllSmall = Template.bind({});
AllSmall.args = {
  size: "small",
};

const SingleTemplate: Story<BitIconButtonComponent> = (args: BitIconButtonComponent) => ({
  props: args,
  template: `
    <button
      [bitIconButton]="bitIconButton"
      [buttonType]="buttonType"
      [size]="size"
      [loading]="loading"
      [title]="title"
      [attr.aria-label]="ariaLabel"></button>
  `,
});
export const Single = SingleTemplate.bind({});
Single.args = {
  bitIconButton: "bwi-star",
  buttonType: "primary",
  size: "default",
  loading: false,
  title: "Example icon button",
  ariaLabel: "Example icon button",
};
