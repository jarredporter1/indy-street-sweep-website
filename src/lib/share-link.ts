const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://indystreetsweep.com";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function randomSuffix(length = 6): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function buildGroupCode(orgName: string): string | null {
  const slug = slugify(orgName);
  if (!slug) return null;
  return `${slug}-${randomSuffix()}`;
}

export function buildShareLink(params: {
  groupCode: string;
  orgName: string;
  rallyPointId: string;
}): string {
  const qs = new URLSearchParams({
    group: params.groupCode,
    church: params.orgName,
    park: params.rallyPointId,
  });
  return `${BASE_URL}/map?${qs.toString()}`;
}

/**
 * Decide whether a fresh group inquiry can auto-receive a share-link.
 * Conflicts when another distinct group_code already has signups at the
 * requested park — sending a second link would let two orgs over-fill it.
 *
 * NOTE: this signal is for the conflict-on-intake check. The authoritative
 * "is this park adopted" check now reads the GroupLinks sheet tab (see
 * lib/group-links.ts), which tracks claims even before any signups land.
 */
export function detectGroupConflict(
  signupRows: string[][],
  rallyPointId: string,
): { conflict: boolean; conflictingGroupCode?: string } {
  // sheet columns: F=rallyPointId (idx 5), Q=group_code (idx 16)
  const codesAtPark = new Set<string>();
  for (const row of signupRows) {
    if (row[5] !== rallyPointId) continue;
    const code = (row[16] || "").trim();
    if (code) codesAtPark.add(code);
  }
  if (codesAtPark.size === 0) return { conflict: false };
  return { conflict: true, conflictingGroupCode: Array.from(codesAtPark)[0] };
}
