import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import { addSignup, getRallyPointById } from "@/lib/sheets";
import { EVENT_DATE_DISPLAY, EVENT_TIME_DISPLAY } from "@/lib/constants";

/* ─── Simple in-memory rate limiter ─── */
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;          // max signups
const RATE_WINDOW_MS = 60_000; // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many signups. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return NextResponse.json({ errors: fieldErrors }, { status: 400 });
    }

    const data = result.data;
    const groupMembers = data.groupMembers ?? [];

    // Enforce site leader fields when role is site_leader
    if (data.role === "site_leader") {
      const missing: Record<string, string[]> = {};
      if (!data.previousSweep) missing.previousSweep = ["Please select an option"];
      if (!data.meetingPreference) missing.meetingPreference = ["Please select an option"];
      if (Object.keys(missing).length > 0) {
        return NextResponse.json({ errors: missing }, { status: 400 });
      }
    }

    // Check capacity: primary registrant (1) + group members
    const totalPeople = 1 + groupMembers.length;
    const { getRallyPointsWithCounts } = await import("@/lib/sheets");
    const rallyPoints = await getRallyPointsWithCounts();
    const targetPoint = rallyPoints.find((rp) => rp.id === data.rallyPointId);

    if (!targetPoint) {
      return NextResponse.json(
        { error: "Rally point not found. Please select a valid location." },
        { status: 400 }
      );
    }

    if (targetPoint.volunteer_count + totalPeople > targetPoint.capacity) {
      return NextResponse.json(
        { error: `${targetPoint.name} is full. Please choose another location.` },
        { status: 400 }
      );
    }

    await addSignup({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      groupSize: totalPeople,
      church: data.church || null,
      tshirtSize: data.tshirtSize || null,
      role: data.role,
      rallyPointId: data.rallyPointId,
      groupMembers,
      previousSweep: data.previousSweep ?? null,
      meetingPreference: data.meetingPreference ?? null,
    });

    const rallyPoint = await getRallyPointById(data.rallyPointId);

    // Fire-and-forget webhook to Make.com for email automation
    fetch(process.env.MAKE_SIGNUP_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        groupSize: totalPeople,
        church: data.church || null,
        tshirtSize: data.tshirtSize || null,
        role: data.role,
        rallyPointName: rallyPoint?.name || "",
        rallyPointAddress: rallyPoint?.address || "",
        rallyPointZone: rallyPoint?.zone || "",
        eventDate: EVENT_DATE_DISPLAY,
        eventTime: EVENT_TIME_DISPLAY,
        groupMembers: groupMembers.length > 0 ? groupMembers : undefined,
        previousSweep: data.previousSweep ?? undefined,
        meetingPreference: data.meetingPreference ?? undefined,
      }),
    }).catch((err) => console.error("Make webhook error:", err));

    return NextResponse.json(
      {
        success: true,
        confirmation: {
          name: data.name,
          role: data.role,
          groupSize: totalPeople,
          rallyPoint: {
            name: rallyPoint?.name || "",
            address: rallyPoint?.address || "",
            zone: rallyPoint?.zone || "",
          },
          eventDate: EVENT_DATE_DISPLAY,
          eventTime: EVENT_TIME_DISPLAY,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup route error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to save signup. Please try again." },
      { status: 500 }
    );
  }
}
