import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";

import { SharedModule } from "../shared";
import { I18nMockService } from "../utils/i18n-mock.service";

import { BadgeListComponent } from "./badge-list.component";
import { BadgeDirective, BadgeTypes } from "./badge.directive";

export default {
  title: "Component Library/Badge",
  decorators: [
    moduleMetadata({
      imports: [SharedModule],
      declarations: [BadgeDirective, BadgeListComponent],
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              plusNMore: (n) => `+ ${n} more`,
            });
          },
        },
      ],
    }),
  ],
  args: {
    badgeType: "primary",
  },
  argTypes: {
    badgeType: {
      options: ["primary", "secondary", "success", "danger", "warning", "info"] as BadgeTypes[],
      control: { type: "inline-radio" },
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/f32LSg3jaegICkMu7rPARm/Tailwind-Component-Library-Update?node-id=1881%3A16956",
    },
  },
} as Meta;

const Template: Story<BadgeDirective> = (args: BadgeDirective) => ({
  props: args,
  template: `
    <span class="tw-text-main">Span </span><span bitBadge [badgeType]="badgeType">Badge</span>
    <br><br>
    <span class="tw-text-main">Link </span><a href="#" bitBadge [badgeType]="badgeType">Badge</a>
    <br><br>
    <span class="tw-text-main">Button </span><button bitBadge [badgeType]="badgeType">Badge</button>
  `,
});

export const Primary = Template.bind({});
Primary.args = {};

export const Secondary = Template.bind({});
Secondary.args = {
  badgeType: "secondary",
};

export const Success = Template.bind({});
Success.args = {
  badgeType: "success",
};

export const Danger = Template.bind({});
Danger.args = {
  badgeType: "danger",
};

export const Warning = Template.bind({});
Warning.args = {
  badgeType: "warning",
};

export const Info = Template.bind({});
Info.args = {
  badgeType: "info",
};

const ListTemplate: Story<BadgeListComponent> = (args: BadgeListComponent) => ({
  props: args,
  template: `
  <bit-badge-list [badgeType]="badgeType" [maxItems]="maxItems" [items]="items"></bit-badge-list>`,
});

export const BadgeList = ListTemplate.bind({});
BadgeList.args = {
  badgeType: "info",
  maxItems: 3,
  items: ["Badge 1", "Badge 2", "Badge 3", "Badge 4", "Badge 5"],
};
