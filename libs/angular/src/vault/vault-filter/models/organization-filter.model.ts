import { Organization } from "@bitwarden/common/models/domain/organization";

export type OrganizationFilter = Organization & { icon: string; hideOptions?: boolean };
