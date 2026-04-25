/**
 * AI entry point. All AI calls go through here.
 *
 * Two modes:
 *   generateResponse    — freeform chat with Sherpa persona + full user context
 *   handleCheckInFlow   — guided morning/evening ritual, one question at a time
 */

import OpenAI from "openai";
import { SHERPA_PERSONA } from "./persona";
import { buildUserContext, buildSystemPrompt } from "./contextBuilder";
import {
  startFlow,
  advanceFlow,
  getActiveFlow,
  clearFlow,
  morningResponsesToCheckIn,
  eveningResponsesToCheckIn,
  type FlowType,
  type CheckInFields,
} from "./checkInFlow";
import { IStorage } from "../storage";
import type { ChatMessage } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4.1-mini";

export async function generateResponse(
  userId: number,
  userMessage: string,
  history: ChatMessage[],
  storage: IStorage
): Promise<string> {
  const ctx = await buildUserContext(userId, storage, userMessage);
  const systemPrompt = buildSystemPrompt(SHERPA_PERSONA, ctx);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20).map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.message,
    })),
    { role: "user", content: userMessage },
  ];

  return callOpenAI(messages);
}

export async function handleCheckInFlow(
  userId: number,
  flowType: FlowType,
  userMessage: string,
  storage: IStorage
): Promise<{ reply: string; isComplete: boolean }> {
  const existing = getActiveFlow(userId);

  if (!existing) {
    // For evening flows, look up today's morning focus from the DB so the
    // first question can reference it even across sessions/restarts.
    let morningFocus: string | null = null;
    if (flowType === "evening") {
      const recentCheckIns = await storage.getCheckIns(userId, 1);
      const latest = recentCheckIns[0];
      if (latest) {
        const today = new Date();
        const latestDate = new Date(latest.date);
        const isSameDay =
          latestDate.getFullYear() === today.getFullYear() &&
          latestDate.getMonth() === today.getMonth() &&
          latestDate.getDate() === today.getDate();
        morningFocus = isSameDay ? (latest.goals ?? null) : null;
      }
    }

    const firstQuestion = startFlow(userId, flowType, morningFocus);
    return { reply: firstQuestion, isComplete: false };
  }

  const { nextQuestion, isComplete, collectedData } = advanceFlow(userId, userMessage);

  if (!isComplete && nextQuestion) {
    return { reply: nextQuestion, isComplete: false };
  }

  clearFlow(userId);

  const checkInData: CheckInFields =
    flowType === "morning"
      ? morningResponsesToCheckIn(collectedData)
      : eveningResponsesToCheckIn(collectedData);

  await storage.createCheckIn({
    userId,
    date: new Date(),
    achievements: checkInData.achievements,
    challenges: checkInData.challenges,
    goals: checkInData.goals,
    reflection: checkInData.reflection,
  });

  // Fetch fresh context now that the check-in is saved — it will appear
  // in the context block and make Sherpa's response feel current.
  const ctx = await buildUserContext(userId, storage);
  const systemPrompt = buildSystemPrompt(SHERPA_PERSONA, ctx);

  const summaryMessage =
    flowType === "morning"
      ? `Focus today: "${collectedData.focus}". Obstacle: "${collectedData.obstacle}".`
      : `How it went: "${collectedData.followUp}". Would do differently: "${collectedData.debrief}". Tomorrow: "${collectedData.tomorrow}".`;

  const reply = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: summaryMessage },
  ]);

  return { reply, isComplete: true };
}

async function callOpenAI(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    return (
      response.choices[0]?.message?.content ??
      "I didn't get a response — want to try again?"
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return "Hit a rate limit — give it a moment and try again.";
      }
      if (error.message.includes("API key") || error.message.includes("Unauthorized")) {
        throw new Error("OpenAI API key is invalid or missing");
      }
    }
    throw error;
  }
}
