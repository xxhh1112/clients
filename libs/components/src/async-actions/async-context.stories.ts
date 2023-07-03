import { Component } from "@angular/core";
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
  template: `<button bitButton buttonType="primary" [bitAsyncClick]="action" class="tw-mr-2">
      Perform action
    </button>
    <button bitIconButton="bwi-trash" buttonType="danger" [bitAsyncClick]="trash"></button>`,
  selector: "app-simple-example",
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

export default {
  title: "Component Library/Async Actions/Contexts",
  decorators: [
    moduleMetadata({
      declarations: [BitAsyncClickDirective, BitAsyncDisableDirective, SimpleExampleComponent],
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

type SimpleStory = StoryObj<SimpleExampleComponent>;

export const Simple: SimpleStory = {
  render: (args) => ({
    props: args,
    template: `<app-simple-example />`,
  }),
};
