/**
 * Insight Extractor
 *
 * After every 10th message, scans the recent conversation for concrete facts
 * that the user revealed to Sherpa — deal names, relationship signals,
 * strategic context — and persists them so future sessions aren't cold.
 *
 * Runs fire-and-forget (unawaited). Errors are caught and logged; they must
 * never surface to the user.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { IStorage } from "../storage";
import { log } from "../vite";
import type { ChatMessage } from "@shared/schema";

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY ?? "");

const INSIGHT_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const EXTRACTION_INTERVAL = 10; // every N total messages
const CONVERSATION_WINDOW = 20; // messages fed to the extractor

const SYSTEM_PROMPT = `You extract short, concrete facts from sales conversations for a personal sales assistant to remember.

Extract facts that are:
- Specific: named accounts, prospects, deals, or people
- Durable: still likely relevant next week (not "feeling tired today")
- From the user only — ignore what the assistant said

Skip:
- Generic statements ("sales is hard", "trying to stay positive")
- Anything already in the "Already known" list
- Vague feelings without a concrete subject

Return ONLY a valid JSON array of strings. Each string ≤15 words. Return [] if nothing new is found.`;

function buildUserPrompt(messages: ChatMessage[], existingInsights: string[]): string {
  const knownBlock = existingInsights.length > 0
    ? `Already known:\n${JSON.stringify(existingInsights)}\n\n`
    : "";

  const conversationBlock = messages
    .map((m) => `[${m.sender === "user" ? "User" : "Sherpa"}]: ${m.message}`)
    .join("\n");

  return `${knownBlock}Conversation:\n${conversationBlock}\n\nExtract new facts:`;
}

function parseInsights(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw.trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

async function extractInsights(
  userId: number,
  allMessages: ChatMessage[],
  storage: IStorage
): Promise<void> {
  const existingInsights = await storage.getInsights(userId);
  const existingTexts = existingInsights.map((i) => i.insight);

  const window = allMessages.slice(-CONVERSATION_WINDOW);

  const model = genai.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { temperature: 0, maxOutputTokens: 200 },
  });

  const result = await model.generateContent(buildUserPrompt(window, existingTexts));
  const raw = result.response.text() ?? "[]";
  const newInsights = parseInsights(raw);

  if (newInsights.length === 0) return;

  const expiresAt = new Date(Date.now() + INSIGHT_TTL_MS);
  await Promise.all(
    newInsights.map((insight) =>
      storage.createInsight({ userId, insight, expiresAt })
    )
  );

  log(`Extracted ${newInsights.length} insight(s) for user ${userId}`);
}

/**
 * Call this after saving an AI response. Pass the total message count
 * (including both the user message and AI response just saved).
 * Runs in the background — never awaited, never throws to the caller.
 */
export function maybeExtractInsights(
  userId: number,
  totalMessageCount: number,
  storage: IStorage
): void {
  if (totalMessageCount % EXTRACTION_INTERVAL !== 0) return;

  storage
    .getChatMessages(userId)
    .then((messages) => extractInsights(userId, messages, storage))
    .catch((err) => log(`Insight extraction failed for user ${userId}: ${err}`));
}
