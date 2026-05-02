/**
 * AI entry point. All AI calls go through here.
 *
 * Two modes:
 *   generateResponse    — freeform chat with Sherpa persona + full user context
 *   handleCheckInFlow   — guided morning/evening ritual, one question at a time
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
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

if (!process.env.GOOGLE_AI_KEY) {
  throw new Error("GOOGLE_AI_KEY environment variable is required");
}

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
const MODEL = "gemini-2.5-pro";

export async function generateResponse(
  userId: number,
  userMessage: string,
  history: ChatMessage[],
  storage: IStorage
): Promise<string> {
  const ctx = await buildUserContext(userId, storage, userMessage);
  const systemPrompt = buildSystemPrompt(SHERPA_PERSONA, ctx);

  const mapped = history.slice(-20).map((m) => ({
    role: m.sender === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.message }],
  }));
  const firstUser = mapped.findIndex((m) => m.role === "user");
  const chatHistory = firstUser > 0 ? mapped.slice(firstUser) : mapped;

  return callGemini(systemPrompt, chatHistory, userMessage);
}

export async function handleCheckInFlow(
  userId: number,
  flowType: FlowType,
  userMessage: string,
  storage: IStorage
): Promise<{ reply: string; isComplete: boolean }> {
  const existing = await getActiveFlow(userId);

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

    const firstQuestion = await startFlow(userId, flowType, morningFocus);
    return { reply: firstQuestion, isComplete: false };
  }

  const { nextQuestion, isComplete, collectedData } = await advanceFlow(userId, userMessage);

  if (!isComplete && nextQuestion) {
    return { reply: nextQuestion, isComplete: false };
  }

  await clearFlow(userId);

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

  const reply = await callGemini(systemPrompt, [], summaryMessage);

  return { reply, isComplete: true };
}

async function callGemini(
  systemPrompt: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  userMessage: string,
  temperature = 0.7
): Promise<string> {
  try {
    const model = genai.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      generationConfig: { temperature, maxOutputTokens: 2048 },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text() || "I didn't get a response — want to try again?";
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED")
      ) {
        return "Hit a rate limit — give it a moment and try again.";
      }
      if (
        error.message.includes("API_KEY_INVALID") ||
        error.message.includes("PERMISSION_DENIED")
      ) {
        throw new Error("Google AI API key is invalid or missing");
      }
    }
    throw error;
  }
}
