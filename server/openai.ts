import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const AI_MODEL = "gpt-4o";

// Cache for user goals and tasks to avoid repeated database calls
const userContextCache = new Map<number, { goals: any[], tasks: any[], lastUpdated: number }>();

/**
 * Initialize cache with existing user data from storage
 */
export async function initializeUserCache(userId: number, storage: any) {
  try {
    const goals = await storage.getGoals(userId);
    const tasks = await storage.getTasks(userId);
    
    userContextCache.set(userId, {
      goals,
      tasks,
      lastUpdated: Date.now()
    });
    
    console.log(`Initialized cache for user ${userId} with ${goals.length} goals and ${tasks.length} tasks`);
  } catch (error) {
    console.error(`Failed to initialize cache for user ${userId}:`, error);
  }
}

/**
 * Update specific goal in cache (differential update)
 */
export function updateGoalInCache(userId: number, goal: any, operation: 'add' | 'update' | 'delete') {
  const cached = userContextCache.get(userId);
  if (!cached) return;

  switch (operation) {
    case 'add':
      cached.goals.push(goal);
      break;
    case 'update':
      const updateIndex = cached.goals.findIndex(g => g.id === goal.id);
      if (updateIndex !== -1) {
        cached.goals[updateIndex] = goal;
      }
      break;
    case 'delete':
      cached.goals = cached.goals.filter(g => g.id !== goal.id);
      break;
  }
  
  cached.lastUpdated = Date.now();
  console.log(`Updated cache for user ${userId}: ${operation} goal "${goal.title}"`);
}

/**
 * Update specific task in cache (differential update)
 */
export function updateTaskInCache(userId: number, task: any, operation: 'add' | 'update' | 'delete') {
  const cached = userContextCache.get(userId);
  if (!cached) return;

  switch (operation) {
    case 'add':
      cached.tasks.push(task);
      break;
    case 'update':
      const updateIndex = cached.tasks.findIndex(t => t.id === task.id);
      if (updateIndex !== -1) {
        cached.tasks[updateIndex] = task;
      }
      break;
    case 'delete':
      cached.tasks = cached.tasks.filter(t => t.id !== task.id);
      break;
  }
  
  cached.lastUpdated = Date.now();
  console.log(`Updated cache for user ${userId}: ${operation} task "${task.title}"`);
}

/**
 * Get cached context for a user, initialize if not available
 */
function getUserContext(userId: number) {
  const cached = userContextCache.get(userId);
  if (!cached) {
    console.log(`No cache found for user ${userId}, returning empty context`);
    return { goals: [], tasks: [] };
  }
  
  return { goals: cached.goals, tasks: cached.tasks };
}

/**
 * Generate a response from the AI sales coach
 * 
 * @param userMessage - The message from the user
 * @param conversation - Previous messages for context
 * @param userId - User ID to get cached goals and tasks
 * @returns The AI-generated response
 */
export async function generateAIResponse(
  userMessage: string, 
  conversation: any[] = [], 
  userId: number
): Promise<string> {
  try {
    // Get cached user context
    const { goals: userGoals, tasks: userTasks } = getUserContext(userId);
    
    // Build goals context
    const goalsContext = userGoals.length > 0 
      ? `\n\nCURRENT GOALS:\n${userGoals.map(goal => 
          `- ${goal.title} (Progress: ${goal.currentAmount}/${goal.targetAmount}, Category: ${goal.category}, Deadline: ${new Date(goal.deadline).toLocaleDateString()})`
        ).join('\n')}`
      : '\n\nNo active goals set.';

    // Build tasks context  
    const tasksContext = userTasks.length > 0
      ? `\n\nCURRENT TASKS:\n${userTasks.map(task => 
          `- ${task.title} (${task.completed ? 'Completed' : 'Pending'}, Priority: ${task.priority})`
        ).join('\n')}`
      : '\n\nNo active tasks.';

    // Debug log the context being sent to AI
    console.log("AI Goals Context:", goalsContext);
    console.log("AI Tasks Context:", tasksContext);

    // Create the conversation history for context
    const messages = [
      {
        role: "system",
        content: `You are an expert Fintech sales coach and mentor for entrepreneurial financial technology professionals.

EXPERTISE & FOCUS AREAS:
- Enterprise B2B fintech sales strategies and relationship management
- Financial services regulations relevant to sales (compliance awareness)
- Payment processing, banking solutions, wealth management tech, blockchain/crypto
- Consultative selling techniques specific to financial decision makers
- Account penetration strategies for financial institutions
- Value proposition development for fintech products
- Competitive landscape analysis for fintech solutions
- Sales forecasting and pipeline management for financial technology sales

COACHING STYLE:
- Be supportive but firm about daily accountability and goal achievement
- Provide specific, actionable advice with concrete next steps
- Reference real-world fintech sales scenarios and challenges
- Keep responses concise but insightful, under 150 words
- Balance strategic guidance with tactical implementation
- Emphasize relationship building with financial stakeholders
- Acknowledge the entrepreneurial mindset of fintech professionals
- Use their current goals and tasks to provide personalized guidance

RECOMMENDED RESOURCES:
Only recommend these five specific sales books if relevant:
1. SPIN Selling
2. To Sell Is Human
3. The Psychology of Selling
4. Never Split the Difference 
5. The New Strategic Selling

CRITICAL INSTRUCTION: You MUST reference the user's specific goals and tasks in your response. When they ask about goals, list their actual goals by name with current progress. DO NOT give generic advice.

${goalsContext}
${tasksContext}

When responding about goals, always mention specific goal titles, progress numbers, and deadlines from the data above. Be specific and personal in your coaching.

Maintain a professional tone that balances friendliness with authority.`
      },
      ...conversation.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    // Generate a response from OpenAI
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that. Could you provide more context?";
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to a generic response if the API call fails
    return "I'm experiencing some technical difficulties. Please try again later or contact support if the issue persists.";
  }
}