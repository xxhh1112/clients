import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ButtonModule, DialogModule, TabsModule } from "@bitwarden/components";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";

import {
  CollectionEditDialogComponent,
  CollectionEditDialogParams,
} from "./collection-edit-dialog.components";

class DialogRefMock implements Partial<DialogRef> {}

export default {
  title: "Web/Collections/Edit dialog",
  component: CollectionEditDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [JslibModule, PreloadedEnglishI18nModule, DialogModule, ButtonModule, TabsModule],
      providers: [
        {
          provide: DialogRef,
          useClass: DialogRefMock,
        },
      ],
    }),
  ],
  args: {
    collectionId: "collectionId",
  } as CollectionEditDialogParams,
} as Meta;

function paramsProvider(params: CollectionEditDialogParams) {
  return {
    provide: DIALOG_DATA,
    useValue: params,
  };
}

const Template: Story<CollectionEditDialogComponent> = (args: CollectionEditDialogParams) => ({
  moduleMetadata: {
    providers: [paramsProvider(args)],
  },
  template: `<app-collection-edit-dialog></app-collection-edit-dialog>`,
});

export const Edit = Template.bind({});
