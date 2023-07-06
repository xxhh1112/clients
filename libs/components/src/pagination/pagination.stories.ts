import { RouterTestingModule } from "@angular/router/testing";
import { Meta, moduleMetadata, StoryObj } from "@storybook/angular";

import { BitPaginationComponent } from "./pagination.component";

export default {
  title: "Component Library/Pagination",
  decorators: [
    moduleMetadata({
      imports: [BitPaginationComponent, RouterTestingModule],
    }),
  ],
  argTypes: {
    totalPages: {
      control: { type: "number" },
    },
    page: {
      control: { type: "number" },
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A18371",
    },
  },
} as Meta;

type Story = StoryObj;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-pagination [totalPages]="totalPages" [(page)]="page"></bit-pagination>
    `,
  }),
  args: {
    totalPages: 10,
    page: 1,
  },
};
