import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Provider } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { action } from "@storybook/addon-actions";
import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";
import { CollectionApiService } from "@bitwarden/common/src/abstractions/collection/collection-api.service.abstraction";
import { Utils } from "@bitwarden/common/src/misc/utils";
import { Collection } from "@bitwarden/common/src/models/domain/collection";
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
      useValue: {
        collectionId: data.collectionId,
        organizationId: data.organizationId,
      } as CollectionEditDialogParams,
    },
    {
      provide: DialogRef,
      useClass: MockDialogRef,
    },
    {
      provide: CollectionService,
      useValue: new MockCollectionService(data.collections),
    },
    {
      provide: CollectionApiService,
      useClass: MockCollectionApiService,
    },
  ] as Provider[];
}

class MockDialogRef implements Partial<DialogRef> {
  close = action("DialogRef.close");
}

class MockCollectionService implements Partial<CollectionService> {
  private encryptAction = action("CollectionService.encrypt");

  constructor(private collections: CollectionView[]) {}

  getAllAdminDecrypted = () => Promise.resolve(this.collections);

  async encrypt(model: CollectionView) {
    this.encryptAction(model);
    return new Collection({
      ...model,
      name: `<encrypted: "${model.name}">`,
    });
  }
}

class MockCollectionApiService implements Partial<CollectionApiService> {
  save = action("CollectionApiService.save") as () => Promise<unknown>;
}

function createCollection(name: string, id = Utils.newGuid()) {
  const collection = new CollectionView();
  collection.id = id;
  collection.name = name;
  return collection;
}
