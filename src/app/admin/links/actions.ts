"use server";

import { getRallyPointsWithCounts, getSignups } from "@/lib/sheets";

export interface GenerateLinkResult {
  ok: boolean;
  error?: string;
  url?: string;
  groupCode?: string;
  rallyPointName?: string;
  currentSignups?: number;
  capacity?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://indystreetsweep.com";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomSuffix(length = 6): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function generateShareLink(formData: FormData): Promise<GenerateLinkResult> {
  const passcode = String(formData.get("passcode") ?? "");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const rallyPointId = String(formData.get("rallyPointId") ?? "").trim();

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

  const slug = slugify(orgName);
  if (!slug) return { ok: false, error: "Organization name has no usable characters." };

  const groupCode = `${slug}-${randomSuffix()}`;

  const params = new URLSearchParams({
    group: groupCode,
    church: orgName,
    park: rallyPointId,
  });
  const url = `${BASE_URL}/map?${params.toString()}`;

  return {
    ok: true,
    url,
    groupCode,
    rallyPointName: target.name,
    currentSignups: target.volunteer_count,
    capacity: target.capacity,
  };
}

export interface AdminRallyPointSummary {
  id: string;
  name: string;
  zone: string | null;
  volunteer_count: number;
  capacity: number;
  hasSiteLeader: boolean;
}

export async function loadAdminContext(passcode: string): Promise<{
  ok: boolean;
  error?: string;
  rallyPoints?: AdminRallyPointSummary[];
  groupCounts?: Record<string, number>;
}> {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return { ok: false, error: "Server not configured: ADMIN_PASSCODE missing." };
  if (passcode !== expected) return { ok: false, error: "Wrong passcode." };

  const [rallyPoints, signupRows] = await Promise.all([
    getRallyPointsWithCounts(),
    getSignups(),
  ]);

  // Tally volunteers per group_code (column O = index 14)
  const groupCounts: Record<string, number> = {};
  for (const row of signupRows) {
    const code = (row[14] || "").trim();
    if (!code) continue;
    groupCounts[code] = (groupCounts[code] || 0) + 1;
  }

  return {
    ok: true,
    rallyPoints: rallyPoints.map((rp) => ({
      id: rp.id,
      name: rp.name,
      zone: rp.zone,
      volunteer_count: rp.volunteer_count,
      capacity: rp.capacity,
      hasSiteLeader: Boolean(rp.site_leader_id),
    })),
    groupCounts,
  };
}
