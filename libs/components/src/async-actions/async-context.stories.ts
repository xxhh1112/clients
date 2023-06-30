import { Component } from "@angular/core";
import { action } from "@storybook/addon-actions";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";
import { delay, of } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { ButtonModule } from "../button";
import { IconButtonModule } from "../icon-button";

import { AsyncContextService } from "./async-context.service";
import { BitAsyncClickDirective } from "./bit-async-click.directive";
import { BitAsyncDisableDirective } from "./bit-async-disable.directive";

@Component({
  template: `<button bitButton buttonType="primary" [bitAsyncClick]="action" class="tw-mr-2">
      Perform action
    </button>
    <button bitIconButton="bwi-trash" buttonType="danger" [bitAsyncClick]="trash"></button>`,
  selector: "app-promise-example",
  providers: [AsyncContextService],
})
class SimpleExampleComponent {
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
  template: ``,
  selector: "app-observable-example",
  providers: [AsyncContextService],
})
class ObservableExampleComponent {
  action = () => {
    return of("fake observable").pipe(delay(2000));
  };
}

@Component({
  template: ``,
  selector: "app-rejected-promise-example",
  providers: [AsyncContextService],
})
class RejectedPromiseExampleComponent {
  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => reject(new Error("Simulated error")), 2000);
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
        SimpleExampleComponent,
        ObservableExampleComponent,
        RejectedPromiseExampleComponent,
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

type PromiseStory = StoryObj<SimpleExampleComponent>;
type ObservableStory = StoryObj<ObservableExampleComponent>;

export const Simple: PromiseStory = {
  render: (args) => ({
    props: args,
    template: `<app-promise-example></app-promise-example>`,
  }),
};

export const UsingObservable: ObservableStory = {
  render: (args) => ({
    template: `<app-observable-example></app-observable-example>`,
  }),
};

export const RejectedPromise: ObservableStory = {
  render: (args) => ({
    template: `<app-rejected-promise-example></app-rejected-promise-example>`,
  }),
};
