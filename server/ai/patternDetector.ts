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

// Weight multiplier per day of age — a match 7 days ago is worth ~0.85^7 ≈ 0.32
// relative to a match today. Keeps recent signal dominant without discarding history.
const DECAY = 0.85;

// Minimum weighted score to surface a pattern. Roughly equivalent to
// two matches within the last few days.
const WEIGHTED_THRESHOLD = 1.5;

// Minimum consecutive recent check-ins to label a pattern as escalating.
const STREAK_MIN = 3;

export function detectPatterns(checkIns: CheckIn[]): string[] {
  if (checkIns.length < 2) return [];

  const now = Date.now();

  // Build weighted entries sorted newest-first so streak detection
  // walks from most recent outward.
  const entries = checkIns
    .map((ci) => {
      const daysAgo = Math.max(0, (now - new Date(ci.date).getTime()) / 86_400_000);
      const text = [ci.achievements, ci.challenges, ci.reflection, ci.goals]
        .filter(Boolean)
        .join(" ");
      return { weight: Math.pow(DECAY, daysAgo), text };
    })
    .sort((a, b) => b.weight - a.weight);

  const results: Array<{
    label: string;
    weightedScore: number;
    rawCount: number;
    streak: number;
  }> = [];

  for (const [label, regex] of Object.entries(SIGNAL_REGEXES)) {
    const matching = entries.filter(({ text }) => regex.test(text));
    const weightedScore = matching.reduce((sum, { weight }) => sum + weight, 0);

    if (weightedScore < WEIGHTED_THRESHOLD) continue;

    // Walk newest-first to find the unbroken streak length.
    let streak = 0;
    for (const { text } of entries) {
      if (regex.test(text)) streak++;
      else break;
    }

    results.push({ label, weightedScore, rawCount: matching.length, streak });
  }

  return results
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3)
    .map(({ label, rawCount, streak }) => {
      if (streak >= STREAK_MIN) {
        return `"${label}" — ${streak} check-ins in a row (escalating trend)`;
      }
      return `"${label}" — came up in ${rawCount} of the last ${entries.length} check-ins`;
    });
}
