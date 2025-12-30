import { Request, Response } from "express";
import { storage } from "../storage";
import { insertChatMessageSchema } from "@shared/schema";
import { generateAIResponse, initializeUserCache } from "../openai";
import { sendMessageToUser, WebSocketMessage, WebSocketMessageType } from "../websocket";
import { log } from "../vite";
import { z } from "zod";
import { ChatSender, NotificationType } from "../constants";

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const messages = await storage.getChatMessages(req.body.userId);
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createChatMessage = async (req: Request, res: Response) => {
  try {
    const validatedData = insertChatMessageSchema.parse({
      ...req.body,
      userId: req.body.userId,
      timestamp: new Date()
    });

    const message = await storage.createChatMessage(validatedData);

    // Generate AI response if the message is from user
    if (validatedData.sender === ChatSender.USER) {
      // Get recent conversation history for context
      const recentMessages = await storage.getChatMessages(req.body.userId);

      log(`Processing user message for AI response - userId: ${req.body.userId}`, "chat");

      // Initialize cache and generate response synchronously to ensure proper data flow
      try {
        // Step 1: Ensure cache is populated with current user data
        await initializeUserCache(req.body.userId, storage);

        // Step 2: Generate AI response with cached context
        const aiResponse = await generateAIResponse(
          validatedData.message,
          recentMessages.slice(-10),
          req.body.userId
        );

        // Step 3: Save AI response
        const savedAIMessage = await storage.createChatMessage({
          userId: req.body.userId,
          message: aiResponse,
          sender: ChatSender.ASSISTANT,
          timestamp: new Date()
        });

        log(`AI response saved successfully with ID: ${savedAIMessage.id}`, "chat");

        // Step 4: Send WebSocket notification to user about new AI response
        const aiResponseMessage: WebSocketMessage = {
          type: WebSocketMessageType.MESSAGE,
          payload: {
            type: NotificationType.AI_CHAT_RESPONSE,
            messageId: savedAIMessage.id,
            message: aiResponse,
            sender: ChatSender.ASSISTANT,
            timestamp: savedAIMessage.timestamp
          },
          timestamp: Date.now()
        };

        sendMessageToUser(req.body.userId, aiResponseMessage);
        log(`Sent WebSocket notification to user ${req.body.userId} about AI response`);

      } catch (error) {
        log(`AI processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, "chat");

        // Save fallback response
        const fallbackMessage = await storage.createChatMessage({
          userId: req.body.userId,
          message: "I'm experiencing technical difficulties accessing your goals data. Please try again.",
          sender: ChatSender.ASSISTANT,
          timestamp: new Date()
        });

        // Send WebSocket notification for fallback response too
        const fallbackResponseMessage: WebSocketMessage = {
          type: WebSocketMessageType.MESSAGE,
          payload: {
            type: NotificationType.AI_CHAT_RESPONSE,
            messageId: fallbackMessage.id,
            message: fallbackMessage.message,
            sender: ChatSender.ASSISTANT,
            timestamp: fallbackMessage.timestamp
          },
          timestamp: Date.now()
        };

        sendMessageToUser(req.body.userId, fallbackResponseMessage);
        log(`Sent WebSocket notification to user ${req.body.userId} about fallback AI response`);
      }
    }

    return res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid message data", errors: error.errors });
    }
    return res.status(500).json({ message: "Server error" });
  }
};
