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
  // DOWNTOWN CORE
  ["rp-2",  "White River State Park",                  "801 W Washington St, Indianapolis, IN",                "39.7655", "-86.1710", "", "50", "Downtown",       ""],
  ["rp-5",  "Military Park",                           "601 W New York St, Indianapolis, IN",                  "39.7740", "-86.1713", "", "30", "Downtown",       ""],
  ["rp-17", "University Park",                         "300 S Meridian St, Indianapolis, IN",                  "39.7660", "-86.1580", "", "25", "Downtown",       ""],
  ["rp-19", "Colts Canal Playscape",                   "Canal Walk, Indianapolis, IN",                         "39.7700", "-86.1670", "", "20", "Downtown",       ""],

  // NEAR SOUTH
  ["rp-1",  "Garfield Park",                           "2345 Pagoda Dr, Indianapolis, IN",                     "39.7276", "-86.1549", "", "50", "Near South",     ""],
  ["rp-6",  "Fountain Square District",                "1056 Virginia Ave, Indianapolis, IN",                  "39.7485", "-86.1460", "", "35", "Near South",     ""],
  ["rp-7",  "Fletcher Place/Holy Rosary",              "630 Virginia Ave, Indianapolis, IN",                   "39.7520", "-86.1490", "", "30", "Near South",     ""],
  ["rp-8",  "Bates-Hendricks",                         "1528 S Madison Ave, Indianapolis, IN",                 "39.7380", "-86.1550", "", "30", "Near South",     ""],

  // NEAR EAST
  ["rp-9",  "Ellenberger Park",                        "5301 E St Clair St, Indianapolis, IN",                 "39.7797", "-86.0878", "", "30", "Near East",      ""],
  ["rp-10", "Brookside Park",                          "3500 Brookside Pkwy S Dr, Indianapolis, IN",           "39.7883", "-86.1048", "", "30", "Near East",      ""],
  ["rp-21", "Spades Park",                             "1800 Nowland Ave, Indianapolis, IN",                   "39.7650", "-86.1100", "", "25", "Near East",      ""],
  ["rp-22", "Christian Park",                          "4200 English Ave, Indianapolis, IN",                   "39.7480", "-86.0850", "", "20", "Near East",      ""],

  // NEAR NORTH
  ["rp-18", "Dr. MLK Jr. Park & Landmark for Peace",   "1702 Dr. Martin Luther King Jr St, Indianapolis, IN", "39.7750", "-86.1650", "", "30", "Near North",     ""],
  ["rp-14", "Fall Creek Park",                         "Fall Creek Pkwy, Indianapolis, IN",                    "39.7865", "-86.1740", "", "25", "Near North",     ""],
  ["rp-16", "Arsenal Park",                            "4602 Indianola Ave, Indianapolis, IN",                 "39.8265", "-86.1320", "", "25", "Near North",     ""],
  ["rp-20", "Watkins Park",                            "2360 Dr. Martin Luther King Jr St, Indianapolis, IN",  "39.7855", "-86.1610", "", "20", "Near North",     ""],

  // NORTHWEST
  ["rp-3",  "Riverside Park — North Zone",             "2420 E Riverside Dr, Indianapolis, IN",                "39.8220", "-86.1196", "", "40", "Northwest",      ""],
  ["rp-4",  "Riverside Park — South Zone",             "2420 E Riverside Dr, Indianapolis, IN",                "39.8170", "-86.1196", "", "40", "Northwest",      ""],
  ["rp-15", "Holliday Park",                           "6363 Spring Mill Rd, Indianapolis, IN",                "39.8710", "-86.1627", "", "25", "Northwest",      ""],

  // NORTH
  ["rp-12", "Broad Ripple Park",                       "1550 Broad Ripple Ave, Indianapolis, IN",              "39.8690", "-86.1411", "", "30", "North",          ""],

  // NEAR NORTHEAST
  ["rp-13", "Highland Park",                           "1100 E New York St, Indianapolis, IN",                 "39.7700", "-86.1430", "", "25", "Near Northeast", ""],

  // NEAR WEST
  ["rp-11", "Washington Park",                         "3130 E 30th St, Indianapolis, IN",                     "39.8051", "-86.1100", "", "30", "Near West",      ""],

  // SOUTH
  ["rp-23", "South Grove Park",                        "South Grove Ave, Indianapolis, IN",                    "39.7065", "-86.0909", "", "20", "South",          ""],
  ["rp-24", "Pleasant Run Park",                       "Pleasant Run Pkwy, Indianapolis, IN",                  "39.7281", "-86.1717", "", "20", "South",          ""],

  // WEST
  ["rp-25", "Rhodius Park",                            "1720 W Wilkins St, Indianapolis, IN",                  "39.7545", "-86.1927", "", "20", "West",           ""],

  // EAST
  ["rp-26", "Grassy Creek Regional Park",             "10510 E 30th St, Indianapolis, IN 46229",              "39.8145", "-85.9850", "", "30", "East",           ""],
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
  console.log("Writing 26 rally points...");
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

  console.log("Done! 26 rally points written. Signups cleared for fresh start.");
}

seed().catch(console.error);
