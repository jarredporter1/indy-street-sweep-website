"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { addPersonToGroup, loadGroupDashboard, type GroupDashboardData } from "./actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TSHIRT_SIZES } from "@/lib/constants";

interface Props {
  initialData: GroupDashboardData;
  code: string;
}

export function GroupDashboardClient({ initialData, code }: Props) {
  const [data, setData] = useState<GroupDashboardData>(initialData);
  const [copied, setCopied] = useState(false);
  const [isAdding, startAdd] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tshirtSize, setTshirtSize] = useState("");

  function refresh() {
    startRefresh(async () => {
      const fresh = await loadGroupDashboard(code);
      setData(fresh);
    });
  }

  async function copyLink() {
    if (!data.shareLink) return;
    try {
      await navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const fd = new FormData();
    fd.set("code", code);
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("tshirtSize", tshirtSize);
    startAdd(async () => {
      const res = await addPersonToGroup(fd);
      if (!res.ok) {
        setAddError(res.error || "Failed to add.");
        return;
      }
      setName("");
      setEmail("");
      setPhone("");
      setTshirtSize("");
      setShowAdd(false);
      refresh();
    });
  }

  if (!data.ok) {
    return (
      <main className="min-h-screen bg-indy-cream flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm space-y-4 text-center">
          <h1 className="font-heading text-2xl font-black text-indy-navy">Link not active</h1>
          <p className="text-sm text-gray-600">{data.error}</p>
          <Link href="/" className="inline-block text-indy-navy font-semibold underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const expected = data.expectedSize || 0;
  const signupCount = data.signups?.length ?? 0;
  const capacity = data.capacity || 30;
  const totalAtPark = data.totalAtPark || 0;
  const reservedTarget = Math.max(signupCount, expected);
  const groupSpotsLeft = Math.max(0, expected - signupCount);
  const parkSpotsLeft = Math.max(0, capacity - Math.max(totalAtPark, reservedTarget));
  const progressPct = expected > 0 ? Math.min(100, Math.round((signupCount / expected) * 100)) : 0;

  return (
    <main className="min-h-screen bg-indy-cream py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/logos/Street Sweep Logo Transparent 1.png"
              alt="Street Sweep Indy"
              width={120}
              height={34}
              className="h-7 w-auto"
            />
          </Link>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="text-xs text-gray-500 hover:text-indy-navy disabled:opacity-50 cursor-pointer"
          >
            {isRefreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </header>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-indy-gold font-semibold">
            Group dashboard
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-indy-navy">
            {data.orgName}
          </h1>
          <p className="text-gray-600">
            Adopting <strong>{data.rallyPoint!.name}</strong>
            {data.rallyPoint?.zone ? ` (${data.rallyPoint.zone})` : ""} · Tuesday, July 7, 2026 ·
            8:00–10:00 AM
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Signed up</p>
              <p className="font-heading text-3xl font-black text-indy-navy tabular-nums">
                {signupCount}
                {expected > 0 && (
                  <span className="text-gray-400 font-normal text-2xl"> / {expected}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-gray-400">Spots left in your goal</p>
              <p className="font-heading text-3xl font-black text-indy-navy tabular-nums">
                {groupSpotsLeft}
              </p>
            </div>
          </div>
          {expected > 0 && (
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indy-navy to-indy-gold rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          <p className="text-xs text-gray-500">
            Park capacity: {totalAtPark} / {capacity} signed up · {parkSpotsLeft} open
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
              Your group sign-up link
            </p>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={data.shareLink || ""}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-gray-50 text-indy-navy"
              />
              <button
                type="button"
                onClick={copyLink}
                className="px-4 py-2 bg-indy-navy text-white text-sm font-semibold rounded-lg hover:bg-indy-blue transition-colors cursor-pointer"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Forward this link to your group. Each person fills it out once and they&apos;re in.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-indy-navy">Your group ({signupCount})</h2>
            <button
              type="button"
              onClick={() => setShowAdd((s) => !s)}
              className="text-sm text-indy-navy font-semibold hover:underline cursor-pointer"
            >
              {showAdd ? "Cancel" : "+ Add a person manually"}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-gray-100">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {addError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Select
                  label="T-shirt (optional)"
                  value={tshirtSize}
                  onChange={(e) => setTshirtSize(e.target.value)}
                  placeholder="Select size"
                  options={TSHIRT_SIZES.map((s) => ({ value: s, label: s }))}
                />
              </div>
              <Button type="submit" disabled={isAdding} className="w-full">
                {isAdding ? "Adding..." : "Add to group"}
              </Button>
            </form>
          )}

          {signupCount === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No one&apos;s signed up yet. Share the link above with your group, or add someone manually.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.signups!.map((s, i) => (
                <li key={`${s.email}-${i}`} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-indy-navy truncate">
                      {s.name}
                      {s.isPoc && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-indy-gold font-bold">
                          POC
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                  </div>
                  <p className="text-xs text-gray-400 tabular-nums">
                    {s.tshirt || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
