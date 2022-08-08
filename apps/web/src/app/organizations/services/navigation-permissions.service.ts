import { Permissions } from "@bitwarden/common/enums/permissions";
import { Organization } from "@bitwarden/common/models/domain/organization";

const permissions = {
  manage: [
    Permissions.CreateNewCollections,
    Permissions.EditAnyCollection,
    Permissions.DeleteAnyCollection,
    Permissions.EditAssignedCollections,
    Permissions.DeleteAssignedCollections,
    Permissions.AccessEventLogs,
    Permissions.ManageGroups,
    Permissions.ManageUsers,
    Permissions.ManagePolicies,
    Permissions.ManageSso,
    Permissions.ManageScim,
  ],
  members: [Permissions.ManageUsers, Permissions.ManageUsersPassword],
  groups: [Permissions.ManageGroups],
  reporting: [Permissions.AccessReports, Permissions.AccessEventLogs],
  billing: [Permissions.ManageBilling],
  settings: [Permissions.ManageOrganization, Permissions.ManagePolicies, Permissions.ManageSso],
};

export class NavigationPermissionsService {
  static getPermissions(route: keyof typeof permissions | "admin") {
    if (route === "admin") {
      return Object.values(permissions).reduce((previous, current) => previous.concat(current), []);
    }

    return permissions[route];
  }

  static canAccessAdmin(organization: Organization): boolean {
    return (
      this.canAccessMembers(organization) ||
      this.canAccessGroups(organization) ||
      this.canAccessReporting(organization) ||
      this.canAccessBilling(organization)
    );
  }

  static canAccessMembers(organization: Organization): boolean {
    return organization.hasAnyPermission(NavigationPermissionsService.getPermissions("members"));
  }

  static canAccessGroups(organization: Organization): boolean {
    return organization.hasAnyPermission(NavigationPermissionsService.getPermissions("groups"));
  }

  static canAccessReporting(organization: Organization): boolean {
    return organization.hasAnyPermission(NavigationPermissionsService.getPermissions("reporting"));
  }

  static canAccessBilling(organization: Organization): boolean {
    return organization.hasAnyPermission(NavigationPermissionsService.getPermissions("billing"));
  }

  static canAccessSettings(organization: Organization): boolean {
    return organization.hasAnyPermission(NavigationPermissionsService.getPermissions("settings"));
  }
}
