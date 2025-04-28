import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth } from "./auth";
import { generateAIResponse } from "./openai";
import { 
  insertCheckInSchema, 
  insertTaskSchema, 
  insertGoalSchema, 
  insertTimeOffSchema, 
  insertChatMessageSchema, 
  insertCheckInAlertSchema 
} from "@shared/schema";

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
      const validatedData = insertGoalSchema.parse({
        ...req.body,
        userId: req.body.userId
      });
      
      const goal = await storage.createGoal(validatedData);
      return res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
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
        
        // Create an AI response in the background
        setTimeout(async () => {
          try {
            // Generate AI response using OpenAI API
            const aiResponse = await generateAIResponse(
              validatedData.message, 
              recentMessages.slice(-10) // Only use last 10 messages for context
            );
            
            // Save the AI response
            await storage.createChatMessage({
              userId: req.body.userId,
              message: aiResponse,
              sender: 'assistant',
              timestamp: new Date()
            });
          } catch (error) {
            console.error("Error generating AI response:", error);
            // Save a fallback response if AI generation fails
            await storage.createChatMessage({
              userId: req.body.userId,
              message: "I encountered an issue processing your request. Could you please try again?",
              sender: 'assistant',
              timestamp: new Date()
            });
          }
        }, 100); // Reduced delay for better user experience
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
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}


