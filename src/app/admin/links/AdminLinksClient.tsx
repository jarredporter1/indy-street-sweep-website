"use client";

import { useState, useTransition } from "react";
import {
  generateShareLink,
  loadAdminContext,
  type AdminRallyPointSummary,
  type GenerateLinkResult,
} from "./actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface UnlockState {
  passcode: string;
  rallyPoints: AdminRallyPointSummary[];
  groupCounts: Record<string, number>;
}

export function AdminLinksClient() {
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<UnlockState | null>(null);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [isUnlocking, startUnlock] = useTransition();

  const [orgName, setOrgName] = useState("");
  const [rallyPointId, setRallyPointId] = useState("");
  const [result, setResult] = useState<GenerateLinkResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, startGenerate] = useTransition();

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlockError(null);
    startUnlock(async () => {
      const res = await loadAdminContext(passcodeInput);
      if (!res.ok || !res.rallyPoints) {
        setUnlockError(res.error || "Could not unlock.");
        return;
      }
      setUnlocked({
        passcode: passcodeInput,
        rallyPoints: res.rallyPoints,
        groupCounts: res.groupCounts || {},
      });
    });
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!unlocked) return;
    setResult(null);
    setCopied(false);
    const fd = new FormData();
    fd.set("passcode", unlocked.passcode);
    fd.set("orgName", orgName);
    fd.set("rallyPointId", rallyPointId);
    startGenerate(async () => {
      const res = await generateShareLink(fd);
      setResult(res);
    });
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on insecure contexts; fall back silently
    }
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-indy-cream p-6">
        <form
          onSubmit={handleUnlock}
          className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm space-y-5"
        >
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-black text-indy-navy">Admin · Group Links</h1>
            <p className="text-sm text-gray-500">Enter the admin passcode to continue.</p>
          </div>
          <Input
            label="Passcode"
            type="password"
            autoFocus
            autoComplete="off"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            error={unlockError || undefined}
          />
          <Button type="submit" disabled={isUnlocking || !passcodeInput} className="w-full">
            {isUnlocking ? "Unlocking..." : "Unlock"}
          </Button>
        </form>
      </main>
    );
  }

  const rallyPointOptions = unlocked.rallyPoints.map((rp) => ({
    value: rp.id,
    label: `${rp.name}${rp.zone ? ` (${rp.zone})` : ""} · ${rp.volunteer_count}/${rp.capacity}${rp.hasSiteLeader ? " · ✓ leader" : ""}`,
  }));

  const groupTotal = Object.values(unlocked.groupCounts).reduce((a, b) => a + b, 0);
  const groupEntries = Object.entries(unlocked.groupCounts).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-indy-cream py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="font-heading text-3xl font-black text-indy-navy">Group Share Links</h1>
          <p className="text-sm text-gray-600">
            Generate a unique URL for an organization, then copy it into your reply email.
            Anyone with the link can sign up under that group at the chosen park.
          </p>
        </header>

        <form
          onSubmit={handleGenerate}
          className="bg-white p-6 rounded-2xl shadow-sm space-y-4"
        >
          <Input
            label="Organization name"
            placeholder="St. Lukes Methodist"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />

          <Select
            label="Rally point"
            value={rallyPointId}
            onChange={(e) => setRallyPointId(e.target.value)}
            placeholder="Select a park"
            options={rallyPointOptions}
            required
          />

          <Button
            type="submit"
            disabled={isGenerating || !orgName.trim() || !rallyPointId}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Share Link"}
          </Button>
        </form>

        {result && !result.ok && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {result.error}
          </div>
        )}

        {result && result.ok && result.url && (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Share link</p>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={result.url}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-gray-50 text-indy-navy"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.url!)}
                  className="px-4 py-2 bg-indy-navy text-white text-sm font-semibold rounded-lg hover:bg-indy-blue transition-colors cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Group code</p>
                <p className="font-mono text-indy-navy">{result.groupCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Rally point</p>
                <p className="text-indy-navy">{result.rallyPointName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Current capacity</p>
                <p className="text-indy-navy">
                  {result.currentSignups} / {result.capacity}
                </p>
              </div>
            </div>

            <div className="bg-indy-cream border-l-4 border-indy-gold p-3 text-xs text-indy-navy rounded">
              <p className="font-semibold mb-1">Suggested email reply:</p>
              <p className="whitespace-pre-line leading-relaxed">
                {`Hey {{firstName}},

Confirmed — your group is locked in for ${result.rallyPointName} on July 7.

Here's the sign-up link to share with your team:
${result.url}

Each person clicks, fills in their name + email + t-shirt size, and they're in. Aim for ${(result.capacity ?? 30) - (result.currentSignups ?? 0)} or fewer so we don't overflow the park.

Talk soon,
Trace`}
              </p>
            </div>
          </div>
        )}

        {groupEntries.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-heading text-lg font-bold text-indy-navy">Active group links</h2>
              <p className="text-xs text-gray-500">
                {groupTotal} signup{groupTotal === 1 ? "" : "s"} across {groupEntries.length}{" "}
                group{groupEntries.length === 1 ? "" : "s"}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider text-left">
                  <th className="py-2 font-medium">Group code</th>
                  <th className="py-2 font-medium text-right">Signups</th>
                </tr>
              </thead>
              <tbody>
                {groupEntries.map(([code, count]) => (
                  <tr key={code} className="border-t border-gray-100">
                    <td className="py-2 font-mono text-xs text-indy-navy">{code}</td>
                    <td className="py-2 text-right font-semibold text-indy-navy">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
