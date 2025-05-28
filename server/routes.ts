import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateAIResponse, initializeUserCache, updateGoalInCache, updateTaskInCache } from "./openai";
import { WebSocketServer, WebSocket } from 'ws';
import { log } from "./vite";
import { 
  insertCheckInSchema, 
  insertTaskSchema, 
  insertGoalSchema, 
  insertTimeOffSchema, 
  insertChatMessageSchema, 
  insertCheckInAlertSchema 
} from "@shared/schema";

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
  // Setup authentication with Passport.js
  setupAuth(app);
  
  // Authentication middleware using Passport
  const authenticateUser = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Since we've checked isAuthenticated, we know req.user exists
    // TypeScript doesn't know this, so we need to assert it
    req.body.userId = req.user!.id;
    
    next();
  };

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
      
      // Update AI cache with just this new goal (differential update)
      updateGoalInCache(validatedData.userId, goal, 'add');
      
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
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      
      // Update AI cache with just this updated goal (differential update)
      if (updatedGoal) {
        updateGoalInCache(req.body.userId, updatedGoal, 'update');
      }
      
      return res.status(200).json(updatedGoal);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/goals/:id", authenticateUser, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      if (goal.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Update AI cache to remove this deleted goal (differential update)
      updateGoalInCache(req.body.userId, goal, 'delete');
      
      await storage.deleteGoal(goalId);
      return res.status(204).send();
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
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      return res.status(200).json(updatedTask);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/tasks/:id", authenticateUser, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
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
      const checkInId = parseInt(req.params.id);
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
        userId: req.body.userId
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
        // Get recent conversation history for context
        const recentMessages = await storage.getChatMessages(req.body.userId);
        
        // Create an AI response immediately (not in background)
        log(`Starting AI response generation for user ${req.body.userId}`, "chat");
        
        // Execute immediately instead of using setTimeout
        (async () => {
          try {
            log(`Ensuring user context is cached for user ${req.body.userId}`, "chat");
            
            // Initialize user cache if not already cached
            await initializeUserCache(req.body.userId, storage);
            
            // Debug: Log that cache initialization is complete
            log(`AI Context cache initialized for user ${req.body.userId}`, "chat");
            
            // Generate AI response using OpenAI API with user ID for cached context
            const aiResponse = await generateAIResponse(
              validatedData.message, 
              recentMessages.slice(-10), // Only use last 10 messages for context
              req.body.userId
            );
            
            // Save the AI response
            await storage.createChatMessage({
              userId: req.body.userId,
              message: aiResponse,
              sender: 'assistant',
              timestamp: new Date()
            });
          } catch (error) {
            log(`Error generating AI response: ${error instanceof Error ? error.message : 'Unknown error'}`, "chat");
            log(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`, "chat");
            
            // Save a fallback response if AI generation fails
            await storage.createChatMessage({
              userId: req.body.userId,
              message: "I encountered an issue processing your request. Could you please try again?",
              sender: 'assistant',
              timestamp: new Date()
            });
          }
        })(); // Execute immediately
      }
      
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Sales metrics routes
  app.get("/api/sales-metrics", authenticateUser, async (req, res) => {
    try {
      const metrics = await storage.getSalesMetrics(req.body.userId);
      
      if (!metrics) {
        return res.status(404).json({ message: "Sales metrics not found" });
      }
      
      return res.status(200).json(metrics);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/sales-metrics", authenticateUser, async (req, res) => {
    try {
      const userId = req.body.userId;
      const updates = {
        newAccountsTarget: req.body.newAccountsTarget,
        meetingsTarget: req.body.meetingsTarget,
        tripsTarget: req.body.tripsTarget,
      };
      
      const metrics = await storage.updateSalesMetrics(userId, updates);
      
      if (!metrics) {
        return res.status(404).json({ message: "Sales metrics not found" });
      }
      
      return res.status(200).json(metrics);
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
      const alertId = parseInt(req.params.id);
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
      const alertId = parseInt(req.params.id);
      const alert = await storage.getCheckInAlert(alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      if (alert.userId !== req.body.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedAlert = await storage.updateCheckInAlert(alertId, req.body);
      return res.status(200).json(updatedAlert);
    } catch (error) {
      console.error("Error updating check-in alert:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/check-in-alerts/:id", authenticateUser, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
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

  const httpServer = createServer(app);
  
  // Set up WebSocket server on a distinct path so it doesn't conflict with Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store client connections with user info for authenticated connections
  const clients = new Map<WebSocket, { userId?: number, sessionId: string }>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, req: any) => {
    // Generate a unique session ID for this connection
    const sessionId = Math.random().toString(36).substring(2, 15);
    log(`WebSocket client connected (Session: ${sessionId})`);
    
    // Store client connection with session info
    clients.set(ws, { sessionId });
    
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
            // Broadcast alert to all connected clients
            broadcastMessage({
              type: WebSocketMessageType.ALERT,
              payload: {
                ...message.payload,
                sourceSessionId: clientInfo?.sessionId,
                timestamp: new Date().toISOString()
              },
              timestamp: Date.now()
            });
            break;
            
          case WebSocketMessageType.NOTIFICATION:
            // Handle notifications, potentially storing them
            // Could add code here to save notifications to the database
            broadcastMessage({
              type: WebSocketMessageType.NOTIFICATION,
              payload: {
                ...message.payload,
                sourceSessionId: clientInfo?.sessionId,
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
  
  return httpServer;
}


