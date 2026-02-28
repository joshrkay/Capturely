import { MemberRole } from "@/generated/prisma/client";

/** owner or admin can manage team members */
export function canManageTeam(role: MemberRole): boolean {
  return role === MemberRole.owner || role === MemberRole.admin;
}

/** owner or admin can manage sites */
export function canManageSites(role: MemberRole): boolean {
  return role === MemberRole.owner || role === MemberRole.admin;
}

/** owner or admin can manage campaigns */
export function canManageCampaigns(role: MemberRole): boolean {
  return role === MemberRole.owner || role === MemberRole.admin;
}

/** only owner can manage billing */
export function canManageBilling(role: MemberRole): boolean {
  return role === MemberRole.owner;
}

/** all roles can view */
export function canView(role: MemberRole): boolean {
  return (
    role === MemberRole.owner ||
    role === MemberRole.admin ||
    role === MemberRole.member
  );
}
