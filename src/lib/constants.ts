export const EVENT_DATE = "2026-07-07";
export const EVENT_DATE_DISPLAY = "Tuesday, July 7, 2026";
export const EVENT_TIME_START = "8:00 AM";
export const EVENT_TIME_END = "10:00 AM";
export const EVENT_TIME_DISPLAY = "8:00 AM – 10:00 AM";
export const VOLUNTEER_GOAL = 777;

export const RALLY_POINT_SEED_DATA = [
  // DOWNTOWN CORE
  { name: "White River State Park", address: "801 W Washington St, Indianapolis, IN", lat: 39.7655, lng: -86.1710, zone: "Downtown", capacity: 50 },
  { name: "Military Park", address: "601 W New York St, Indianapolis, IN", lat: 39.7740, lng: -86.1713, zone: "Downtown", capacity: 30 },
  { name: "University Park", address: "300 S Meridian St, Indianapolis, IN", lat: 39.7660, lng: -86.1580, zone: "Downtown", capacity: 25 },
  { name: "Colts Canal Playscape", address: "Canal Walk, Indianapolis, IN", lat: 39.7700, lng: -86.1670, zone: "Downtown", capacity: 20 },

  // NEAR SOUTH
  { name: "Garfield Park", address: "2345 Pagoda Dr, Indianapolis, IN", lat: 39.7276, lng: -86.1549, zone: "Near South", capacity: 50 },
  { name: "Fountain Square District", address: "1056 Virginia Ave, Indianapolis, IN", lat: 39.7485, lng: -86.1460, zone: "Near South", capacity: 35 },
  { name: "Fletcher Place/Holy Rosary", address: "630 Virginia Ave, Indianapolis, IN", lat: 39.7520, lng: -86.1490, zone: "Near South", capacity: 30 },
  { name: "Bates-Hendricks", address: "1528 S Madison Ave, Indianapolis, IN", lat: 39.7380, lng: -86.1550, zone: "Near South", capacity: 30 },

  // NEAR EAST
  { name: "Ellenberger Park", address: "5301 E St Clair St, Indianapolis, IN", lat: 39.7797, lng: -86.0878, zone: "Near East", capacity: 30 },
  { name: "Brookside Park", address: "3500 Brookside Pkwy S Dr, Indianapolis, IN", lat: 39.7883, lng: -86.1048, zone: "Near East", capacity: 30 },
  { name: "Spades Park", address: "1800 Nowland Ave, Indianapolis, IN", lat: 39.7650, lng: -86.1100, zone: "Near East", capacity: 25 },
  { name: "Christian Park", address: "4200 English Ave, Indianapolis, IN", lat: 39.7480, lng: -86.0850, zone: "Near East", capacity: 20 },

  // NEAR NORTH
  { name: "Dr. MLK Jr. Park & Landmark for Peace", address: "1702 Dr. Martin Luther King Jr St, Indianapolis, IN", lat: 39.7750, lng: -86.1650, zone: "Near North", capacity: 30 },
  { name: "Fall Creek Park", address: "Fall Creek Pkwy, Indianapolis, IN", lat: 39.7865, lng: -86.1740, zone: "Near North", capacity: 25 },
  { name: "Arsenal Park", address: "4602 Indianola Ave, Indianapolis, IN", lat: 39.8265, lng: -86.1320, zone: "Near North", capacity: 25 },
  { name: "Watkins Park", address: "2360 Dr. Martin Luther King Jr St, Indianapolis, IN", lat: 39.7855, lng: -86.1610, zone: "Near North", capacity: 20 },

  // NORTHWEST
  { name: "Riverside Park — North Zone", address: "2420 E Riverside Dr, Indianapolis, IN", lat: 39.8220, lng: -86.1196, zone: "Northwest", capacity: 40 },
  { name: "Riverside Park — South Zone", address: "2420 E Riverside Dr, Indianapolis, IN", lat: 39.8170, lng: -86.1196, zone: "Northwest", capacity: 40 },
  { name: "Holliday Park", address: "6363 Spring Mill Rd, Indianapolis, IN", lat: 39.8710, lng: -86.1627, zone: "Northwest", capacity: 25 },

  // NORTH
  { name: "Broad Ripple Park", address: "1550 Broad Ripple Ave, Indianapolis, IN", lat: 39.8690, lng: -86.1411, zone: "North", capacity: 30 },

  // NEAR NORTHEAST
  { name: "Highland Park", address: "1100 E New York St, Indianapolis, IN", lat: 39.7700, lng: -86.1430, zone: "Near Northeast", capacity: 25 },

  // NEAR WEST
  { name: "Washington Park", address: "3130 E 30th St, Indianapolis, IN", lat: 39.8051, lng: -86.1100, zone: "Near West", capacity: 30 },

  // SOUTH
  { name: "South Grove Park", address: "South Grove Ave, Indianapolis, IN", lat: 39.7065, lng: -86.0909, zone: "South", capacity: 20 },
  { name: "Pleasant Run Park", address: "Pleasant Run Pkwy, Indianapolis, IN", lat: 39.7281, lng: -86.1717, zone: "South", capacity: 20 },

  // WEST
  { name: "Rhodius Park", address: "1720 W Wilkins St, Indianapolis, IN", lat: 39.7545, lng: -86.1927, zone: "West", capacity: 20 },

  // EAST
  { name: "Grassy Creek Regional Park", address: "10510 E 30th St, Indianapolis, IN 46229", lat: 39.8145, lng: -85.9850, zone: "East", capacity: 30 },
] as const;

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;

