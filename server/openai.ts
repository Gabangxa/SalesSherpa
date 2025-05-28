import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const AI_MODEL = "gpt-4o";

/**
 * Generate a response from the AI sales coach
 * 
 * @param userMessage - The message from the user
 * @param conversation - Previous messages for context
 * @param userGoals - Current user goals for context
 * @param userTasks - Current user tasks for context
 * @returns The AI-generated response
 */
export async function generateAIResponse(
  userMessage: string, 
  conversation: any[] = [], 
  userGoals: any[] = [],
  userTasks: any[] = []
): Promise<string> {
  try {
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

IMPORTANT: You have access to the user's current goals and tasks. Reference these when providing guidance to make your coaching more targeted and effective.

${goalsContext}
${tasksContext}

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