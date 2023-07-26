import { Component, importProvidersFrom } from "@angular/core";
import { RouterModule } from "@angular/router";
import { applicationConfig, Meta, moduleMetadata, StoryObj } from "@storybook/angular";

import { BitPaginationComponent } from "./pagination.component";

@Component({
  template: "",
})
class EmptyComponent {}

export default {
  title: "Component Library/Pagination",
  decorators: [
    moduleMetadata({
      imports: [BitPaginationComponent, RouterModule],
    }),
    applicationConfig({
      providers: [
        importProvidersFrom(
          RouterModule.forRoot([{ path: "**", component: EmptyComponent }], { useHash: true })
        ),
      ],
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

export const Standalone: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-pagination [totalPages]="totalPages"></bit-pagination>
    `,
  }),
  args: {
    totalPages: 10,
    page: 1,
  },
};

export const WithTable: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-pagination [totalPages]="totalPages"></bit-pagination>
    `,
  }),
  args: {
    totalPages: 10,
    page: 1,
  },
};
