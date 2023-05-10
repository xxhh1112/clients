import { Meta, Story } from "@storybook/angular";

import { BitIconComponent } from "./icon.component";
import { selection } from "./selection";

export default {
  title: "Component Library/Icon",
  component: BitIconComponent,
  args: {
    icon: "reportExposedPasswords",
  },
} as Meta;

const Template: Story<BitIconComponent> = (args: BitIconComponent) => ({
  props: args,
  template: `
  <div class="tw-bg-primary-500 tw-p-5">
    <bit-icon [icon]="icon" class="tw-text-primary-300"></bit-icon>
  </div>
  `,
});

export const ReportExposedPasswords = Template.bind({});

export const UnknownIcon = Template.bind({});
UnknownIcon.args = {
  icon: "unknown",
};

const AllIconsTemplate = () => ({
  template: `
    <table class="tw-text-lg tw-text-main">
      <thead>
        <tr>
          <th>Name</th>
          <th>Icon</th>
        </tr>
      </thead>
      <tbody>
        ${selection.icons
          .map(
            (icon) => `
        <tr>
          <td class="tw-p-1">${icon.properties.name}</td>
          <td class="tw-p-1"><bit-icon name="${icon.properties.name}"></bit-icon></td>
        </tr>
      `
          )
          .join("\n")}
      </tbody>
    </table>
  `,
});

export const AllIcons = AllIconsTemplate.bind({});
