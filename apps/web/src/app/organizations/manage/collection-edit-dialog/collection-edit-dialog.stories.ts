import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { ReactiveFormsModule } from "@angular/forms";
import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { Utils } from "@bitwarden/common/src/misc/utils";
import { ButtonModule, DialogModule, FormFieldModule, TabsModule } from "@bitwarden/components";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";

import {
  CollectionEditDialogComponent,
  CollectionEditDialogParams,
} from "./collection-edit-dialog.components";

interface ProviderData {
  collectionId: string;
  organizationId: string;
  collections: CollectionView[];
}

class DialogRefMock implements Partial<DialogRef> {}

export default {
  title: "Web/Collections/Edit dialog",
  component: CollectionEditDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [
        JslibModule,
        PreloadedEnglishI18nModule,
        DialogModule,
        ButtonModule,
        TabsModule,
        FormFieldModule,
        ReactiveFormsModule,
      ],
      providers: [
        {
          provide: DialogRef,
          useClass: DialogRefMock,
        },
        {
          provide: CollectionService,
          useValue: undefined,
        },
      ],
    }),
  ],
} as Meta;

const organizationId = Utils.newGuid();
let collections = Array.from({ length: 10 }, (x, i) => createCollection(`Collection ${i}`));
collections = collections.concat(
  collections.map((c, i) => createCollection(`${c.name}/Sub-collection ${i}`))
);

const NewCollectionTemplate: Story<CollectionEditDialogComponent> = (
  args: CollectionEditDialogComponent
) => ({
  moduleMetadata: {
    providers: providers({ collectionId: undefined, organizationId, collections }),
  },
  template: `<app-collection-edit-dialog></app-collection-edit-dialog>`,
});

export const NewCollection = NewCollectionTemplate.bind({});

const ExistingCollectionTemplate: Story<CollectionEditDialogComponent> = (
  args: CollectionEditDialogComponent
) => ({
  moduleMetadata: {
    providers: providers({
      collectionId: collections[collections.length - 1].id,
      organizationId,
      collections,
    }),
  },
  template: `<app-collection-edit-dialog></app-collection-edit-dialog>`,
});

export const ExistingCollection = ExistingCollectionTemplate.bind({});

function providers(data: ProviderData) {
  return [
    {
      provide: DIALOG_DATA,
      useValue: { collectionId: data.collectionId } as CollectionEditDialogParams,
    },
    {
      provide: CollectionService,
      useValue: {
        getAllDecrypted: () => Promise.resolve(data.collections),
      } as Partial<CollectionService>,
    },
  ];
}

function createCollection(name: string, id = Utils.newGuid()) {
  const collection = new CollectionView();
  collection.id = id;
  collection.name = name;
  return collection;
}
