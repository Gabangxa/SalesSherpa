/**
 * Context Builder
 *
 * Assembles a structured context block for every AI request.
 * This is what makes Sherpa feel like it knows the user —
 * without it, every conversation starts cold.
 *
 * Injected into the SHERPA_PERSONA as {USER_CONTEXT}.
 */

import { IStorage } from "../storage";
import { detectPatterns } from "./patternDetector";
import type { Goal, CheckIn, MeetingNote } from "@shared/schema";

export interface UserContext {
  name: string;
  role: string;
  goals: Goal[];
  recentCheckIns: CheckIn[];
  recentMeetingNotes: MeetingNote[];
  todaysMorningFocus: string | null;
  patterns: string[];
  insights: string[];
  checkInsRankedByRelevance: boolean;
}

/**
 * Build the full context block for a user.
 * Pass userMessage to rank check-ins by relevance to the current message
 * instead of defaulting to pure recency order.
 */
export async function buildUserContext(
  userId: number,
  storage: IStorage,
  userMessage?: string
): Promise<UserContext> {
  const [user, goals, recentCheckIns, rawInsights, allMeetingNotes] = await Promise.all([
    storage.getUser(userId),
    storage.getGoals(userId),
    storage.getCheckIns(userId, 14),
    storage.getInsights(userId).catch(() => []),
    storage.getMeetingNotes(userId).catch(() => []),
  ]);

  if (!user) throw new Error(`User ${userId} not found`);

  const patterns = detectPatterns(recentCheckIns);
  const todaysMorningFocus = getTodaysMorningFocus(recentCheckIns);

  const { ranked, byRelevance } = rankCheckIns(recentCheckIns, userMessage);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentMeetingNotes = allMeetingNotes
    .filter((n) => new Date(n.date).getTime() >= thirtyDaysAgo)
    .slice(0, 10);

  return {
    name: user.name,
    role: user.role,
    goals,
    recentCheckIns: ranked.slice(0, 10),
    recentMeetingNotes,
    todaysMorningFocus,
    patterns,
    insights: rawInsights.map((i) => i.insight),
    checkInsRankedByRelevance: byRelevance,
  };
}

/**
 * Serialise the context object into the string block
 * that gets injected into the system prompt.
 */
export function formatContextBlock(ctx: UserContext): string {
  const lines: string[] = [];

  lines.push(`User: ${ctx.name} — ${ctx.role}`);

  if (ctx.goals.length > 0) {
    lines.push("\nActive goals:");
    for (const goal of ctx.goals) {
      const progress = getProgressPercent(goal);
      const deadline = new Date(goal.deadline).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
      });
      lines.push(
        `  - ${goal.title}: ${progress}% to target (deadline ${deadline})`
      );
    }
  } else {
    lines.push("\nNo active goals set.");
  }

  if (ctx.insights.length > 0) {
    lines.push("\nRemembered from past conversations:");
    for (const insight of ctx.insights) {
      lines.push(`  - ${insight}`);
    }
  }

  if (ctx.todaysMorningFocus) {
    lines.push(`\nThis morning they said their focus was: "${ctx.todaysMorningFocus}"`);
  }

  if (ctx.recentCheckIns.length > 0) {
    const header = ctx.checkInsRankedByRelevance
      ? "\nMost relevant check-ins:"
      : "\nRecent check-ins (newest first):";
    lines.push(header);
    for (const ci of ctx.recentCheckIns.slice(0, 5)) {
      const date = new Date(ci.date).toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const summary = [ci.achievements, ci.challenges, ci.reflection]
        .filter(Boolean)
        .join(" / ")
        .slice(0, 120);
      if (summary) lines.push(`  [${date}] ${summary}`);
    }
  }

  if (ctx.recentMeetingNotes.length > 0) {
    lines.push("\nRecent meeting notes (last 30 days):");
    for (const note of ctx.recentMeetingNotes) {
      const date = new Date(note.date).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
      });
      const company = note.company ? ` — ${note.company}` : "";
      const contact = note.contactName ? ` (${note.contactName})` : "";
      const purpose = note.purpose ? ` [${note.purpose}]` : "";
      let sectionSummary = "";
      try {
        const sections: { label: string; content: string }[] = JSON.parse(note.sections);
        sectionSummary = sections
          .filter((s) => s.content?.trim())
          .map((s) => `${s.label}: ${s.content.slice(0, 100)}`)
          .join(" | ")
          .slice(0, 250);
      } catch {
        sectionSummary = note.sections.slice(0, 150);
      }
      lines.push(`  [${date}]${company}${contact}${purpose} — ${note.title}${sectionSummary ? `: ${sectionSummary}` : ""}`);
    }
  }

  if (ctx.patterns.length > 0) {
    lines.push("\nPatterns noticed across recent check-ins:");
    for (const pattern of ctx.patterns) {
      lines.push(`  - ${pattern}`);
    }
  }

  return lines.join("\n");
}

/**
 * Inject the formatted context into the persona template.
 */
export function buildSystemPrompt(persona: string, ctx: UserContext): string {
  return persona.replace("{USER_CONTEXT}", formatContextBlock(ctx));
}

// --- Helpers ---

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "was", "are", "were", "i", "my", "me", "we",
  "you", "he", "she", "it", "they", "and", "or", "but", "in", "on", "at",
  "to", "for", "of", "with", "this", "that", "have", "had", "has", "do",
  "did", "does", "be", "been", "being", "can", "could", "will", "would",
  "should", "may", "might", "so", "if", "not", "no", "just", "what", "how",
  "its", "their", "our", "your", "his", "her", "about", "up", "out", "been",
]);

/**
 * Rank check-ins by a blend of keyword relevance (60%) and recency (40%).
 * Falls back to pure recency when userMessage is absent or has no signal tokens.
 */
function rankCheckIns(
  checkIns: CheckIn[],
  userMessage?: string
): { ranked: CheckIn[]; byRelevance: boolean } {
  if (!userMessage) {
    return { ranked: [...checkIns], byRelevance: false };
  }

  const queryTokens = userMessage
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  if (queryTokens.length === 0) {
    return { ranked: [...checkIns], byRelevance: false };
  }

  const querySet = new Set(queryTokens);
  const now = Date.now();

  const scored = checkIns.map((ci) => {
    const daysAgo = Math.max(0, (now - new Date(ci.date).getTime()) / 86_400_000);
    const recencyScore = Math.pow(0.9, daysAgo);

    const ciText = [ci.achievements, ci.challenges, ci.reflection, ci.goals]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);

    const matchCount = ciText.filter((t) => querySet.has(t)).length;
    const relevanceScore = matchCount / queryTokens.length;

    return { ci, score: 0.6 * relevanceScore + 0.4 * recencyScore };
  });

  return {
    ranked: scored.sort((a, b) => b.score - a.score).map(({ ci }) => ci),
    byRelevance: true,
  };
}

function getProgressPercent(goal: Goal): number {
  const range = goal.targetAmount - goal.startingAmount;
  if (range === 0) return 0;
  const progress = goal.currentAmount - goal.startingAmount;
  return Math.round((progress / range) * 100);
}

function getTodaysMorningFocus(checkIns: CheckIn[]): string | null {
  if (checkIns.length === 0) return null;

  const today = new Date();
  const latest = checkIns[0];
  const latestDate = new Date(latest.date);

  const isSameDay =
    latestDate.getFullYear() === today.getFullYear() &&
    latestDate.getMonth() === today.getMonth() &&
    latestDate.getDate() === today.getDate();

  if (!isSameDay) return null;

  // The "goals" field in a morning check-in holds what they want to nail today
  return latest.goals || null;
}
