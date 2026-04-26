import { z } from "zod/v4";

const groupMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email").max(254),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "2XL", "3XL"]).optional().or(z.literal("")),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Please enter a valid email").max(254),
  phone: z
    .string()
    .regex(/^\+?[\d\s()\-]{7,15}$/, "Please enter a valid phone number"),
  groupSize: z.number().int().min(1, "At least 1 person").max(50, "Maximum 50 per signup"),
  church: z.string().max(100).optional().or(z.literal("")),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "2XL", "3XL"]).optional().or(z.literal("")),
  role: z.enum(["volunteer", "site_leader", "group_lead"]),
  rallyPointId: z.string().min(1, "Please select a rally point").max(20),
  groupMembers: z.array(groupMemberSchema).optional().default([]),
  // Site leader fields — optional at schema level, enforced when role === "site_leader"
  previousSweep: z.enum(["yes", "no"]).optional(),
  meetingPreference: z.enum(["May meeting at 6338 Westfield Blvd", "June meeting at 6338 Westfield Blvd", "Google Meet", "Either works", "Neither, but I'm still in"]).optional(),
  // Group lead fields — optional at schema level, enforced when role === "group_lead"
  orgName: z.string().min(1).max(120).optional(),
  orgType: z.enum(["church", "company", "nonprofit", "school", "scout_youth", "neighborhood", "other"]).optional(),
  expectedSize: z.number().int().min(5, "At least 5 people").max(50, "Maximum 50 per rally point").optional(),
  notes: z.string().max(1000).optional(),
  // Group lead → POC's own attendance (writes them as the first volunteer when true)
  attending: z.boolean().optional(),
  // Share-link tracking (optional, for analytics on group volunteer signups)
  groupCode: z.string().max(60).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
