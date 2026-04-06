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

// In-memory store keyed by userId.
// Flows expire after 2 hours to prevent unbounded growth.
const activeFlows = new Map<number, FlowState>();
const FLOW_TTL_MS = 2 * 60 * 60 * 1000;

// Prune stale flows every 30 minutes.
setInterval(() => {
  const now = Date.now();
  Array.from(activeFlows.entries()).forEach(([userId, state]) => {
    if (now - state.startedAt.getTime() > FLOW_TTL_MS) {
      activeFlows.delete(userId);
    }
  });
}, 30 * 60 * 1000).unref(); // .unref() prevents keeping the process alive

interface FlowStep {
  key: string;
  // morningFocus is passed explicitly so the evening question can reference it
  // without relying on in-memory state from a possibly-expired morning flow.
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

export function startFlow(
  userId: number,
  flowType: FlowType,
  morningFocus?: string | null
): string {
  const state: FlowState = {
    flowType,
    step: 0,
    responses: morningFocus ? { _morningFocus: morningFocus } : {},
    status: "in_progress",
    startedAt: new Date(),
  };

  activeFlows.set(userId, state);
  return FLOWS[flowType][0].question(morningFocus ?? null);
}

export function advanceFlow(
  userId: number,
  userResponse: string
): { nextQuestion: string | null; isComplete: boolean; collectedData: FlowState["responses"] } {
  const state = activeFlows.get(userId);

  if (!state || state.status === "complete") {
    return { nextQuestion: null, isComplete: true, collectedData: {} };
  }

  const steps = FLOWS[state.flowType];
  const currentStep = steps[state.step];

  state.responses[currentStep.key] = userResponse.trim();
  state.step++;

  if (state.step >= steps.length) {
    state.status = "complete";
    return { nextQuestion: null, isComplete: true, collectedData: { ...state.responses } };
  }

  const morningFocus = state.responses._morningFocus ?? null;
  const nextQuestion = steps[state.step].question(morningFocus);
  return { nextQuestion, isComplete: false, collectedData: state.responses };
}

export function getActiveFlow(userId: number): FlowState | null {
  const state = activeFlows.get(userId);
  if (!state || state.status === "complete") return null;
  return state;
}

export function clearFlow(userId: number): void {
  activeFlows.delete(userId);
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
