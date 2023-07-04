import { Component, Input } from "@angular/core";
import { action } from "@storybook/addon-actions";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { ButtonModule } from "../button";
import { IconButtonModule } from "../icon-button";

import { AsyncContextService } from "./async-context.service";
import { BitAsyncClickDirective } from "./bit-async-click.directive";
import { BitAsyncDisableDirective } from "./bit-async-disable.directive";

@Component({
  template: `<h3 *ngIf="name" class="tw-text-main">{{ name }}</h3>
    <button bitButton buttonType="primary" [bitAsyncClick]="action" class="tw-mr-2">Save</button>
    <button bitIconButton="bwi-trash" buttonType="danger" [bitAsyncClick]="trash"></button>`,
  selector: "app-group",
  providers: [AsyncContextService],
})
class GroupComponent {
  @Input() name?: string = undefined;

  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(resolve, 2000);
    });
  };

  trash = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(resolve, 2000);
    });
  };
}

@Component({
  template: `<h2 *ngIf="name" class="tw-text-main">Parent</h2>
    <button bitButton buttonType="primary" [bitAsyncClick]="action" class="tw-mr-2">
      Perform action
    </button>
    <ng-content></ng-content>`,
  selector: "app-parent",
  providers: [AsyncContextService],
})
class ParentComponent {
  @Input() name?: string = undefined;

  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(resolve, 2000);
    });
  };
}

export default {
  title: "Component Library/Async Actions/Contexts",
  decorators: [
    moduleMetadata({
      declarations: [
        BitAsyncClickDirective,
        BitAsyncDisableDirective,
        GroupComponent,
        ParentComponent,
      ],
      imports: [ButtonModule, IconButtonModule],
      providers: [
        {
          provide: ValidationService,
          useValue: {
            showError: action("ValidationService.showError"),
          } as Partial<ValidationService>,
        },
        {
          provide: LogService,
          useValue: {
            error: action("LogService.error"),
          } as Partial<LogService>,
        },
      ],
    }),
  ],
} as Meta;

type SimpleStory = StoryObj<GroupComponent>;
type ParentWithSiblingsStory = StoryObj<ParentComponent>;

export const Simple: SimpleStory = {
  render: (args) => ({
    props: args,
    template: `<app-group />`,
  }),
  parameters: {
    docs: {
      source: {
        language: "typescript",
        code: `
@Component({
  template: \`
    <button bitButton buttonType="primary" [bitAsyncClick]="action" class="tw-mr-2">Save</button>
    <button bitIconButton="bwi-trash" buttonType="danger" [bitAsyncClick]="trash"></button>\`,
  selector: "app-group",
  providers: [AsyncContextService],
})
class GroupComponent {
  @Input() name?: string = undefined;

  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(resolve, 2000);
    });
  };

  trash = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(resolve, 2000);
    });
  };
}`,
      },
    },
  },
};

export const NestedParentWithSiblings: ParentWithSiblingsStory = {
  render: (args) => ({
    props: args,
    template: `
    <app-parent class="tw-block tw-border tw-border-solid tw-border-secondary-500 tw-p-3">
      <app-parent class="tw-block tw-mt-3 tw-border tw-border-solid tw-border-secondary-500 tw-p-3">
        <div class="tw-mt-3 tw-flex">
          <div class="tw-border tw-border-solid tw-border-secondary-500 tw-p-3">
            <app-group name="Nested group A" />
          </div>
          <div class="tw-ml-3 tw-border tw-border-solid tw-border-secondary-500 tw-p-3">
            <app-group name="Nested group B" />
          </div>
        </div>
      </app-parent>
    </app-parent>`,
  }),
};
