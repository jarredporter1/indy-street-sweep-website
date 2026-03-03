import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import { addSignup, getRallyPointById, getVolunteerCount, getSignups } from "@/lib/sheets";
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

/* ─── Milestone email templates ─── */
const MILESTONES = [50, 100, 200, 300, 400, 500, 600, 700] as const;

interface MilestoneEmail {
  subject: string;
  body: string;
}

function getMilestoneEmail(milestone: number, count: number): MilestoneEmail | null {
  const pct = ((count / 777) * 100).toFixed(1);
  const remaining = 777 - count;
  const wrap = (body: string) =>
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;line-height:1.6;">${body}<p>Max</p></div>`;

  switch (milestone) {
    case 50:
      return {
        subject: "50 Volunteers! 🎉",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>We just hit 50 volunteers. That's 50 people who said yes to cleaning up Indianapolis on July 7.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>Keep sharing — we've got ${remaining} more spots to fill.</p>`),
      };
    case 100:
      return {
        subject: "Triple Digits: 100 Volunteers Signed Up 💯",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>100 volunteers.</p><p>That's enough people to cover 4 full rally points on July 7. But we're going for 25 parks.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>Let's keep the momentum going.</p>`),
      };
    case 200:
      return {
        subject: "200 People. One Morning. 🧹",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>We're at ${count} volunteers now.</p><p>That's ${count} people waking up early on a Tuesday in July to clean Indianapolis parks. That's not normal — that's special.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>We're a quarter of the way there.</p>`),
      };
    case 300:
      return {
        subject: "300 Volunteers (Almost Halfway) 🔥",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>We're almost halfway to 777. At this pace, we're going to hit our goal.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>Keep inviting people. This is building.</p>`),
      };
    case 400:
      return {
        subject: "400 Strong 💪",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>${count} volunteers signed up for July 7.</p><p>We're over halfway there.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>The momentum is real. Let's finish this.</p>`),
      };
    case 500:
      return {
        subject: "500 Volunteers. 277 To Go.",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>That's more people than most companies employ. And they're all showing up on one morning to clean Indianapolis.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>We're in the home stretch.</p>`),
      };
    case 600:
      return {
        subject: `600 Signed Up. ${remaining} Spots Left.`,
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>${count} volunteers.</p><p>We're ${pct}% to goal. If you haven't invited someone yet, now's the time.</p><p><strong>Current: ${count}/777</strong></p><p>Let's close this out.</p>`),
      };
    case 700:
      return {
        subject: "700 Volunteers. 77 Spots Remaining. 🎯",
        body: wrap(`<p style="font-size:16px;">Hey [NAME],</p><p>We're at ${count}.</p><p>${remaining} spots left until we hit 777 volunteers for July 7.</p><p><strong>Current: ${count}/777 (${pct}% there)</strong></p><p>We're going to make this happen.</p>`),
      };
    default:
      return null;
  }
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

    // Get count BEFORE signup for milestone detection
    const countBefore = await getVolunteerCount();

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
    const countAfter = countBefore + totalPeople;

    // ── Fire-and-forget webhooks to Make.com ──

    // 1. Signup confirmation (Email #1) + Site leader notification (Email #3)
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
    }).catch((err) => console.error("Make signup webhook error:", err));

    // 2. Instagram follow-up queue (Email #2) — queues in Make, processed daily
    if (process.env.MAKE_FOLLOWUP_WEBHOOK_URL) {
      fetch(process.env.MAKE_FOLLOWUP_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email }),
      }).catch((err) => console.error("Make follow-up webhook error:", err));
    }

    // 3. Milestone detection (Emails #4–#11)
    if (process.env.MAKE_MILESTONE_WEBHOOK_URL) {
      const crossedMilestone = MILESTONES.find(
        (m) => countBefore < m && countAfter >= m
      );

      if (crossedMilestone) {
        const milestoneEmail = getMilestoneEmail(crossedMilestone, countAfter);
        if (milestoneEmail) {
          // Get all volunteer emails for the blast
          getSignups()
            .then((rows) => {
              const volunteers = rows.map((row) => ({
                name: row[0] || "Volunteer",
                email: row[1] || "",
              })).filter((v) => v.email);

              return fetch(process.env.MAKE_MILESTONE_WEBHOOK_URL!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  milestone: crossedMilestone,
                  volunteerCount: countAfter,
                  subject: milestoneEmail.subject,
                  htmlBody: milestoneEmail.body,
                  volunteers,
                }),
              });
            })
            .catch((err) => console.error("Make milestone webhook error:", err));
        }
      }
    }

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
