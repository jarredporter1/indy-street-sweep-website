"use server";

import { COL_GROUP_CODE, getRallyPointsWithCounts, getSignups } from "@/lib/sheets";
import { buildGroupCode, buildShareLink } from "@/lib/share-link";
import {
  addGroupLink,
  getActiveGroupLinkForRallyPoint,
  getActiveGroupLinks,
  releaseGroupLink,
} from "@/lib/group-links";

export interface GenerateLinkResult {
  ok: boolean;
  error?: string;
  url?: string;
  groupCode?: string;
  rallyPointName?: string;
  currentSignups?: number;
  capacity?: number;
  conflict?: { orgName: string; groupCode: string };
}

export async function generateShareLink(formData: FormData): Promise<GenerateLinkResult> {
  const passcode = String(formData.get("passcode") ?? "");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const rallyPointId = String(formData.get("rallyPointId") ?? "").trim();
  const expectedSize = parseInt(String(formData.get("expectedSize") ?? "0"), 10) || 0;
  const force = String(formData.get("force") ?? "") === "true";

  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return { ok: false, error: "Server not configured: ADMIN_PASSCODE missing." };
  }
  if (passcode !== expected) {
    return { ok: false, error: "Wrong passcode." };
  }
  if (!orgName) return { ok: false, error: "Organization name is required." };
  if (!rallyPointId) return { ok: false, error: "Pick a rally point." };

  const rallyPoints = await getRallyPointsWithCounts();
  const target = rallyPoints.find((rp) => rp.id === rallyPointId);
  if (!target) return { ok: false, error: "Rally point not found." };

  // Block by default if the park is already adopted; admin can override with force.
  const existingClaim = await getActiveGroupLinkForRallyPoint(rallyPointId);
  if (existingClaim && !force) {
    return {
      ok: false,
      error: `${target.name} is already adopted by ${existingClaim.org_name}. Release the existing claim first or check the override box to issue a second link anyway.`,
      conflict: { orgName: existingClaim.org_name, groupCode: existingClaim.group_code },
    };
  }

  const groupCode = buildGroupCode(orgName);
  if (!groupCode) return { ok: false, error: "Organization name has no usable characters." };

  const url = buildShareLink({ groupCode, orgName, rallyPointId });

  await addGroupLink({
    group_code: groupCode,
    org_name: orgName,
    rally_point_id: rallyPointId,
    expected_size: expectedSize > 0 ? expectedSize : 0,
    poc_name: "(admin-generated)",
    poc_email: "",
    source: "admin",
  });

  return {
    ok: true,
    url,
    groupCode,
    rallyPointName: target.name,
    currentSignups: target.volunteer_count,
    capacity: target.capacity,
  };
}

export async function releaseGroupLinkAction(
  passcode: string,
  groupCode: string,
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return { ok: false, error: "Server not configured." };
  if (passcode !== expected) return { ok: false, error: "Wrong passcode." };
  const released = await releaseGroupLink(groupCode);
  return released ? { ok: true } : { ok: false, error: "Group code not found." };
}

export interface AdminRallyPointSummary {
  id: string;
  name: string;
  zone: string | null;
  volunteer_count: number;
  capacity: number;
  hasSiteLeader: boolean;
  adoptedBy: string | null;
  adoptedCode: string | null;
  expectedSize: number;
}

export interface AdminGroupSummary {
  groupCode: string;
  orgName: string;
  rallyPointId: string;
  expectedSize: number;
  source: "auto" | "admin";
  status: "active" | "released";
  createdAt: string;
  signups: number;
}

export async function loadAdminContext(passcode: string): Promise<{
  ok: boolean;
  error?: string;
  rallyPoints?: AdminRallyPointSummary[];
  groups?: AdminGroupSummary[];
}> {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return { ok: false, error: "Server not configured: ADMIN_PASSCODE missing." };
  if (passcode !== expected) return { ok: false, error: "Wrong passcode." };

  const [rallyPoints, signupRows, activeLinks] = await Promise.all([
    getRallyPointsWithCounts(),
    getSignups(),
    getActiveGroupLinks(),
  ]);

  // Tally signups per group_code (column Q = index 16)
  const signupsPerCode: Record<string, number> = {};
  for (const row of signupRows) {
    const code = (row[COL_GROUP_CODE] || "").trim();
    if (!code) continue;
    signupsPerCode[code] = (signupsPerCode[code] || 0) + 1;
  }

  const adoptionByPark: Record<string, { orgName: string; code: string; expected: number }> = {};
  for (const link of activeLinks) {
    adoptionByPark[link.rally_point_id] = {
      orgName: link.org_name,
      code: link.group_code,
      expected: link.expected_size,
    };
  }

  return {
    ok: true,
    rallyPoints: rallyPoints.map((rp) => {
      const claim = adoptionByPark[rp.id];
      return {
        id: rp.id,
        name: rp.name,
        zone: rp.zone,
        volunteer_count: rp.volunteer_count,
        capacity: rp.capacity,
        hasSiteLeader: Boolean(rp.site_leader_id),
        adoptedBy: claim?.orgName ?? null,
        adoptedCode: claim?.code ?? null,
        expectedSize: claim?.expected ?? 0,
      };
    }),
    groups: activeLinks
      .map((l) => ({
        groupCode: l.group_code,
        orgName: l.org_name,
        rallyPointId: l.rally_point_id,
        expectedSize: l.expected_size,
        source: l.source,
        status: l.status,
        createdAt: l.created_at,
        signups: signupsPerCode[l.group_code] || 0,
      }))
      .sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1)),
  };
}
