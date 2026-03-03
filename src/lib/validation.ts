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
  role: z.enum(["volunteer", "site_leader"]),
  rallyPointId: z.string().min(1, "Please select a rally point").max(20),
  groupMembers: z.array(groupMemberSchema).optional().default([]),
  // Site leader fields — optional at schema level, enforced when role === "site_leader"
  previousSweep: z.enum(["yes", "no"]).optional(),
  meetingPreference: z.enum(["April meeting at 6338 Westfield Blvd", "May meeting at 6338 Westfield Blvd", "Google Meet", "Either works", "Neither, but I'm still in"]).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
