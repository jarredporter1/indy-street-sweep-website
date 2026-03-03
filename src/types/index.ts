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

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  group_size: number;
  church: string | null;
  tshirt_size: string;
  role: "volunteer" | "site_leader";
  rally_point_id: string;
  previous_experience: string | null;
  created_at: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  groupSize: number;
  church: string;
  tshirtSize: string;
  role: "volunteer" | "site_leader";
  rallyPointId: string;
  previousExperience: string;
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
