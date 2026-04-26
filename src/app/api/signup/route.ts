import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import { addSignup, getRallyPointById, getVolunteerCount, getSignups } from "@/lib/sheets";
import { EVENT_DATE_DISPLAY, EVENT_TIME_DISPLAY } from "@/lib/constants";
import { buildGroupCode, buildShareLink, detectGroupConflict } from "@/lib/share-link";
import {
  addGroupLink,
  getActiveGroupLinkForRallyPoint,
  getActiveGroupLinks,
  releaseGroupLink,
} from "@/lib/group-links";

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

interface MilestoneContent {
  subject: string;
  headline: string;
  lines: string[];
  cta: string;
}

const MILESTONE_CONTENT: Record<number, (count: number, remaining: number) => MilestoneContent> = {
  50: (count, remaining) => ({
    subject: "We Just Hit 50 Volunteers",
    headline: "50!",
    lines: [
      `<strong>50 people</strong> said yes to waking up early on a Tuesday morning to serve Indianapolis.`,
      `<strong>50 people</strong> said yes to being part of something bigger than themselves.`,
      `If you haven't invited someone yet, now's the time. We've got ${remaining} more spots to fill.`,
    ],
    cta: "Invite Someone to Sign Up",
  }),
  100: (count, remaining) => ({
    subject: "Triple Digits: 100 Volunteers Signed Up",
    headline: "100!",
    lines: [
      `100 volunteers. That's enough people to cover 4 full rally points on July 7.`,
      `But we're going for 26 parks across Indianapolis. And at this pace, we're going to get there.`,
      `Keep sharing. ${remaining} spots left.`,
    ],
    cta: "Share the Sign-Up Link",
  }),
  200: (_count, remaining) => ({
    subject: "200 People. One Morning.",
    headline: "200!",
    lines: [
      `200 people waking up early on a Tuesday in July to clean Indianapolis parks.`,
      `That's not normal — that's special. We're a quarter of the way to 777.`,
      `${remaining} spots remain. The momentum is building.`,
    ],
    cta: "Help Us Keep Going",
  }),
  300: (_count, remaining) => ({
    subject: "300 Volunteers — Almost Halfway",
    headline: "300!",
    lines: [
      `We're almost halfway to 777. At this pace, we're going to hit our goal.`,
      `Every person who signs up makes the impact bigger for every park across the city.`,
      `Keep inviting people. ${remaining} spots to go.`,
    ],
    cta: "Invite Your People",
  }),
  400: (count, remaining) => ({
    subject: "400 Strong",
    headline: "400!",
    lines: [
      `${count} volunteers signed up for July 7. We're over halfway there.`,
      `This started as an idea. Now it's a movement.`,
      `The momentum is real. ${remaining} spots left. Let's finish this.`,
    ],
    cta: "Help Us Close the Gap",
  }),
  500: (_count, _remaining) => ({
    subject: "500 Volunteers. 277 To Go.",
    headline: "500!",
    lines: [
      `That's more people than most companies employ. And they're all showing up on one morning to clean Indianapolis.`,
      `We're in the home stretch. 277 spots left until we hit 777.`,
      `If you know someone who hasn't signed up, send them the link.`,
    ],
    cta: "Send the Sign-Up Link",
  }),
  600: (_count, remaining) => ({
    subject: `600 Signed Up. ${remaining} Spots Left.`,
    headline: "600!",
    lines: [
      `We can see the finish line. ${remaining} spots left until 777 volunteers for July 7.`,
      `If you haven't invited someone yet, now's the time.`,
      `Let's close this out.`,
    ],
    cta: "Help Us Finish",
  }),
  700: (_count, remaining) => ({
    subject: "700 Volunteers. 77 Spots Remaining.",
    headline: "700!",
    lines: [
      `${remaining} spots left until we hit 777 volunteers for July 7.`,
      `We are this close. This is really happening.`,
      `One more push and we're there.`,
    ],
    cta: "Fill the Last Spots",
  }),
};

