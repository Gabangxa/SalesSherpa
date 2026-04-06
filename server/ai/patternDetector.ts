import type { CheckIn } from "@shared/schema";

// Keywords to track, grouped by theme.
// Extend these as you learn what your users actually talk about.
const SIGNAL_GROUPS: Record<string, string[]> = {
  "pricing objections": [
    "price",
    "pricing",
    "too expensive",
    "cost",
    "budget",
    "afford",
    "cheaper",
    "discount",
  ],
  "prospect going cold": [
    "no response",
    "went cold",
    "ghosted",
    "stopped responding",
    "silent",
    "no reply",
    "disappeared",
  ],
  "motivation / energy": [
    "unmotivated",
    "tired",
    "drained",
    "hard to focus",
    "low energy",
    "not feeling it",
    "burnt out",
    "struggling",
  ],
  "pipeline concerns": [
    "pipeline",
    "empty",
    "slow",
    "no leads",
    "not enough deals",
    "dry",
    "few prospects",
  ],
  "momentum / winning": [
    "great day",
    "closed",
    "won",
    "excited",
    "momentum",
    "on a roll",
    "breakthrough",
    "progress",
  ],
  "manager / support issues": [
    "no support",
    "manager",
    "alone",
    "no guidance",
    "isolated",
    "no feedback",
    "no help",
  ],
};

// Precompile one regex per group to avoid rebuilding on every call.
// Word boundaries prevent "afford" matching "unaffordable", etc.
const SIGNAL_REGEXES: Record<string, RegExp> = Object.fromEntries(
  Object.entries(SIGNAL_GROUPS).map(([label, keywords]) => [
    label,
    new RegExp(keywords.map((kw) => `\\b${kw}\\b`).join("|"), "i"),
  ])
);

const THRESHOLD = 2;

export function detectPatterns(checkIns: CheckIn[]): string[] {
  if (checkIns.length < THRESHOLD) return [];

  const checkInTexts = checkIns.map((ci) =>
    [ci.achievements, ci.challenges, ci.reflection, ci.goals]
      .filter(Boolean)
      .join(" ")
  );

  const counts: Record<string, number> = {};

  for (const [label, regex] of Object.entries(SIGNAL_REGEXES)) {
    const matchCount = checkInTexts.filter((text) => regex.test(text)).length;
    if (matchCount >= THRESHOLD) {
      counts[label] = matchCount;
    }
  }

  if (Object.keys(counts).length === 0) return [];

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([label, count]) => `"${label}" came up in ${count} of the last ${checkIns.length} check-ins`);
}
