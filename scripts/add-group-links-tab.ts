// Run with: npx tsx scripts/add-group-links-tab.ts
// Creates the GroupLinks tab on the Indy Street Sweep Signups sheet.
// Idempotent — skips creation if the tab already exists.
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) throw new Error(`.env.local not found at ${envPath}`);
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

async function main() {
  loadEnv();
  const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === "GroupLinks");
  if (existing) {
    console.log("GroupLinks tab already exists — skipping create.");
  } else {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "GroupLinks" } } }],
      },
    });
    console.log("Created GroupLinks tab.");
  }

  // Always write/refresh the header row.
  const headers = [
    "group_code",
    "org_name",
    "rally_point_id",
    "expected_size",
    "poc_name",
    "poc_email",
    "source",
    "created_at",
    "status",
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "GroupLinks!A1:I1",
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
  console.log("Wrote header row:", headers.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