function getMilestoneEmail(milestone: number, count: number): MilestoneEmail | null {
  const pct = ((count / 777) * 100).toFixed(1);
  const remaining = 777 - count;
  const contentFn = MILESTONE_CONTENT[milestone];
  if (!contentFn) return null;

  const { subject, headline, lines, cta } = contentFn(count, remaining);
  const progressWidth = pct;

  const body = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;line-height:1.6;color:#333;background:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">

<div style="background:#2D5016;color:white;padding:40px 20px;text-align:center;">
  <h1 style="font-size:48px;margin:0;font-weight:bold;">${headline}</h1>
  <p style="font-size:20px;margin:10px 0 0 0;color:#e0e0e0;">We Just Hit ${milestone} Volunteers</p>
</div>

<div style="padding:30px 20px;">
  <p style="font-size:16px;">Hey [NAME],</p>

  ${lines.map((line) => `<p style="font-size:16px;line-height:1.8;">${line}</p>`).join("\n  ")}

  <div style="background:#e0e0e0;height:30px;border-radius:15px;margin:25px 0 10px;overflow:hidden;">
    <div style="background:linear-gradient(90deg,#2D5016,#4CAF50);height:100%;width:${progressWidth}%;border-radius:15px;"></div>
  </div>
  <p style="text-align:center;margin:0 0 25px;font-size:18px;font-weight:bold;color:#2D5016;">${count} / 777 volunteers (${pct}%)</p>

  <div style="background:#f4f4f4;padding:20px;border-left:4px solid #4CAF50;margin:20px 0;">
    <p style="margin:5px 0;font-size:15px;">&#9989; ${count} volunteers signed up</p>
    <p style="margin:5px 0;font-size:15px;">&#127919; ${remaining} spots left to fill</p>
    <p style="margin:5px 0;font-size:15px;">&#128205; 26 rally points across Indianapolis</p>
    <p style="margin:5px 0;font-size:15px;">&#128197; July 7, 2026 &middot; 8:00–10:00 AM</p>
  </div>

  <div style="text-align:center;margin:25px 0;">
    <a href="https://indystreetsweep.com" style="display:inline-block;background:#4CAF50;color:white;padding:15px 40px;text-decoration:none;border-radius:5px;font-weight:bold;font-size:16px;">${cta}</a>
  </div>

  <p style="font-size:15px;">This is happening,</p>
  <p style="font-size:15px;"><strong>Trace Burgess</strong><br>
  Indy Street Sweep<br>
  <a href="https://indystreetsweep.com" style="color:#4CAF50;">indystreetsweep.com</a></p>
</div>

<div style="background:#f8f8f8;padding:20px;text-align:center;font-size:14px;color:#666;">
  <p style="margin:0;">777 volunteers. 26 parks. 1 morning. 1 city.</p>
</div>

</div>
</body>
</html>`;

  return { subject, body };
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

    // ── Group-lead intake: claim a park + auto-send share link ──
    // Writes a row to GroupLinks (the source of truth for adoption claims),
    // optionally adds the POC themselves as the first signup, and fires the
    // Make webhook so Jarred + the POC get their respective emails.
    if (data.role === "group_lead") {
      const missing: Record<string, string[]> = {};
      if (!data.orgName?.trim()) missing.orgName = ["Organization name is required"];
      if (!data.orgType) missing.orgType = ["Please select an organization type"];
      if (!data.expectedSize) missing.expectedSize = ["Estimated group size is required"];
      if (Object.keys(missing).length > 0) {
        return NextResponse.json({ errors: missing }, { status: 400 });
      }

      const targetPoint = await getRallyPointById(data.rallyPointId);
      if (!targetPoint) {
        return NextResponse.json(
          { error: "Rally point not found. Please select a valid location." },
          { status: 400 }
        );
      }

      // Authoritative conflict check uses GroupLinks (works even before any
      // signups land). Fall back to signup-row scan as a belt-and-suspenders
      // signal in case a legacy claim never made it into GroupLinks.
      const orgNameTrim = data.orgName!.trim();
      const [activeClaim, existingRows] = await Promise.all([
        getActiveGroupLinkForRallyPoint(data.rallyPointId),
        getSignups(),
      ]);
      const signupConflict = detectGroupConflict(existingRows, data.rallyPointId);
      const conflict = activeClaim
        ? { conflict: true, conflictingGroupCode: activeClaim.group_code }
        : signupConflict;

      // Mutable conflict state — may flip to true if the GroupLinks write
      // fails or we lose a race against another simultaneous claim.
      let activeConflict = conflict.conflict;
      let conflictingCode = conflict.conflictingGroupCode;
      let groupCode: string | null = !activeConflict ? buildGroupCode(orgNameTrim) : null;
      let groupLinkWriteFailed = false;

      // Persist the claim so the dashboard, map, and future intake checks all
      // see the reservation immediately. If the write fails, fall back to the
      // conflict path so the POC isn't handed a dashboard URL that 404s.
      if (groupCode) {
        try {
          await addGroupLink({
            group_code: groupCode,
            org_name: orgNameTrim,
            rally_point_id: data.rallyPointId,
            expected_size: data.expectedSize ?? 0,
            poc_name: data.name,
            poc_email: data.email,
            source: "auto",
          });
        } catch (err) {
          console.error("Failed to write GroupLinks row:", err);
          groupLinkWriteFailed = true;
          activeConflict = true;
          conflictingCode = "(GroupLinks write failed — investigate)";
          groupCode = null;
        }
      }

      // Race-resolution: if two POCs hit the form at the same time, both
      // would have read no claim and both would have written rows. Read back
      // and let the earliest-created claim win. Loser releases their row and
      // takes the conflict path (no auto-link).
      if (groupCode) {
        try {
          const all = await getActiveGroupLinks();
          const claimsForPark = all
            .filter((l) => l.rally_point_id === data.rallyPointId)
            .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
          const winner = claimsForPark[0];
          if (winner && winner.group_code !== groupCode) {
            // Lost the race — release our row, defer to the winner.
            await releaseGroupLink(groupCode).catch((err) =>
              console.error("Failed to release losing claim:", err),
            );
            activeConflict = true;
            conflictingCode = winner.group_code;
            groupCode = null;
          }
        } catch (err) {
          console.error("Race-resolution check failed:", err);
          // If we can't read back, trust our write and continue.
        }
      }

      const shareLink = groupCode
        ? buildShareLink({ groupCode, orgName: orgNameTrim, rallyPointId: data.rallyPointId })
        : "";

      // POC opted in to attend → register them as the first volunteer under
      // this group code so their seat is real (not just reserved). Skipped on
      // conflict (no groupCode to attribute the row to).
      if (data.attending && groupCode) {
        try {
          await addSignup({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            groupSize: 1,
            church: orgNameTrim,
            tshirtSize: data.tshirtSize || null,
            role: "volunteer",
            rallyPointId: data.rallyPointId,
            groupMembers: [],
            previousSweep: null,
            meetingPreference: null,
            groupCode,
          });
        } catch (err) {
          console.error("Failed to add POC as first volunteer:", err);
        }
      }

      const dashboardUrl = groupCode
        ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://indystreetsweep.com"}/group/${groupCode}`
        : "";

      if (process.env.MAKE_GROUP_LEAD_WEBHOOK_URL) {
        fetch(process.env.MAKE_GROUP_LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgName: orgNameTrim,
            orgType: data.orgType,
            expectedSize: data.expectedSize,
            notes: data.notes || null,
            pocName: data.name,
            pocEmail: data.email,
            pocPhone: data.phone,
            preferredRallyPointId: data.rallyPointId,
            preferredRallyPointName: targetPoint.name,
            preferredRallyPointAddress: targetPoint.address,
            preferredRallyPointZone: targetPoint.zone || "",
            submittedAt: new Date().toISOString(),
            shareLink,
            dashboardUrl,
            groupCode: groupCode || "",
            hasConflict: activeConflict,
            conflictingGroupCode: conflictingCode || "",
            pocAttending: Boolean(data.attending),
            linkGenerationFailed: groupLinkWriteFailed,
          }),
        }).catch((err) => console.error("Make group-lead webhook error:", err));
      } else {
        console.warn("MAKE_GROUP_LEAD_WEBHOOK_URL not set — group-lead intake submitted but no webhook fired.");
      }

      return NextResponse.json(
        {
          success: true,
          confirmation: {
            name: data.name,
            role: "group_lead",
            groupSize: data.expectedSize ?? 0,
            rallyPoint: {
              name: targetPoint.name,
              address: targetPoint.address,
              zone: targetPoint.zone || "",
            },
            eventDate: EVENT_DATE_DISPLAY,
            eventTime: EVENT_TIME_DISPLAY,
            shareLinkSent: Boolean(shareLink),
            dashboardUrl,
          },
        },
        { status: 201 }
      );
    }

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

    // Hard cap: never exceed the park's actual capacity.
    if (targetPoint.volunteer_count + totalPeople > targetPoint.capacity) {
      return NextResponse.json(
        { error: `${targetPoint.name} is full. Please choose another location.` },
        { status: 400 }
      );
    }

    // Soft reservation: if this park is adopted by a group, random volunteers
    // (no matching groupCode) can only fill seats beyond the group's commitment.
    // Members of the adopting group itself bypass this check because their
    // signup eats into the seats already reserved for them.
    const adoptedCode = targetPoint.adopted_code || "";
    const expectedSize = targetPoint.expected_size || 0;
    const isMatchingGroupMember = data.groupCode && data.groupCode === adoptedCode;
    if (adoptedCode && !isMatchingGroupMember && expectedSize > 0) {
      const reservedFloor = Math.max(targetPoint.volunteer_count, expectedSize);
      const remainingForRandoms = targetPoint.capacity - reservedFloor;
      if (totalPeople > remainingForRandoms) {
        return NextResponse.json(
          {
            error: `${targetPoint.name} is reserved by ${targetPoint.adopted_by} (${expectedSize} spots committed). Please choose a different park.`,
          },
          { status: 400 }
        );
      }
    }

    // Prevent duplicate site leaders at the same rally point
    if (data.role === "site_leader" && targetPoint.site_leader_id) {
      return NextResponse.json(
        { error: `${targetPoint.name} already has a site leader. You can still sign up as a volunteer.` },
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
      groupCode: data.groupCode ?? null,
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
        groupCode: data.groupCode ?? undefined,
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
