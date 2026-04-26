import { google } from "googleapis";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

/**
 * GroupLinks sheet column map:
 *   A group_code, B org_name, C rally_point_id, D expected_size,
 *   E poc_name, F poc_email, G source, H created_at, I status
 */
export interface GroupLink {
  group_code: string;
  org_name: string;
  rally_point_id: string;
  expected_size: number;
  poc_name: string;
  poc_email: string;
  source: "auto" | "admin";
  created_at: string;
  status: "active" | "released";
}

function sanitize(v: string): string {
  if (typeof v !== "string") return v;
  if (/^[=+\-@\t\r]/.test(v)) return "'" + v;
  return v;
}

function rowToLink(row: string[]): GroupLink {
  return {
    group_code: row[0] || "",
    org_name: row[1] || "",
    rally_point_id: row[2] || "",
    expected_size: parseInt(row[3] || "0", 10) || 0,
    poc_name: row[4] || "",
    poc_email: row[5] || "",
    source: (row[6] === "admin" ? "admin" : "auto") as GroupLink["source"],
    created_at: row[7] || "",
    status: (row[8] === "released" ? "released" : "active") as GroupLink["status"],
  };
}

export async function getGroupLinks(): Promise<GroupLink[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "GroupLinks!A2:I",
  });
  const rows = res.data.values || [];
  return rows.map(rowToLink);
}

export async function getActiveGroupLinks(): Promise<GroupLink[]> {
  const all = await getGroupLinks();
  return all.filter((l) => l.status === "active");
}

export async function getGroupLinkByCode(code: string): Promise<GroupLink | null> {
  const all = await getGroupLinks();
  return all.find((l) => l.group_code === code) ?? null;
}

export async function getActiveGroupLinkForRallyPoint(
  rallyPointId: string,
): Promise<GroupLink | null> {
  const active = await getActiveGroupLinks();
  return active.find((l) => l.rally_point_id === rallyPointId) ?? null;
}

export async function addGroupLink(data: Omit<GroupLink, "created_at" | "status">): Promise<void> {
  const sheets = getSheets();
  const row = [
    sanitize(data.group_code),
    sanitize(data.org_name),
    data.rally_point_id,
    data.expected_size,
    sanitize(data.poc_name),
    sanitize(data.poc_email),
    data.source,
    new Date().toISOString(),
    "active",
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "GroupLinks!A:I",
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}

/**
 * Mark a group link as released — frees the soft reservation so other
 * groups (or random volunteers) can claim the park's remaining capacity.
 */
export async function releaseGroupLink(code: string): Promise<boolean> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "GroupLinks!A2:A",
  });
  const codes = res.data.values || [];
  const idx = codes.findIndex((r) => r[0] === code);
  if (idx === -1) return false;
  // Status column (I) at row idx+2 (1-indexed + header)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `GroupLinks!I${idx + 2}`,
    valueInputOption: "RAW",
    requestBody: { values: [["released"]] },
  });
  return true;
}
