// Run with: npx tsx scripts/update-rally-points.ts
// Updates ONLY the RallyPoints sheet — does NOT touch Signups
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually (no dotenv dependency needed)
const envFile = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
}

const SHEET_ID = env.GOOGLE_SHEET_ID;

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// IDs rp-1 through rp-13, rp-16 through rp-21 kept for existing parks
// IDs rp-14, rp-15, rp-22-25 reused for new parks (old parks had 0 signups)
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
];

async function update() {
  console.log("Updating RallyPoints sheet (preserving Signups)...\n");

  // Clear only the RallyPoints data (keep header row by clearing A2 onward)
  console.log("Clearing old rally point data...");
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A2:I100",
  });

  // Write new rally point data
  console.log(`Writing ${RALLY_POINTS.length} rally points...`);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A2",
    valueInputOption: "RAW",
    requestBody: {
      values: RALLY_POINTS,
    },
  });

  // Verify
  const verify = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "RallyPoints!A1:I26",
  });
  const rows = verify.data.values || [];
  console.log(`\nVerified: ${rows.length - 1} rally points in sheet (plus header)`);

  // Check signups are intact
  const signups = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Signups!A2:A",
  });
  const signupCount = (signups.data.values || []).length;
  console.log(`Signups preserved: ${signupCount} rows\n`);

  // Print summary
  const totalCap = RALLY_POINTS.reduce((sum, rp) => sum + parseInt(rp[6]), 0);
  console.log(`Total capacity: ${totalCap} volunteers across ${RALLY_POINTS.length} parks`);
  console.log("Done!");
}

update().catch(console.error);
