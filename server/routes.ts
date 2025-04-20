import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertCheckInSchema, insertTaskSchema, insertGoalSchema, insertTimeOffSchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication helper (simplified for demo)
  const authenticateUser = async (req: Request, res: Response, next: Function) => {
    // In a real app, this would use sessions or tokens
    // For this demo, we'll use a fixed user ID
    req.body.userId = 1;
    next();
  };

  // Login route (simplified for demo)
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we would create a session or token here
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Current user route
  app.get("/api/user", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(req.body.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
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
        userId: req.body.userId,
        timestamp: new Date()
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Simulate AI response
      if (validatedData.sender === 'user') {
        setTimeout(async () => {
          await storage.createChatMessage({
            userId: req.body.userId,
            message: generateAssistantResponse(validatedData.message),
            sender: 'assistant',
            timestamp: new Date()
          });
        }, 1000);
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

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate assistant responses
function generateAssistantResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('acme') || lowerMessage.includes('meeting') || lowerMessage.includes('client')) {
    return "Great progress with that client! Remember to follow up within 24 hours to maintain momentum. What next steps have you planned?";
  }
  
  if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
    return "Setting clear targets is crucial. Let's break down this goal into weekly actionable steps. What's the first milestone you need to hit?";
  }
  
  if (lowerMessage.includes('challenge') || lowerMessage.includes('problem') || lowerMessage.includes('difficult')) {
    return "That sounds challenging. When facing obstacles, try reframing them as opportunities to demonstrate value. What specific concerns did they raise?";
  }
  
  if (lowerMessage.includes('time off') || lowerMessage.includes('vacation') || lowerMessage.includes('break')) {
    return "I've noted your time off. I'll pause reminders during this period. Remember to set up proper handoffs for any active deals.";
  }
  
  // Default response
  return "Thanks for the update! How can I help you strategize for your next steps? Are there any particular challenges you're facing today?";
}
