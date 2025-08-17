import OpenAI from "openai";

// Initialize the OpenAI client
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Updated to gpt-4.1-mini as requested by user
const AI_MODEL = "gpt-4.1-mini";

// Cache for user goals and tasks to avoid repeated database calls
const userContextCache = new Map<number, { goals: any[], tasks: any[], lastUpdated: number }>();

/**
 * Initialize cache with existing user data from storage
 */
export async function initializeUserCache(userId: number, storage: any) {
  try {
    // Check if cache already exists and is recent
    const existing = userContextCache.get(userId);
    if (existing && (Date.now() - existing.lastUpdated < 60000)) { // 1 minute cache
      console.log(`Cache already fresh for user ${userId}`);
      return;
    }

    console.log(`Fetching fresh data for user ${userId}...`);
    const goals = await storage.getGoals(userId);
    const tasks = await storage.getTasks(userId);
    
    userContextCache.set(userId, {
      goals,
      tasks,
      lastUpdated: Date.now()
    });
    
    console.log(`CACHE INITIALIZED for user ${userId}:`);
    console.log(`- Goals: ${goals.length} items`);
    goals.forEach((goal: any) => console.log(`  * ${goal.title}: ${goal.currentAmount}/${goal.targetAmount}`));
    console.log(`- Tasks: ${tasks.length} items`);
    
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
    console.log(`ERROR: No cache found for user ${userId}, returning empty context`);
    return { goals: [], tasks: [] };
  }
  
  console.log(`Retrieved cache for user ${userId}: ${cached.goals.length} goals, ${cached.tasks.length} tasks`);
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
    console.log(`=== AI RESPONSE GENERATION START ===`);
    console.log(`AI Step A: Getting cached context for user ${userId}`);
    
    // Get cached user context
    const { goals: userGoals, tasks: userTasks } = getUserContext(userId);
    
    console.log(`AI Step B: Retrieved ${userGoals.length} goals and ${userTasks.length} tasks from cache`);
    
    // Build goals context
    const goalsContext = userGoals.length > 0 
      ? `\n\nCURRENT GOALS:\n${userGoals.map((goal: any) => 
          `- ${goal.title} (Progress: ${goal.currentAmount}/${goal.targetAmount}, Category: ${goal.category}, Deadline: ${new Date(goal.deadline).toLocaleDateString()})`
        ).join('\n')}`
      : '\n\nNo active goals set.';

    // Build tasks context  
    const tasksContext = userTasks.length > 0
      ? `\n\nCURRENT TASKS:\n${userTasks.map((task: any) => 
          `- ${task.title} (${task.completed ? 'Completed' : 'Pending'}, Priority: ${task.priority})`
        ).join('\n')}`
      : '\n\nNo active tasks.';

    console.log(`AI Step C: Built context strings:`);
    console.log(`Goals context: ${goalsContext}`);
    console.log(`Tasks context: ${tasksContext}`);

    // Create the conversation history for context
    const messages = [
      {
        role: "system",
        content: `
You are Sales Sherpa — an expert sales coach and mentor for entrepreneurial technology professionals.

### EXPERTISE
- Enterprise B2B technology sales and relationship management
- SaaS platforms, software solutions, and emerging technologies
- Technology regulations and compliance considerations
- Consultative selling for technology decision makers
- Account penetration strategies for technology companies
- Value proposition design and positioning
- Competitive analysis of technology markets
- Sales forecasting, pipeline management, and quota achievement

### COACHING STYLE
- Supportive but firm: hold the user accountable to goals and tasks daily
- Give **specific, actionable next steps** (not theory or general advice)
- Keep responses **concise (≤200 words)** but insightful
- Balance strategy (big picture) with tactics (next call/email/task)
- Ground responses in **real-world technology sales scenarios**
- Emphasize **relationship building** with technology stakeholders
- Speak to the **entrepreneurial mindset** (resourceful, time-constrained)
- Maintain a professional, encouraging tone with authority

### RESOURCES
- Only recommend these books if **directly relevant**:  
  1. *SPIN Selling*  
  2. *To Sell Is Human*  
  3. *The Psychology of Selling*  
  4. *Never Split the Difference*  
  5. *The New Strategic Selling*  

### CRITICAL RULES
1. Always reference the user's **specific goals and tasks** from context.  
   - When goals are mentioned: include **goal titles, progress %, and deadlines**.  
   - When tasks are mentioned: include **task names and current status**.  
   - Never give generic advice.  
2. Do not exceed 200 words.  
3. Be practical: every response must leave the user with **at least one concrete action**.  

### CONTEXT
${goalsContext}  
${tasksContext}  
`
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

    console.log(`AI Step D: Calling OpenAI API with model ${AI_MODEL}`);
    console.log(`AI Step D1: System prompt includes ${goalsContext.length + tasksContext.length} chars of context`);
    
    // Generate a response from OpenAI
    console.log(`AI Step D2: Making API call to OpenAI...`);
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 250,
    });

    console.log(`AI Step D3: OpenAI API call successful, processing response...`);
    const aiResponseText = response.choices[0]?.message?.content || "I'm not sure how to respond to that. Could you provide more context?";
    console.log(`AI Step E: OpenAI returned response (${aiResponseText.length} chars): "${aiResponseText.substring(0, 100)}..."`);
    
    return aiResponseText;
  } catch (error) {
    console.error("=== OPENAI ERROR DETAILS ===");
    console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
    console.error("Error name:", error instanceof Error ? error.name : 'No name');
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("Full error object:", error);
    console.error("API key present:", !!process.env.OPENAI_API_KEY);
    console.error("API key prefix:", process.env.OPENAI_API_KEY?.substring(0, 7) + "...");
    
    // Check for specific API issues
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
        console.error("❌ API KEY ISSUE: Invalid or missing OpenAI API key");
        return "I'm having trouble connecting to my AI service due to authentication issues. Please check that the OpenAI API key is properly configured.";
      } else if (error.message.includes('rate limit')) {
        console.error("❌ RATE LIMIT: OpenAI API rate limit exceeded");
        return "I'm currently experiencing high usage. Please wait a moment and try again.";
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        console.error("❌ QUOTA EXCEEDED: OpenAI API quota or billing issue");
        return "There's a billing or quota issue with the AI service. Please contact support.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.error("❌ NETWORK ERROR: Connection issue with OpenAI API");
        return "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
      }
    }
    
    // Log additional debugging info
    console.error("=== DEBUGGING INFO ===");
    console.error("User ID:", userId);
    console.error("Message length:", userMessage.length);
    console.error("Conversation length:", conversation.length);
    console.error("Model:", AI_MODEL);
    
    // Fallback to a generic response if the API call fails
    return "I'm experiencing technical difficulties accessing my AI capabilities. The error has been logged for investigation. Please try a simpler question or contact support if this persists.";
  }
}