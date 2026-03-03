// Run with: npx tsx scripts/seed-sheet.ts
import { google } from "googleapis";

const SHEET_ID = "1DUxW613nO5So3YFGlIybwvwwAzd6BKd0RrMJXH5VwoQ";

import * as fs from "fs";
import * as path from "path";

const keyFile = JSON.parse(
  fs.readFileSync(
    path.join("/Users/jarredporter/Downloads", "indy-street-sweep-5b686d65ce32.json"),
    "utf8"
  )
);

const auth = new google.auth.JWT({
  email: keyFile.client_email,
  key: keyFile.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const RALLY_POINTS = [
  // Priority Tier 1 — High Traffic / Post-July 4th
  ["rp-1",  "Garfield Park",                          "2345 Pagoda Dr, Indianapolis, IN",                    "39.7276", "-86.1549", "", "50", "Near South",  ""],
  ["rp-2",  "White River State Park",                  "801 W Washington St, Indianapolis, IN",               "39.7655", "-86.1710", "", "50", "Downtown",    ""],
  ["rp-3",  "Riverside Park — North Zone",             "2420 E Riverside Dr, Indianapolis, IN",               "39.8220", "-86.1196", "", "40", "Northwest",   ""],
  ["rp-4",  "Riverside Park — South Zone",             "2420 E Riverside Dr, Indianapolis, IN",               "39.8170", "-86.1196", "", "40", "Northwest",   ""],

  // Priority Tier 2 — Urban Core / Commercial Districts
  ["rp-5",  "Military Park",                           "601 W New York St, Indianapolis, IN",                 "39.7740", "-86.1713", "", "30", "Downtown",    ""],
  ["rp-6",  "Fountain Square District",                "1056 Virginia Ave, Indianapolis, IN",                 "39.7485", "-86.1460", "", "35", "Near South",  ""],
  ["rp-7",  "Fletcher Place Neighborhood",             "630 Virginia Ave, Indianapolis, IN",                  "39.7520", "-86.1490", "", "30", "Near South",  ""],
  ["rp-8",  "Bates-Hendricks Neighborhood",            "1528 S Madison Ave, Indianapolis, IN",                "39.7380", "-86.1550", "", "30", "Near South",  ""],

  // Priority Tier 3 — Major Neighborhood Parks
  ["rp-9",  "Ellenberger Park",                        "5301 E St Clair St, Indianapolis, IN",                "39.7797", "-86.0878", "", "30", "East",        ""],
  ["rp-10", "Brookside Park",                          "3500 Brookside Pkwy S Dr, Indianapolis, IN",          "39.7883", "-86.1048", "", "30", "Near East",   ""],
  ["rp-11", "Washington Park",                         "3130 E 30th St, Indianapolis, IN",                    "39.8051", "-86.1100", "", "30", "North",       ""],
  ["rp-12", "Broad Ripple Park",                       "1550 Broad Ripple Ave, Indianapolis, IN",             "39.8690", "-86.1411", "", "30", "North",       ""],

  // Priority Tier 4 — Strategic Neighborhoods
  ["rp-13", "Highland Park",                           "1100 E New York St, Indianapolis, IN",                "39.7700", "-86.1430", "", "25", "Near East",   ""],
  ["rp-14", "Southwestway Park",                       "8400 Mann Rd, Indianapolis, IN",                      "39.6648", "-86.2245", "", "35", "West",        ""],
  ["rp-15", "Sahm Park",                               "6801 E 91st St, Indianapolis, IN",                    "39.9157", "-86.0590", "", "25", "North",       ""],
  ["rp-16", "Arsenal Park",                            "4602 Indianola Ave, Indianapolis, IN",                "39.8265", "-86.1320", "", "25", "Near East",   ""],

  // Priority Tier 5 — Downtown Extensions
  ["rp-17", "University Park",                         "300 S Meridian St, Indianapolis, IN",                 "39.7660", "-86.1580", "", "25", "Downtown",    ""],
  ["rp-18", "Dr. MLK Jr. Park & Landmark for Peace",   "1702 Dr. Martin Luther King Jr St, Indianapolis, IN", "39.7750", "-86.1650", "", "25", "Downtown",    ""],
  ["rp-19", "Colts Canal Playscape",                   "Canal Walk, Indianapolis, IN",                        "39.7700", "-86.1670", "", "20", "Downtown",    ""],
  ["rp-20", "Watkins Park",                            "2360 Dr. Martin Luther King Jr St, Indianapolis, IN", "39.7855", "-86.1610", "", "20", "Near North",  ""],

  // Priority Tier 6 — Coverage Zones
  ["rp-21", "Spades Park",                             "1800 Nowland Ave, Indianapolis, IN",                  "39.7650", "-86.1100", "", "20", "East",        ""],
  ["rp-22", "Bertha Ross Park",                        "3700 N Michigan Rd, Indianapolis, IN",                "39.8180", "-86.1850", "", "20", "Near North",  ""],
  ["rp-23", "Northwestway Park",                       "5253 W 62nd St, Indianapolis, IN",                    "39.8538", "-86.2254", "", "25", "Northwest",   ""],
  ["rp-24", "Thatcher Park",                           "4649 W Vermont St, Indianapolis, IN",                 "39.7500", "-86.2000", "", "20", "West",        ""],
  ["rp-25", "Skiles Test Park",                        "3701 Mitthoeffer Rd, Indianapolis, IN",               "39.8075", "-85.9811", "", "20", "Far East",    ""],
];

async function seed() {
  console.log("Setting up Google Sheet with updated rally points...");

  // Get existing sheet info
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = spreadsheet.data.sheets || [];

  const requests: any[] = [];

  // Rename first sheet to RallyPoints if needed
  const firstSheet = existingSheets[0];
  if (firstSheet && firstSheet.properties?.title !== "RallyPoints") {
    requests.push({
      updateSheetProperties: {
        properties: { sheetId: firstSheet.properties?.sheetId, title: "RallyPoints" },
        fields: "title",
      },
    });
  }

  // Add Signups sheet if it doesn't exist
  const hasSignups = existingSheets.some((s) => s.properties?.title === "Signups");
  if (!hasSignups) {
    requests.push({
      addSheet: { properties: { title: "Signups" } },
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests },
    });
  }

  // Clear existing data first
  console.log("Clearing old data...");
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A1:Z1000",
  });
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "Signups!A1:Z1000",
  });

  // Write RallyPoints headers + data
  console.log("Writing 25 rally points...");
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["id", "name", "address", "lat", "lng", "description", "capacity", "zone", "site_leader_id"],
        ...RALLY_POINTS,
      ],
    },
  });

  // Write Signups headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "Signups!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["name", "email", "phone", "group_size", "church", "rally_point_id", "tshirt_size", "role", "previous_experience", "signed_up_at"],
      ],
    },
  });

  console.log("Done! 25 rally points written. Signups cleared for fresh start.");
}

seed().catch(console.error);
