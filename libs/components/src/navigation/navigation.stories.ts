import { RouterTestingModule } from "@angular/router/testing";
import { Meta, moduleMetadata, Story } from "@storybook/angular";

import { NavigationDirective } from "./navigation.direction";

export default {
  title: "Component Library/Navigation",
  component: NavigationDirective,
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [RouterTestingModule],
    }),
  ],
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=4687%3A86642",
    },
  },
} as Meta;

const Template: Story<NavigationDirective> = (args: NavigationDirective) => ({
  props: args,
  template: `
    <a [routerLink]="['']" bitNavigation>
      <i class="bwi bwi-fw bwi-filter"></i>
      <span>Active link</span>
    </a>
    <a [routerLink]="['abc']" href="#" bitNavigation>
      <i class="bwi bwi-fw bwi-key"></i>
      <span>Anchor link</span>
    </a>
    `,
});

export const Default = Template.bind({});
