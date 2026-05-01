import { StringCodec } from 'nats';
import { getFlowKv } from '../nats';

export type FlowType = "morning" | "evening";
export type FlowStatus = "in_progress" | "complete";

export interface FlowState {
  flowType: FlowType;
  step: number;
  responses: Record<string, string>;
  status: FlowStatus;
  startedAt: Date;
}

export interface CheckInFields {
  achievements: string | null;
  challenges: string | null;
  goals: string | null;
  reflection: string | null;
}

const sc = StringCodec();
const FLOW_TTL_MS = 2 * 60 * 60 * 1000;

// In-memory fallback for single-instance mode.
const activeFlows = new Map<number, FlowState>();

setInterval(() => {
  const now = Date.now();
  activeFlows.forEach((state, userId) => {
    if (now - state.startedAt.getTime() > FLOW_TTL_MS) activeFlows.delete(userId);
  });
}, 30 * 60 * 1000).unref();

function encodeFlow(state: FlowState): Uint8Array {
  return sc.encode(JSON.stringify({ ...state, startedAt: state.startedAt.toISOString() }));
}

function decodeFlow(data: Uint8Array): FlowState {
  const obj = JSON.parse(sc.decode(data));
  return { ...obj, startedAt: new Date(obj.startedAt) };
}

async function kvGet(userId: number): Promise<FlowState | null> {
  try {
    const kv = await getFlowKv();
    if (!kv) return activeFlows.get(userId) ?? null;
    const entry = await kv.get(`flow.${userId}`);
    if (!entry || entry.operation) return null;
    return decodeFlow(entry.value);
  } catch {
    return activeFlows.get(userId) ?? null;
  }
}

async function kvSet(userId: number, state: FlowState): Promise<void> {
  try {
    const kv = await getFlowKv();
    if (!kv) { activeFlows.set(userId, state); return; }
    await kv.put(`flow.${userId}`, encodeFlow(state));
  } catch {
    activeFlows.set(userId, state);
  }
}

async function kvDelete(userId: number): Promise<void> {
  try {
    const kv = await getFlowKv();
    if (!kv) { activeFlows.delete(userId); return; }
    await kv.delete(`flow.${userId}`);
  } catch {
    activeFlows.delete(userId);
  }
}

interface FlowStep {
  key: string;
  question: (morningFocus?: string | null) => string;
}

const MORNING_STEPS: FlowStep[] = [
  {
    key: "focus",
    question: () => "Morning — what's the one thing you need to nail today?",
  },
  {
    key: "obstacle",
    question: () => "What's in the way right now?",
  },
];

const EVENING_STEPS: FlowStep[] = [
  {
    key: "followUp",
    question: (morningFocus) =>
      morningFocus
        ? `How did "${morningFocus}" go today?`
        : "How did today go overall?",
  },
  {
    key: "debrief",
    question: () => "What's the one thing you'd do differently?",
  },
  {
    key: "tomorrow",
    question: () => "What's the one thing for tomorrow?",
  },
];

const FLOWS: Record<FlowType, FlowStep[]> = {
  morning: MORNING_STEPS,
  evening: EVENING_STEPS,
};

export async function startFlow(
  userId: number,
  flowType: FlowType,
  morningFocus?: string | null
): Promise<string> {
  const state: FlowState = {
    flowType,
    step: 0,
    responses: morningFocus ? { _morningFocus: morningFocus } : {},
    status: "in_progress",
    startedAt: new Date(),
  };
  await kvSet(userId, state);
  return FLOWS[flowType][0].question(morningFocus ?? null);
}

export async function advanceFlow(
  userId: number,
  userResponse: string
): Promise<{ nextQuestion: string | null; isComplete: boolean; collectedData: FlowState["responses"] }> {
  const state = await kvGet(userId);

  if (!state || state.status === "complete") {
    return { nextQuestion: null, isComplete: true, collectedData: {} };
  }

  const steps = FLOWS[state.flowType];
  const currentStep = steps[state.step];

  state.responses[currentStep.key] = userResponse.trim();
  state.step++;

  if (state.step >= steps.length) {
    state.status = "complete";
    await kvSet(userId, state);
    return { nextQuestion: null, isComplete: true, collectedData: { ...state.responses } };
  }

  const morningFocus = state.responses._morningFocus ?? null;
  const nextQuestion = steps[state.step].question(morningFocus);
  await kvSet(userId, state);
  return { nextQuestion, isComplete: false, collectedData: state.responses };
}

export async function getActiveFlow(userId: number): Promise<FlowState | null> {
  const state = await kvGet(userId);
  if (!state || state.status === "complete") return null;
  return state;
}

export async function clearFlow(userId: number): Promise<void> {
  await kvDelete(userId);
}

export function morningResponsesToCheckIn(responses: FlowState["responses"]): CheckInFields {
  return {
    achievements: null,
    challenges: responses.obstacle || null,
    goals: responses.focus || null,
    reflection: null,
  };
}

export function eveningResponsesToCheckIn(responses: FlowState["responses"]): CheckInFields {
  return {
    achievements: responses.followUp || null,
    challenges: null,
    goals: responses.tomorrow || null,
    reflection: responses.debrief || null,
  };
}
