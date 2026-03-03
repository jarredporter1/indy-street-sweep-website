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

    // Check capacity before allowing signup
    const { getRallyPointsWithCounts } = await import("@/lib/sheets");
    const rallyPoints = await getRallyPointsWithCounts();
    const targetPoint = rallyPoints.find((rp) => rp.id === data.rallyPointId);

    if (!targetPoint) {
      return NextResponse.json(
        { error: "Rally point not found. Please select a valid location." },
        { status: 400 }
      );
    }

    if (targetPoint.volunteer_count + data.groupSize > targetPoint.capacity) {
      return NextResponse.json(
        { error: `${targetPoint.name} is full. Please choose another location.` },
        { status: 400 }
      );
    }

    await addSignup({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      groupSize: data.groupSize,
      church: data.church || null,
      tshirtSize: data.tshirtSize,
      role: data.role,
      rallyPointId: data.rallyPointId,
      previousExperience: data.previousExperience || null,
    });

    const rallyPoint = await getRallyPointById(data.rallyPointId);

    return NextResponse.json(
      {
        success: true,
        confirmation: {
          name: data.name,
          role: data.role,
          groupSize: data.groupSize,
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
