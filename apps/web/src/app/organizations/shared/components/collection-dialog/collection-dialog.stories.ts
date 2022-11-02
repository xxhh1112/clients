import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Provider } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { action } from "@storybook/addon-actions";
import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { GroupServiceAbstraction } from "@bitwarden/common/abstractions/group";
import { OrganizationService } from "@bitwarden/common/abstractions/organization/organization.service.abstraction";
import { OrganizationUserStatusType } from "@bitwarden/common/enums/organizationUserStatusType";
import { Utils } from "@bitwarden/common/misc/utils";
import { OrganizationUserUserDetailsResponse } from "@bitwarden/common/models/response/organization-user.response";
import { GroupView } from "@bitwarden/common/models/view/group-view";
import { PlatformUtilsService } from "@bitwarden/common/src/abstractions/platformUtils.service";

import { SharedModule } from "../../../../shared/shared.module";
import { PreloadedEnglishI18nModule } from "../../../../tests/preloaded-english-i18n.module";
import {
  CollectionAccessSelectionView,
  CollectionAdminView,
  CollectionAdminService,
} from "../../../core";
import { AccessSelectorModule } from "../access-selector";

import { CollectionDialogComponent, CollectionDialogParams } from "./collection-dialog.component";

interface ProviderData {
  collectionId: string;
  organizationId: string;
  collections: CollectionAdminView[];
  groups: GroupView[];
  users: OrganizationUserUserDetailsResponse[];
  useGroups: boolean;
}

export default {
  title: "Web/Organizations/Collection Dialog",
  component: CollectionDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [
        JslibModule,
        PreloadedEnglishI18nModule,
        SharedModule,
        ReactiveFormsModule,
        AccessSelectorModule,
      ],
    }),
  ],
} as Meta;

const organizationId = Utils.newGuid();
const groups = Array.from({ length: 10 }, (x, i) => createGroup(`Group ${i}`));
const users = Array.from({ length: 10 }, (x, i) => createUser(i));
const groupSelection = new CollectionAccessSelectionView({
  id: groups[0].id,
  readOnly: false,
  hidePasswords: false,
});
const userSelection = new CollectionAccessSelectionView({
  id: users[0].id,
  readOnly: false,
  hidePasswords: false,
});
let collections = Array.from({ length: 10 }, (x, i) =>
  createCollection(`Collection ${i}`, [groupSelection], [userSelection])
);
collections = collections.concat(
  collections.map((c, i) =>
    createCollection(`${c.name}/Sub-collection ${i}`, [groupSelection], [userSelection])
  )
);

function providers(data: ProviderData) {
  return [
    {
      provide: DIALOG_DATA,
      useValue: {
        collectionId: data.collectionId,
        organizationId: data.organizationId,
      } as CollectionDialogParams,
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
      provide: OrganizationService,
      useValue: {
        get: () => ({ useGroups: data.useGroups, canDeleteAssignedCollections: true } as any),
      } as Partial<OrganizationService>,
    },
    {
      provide: GroupServiceAbstraction,
      useValue: { getAll: () => Promise.resolve(data.groups) } as Partial<GroupServiceAbstraction>,
    },
    {
      provide: ApiService,
      useValue: {
        getOrganizationUsers: () => Promise.resolve({ data: data.users }),
      },
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

function createCollection(
  name: string,
  collectionGroups: CollectionAccessSelectionView[],
  collectionUsers: CollectionAccessSelectionView[],
  id = Utils.newGuid()
) {
  const collection = new CollectionAdminView();
  collection.id = id;
  collection.name = name;
  collection.groups = collectionGroups;
  collection.users = collectionUsers;
  return collection;
}

function createGroup(name: string, id = Utils.newGuid()) {
  const group = new GroupView();
  group.id = id;
  group.name = name;
  return group;
}

function createUser(i: number, id = Utils.newGuid()) {
  const user = new OrganizationUserUserDetailsResponse({});
  user.name = `User ${i}`;
  user.email = `user_${i}@email.com`;
  user.twoFactorEnabled = false;
  user.usesKeyConnector = false;
  user.status = OrganizationUserStatusType.Accepted;
  return user;
}

const NewCollectionTemplate: Story<CollectionDialogComponent> = (
  args: CollectionDialogComponent
) => ({
  moduleMetadata: {
    providers: providers({
      collectionId: undefined,
      organizationId,
      collections,
      groups,
      users,
      useGroups: true,
    }),
  },
  template: `<app-collection-dialog></app-collection-dialog>`,
});

export const NewCollection = NewCollectionTemplate.bind({});

const ExistingCollectionTemplate: Story<CollectionDialogComponent> = (
  args: CollectionDialogComponent
) => ({
  moduleMetadata: {
    providers: providers({
      collectionId: collections[collections.length - 1].id,
      organizationId,
      collections,
      groups,
      users,
      useGroups: true,
    }),
  },
  template: `<app-collection-dialog></app-collection-dialog>`,
});

export const ExistingCollection = ExistingCollectionTemplate.bind({});

const NonExistingParentTemplate: Story<CollectionDialogComponent> = (
  args: CollectionDialogComponent
) => {
  const collection = createCollection(
    "Non existing parent/Collection",
    [groupSelection],
    [userSelection]
  );

  return {
    moduleMetadata: {
      providers: providers({
        collectionId: collection.id,
        organizationId,
        collections: [collection, ...collections],
        groups,
        users,
        useGroups: true,
      }),
    },
    template: `<app-collection-dialog></app-collection-dialog>`,
  };
};

export const NonExistingParentCollection = NonExistingParentTemplate.bind({});

const FreeOrganizationTemplate: Story<CollectionDialogComponent> = (
  args: CollectionDialogComponent
) => ({
  moduleMetadata: {
    providers: providers({
      collectionId: collections[collections.length - 1].id,
      organizationId,
      collections,
      groups,
      users,
      useGroups: false,
    }),
  },
  template: `<app-collection-dialog></app-collection-dialog>`,
});

export const FreeOrganization = FreeOrganizationTemplate.bind({});
