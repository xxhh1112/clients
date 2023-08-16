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
      type: "number",
      description: "The total number of pages in the associated table.",
      defaultValue: 1,
    },
    queryParam: {
      type: "string",
      description: "The query parameter key associated with the current page number.",
      defaultValue: "page",
    },
    pageChange: {
      action: "pageChange",
      description: "Fires when the query parameter supplied by `queryParam` changes.",
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
    },
    template: `
      <bit-pagination [totalPages]="totalPages" [queryParam]="queryParam" (pageChange)="pageChange($event)"></bit-pagination>
    `,
  }),
  args: {
    totalPages: 10,
    queryParam: "page",
  },
};

export const Single: Story = {
  ...Default,
  args: {
    totalPages: 1,
  },
};

export const WithoutPrevNext: Story = {
  ...Default,
  args: {
    totalPages: 7,
  },
};
