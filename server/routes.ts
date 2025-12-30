import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupWebSocket } from "./websocket";
import { authenticateUser } from "./middleware/auth";
import * as goalController from "./controllers/goalController";
import * as taskController from "./controllers/taskController";
import * as checkInController from "./controllers/checkInController";
import * as timeOffController from "./controllers/timeOffController";
import * as chatController from "./controllers/chatController";
import * as teamController from "./controllers/teamController";
import * as salesController from "./controllers/salesController";

export async function registerRoutes(app: Express): Promise<Server> {
  // User info endpoint
  app.get("/api/user", authenticateUser, (req, res) => {
    res.json(req.user);
  });

  // Goals routes
  app.get("/api/goals", authenticateUser, goalController.getGoals);
  app.post("/api/goals", authenticateUser, goalController.createGoal);
  app.patch("/api/goals/:id", authenticateUser, goalController.updateGoal);
  app.delete("/api/goals/:id", authenticateUser, goalController.deleteGoal);
  
  // Shared goals routes
  app.post("/api/shared-goals", authenticateUser, goalController.createSharedGoal);

  // Team Collaboration Routes
  app.get("/api/teams/user/:userId", authenticateUser, teamController.getTeam);
  app.post("/api/teams", authenticateUser, teamController.createTeam);
  app.post("/api/teams/join", authenticateUser, teamController.joinTeam);
  app.get("/api/teams/:teamId/activities", authenticateUser, teamController.getTeamActivities);

  // Tasks routes
  app.get("/api/tasks", authenticateUser, taskController.getTasks);
  app.post("/api/tasks", authenticateUser, taskController.createTask);
  app.patch("/api/tasks/:id", authenticateUser, taskController.updateTask);
  app.delete("/api/tasks/:id", authenticateUser, taskController.deleteTask);

  // Check-in routes
  app.get("/api/check-ins", authenticateUser, checkInController.getCheckIns);
  app.post("/api/check-ins", authenticateUser, checkInController.createCheckIn);
  app.get("/api/check-ins/:id", authenticateUser, checkInController.getCheckIn);

  // Check-in alerts routes
  app.get("/api/check-in-alerts", authenticateUser, checkInController.getCheckInAlerts);
  app.post("/api/check-in-alerts", authenticateUser, checkInController.createCheckInAlert);
  app.get("/api/check-in-alerts/:id", authenticateUser, checkInController.getCheckInAlert);
  app.patch("/api/check-in-alerts/:id", authenticateUser, checkInController.updateCheckInAlert);
  app.delete("/api/check-in-alerts/:id", authenticateUser, checkInController.deleteCheckInAlert);

  // Time off routes
  app.get("/api/time-off", authenticateUser, timeOffController.getTimeOff);
  app.post("/api/time-off", authenticateUser, timeOffController.createTimeOff);

  // Chat messages routes
  app.get("/api/chat", authenticateUser, chatController.getChatMessages);
  app.post("/api/chat", authenticateUser, chatController.createChatMessage);

  // Sales metrics routes
  app.get("/api/sales-metrics", authenticateUser, salesController.getSalesMetrics);
  app.patch("/api/sales-metrics", authenticateUser, salesController.updateSalesMetrics);

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  setupWebSocket(httpServer);

  return httpServer;
}
