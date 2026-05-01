import { natsSubscribe, natsPublish } from './nats';
import { generateResponse } from './ai/index';
import { maybeExtractInsights } from './ai/insightExtractor';
import { storage } from './storage';
import { log } from './vite';

interface ChatJob {
  userId: number;
  message: string;
}

export function startAiWorker(): void {
  const sub = natsSubscribe('chat.process.*', async (_subject, data) => {
    const { userId, message } = data as ChatJob;

    try {
      const recentMessages = await storage.getChatMessages(userId);
      const aiResponse = await generateResponse(
        userId,
        message,
        recentMessages.slice(-10),
        storage
      );

      const saved = await storage.createChatMessage({
        userId,
        message: aiResponse,
        sender: 'assistant',
        timestamp: new Date(),
      });

      natsPublish(`notifications.user.${userId}`, {
        type: 'MESSAGE',
        payload: {
          type: 'ai_chat_response',
          messageId: saved.id,
          message: aiResponse,
          sender: 'assistant',
          timestamp: saved.timestamp,
        },
        timestamp: Date.now(),
      });

      // recentMessages was fetched before the AI response was saved,
      // so total = recentMessages.length + 1 (the AI message just saved).
      maybeExtractInsights(userId, recentMessages.length + 1, storage);

      log(`AI worker processed chat for user ${userId}`);
    } catch (err) {
      log(`AI worker error for user ${userId}: ${err}`);

      const fallback = await storage.createChatMessage({
        userId,
        message: "I'm experiencing technical difficulties. Please try again.",
        sender: 'assistant',
        timestamp: new Date(),
      });

      natsPublish(`notifications.user.${userId}`, {
        type: 'MESSAGE',
        payload: {
          type: 'ai_chat_response',
          messageId: fallback.id,
          message: fallback.message,
          sender: 'assistant',
          timestamp: fallback.timestamp,
        },
        timestamp: Date.now(),
      });
    }
  });

  if (sub) {
    log('AI worker started — listening on chat.process.*');
  }
}
