import { Component, importProvidersFrom } from "@angular/core";
import { RouterModule } from "@angular/router";
import { applicationConfig, Meta, moduleMetadata, StoryObj } from "@storybook/angular";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { I18nMockService } from "../utils/i18n-mock.service";

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
      providers: [
        {
          provide: I18nService,
          useFactory: () => {
            return new I18nMockService({
              goToPage: (page) => `Go to page ${page}`,
              lastPage: (page) => `Last page, Page ${page}`,
              previousPage: (page) => `Previous page, Page ${page}`,
              nextPage: (page) => `Next page, Page ${page}`,
            });
          },
        },
      ],
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

export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      // eslint-disable-next-line no-console
      handlePageChange: (page: number) => console.log("Page changed to:", page),
    },
    template: `
      <bit-pagination [totalPages]="totalPages" (pageChange)="handlePageChange($event)"></bit-pagination>
    `,
  }),
  args: {
    totalPages: 10,
    page: 1,
  },
};

export const Single: Story = {
  ...Default,
  args: {
    totalPages: 1,
    page: 1,
  },
};

export const WithoutPrevNext: Story = {
  ...Default,
  args: {
    totalPages: 7,
    page: 1,
  },
};
