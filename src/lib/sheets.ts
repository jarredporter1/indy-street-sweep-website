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

export async function getRallyPoints() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A2:J",
  });

  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    name: row[1] || "",
    address: row[2] || "",
    lat: parseFloat(row[3]) || 0,
    lng: parseFloat(row[4]) || 0,
    description: row[5] || null,
    capacity: parseInt(row[6]) || 30,
    zone: row[7] || null,
    site_leader_id: row[8] || null,
    volunteer_count: 0,
    signup_count: 0,
  }));
}

export async function getSignups() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Signups!A2:L",
  });
  return res.data.values || [];
}

export async function getRallyPointsWithCounts() {
  const [rallyPoints, signupRows] = await Promise.all([
    getRallyPoints(),
    getSignups(),
  ]);

  // Count volunteers per rally point (column F = index 5 = rallyPointId, column D = index 3 = groupSize)
  const counts: Record<string, { signups: number; volunteers: number }> = {};
  for (const row of signupRows) {
    const rpId = row[5]; // rallyPointId column
    const groupSize = parseInt(row[3]) || 1;
    if (!counts[rpId]) counts[rpId] = { signups: 0, volunteers: 0 };
    counts[rpId].signups += 1;
    counts[rpId].volunteers += groupSize;
  }

  return rallyPoints.map((rp) => ({
    ...rp,
    volunteer_count: counts[rp.id]?.volunteers || 0,
    signup_count: counts[rp.id]?.signups || 0,
  }));
}

export async function getVolunteerCount() {
  const signupRows = await getSignups();
  let total = 0;
  for (const row of signupRows) {
    total += parseInt(row[3]) || 1; // groupSize column
  }
  return total;
}

/** Prevent Google Sheets formula injection by prefixing dangerous characters with a single quote. */
function sanitizeForSheet(value: string): string {
  if (typeof value !== "string") return value;
  if (/^[=+\-@\t\r]/.test(value)) return "'" + value;
  return value;
}

export async function addSignup(data: {
  name: string;
  email: string;
  phone: string | null;
  groupSize: number;
  church: string | null;
  tshirtSize: string;
  role: string;
  rallyPointId: string;
  previousExperience: string | null;
}) {
  const sheets = getSheets();
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Signups!A:L",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          sanitizeForSheet(data.name),
          sanitizeForSheet(data.email),
          sanitizeForSheet(data.phone || ""),
          data.groupSize,
          sanitizeForSheet(data.church || ""),
          data.rallyPointId,
          data.tshirtSize,
          data.role,
          sanitizeForSheet(data.previousExperience || ""),
          "", // legacy trial_run_available column — safe to delete from sheet later
          now,
        ],
      ],
    },
  });

  if (data.role === "site_leader") {
    await assignSiteLeader(data.rallyPointId, data.email);
  }
}

async function assignSiteLeader(rallyPointId: string, email: string) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A2:A",
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === rallyPointId);
  if (rowIndex === -1) return;

  // Column I = site_leader_id, row offset +2 for header + 0-index
  const cell = `RallyPoints!I${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: cell,
    valueInputOption: "RAW",
    requestBody: { values: [[sanitizeForSheet(email)]] },
  });
}

export async function getRallyPointById(id: string) {
  const rallyPoints = await getRallyPoints();
  return rallyPoints.find((rp) => rp.id === id) || null;
}
