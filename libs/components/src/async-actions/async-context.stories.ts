import { Component, OnInit } from "@angular/core";
import { action } from "@storybook/addon-actions";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";
import { delay, firstValueFrom, of } from "rxjs";

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

@Component({
  template: `<ng-container *ngIf="initialLoading">Loading...</ng-container>
    <ng-container *ngIf="!initialLoading">
      <button bitButton buttonType="primary" [bitAsyncClick]="action">Perform action</button>
    </ng-container>
    <button bitButton buttonType="secondary" [bitAsyncClick]="init" class="tw-ml-2">
      Re-run initialization
    </button>`,
  selector: "app-initial-data-fetch-example",
  providers: [AsyncContextService],
})
class InitialDataFetchExampleComponent implements OnInit {
  private fakeDataService = { getData$: () => of("fake data").pipe(delay(5000)) };

  protected initialLoading = true;
  protected fakeData: string;

  constructor(private asyncContextService: AsyncContextService) {}

  ngOnInit(): void {
    this.asyncContextService.run(this.init);
  }

  init = async () => {
    this.initialLoading = true;
    this.fakeData = await firstValueFrom(this.fakeDataService.getData$());
    this.initialLoading = false;
  };

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
        SimpleExampleComponent,
        InitialDataFetchExampleComponent,
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

type SimpleStory = StoryObj<SimpleExampleComponent>;
type InitialDataFetchStory = StoryObj<InitialDataFetchExampleComponent>;

export const Simple: SimpleStory = {
  render: (args) => ({
    props: args,
    template: `<app-simple-example />`,
  }),
};

export const InitialDataFetch: InitialDataFetchStory = {
  render: (args) => ({
    props: args,
    template: `<app-initial-data-fetch-example />`,
  }),
};

// export const UsingObservable: ObservableStory = {
//   render: (args) => ({
//     template: `<app-observable-example></app-observable-example>`,
//   }),
// };

// export const RejectedPromise: ObservableStory = {
//   render: (args) => ({
//     template: `<app-rejected-promise-example></app-rejected-promise-example>`,
//   }),
// };