export const MEETING_OPTIONS = [
  "April meeting at 6338 Westfield Blvd",
  "May meeting at 6338 Westfield Blvd",
  "Google Meet",
  "Either works",
  "Neither, but I'm still in",
] as const;

export const FAQ_CATEGORIES = [
  {
    label: "General",
    items: [
      {
        question: "What is Indy Street Sweep?",
        answer: "Indy Street Sweep is a citywide Day of Caring on July 7, 2026, where 777 volunteers will gather across 26 locations to clean up Indianapolis. It's one massive morning of neighbors serving neighbors.",
      },
      {
        question: "When is the event?",
        answer: "July 7, 2026 from 8:00 AM to 10:00 AM.",
      },
      {
        question: "Who is behind this?",
        answer: "Indy Street Sweep is presented by Citizens 7 in partnership with Together Indy, Multiply Indiana, and Roots Realty Co.",
      },
    ],
  },
  {
    label: "Volunteering",
    items: [
      {
        question: "How do I sign up?",
        answer: "Click the \"Sign Up to Serve\" button, choose your rally point location, and fill out the quick registration form. You'll get a confirmation email with everything you need.",
      },
      {
        question: "Can I bring my family or a group?",
        answer: "Absolutely. Just let us know how many people are in your group when you sign up.",
      },
{
        question: "What should I bring?",
        answer: "Comfortable clothes you don't mind getting dirty, closed-toe shoes, sunscreen, and a water bottle. We'll handle the rest.",
      },
      {
        question: "How do I choose a location?",
        answer: "During sign-up you'll see a map of rally points across Indianapolis. Pick the one closest to you or wherever you want to make an impact.",
        link: { label: "View the Map", href: "/map" },
      },
    ],
  },
  {
    label: "Site Leaders",
    items: [
      {
        question: "What does a site leader do?",
        answer: "Site leaders manage a group of roughly 30 volunteers at their assigned rally point. You'll help coordinate the cleanup and make sure your crew has what they need.",
      },
    ],
  },
  {
    label: "Logistics",
    items: [
      {
        question: "What if it rains?",
        answer: "The event is rain or shine. We'll communicate any major weather updates via email before the event.",
      },
{
        question: "Do I need to be affiliated with a church to participate?",
        answer: "Not at all. This is open to everyone, all backgrounds, all neighborhoods. Just come ready to serve.",
      },
    ],
  },
  {
    label: "Contact",
    items: [
      {
        question: "I have a question that's not answered here.",
        answer: "Reach out to Max Moore at max@maxmoorerealty.com and we'll get back to you.",
      },
    ],
  },
];
