import { OrganizationUserStatusType } from "@bitwarden/common/enums/organizationUserStatusType";
import { OrganizationUserType } from "@bitwarden/common/enums/organizationUserType";
import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selectionReadOnlyRequest";
import { SelectionReadOnlyResponse } from "@bitwarden/common/models/response/selectionReadOnlyResponse";

/**
 * Permission options that replace/correspond with readOnly and hidePassword server fields.
 */
export enum CollectionPermission {
  VIEW = "view",
  VIEW_EXCEPT_PASSWORDS = "viewExceptPass",
  EDIT = "edit",
  EDIT_EXCEPT_PASSWORDS = "editExceptPass",
}

export enum AccessItemType {
  COLLECTION,
  GROUP,
  MEMBER,
}

/**
 * A "generic" type that describes an item that can be selected from a
 * ng-select list and have its collection permission modified.
 *
 * Currently, it supports Collections, Groups, and Members. Members require some additional
 * details to render in the AccessSelectorComponent so their type is defined separately
 * and then joined back with the base type.
 */
export type AccessItemView =
  | {
      /**
       * Unique identifier of the item being selected
       */
      id: string;

      /**
       * Text that be displayed in the ngSelect list items
       */
      listName: string;

      /**
       * Text that will be displayed in the ngSelect selection option badge
       */
      labelName: string;

      /**
       * Optional string to group items by a parent in the ngSelect component
       */
      parentGrouping?: string;
    } & (
      | {
          type: AccessItemType.COLLECTION | AccessItemType.GROUP;
        }
      | {
          type: AccessItemType.MEMBER; // Members have a few extra details required to display, so they're added here
          email: string;
          role: OrganizationUserType;
          status: OrganizationUserStatusType;
        }
    );

/**
 * A type that is emitted as a value for the ngControl
 */
export type AccessItemValue = {
  id: string;
  permission?: CollectionPermission;
  type: AccessItemType;
};

/**
 * Converts the older SelectionReadOnly interface to one of the new CollectionPermission values
 * for the dropdown in the AccessSelectorComponent
 * @param value
 */
export const convertToPermission = (value: SelectionReadOnlyResponse) => {
  if (value.readOnly) {
    return value.hidePasswords
      ? CollectionPermission.VIEW_EXCEPT_PASSWORDS
      : CollectionPermission.VIEW;
  } else {
    return value.hidePasswords
      ? CollectionPermission.EDIT_EXCEPT_PASSWORDS
      : CollectionPermission.EDIT;
  }
};

/**
 * Converts an AccessItemValue back into a SelectionReadOnly class using the CollectionPermission
 * to determine the values for `readOnly` and `hidePassword`
 * @param value
 */
export const convertToSelectionReadOnly = (value: AccessItemValue) => {
  return new SelectionReadOnlyRequest(
    value.id,
    readOnly(value.permission),
    hidePassword(value.permission)
  );
};

const readOnly = (perm: CollectionPermission) =>
  [CollectionPermission.VIEW, CollectionPermission.VIEW_EXCEPT_PASSWORDS].includes(perm);

const hidePassword = (perm: CollectionPermission) =>
  [CollectionPermission.VIEW_EXCEPT_PASSWORDS, CollectionPermission.EDIT_EXCEPT_PASSWORDS].includes(
    perm
  );
