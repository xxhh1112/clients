import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Provider } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { action } from "@storybook/addon-actions";
import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { CollectionAdminService } from "@bitwarden/common/abstractions/collection/collection-admin.service.abstraction";
import { Utils } from "@bitwarden/common/misc/utils";
import { CollectionAdminView } from "@bitwarden/common/models/view/collection-admin-view";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";
import {
  ButtonModule,
  DialogModule,
  FormFieldModule,
  IconButtonModule,
  TabsModule,
} from "@bitwarden/components";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";

import {
  CollectionEditDialogComponent,
  CollectionEditDialogParams,
} from "./collection-edit-dialog.components";

interface ProviderData {
  collectionId: string;
  organizationId: string;
  collections: CollectionAdminView[];
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
        IconButtonModule,
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
      provide: CollectionAdminService,
      useValue: new MockCollectionAdminService(data.collections, data.collectionId),
    },
    {
      provide: PlatformUtilsService,
      useValue: {
        showDialog: action("PlatformUtilsService.show") as () => Promise<unknown>,
      } as Partial<PlatformUtilsService>,
    },
  ] as Provider[];
}

class MockDialogRef implements Partial<DialogRef> {
  close = action("DialogRef.close");
}

class MockCollectionAdminService implements Partial<CollectionAdminService> {
  constructor(private collections: CollectionAdminView[], private collectionId: string) {}

  private saveAction = action("CollectionApiService.save");

  getAll = () => Promise.resolve(this.collections);

  get = () => Promise.resolve(this.collections.find((c) => c.id === this.collectionId));

  async save(...args: unknown[]) {
    this.saveAction(args);
    await Utils.delay(1500);
  }
}

function createCollection(name: string, id = Utils.newGuid()) {
  const collection = new CollectionAdminView();
  collection.id = id;
  collection.name = name;
  return collection;
}
