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
import type { Goal, CheckIn } from "@shared/schema";

export interface UserContext {
  name: string;
  role: string;
  goals: Goal[];
  recentCheckIns: CheckIn[];
  todaysMorningFocus: string | null;
  patterns: string[];
}

/**
 * Build the full context block for a user.
 * Call this before every AI request and inject the result into the persona.
 */
export async function buildUserContext(
  userId: number,
  storage: IStorage
): Promise<UserContext> {
  const [user, goals, recentCheckIns] = await Promise.all([
    storage.getUser(userId),
    storage.getGoals(userId),
    storage.getCheckIns(userId, 14),
  ]);

  if (!user) throw new Error(`User ${userId} not found`);

  const patterns = detectPatterns(recentCheckIns);
  const todaysMorningFocus = getTodaysMorningFocus(recentCheckIns);

  return {
    name: user.name,
    role: user.role,
    goals,
    recentCheckIns: recentCheckIns.slice(0, 10),
    todaysMorningFocus,
    patterns,
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

  if (ctx.todaysMorningFocus) {
    lines.push(`\nThis morning they said their focus was: "${ctx.todaysMorningFocus}"`);
  }

  if (ctx.recentCheckIns.length > 0) {
    lines.push("\nRecent check-ins (newest first):");
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
