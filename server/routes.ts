import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

let alertInterval: ReturnType<typeof setInterval> | null = null;

export function stopAlertService() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}
import { storage } from "./storage";
import { sendEmail, generateVerificationToken, generateVerificationEmail } from "./emailService";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateResponse, handleCheckInFlow } from "./ai/index";
import { maybeExtractInsights } from "./ai/insightExtractor";
import type { FlowType } from "./ai/checkInFlow";
import { WebSocketServer, WebSocket } from 'ws';
import { log } from "./vite";
import { isNatsAvailable, natsPublish, natsSubscribe } from "./nats";
import * as pushService from "./pushService";
import {
  insertCheckInSchema,
  insertTaskSchema,
  insertGoalSchema,
  insertTimeOffSchema,
  insertChatMessageSchema,
  insertCheckInAlertSchema,
  insertMeetingNoteSchema,
  insertNoteTemplateSchema,
  CheckInAlert
} from "@shared/schema";
import { DateTime } from "luxon";

// WebSocket message types
enum WebSocketMessageType {
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  MESSAGE = 'MESSAGE',
  ALERT = 'ALERT',
  NOTIFICATION = 'NOTIFICATION',
  ERROR = 'ERROR',
}

// Interface for WebSocket messages
interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: number;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Parse a route/query param as a positive integer; returns null on failure.
  function parseId(value: string | undefined): number | null {
    if (!value) return null;
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  // Authentication middleware using Passport
  const authenticateUser = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      console.log(`Authentication failed for ${req.method} ${req.path}, session ID: ${req.sessionID}`);
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Since we've checked isAuthenticated, we know req.user exists
    // TypeScript doesn't know this, so we need to assert it
    req.body.userId = req.user!.id;
    
    next();
  };

  // User info endpoint
  app.get("/api/user", authenticateUser, (req, res) => {
    res.json(req.user);
  });

  // Goals routes
  app.get("/api/goals", authenticateUser, async (req, res) => {
    try {
      const goals = await storage.getGoals(req.body.userId);
      return res.status(200).json(goals);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/goals", authenticateUser, async (req, res) => {
    try {
      // The userId is already added to req.body by the authenticateUser middleware
      // No need to extract it separately
      
      // Validate the data with the schema
      const validatedData = insertGoalSchema.parse(req.body);
      
      // For debugging
      log(`Creating goal with data: ${JSON.stringify(validatedData)}`, "goals");
      
      const goal = await storage.createGoal(validatedData);
      
      // Send WebSocket notification to user about new goal
      const goalCreatedMessage: WebSocketMessage = {
        type: WebSocketMessageType.NOTIFICATION,
        payload: {
          type: 'goal_created',
          goal: goal,
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now()
      };
      
      sendMessageToUser(validatedData.userId, goalCreatedMessage);
      log(`Sent WebSocket notification to user ${validatedData.userId} about goal creation: ${goal.title}`);
      
      return res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Log the validation errors for debugging
        log(`Goal validation error: ${JSON.stringify(error.errors)}`, "goals");
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      log(`Goal creation error: ${error instanceof Error ? error.message : "Unknown error"}`, "goals");
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/goals/:id", authenticateUser, async (req, res) => {
    try {
      const goalId = parseId(req.params.id);
      if (!goalId) return res.status(400).json({ message: "Invalid goal ID" });
      const goal = await storage.getGoal(goalId);

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Only allow mutable fields — prevents id/userId mass-assignment
      const { title, targetAmount, currentAmount, startingAmount, deadline, category, valueType } = req.body;
      const updatedGoal = await storage.updateGoal(goalId, { title, targetAmount, currentAmount, startingAmount, deadline, category, valueType });
      
      if (updatedGoal) {
        // Send WebSocket notification to user about goal update
        const goalUpdatedMessage: WebSocketMessage = {
          type: WebSocketMessageType.NOTIFICATION,
          payload: {
            type: 'goal_updated',
            goal: updatedGoal,
            timestamp: new Date().toISOString()
          },
          timestamp: Date.now()
        };
        
        sendMessageToUser(req.body.userId, goalUpdatedMessage);
        log(`Sent WebSocket notification to user ${req.body.userId} about goal update: ${updatedGoal.title}`);
      }
      
      return res.status(200).json(updatedGoal);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/goals/:id", authenticateUser, async (req, res) => {
    try {
      const goalId = parseId(req.params.id);
      if (!goalId) return res.status(400).json({ message: "Invalid goal ID" });
      const goal = await storage.getGoal(goalId);

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      if (goal.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Send WebSocket notification to user about goal deletion
      const goalDeletedMessage: WebSocketMessage = {
        type: WebSocketMessageType.NOTIFICATION,
        payload: {
          type: 'goal_deleted',
          goalId: goal.id,
          goalTitle: goal.title,
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now()
      };
      
      sendMessageToUser(req.body.userId, goalDeletedMessage);
      log(`Sent WebSocket notification to user ${req.body.userId} about goal deletion: ${goal.title}`);
      
      await storage.deleteGoal(goalId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Team Collaboration Routes
  // Team routes
  app.get("/api/teams/user/:userId", authenticateUser, async (req, res) => {
    try {
      const userId = parseId(req.params.userId);
      if (!userId) return res.status(400).json({ message: "Invalid user ID" });

      // Security: Users can only access their own teams
      if (userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized to view teams for this user" });
      }
      
      const teams = await storage.getUserTeams(userId);
      return res.status(200).json(teams);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/teams", authenticateUser, async (req, res) => {
    try {
      const teamData = {
        ...req.body,
        ownerId: req.body.userId
      };
      
      const team = await storage.createTeam(teamData);
      
      // Create team activity for team creation
      await storage.createTeamActivity({
        teamId: team.id,
        userId: req.body.userId,
        activityType: 'team_created',
        description: `Team "${team.name}" was created`,
      });
      
      // Send WebSocket notification to team owner about new team
      const teamCreatedMessage: WebSocketMessage = {
        type: WebSocketMessageType.NOTIFICATION,
        payload: {
          type: 'team_created',
          team: team,
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now()
      };
      
      sendMessageToUser(req.body.userId, teamCreatedMessage);
      log(`Sent WebSocket notification to user ${req.body.userId} about team creation: ${team.name}`);
      
      return res.status(201).json(team);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/teams/join", authenticateUser, async (req, res) => {
    try {
      const { inviteCode } = req.body;
      const userId = req.body.userId;
      
      // Find team by invite code
      const team = await storage.getTeamByInviteCode(inviteCode);
      if (!team) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      // Check if user is already a member
      const existingMembership = await storage.getUserTeamMembership(userId, team.id);
      if (existingMembership) {
        return res.status(409).json({ message: "Already a member of this team" });
      }
      
      // Add user to team
      const membership = await storage.createTeamMembership({
        teamId: team.id,
        userId,
        role: 'member'
      });
      
      // Get user details for activity log
      const user = await storage.getUser(userId);
      
      // Create team activity for member joining
      await storage.createTeamActivity({
        teamId: team.id,
        userId,
        activityType: 'member_joined',
        description: `${user?.name || 'Unknown'} joined the team`,
      });
      
      // Send WebSocket notification to all team members about new member
      const teamMemberships = await storage.getTeamMemberships(team.id);
      const memberJoinedMessage: WebSocketMessage = {
        type: WebSocketMessageType.NOTIFICATION,
        payload: {
          type: 'member_joined',
          team: team,
          user: { id: user?.id, name: user?.name },
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now()
      };
      
      // Broadcast to all team members
      for (const member of teamMemberships) {
        sendMessageToUser(member.userId, memberJoinedMessage);
      }
      log(`Broadcasted member joined notification to team ${team.name} (${teamMemberships.length} members)`);
      
      return res.status(201).json({ team, membership });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Shared goals routes
  app.post("/api/shared-goals", authenticateUser, async (req, res) => {
    try {
      const { goalId, teamId, canEdit } = req.body;
      const userId = req.body.userId;
      
      // Verify user owns the goal
      const goal = await storage.getGoal(goalId);
      if (!goal || goal.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to share this goal" });
      }
      
      // Verify user is member of the team
      const membership = await storage.getUserTeamMembership(userId, teamId);
      if (!membership) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      // Create shared goal
      const sharedGoal = await storage.createSharedGoal({
        goalId,
        teamId,
        sharedBy: userId,
        canEdit: canEdit || false
      });
      
      // Get user and team details
      const user = await storage.getUser(userId);
      const team = await storage.getTeam(teamId);
      
      // Create team activity
      await storage.createTeamActivity({
        teamId,
        userId,
        activityType: 'goal_shared',
        description: `${user?.name || 'Unknown'} shared goal "${goal.title}" with the team`,
        metadata: JSON.stringify({ goalId, goalTitle: goal.title })
      });
      
      // Send WebSocket notification to all team members about shared goal
      const teamMemberships = await storage.getTeamMemberships(teamId);
      const goalSharedMessage: WebSocketMessage = {
        type: WebSocketMessageType.NOTIFICATION,
        payload: {
          type: 'goal_shared',
          goal: goal,
          team: team,
          sharedBy: { id: user?.id, name: user?.name },
          canEdit,
          timestamp: new Date().toISOString()
        },
        timestamp: Date.now()
      };
      
      // Broadcast to all team members except the sharer
      for (const member of teamMemberships) {
        if (member.userId !== userId) {
          sendMessageToUser(member.userId, goalSharedMessage);
        }
      }
      log(`Broadcasted goal sharing notification to team ${team?.name} (${teamMemberships.length - 1} members notified)`);
      
      return res.status(201).json(sharedGoal);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Team activity feed
  app.get("/api/teams/:teamId/activities", authenticateUser, async (req, res) => {
    try {
      const teamId = parseId(req.params.teamId);
      if (!teamId) return res.status(400).json({ message: "Invalid team ID" });
      const limit = Math.min(parseId(req.query.limit as string) ?? 20, 100);
      
      // Verify user is member of the team
      const membership = await storage.getUserTeamMembership(req.body.userId, teamId);
      if (!membership) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      const activities = await storage.getTeamActivities(teamId, limit);
      return res.status(200).json(activities);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Tasks routes
  app.get("/api/tasks", authenticateUser, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.body.userId);
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tasks", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId: req.body.userId
      });
      
      const task = await storage.createTask(validatedData);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/tasks/:id", authenticateUser, async (req, res) => {
    try {
      const taskId = parseId(req.params.id);
      if (!taskId) return res.status(400).json({ message: "Invalid task ID" });
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Only allow mutable fields — prevents id/userId mass-assignment
      const { title, description, priority, completed, dueDate } = req.body;
      const updatedTask = await storage.updateTask(taskId, { title, description, priority, completed, dueDate });
      return res.status(200).json(updatedTask);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/tasks/:id", authenticateUser, async (req, res) => {
    try {
      const taskId = parseId(req.params.id);
      if (!taskId) return res.status(400).json({ message: "Invalid task ID" });
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteTask(taskId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Check-in routes
  app.get("/api/check-ins", authenticateUser, async (req, res) => {
    try {
      const checkIns = await storage.getCheckIns(req.body.userId);
      return res.status(200).json(checkIns);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Guided check-in flow — replaces the raw form-based check-in for chat UI
  // POST /api/check-in-flow { flowType: "morning" | "evening", message: string }
  // Call with empty message to start the flow. Keep calling with user answers until isComplete.
  app.post("/api/check-in-flow", authenticateUser, async (req, res) => {
    try {
      const { flowType, message = "" } = req.body as { flowType: FlowType; message?: string };

      if (!flowType || !["morning", "evening"].includes(flowType)) {
        return res.status(400).json({ message: "flowType must be 'morning' or 'evening'" });
      }

      const result = await handleCheckInFlow(
        req.body.userId,
        flowType,
        message,
        storage
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Server error during check-in flow" });
    }
  });

  app.post("/api/check-ins", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertCheckInSchema.parse({
        ...req.body,
        userId: req.body.userId,
        date: req.body.date || new Date()
      });
      
      const checkIn = await storage.createCheckIn(validatedData);
      return res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid check-in data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/check-ins/:id", authenticateUser, async (req, res) => {
    try {
      const checkInId = parseId(req.params.id);
      if (!checkInId) return res.status(400).json({ message: "Invalid check-in ID" });
      const checkIn = await storage.getCheckIn(checkInId);
      
      if (!checkIn) {
        return res.status(404).json({ message: "Check-in not found" });
      }
      
      if (checkIn.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      return res.status(200).json(checkIn);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Time off routes
  app.get("/api/time-off", authenticateUser, async (req, res) => {
    try {
      const timeOffPeriods = await storage.getTimeOffPeriods(req.body.userId);
      return res.status(200).json(timeOffPeriods);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/time-off", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertTimeOffSchema.parse({
        ...req.body,
        userId: req.body.userId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      });
      
      const timeOff = await storage.createTimeOff(validatedData);
      return res.status(201).json(timeOff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid time off data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Chat messages routes
  app.get("/api/chat", authenticateUser, async (req, res) => {
    try {
      // Use req.body.userId which is set by the authenticateUser middleware
      const messages = await storage.getChatMessages(req.body.userId);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/chat", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.body.userId, // Use req.body.userId which is set by the authenticateUser middleware
        timestamp: new Date()
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Generate AI response if the message is from user
      if (validatedData.sender === 'user') {
        if (isNatsAvailable()) {
          // Async path: offload to AI worker via NATS — HTTP returns immediately
          natsPublish(`chat.process.${req.body.userId}`, {
            userId: req.body.userId,
            message: validatedData.message,
          });
          log(`Chat job queued via NATS for user ${req.body.userId}`, "chat");
        } else {
          // Fallback: synchronous processing when NATS is unavailable
          const recentMessages = await storage.getChatMessages(req.body.userId);
          log(`Processing user message synchronously - userId: ${req.body.userId}`, "chat");

          try {
            const aiResponse = await generateResponse(
              req.body.userId,
              validatedData.message,
              recentMessages.slice(-10),
              storage
            );

            const savedAIMessage = await storage.createChatMessage({
              userId: req.body.userId,
              message: aiResponse,
              sender: 'assistant',
              timestamp: new Date()
            });

            log(`AI response saved with ID: ${savedAIMessage.id}`, "chat");

            // recentMessages was fetched before the AI response was saved,
            // so total = recentMessages.length + 1.
            maybeExtractInsights(req.body.userId, recentMessages.length + 1, storage);

            sendMessageToUser(req.body.userId, {
              type: WebSocketMessageType.MESSAGE,
              payload: {
                type: 'ai_chat_response',
                messageId: savedAIMessage.id,
                message: aiResponse,
                sender: 'assistant',
                timestamp: savedAIMessage.timestamp
              },
              timestamp: Date.now()
            });
          } catch (error) {
            log(`AI processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, "chat");

            const fallbackMessage = await storage.createChatMessage({
              userId: req.body.userId,
              message: "I'm experiencing technical difficulties accessing your goals data. Please try again.",
              sender: 'assistant',
              timestamp: new Date()
            });

            sendMessageToUser(req.body.userId, {
              type: WebSocketMessageType.MESSAGE,
              payload: {
                type: 'ai_chat_response',
                messageId: fallbackMessage.id,
                message: fallbackMessage.message,
                sender: 'assistant',
                timestamp: fallbackMessage.timestamp
              },
              timestamp: Date.now()
            });
          }
        }
      }
      
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Web push routes
  app.get("/api/push/vapid-public-key", (_req, res) => {
    const { vapidPublicKey, isWebPushConfigured } = pushService;
    if (!isWebPushConfigured) {
      return res.status(503).json({ message: "Push notifications not configured" });
    }
    return res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/push/subscribe", authenticateUser, async (req, res) => {
    try {
      const { endpoint, p256dh, auth } = req.body;
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ message: "endpoint, p256dh and auth are required" });
      }
      const sub = await storage.createPushSubscription({
        userId: req.body.userId,
        endpoint,
        p256dh,
        auth,
      });
      return res.status(201).json(sub);
    } catch (error) {
      console.error("Error creating push subscription:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/push/subscribe", authenticateUser, async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ message: "endpoint is required" });
      await storage.deletePushSubscriptionByEndpoint(endpoint);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Check-in alerts routes
  app.get("/api/check-in-alerts", authenticateUser, async (req, res) => {
    try {
      const alerts = await storage.getCheckInAlerts(req.body.userId);
      return res.status(200).json(alerts);
    } catch (error) {
      console.error("Error getting check-in alerts:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/check-in-alerts", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertCheckInAlertSchema.parse({
        ...req.body,
        userId: req.body.userId,
        enabled: req.body.enabled ?? true
      });
      
      const alert = await storage.createCheckInAlert(validatedData);
      return res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating check-in alert:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/check-in-alerts/:id", authenticateUser, async (req, res) => {
    try {
      const alertId = parseId(req.params.id);
      if (!alertId) return res.status(400).json({ message: "Invalid alert ID" });
      const alert = await storage.getCheckInAlert(alertId);

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      if (alert.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      return res.status(200).json(alert);
    } catch (error) {
      console.error("Error getting check-in alert by ID:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/check-in-alerts/:id", authenticateUser, async (req, res) => {
    try {
      const alertId = parseId(req.params.id);
      if (!alertId) return res.status(400).json({ message: "Invalid alert ID" });
      const alert = await storage.getCheckInAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      if (alert.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Only allow mutable fields — prevents id/userId mass-assignment
      const { time, days, timezone, enabled, title, message: alertMessage } = req.body;
      const updatedAlert = await storage.updateCheckInAlert(alertId, { time, days, timezone, enabled, title, message: alertMessage });
      return res.status(200).json(updatedAlert);
    } catch (error) {
      console.error("Error updating check-in alert:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/check-in-alerts/:id", authenticateUser, async (req, res) => {
    try {
      const alertId = parseId(req.params.id);
      if (!alertId) return res.status(400).json({ message: "Invalid alert ID" });
      const alert = await storage.getCheckInAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      if (alert.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteCheckInAlert(alertId);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting check-in alert:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Meeting notes routes
  app.get("/api/meeting-notes", authenticateUser, async (req, res) => {
    try {
      const notes = await storage.getMeetingNotes(req.body.userId);
      return res.status(200).json(notes);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/meeting-notes", authenticateUser, async (req, res) => {
    try {
      const { userId: _ignored, ...clientBody } = req.body;
      const validatedData = insertMeetingNoteSchema.parse({ ...clientBody, userId: req.body.userId });
      const note = await storage.createMeetingNote(validatedData);
      return res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/meeting-notes/:id", authenticateUser, async (req, res) => {
    try {
      const noteId = parseId(req.params.id);
      if (!noteId) return res.status(400).json({ message: "Invalid note ID" });
      const note = await storage.getMeetingNote(noteId);
      if (!note) return res.status(404).json({ message: "Not found" });
      if (note.userId !== req.body.userId) return res.status(403).json({ message: "Not authorized" });
      return res.status(200).json(note);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/meeting-notes/:id", authenticateUser, async (req, res) => {
    try {
      const noteId = parseId(req.params.id);
      if (!noteId) return res.status(400).json({ message: "Invalid note ID" });
      const note = await storage.getMeetingNote(noteId);
      if (!note) return res.status(404).json({ message: "Not found" });
      if (note.userId !== req.body.userId) return res.status(403).json({ message: "Not authorized" });
      const { title, date, company, contactName, purpose, location, attendees, sections, templateId } = req.body;
      const updated = await storage.updateMeetingNote(noteId, { title, date, company, contactName, purpose, location, attendees, sections, templateId });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/meeting-notes/:id", authenticateUser, async (req, res) => {
    try {
      const noteId = parseId(req.params.id);
      if (!noteId) return res.status(400).json({ message: "Invalid note ID" });
      const note = await storage.getMeetingNote(noteId);
      if (!note) return res.status(404).json({ message: "Not found" });
      if (note.userId !== req.body.userId) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteMeetingNote(noteId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Note template routes
  app.get("/api/note-templates", authenticateUser, async (req, res) => {
    try {
      const templates = await storage.getNoteTemplates(req.body.userId);
      return res.status(200).json(templates);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/note-templates", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertNoteTemplateSchema.parse({ ...req.body, userId: req.body.userId });
      const template = await storage.createNoteTemplate(validatedData);
      return res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/note-templates/:id", authenticateUser, async (req, res) => {
    try {
      const templateId = parseId(req.params.id);
      if (!templateId) return res.status(400).json({ message: "Invalid template ID" });
      const template = await storage.getNoteTemplate(templateId);
      if (!template) return res.status(404).json({ message: "Not found" });
      if (template.userId !== req.body.userId) return res.status(403).json({ message: "Not authorized" });
      const { name, sections, isDefault } = req.body;
      const updated = await storage.updateNoteTemplate(templateId, { name, sections, isDefault });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/note-templates/:id", authenticateUser, async (req, res) => {
    try {
      const templateId = parseId(req.params.id);
      if (!templateId) return res.status(400).json({ message: "Invalid template ID" });
      const template = await storage.getNoteTemplate(templateId);
      if (!template) return res.status(404).json({ message: "Not found" });
      if (template.userId !== req.body.userId) return res.status(403).json({ message: "Not authorized" });
      await storage.deleteNoteTemplate(templateId);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/alert-history", authenticateUser, async (req, res) => {
    try {
      const history = await storage.getAlertHistory(req.body.userId);
      return res.status(200).json(history);
    } catch (error) {
      console.error("Error fetching alert history:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server on a distinct path so it doesn't conflict with Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store client connections with user info for authenticated connections
  const clients = new Map<WebSocket, { userId?: number, sessionId: string }>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, req: any) => {
    // Generate a unique session ID for this connection
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Try to get user ID from session if authenticated
    const userId = req.session?.passport?.user;
    
    log(`WebSocket client connected (Session: ${sessionId}, User: ${userId || 'anonymous'})`);
    
    // Store client connection with session and user info
    clients.set(ws, { sessionId, userId });
    
    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
      type: WebSocketMessageType.CONNECT,
      payload: { 
        message: 'Connected to server',
        sessionId,
        timestamp: new Date().toISOString(),
        activeConnections: clients.size
      },
      timestamp: Date.now()
    };
    
    ws.send(JSON.stringify(welcomeMessage));
    
    // Send a notification to all clients about new connection
    broadcastConnectionUpdate(clients.size);
    
    // Handle incoming messages
    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data) as WebSocketMessage;
        const clientInfo = clients.get(ws);
        
        // Add log for debugging
        log(`Received WebSocket message: ${message.type}`);
        
        // Process message based on type
        switch (message.type) {
          case WebSocketMessageType.MESSAGE:
            // Handle regular messages
            ws.send(JSON.stringify({
              type: WebSocketMessageType.MESSAGE,
              payload: { 
                message: 'Echo: ' + message.payload.message,
                originalMessage: message.payload,
                sessionId: clientInfo?.sessionId,
                userId: clientInfo?.userId,
                timestamp: new Date().toISOString()
              },
              timestamp: Date.now()
            }));
            break;
            
          case WebSocketMessageType.ALERT:
            // Only authenticated clients may broadcast alerts
            if (!clientInfo?.userId) {
              ws.send(JSON.stringify({
                type: WebSocketMessageType.ERROR,
                payload: { error: 'Authentication required to send alerts' },
                timestamp: Date.now()
              }));
              break;
            }
            broadcastMessage({
              type: WebSocketMessageType.ALERT,
              payload: {
                ...message.payload,
                sourceSessionId: clientInfo.sessionId,
                timestamp: new Date().toISOString()
              },
              timestamp: Date.now()
            });
            break;

          case WebSocketMessageType.NOTIFICATION:
            // Only authenticated clients may broadcast notifications
            if (!clientInfo?.userId) {
              ws.send(JSON.stringify({
                type: WebSocketMessageType.ERROR,
                payload: { error: 'Authentication required to send notifications' },
                timestamp: Date.now()
              }));
              break;
            }
            broadcastMessage({
              type: WebSocketMessageType.NOTIFICATION,
              payload: {
                ...message.payload,
                sourceSessionId: clientInfo.sessionId,
                timestamp: new Date().toISOString()
              },
              timestamp: Date.now()
            });
            break;
            
          default:
            // Unknown message type
            ws.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { 
                error: 'Unknown message type',
                receivedType: message.type 
              },
              timestamp: Date.now()
            }));
        }
      } catch (error) {
        // Log the error for debugging
        log(`WebSocket message parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Send error response for invalid messages
        ws.send(JSON.stringify({
          type: WebSocketMessageType.ERROR,
          payload: { 
            error: 'Invalid message format',
            hint: 'Message must be valid JSON with type, payload, and timestamp fields'
          },
          timestamp: Date.now()
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      log(`WebSocket client disconnected (Session: ${clientInfo?.sessionId})`);
      
      // Remove client from the connections map
      clients.delete(ws);
      
      // Notify remaining clients about connection update
      broadcastConnectionUpdate(clients.size);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      const clientInfo = clients.get(ws);
      log(`WebSocket error (Session: ${clientInfo?.sessionId}): ${error.message}`);
    });
  });
  
  // Helper function to broadcast a message to all connected clients
  function broadcastMessage(message: WebSocketMessage): void {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  // Helper function to broadcast connection status updates
  function broadcastConnectionUpdate(connectionCount: number): void {
    const updateMessage: WebSocketMessage = {
      type: WebSocketMessageType.NOTIFICATION,
      payload: { 
        type: 'connection_update', 
        activeConnections: connectionCount,
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now()
    };
    
    broadcastMessage(updateMessage);
  }
  
  // Writes a message directly to all local WebSocket connections for a user.
  // Called by the NATS subscription handler so cross-instance messages also land here.
  function deliverToUser(userId: number, message: WebSocketMessage): void {
    clients.forEach((clientInfo, ws) => {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Routes a message to a user — via NATS when available (multi-instance safe),
  // falling back to direct local delivery in single-instance mode.
  function sendMessageToUser(userId: number, message: WebSocketMessage): void {
    if (isNatsAvailable()) {
      natsPublish(`notifications.user.${userId}`, message);
    } else {
      deliverToUser(userId, message);
    }
  }

  // NATS → WS bridge: any instance that published a notification delivers it
  // to the WebSocket clients connected to this instance.
  natsSubscribe('notifications.user.*', (_subject, data) => {
    const parts = _subject.split('.');
    const userId = parseInt(parts[2]);
    if (!isNaN(userId)) {
      deliverToUser(userId, data as WebSocketMessage);
    }
  });
  
  // Background alert checking service
  startAlertCheckingService();
  
  // Background alert checking function
  async function startAlertCheckingService() {
    log('Starting background alert checking service...');
    
    // Day of week mapping to match client-side
    const dayMapping: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday', 
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    
    // Check alerts every 30 seconds for more responsive notifications
    alertInterval = setInterval(async () => {
      try {
        // Get all users who have enabled alerts
        const usersWithAlerts = await storage.getAllUsersWithAlerts();
        
        for (const user of usersWithAlerts) {
          try {
            const alerts = await storage.getCheckInAlerts(user.id);
            const enabledAlerts = alerts.filter(alert => alert.enabled);
            
            if (enabledAlerts.length === 0) continue;

            for (const alert of enabledAlerts) {
              // Derive current time in the alert's own timezone (fixes UTC day-of-week bug)
              const alertTimezone = alert.timezone || 'America/New_York';
              const currentTimeInAlertTz = DateTime.now().setZone(alertTimezone);
              const currentDay = currentTimeInAlertTz.weekdayLong?.toLowerCase();

              // Check if current day is in alert's days
              if (!currentDay || !alert.days.includes(currentDay)) continue;

              // Parse alert time
              const [alertHour, alertMinute] = alert.time.split(':').map(Number);
              const alertTime = currentTimeInAlertTz.set({
                hour: alertHour,
                minute: alertMinute,
                second: 0,
                millisecond: 0
              });

              // Check if current time is within the 30-second check interval of alert time
              const timeDiff = Math.abs(currentTimeInAlertTz.diff(alertTime, 'seconds').seconds);

              if (timeDiff > 30) continue;

              // Deduplicate: skip if this alert already fired within the last 5 minutes
              if (alert.lastTriggeredAt) {
                const minutesSinceLast = DateTime.now().diff(DateTime.fromJSDate(alert.lastTriggeredAt), 'minutes').minutes;
                if (minutesSinceLast < 5) continue;
              }

              // Stamp lastTriggeredAt before sending so concurrent ticks can't double-fire
              await storage.updateCheckInAlert(alert.id, { lastTriggeredAt: new Date() });

              // Send WebSocket notification to user
              const alertMessage: WebSocketMessage = {
                type: WebSocketMessageType.ALERT,
                payload: {
                  type: 'check_in_alert',
                  alertId: alert.id,
                  title: alert.title,
                  message: alert.message,
                  timestamp: new Date().toISOString()
                },
                timestamp: Date.now()
              };

              sendMessageToUser(user.id, alertMessage);

              // Also send web push to all subscribed browsers/devices
              if (pushService.isWebPushConfigured) {
                const subs = await storage.getPushSubscriptions(user.id);
                for (const sub of subs) {
                  const result = await pushService.sendPushToSubscription(sub, {
                    title: alert.title,
                    body: alert.message,
                    url: "/check-in",
                    tag: `alert-${alert.id}`,
                  }).catch(() => "expired" as const);
                  if (result === "expired") {
                    await storage.deletePushSubscriptionByEndpoint(sub.endpoint);
                  }
                }
              }

              log(`Sent check-in alert to user ${user.id}: ${alert.title}`);
              await storage.createAlertHistory({ alertId: alert.id, userId: user.id, title: alert.title, message: alert.message });
              storage.deleteOldAlertHistory().catch(() => {});
            }
          } catch (error) {
            log(`Error checking alerts for user ${user.id}: ${error}`);
          }
        }
      } catch (error) {
        log(`Error in alert checking service: ${error}`);
      }
    }, 30000); // Check every 30 seconds
  }

  return httpServer;
}


