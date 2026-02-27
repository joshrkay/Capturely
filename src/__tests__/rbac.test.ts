import { describe, it, expect } from "vitest";
import { MemberRole } from "@/generated/prisma/client";
import {
  canManageTeam,
  canManageSites,
  canManageCampaigns,
  canManageBilling,
  canView,
} from "@/lib/rbac";

describe("RBAC helpers", () => {
  describe("canManageTeam", () => {
    it("allows owner", () => {
      expect(canManageTeam(MemberRole.owner)).toBe(true);
    });
    it("allows admin", () => {
      expect(canManageTeam(MemberRole.admin)).toBe(true);
    });
    it("denies member", () => {
      expect(canManageTeam(MemberRole.member)).toBe(false);
    });
  });

  describe("canManageSites", () => {
    it("allows owner", () => {
      expect(canManageSites(MemberRole.owner)).toBe(true);
    });
    it("allows admin", () => {
      expect(canManageSites(MemberRole.admin)).toBe(true);
    });
    it("denies member", () => {
      expect(canManageSites(MemberRole.member)).toBe(false);
    });
  });

  describe("canManageCampaigns", () => {
    it("allows owner", () => {
      expect(canManageCampaigns(MemberRole.owner)).toBe(true);
    });
    it("allows admin", () => {
      expect(canManageCampaigns(MemberRole.admin)).toBe(true);
    });
    it("denies member", () => {
      expect(canManageCampaigns(MemberRole.member)).toBe(false);
    });
  });

  describe("canManageBilling", () => {
    it("allows owner", () => {
      expect(canManageBilling(MemberRole.owner)).toBe(true);
    });
    it("denies admin", () => {
      expect(canManageBilling(MemberRole.admin)).toBe(false);
    });
    it("denies member", () => {
      expect(canManageBilling(MemberRole.member)).toBe(false);
    });
  });

  describe("canView", () => {
    it("allows owner", () => {
      expect(canView(MemberRole.owner)).toBe(true);
    });
    it("allows admin", () => {
      expect(canView(MemberRole.admin)).toBe(true);
    });
    it("allows member", () => {
      expect(canView(MemberRole.member)).toBe(true);
    });
  });
});
