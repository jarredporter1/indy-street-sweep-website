export interface RallyPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  capacity: number;
  zone: string | null;
  site_leader_id: string | null;
}

export interface RallyPointWithCount extends RallyPoint {
  volunteer_count: number;
  signup_count: number;
}

export interface GroupMember {
  name: string;
  email: string;
  tshirtSize?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  group_size: number;
  church: string | null;
  tshirt_size: string | null;
  role: "volunteer" | "site_leader";
  rally_point_id: string;
  previous_experience: string | null;
  created_at: string;
  group_id: string | null;
  is_group_leader: boolean;
  previous_sweep: string | null;
  meeting_preference: string | null;
}

export type SignupRole = "volunteer" | "site_leader" | "group_lead";

export type OrgType =
  | "church"
  | "company"
  | "nonprofit"
  | "school"
  | "scout_youth"
  | "neighborhood"
  | "other";

export interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  groupSize: number;
  church: string;
  tshirtSize: string;
  role: SignupRole;
  rallyPointId: string;
  groupMembers: GroupMember[];
  previousSweep: string;
  meetingPreference: string;
  // group_lead fields
  orgName: string;
  orgType: OrgType | "";
  expectedSize: number;
  notes: string;
}

export interface SignupConfirmation {
  name: string;
  role: string;
  groupSize: number;
  rallyPoint: {
    name: string;
    address: string;
    zone: string;
  };
  eventDate: string;
  eventTime: string;
}

export type DensityLevel = "low" | "medium" | "high";
