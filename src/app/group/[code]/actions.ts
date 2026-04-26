"use server";

import { addSignup, getRallyPointById, getRallyPointsWithCounts, getSignups, COL_GROUP_CODE } from "@/lib/sheets";
import { getGroupLinkByCode } from "@/lib/group-links";
import { buildShareLink } from "@/lib/share-link";
import { EVENT_DATE_DISPLAY, EVENT_TIME_DISPLAY } from "@/lib/constants";

export interface GroupDashboardSignup {
  name: string;
  email: string;
  tshirt: string;
  joinedAt: string;
  isPoc: boolean;
}

export interface GroupDashboardData {
  ok: boolean;
  error?: string;
  groupCode?: string;
  orgName?: string;
  rallyPoint?: { id: string; name: string; address: string; zone: string | null };
  expectedSize?: number;
  capacity?: number;
  totalAtPark?: number;
  signups?: GroupDashboardSignup[];
  shareLink?: string;
  pocEmail?: string;
}

export async function loadGroupDashboard(code: string): Promise<GroupDashboardData> {
  const link = await getGroupLinkByCode(code);
  if (!link) return { ok: false, error: "This group link is not active or no longer exists." };
  if (link.status === "released") {
    return { ok: false, error: "This group link has been released and is no longer active." };
  }

  const [rallyPoint, rallyPointsWithCounts, signupRows] = await Promise.all([
    getRallyPointById(link.rally_point_id),
    getRallyPointsWithCounts(),
    getSignups(),
  ]);
  if (!rallyPoint) return { ok: false, error: "Rally point not found." };

  const totalAtPark =
    rallyPointsWithCounts.find((rp) => rp.id === link.rally_point_id)?.volunteer_count ?? 0;

  const signups: GroupDashboardSignup[] = signupRows
    .filter((row) => (row[COL_GROUP_CODE] || "").trim() === code)
    .map((row) => ({
      name: row[0] || "",
      email: row[1] || "",
      tshirt: row[6] || "",
      joinedAt: row[9] || "",
      isPoc: (row[1] || "").toLowerCase() === link.poc_email.toLowerCase(),
    }))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  return {
    ok: true,
    groupCode: link.group_code,
    orgName: link.org_name,
    rallyPoint: {
      id: rallyPoint.id,
      name: rallyPoint.name,
      address: rallyPoint.address,
      zone: rallyPoint.zone,
    },
    expectedSize: link.expected_size,
    capacity: rallyPoint.capacity,
    totalAtPark,
    signups,
    shareLink: buildShareLink({
      groupCode: link.group_code,
      orgName: link.org_name,
      rallyPointId: link.rally_point_id,
    }),
    pocEmail: link.poc_email,
  };
}

export interface AddPersonResult {
  ok: boolean;
  error?: string;
}

export async function addPersonToGroup(formData: FormData): Promise<AddPersonResult> {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const tshirtSize = String(formData.get("tshirtSize") ?? "").trim();

  if (!code) return { ok: false, error: "Missing group code." };
  if (!name) return { ok: false, error: "Name is required." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Valid email is required." };
  }

  const link = await getGroupLinkByCode(code);
  if (!link || link.status === "released") {
    return { ok: false, error: "Group link is not active." };
  }

  // Capacity guard — count current park signups vs. capacity.
  const [rallyPoint, rallyPointsWithCounts] = await Promise.all([
    getRallyPointById(link.rally_point_id),
    getRallyPointsWithCounts(),
  ]);
  if (!rallyPoint) return { ok: false, error: "Rally point not found." };
  const totalAtPark =
    rallyPointsWithCounts.find((rp) => rp.id === link.rally_point_id)?.volunteer_count ?? 0;
  if (totalAtPark + 1 > rallyPoint.capacity) {
    return { ok: false, error: `${rallyPoint.name} is full. Release a spot or pick a different park.` };
  }

  await addSignup({
    name,
    email,
    phone: phone || null,
    groupSize: 1,
    church: link.org_name,
    tshirtSize: tshirtSize || null,
    role: "volunteer",
    rallyPointId: link.rally_point_id,
    groupMembers: [],
    previousSweep: null,
    meetingPreference: null,
    groupCode: code,
  });

  // Fire the standard signup webhook so the manually-added person gets the
  // same "You're In!" confirmation email as someone who clicked the link.
  if (process.env.MAKE_SIGNUP_WEBHOOK_URL) {
    fetch(process.env.MAKE_SIGNUP_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone: phone || null,
        groupSize: 1,
        church: link.org_name,
        tshirtSize: tshirtSize || null,
        role: "volunteer",
        rallyPointName: rallyPoint.name,
        rallyPointAddress: rallyPoint.address,
        rallyPointZone: rallyPoint.zone || "",
        eventDate: EVENT_DATE_DISPLAY,
        eventTime: EVENT_TIME_DISPLAY,
        groupCode: code,
      }),
    }).catch((err) => console.error("Make signup webhook error (manual add):", err));
  }

  return { ok: true };
}
