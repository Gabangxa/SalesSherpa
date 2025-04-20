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
 * @returns The AI-generated response
 */
export async function generateAIResponse(userMessage: string, conversation: any[] = []): Promise<string> {
  try {
    // Create the conversation history for context
    const messages = [
      {
        role: "system",
        content: `You are an expert Fintech sales coach and mentor. 
Your purpose is to guide fintech sales professionals to improve their performance, accountability, and strategic planning.
Focus on providing specific, actionable advice related to fintech sales strategies.
Keep responses concise but insightful, under 150 words.
Be supportive but firm about accountability.
Be knowledgeable about fintech industry trends, sales methodologies, and best practices.
If you don't know something specific to the user's situation, offer general best practices rather than making assumptions.
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