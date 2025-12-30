import { Request, Response } from "express";
import { storage } from "../storage";
import { insertGoalSchema } from "@shared/schema";
import { updateGoalInCache } from "../openai";
import { sendMessageToUser, WebSocketMessage, WebSocketMessageType } from "../websocket";
import { log } from "../vite";
import { z } from "zod";
import { NotificationType } from "../constants";

export const getGoals = async (req: Request, res: Response) => {
  try {
    const goals = await storage.getGoals(req.body.userId);
    return res.status(200).json(goals);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const validatedData = insertGoalSchema.parse(req.body);

    log(`Creating goal with data: ${JSON.stringify(validatedData)}`, "goals");

    const goal = await storage.createGoal(validatedData);

    updateGoalInCache(validatedData.userId, goal, 'add');

    const goalCreatedMessage: WebSocketMessage = {
      type: WebSocketMessageType.NOTIFICATION,
      payload: {
        type: NotificationType.GOAL_CREATED,
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
      log(`Goal validation error: ${JSON.stringify(error.errors)}`, "goals");
      return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
    }
    log(`Goal creation error: ${error instanceof Error ? error.message : "Unknown error"}`, "goals");
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
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

    if (updatedGoal) {
      updateGoalInCache(req.body.userId, updatedGoal, 'update');

      const goalUpdatedMessage: WebSocketMessage = {
        type: WebSocketMessageType.NOTIFICATION,
        payload: {
          type: NotificationType.GOAL_UPDATED,
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
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const goalId = parseInt(req.params.id);
    const goal = await storage.getGoal(goalId);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    if (goal.userId !== req.body.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    updateGoalInCache(req.body.userId, goal, 'delete');

    const goalDeletedMessage: WebSocketMessage = {
      type: WebSocketMessageType.NOTIFICATION,
      payload: {
        type: NotificationType.GOAL_DELETED,
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
};

export const createSharedGoal = async (req: Request, res: Response) => {
  try {
    const { goalId, teamId, canEdit } = req.body;
    const userId = req.body.userId;

    const goal = await storage.getGoal(goalId);
    if (!goal || goal.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to share this goal" });
    }

    const membership = await storage.getUserTeamMembership(userId, teamId);
    if (!membership) {
      return res.status(403).json({ message: "Not a member of this team" });
    }

    const sharedGoal = await storage.createSharedGoal({
      goalId,
      teamId,
      sharedBy: userId,
      canEdit: canEdit || false
    });

    const user = await storage.getUser(userId);
    const team = await storage.getTeam(teamId);

    await storage.createTeamActivity({
      teamId,
      userId,
      activityType: 'goal_shared',
      description: `${user?.name || 'Unknown'} shared goal "${goal.title}" with the team`,
      metadata: JSON.stringify({ goalId, goalTitle: goal.title })
    });

    const teamMemberships = await storage.getTeamMemberships(teamId);
    const goalSharedMessage: WebSocketMessage = {
      type: WebSocketMessageType.NOTIFICATION,
      payload: {
        type: NotificationType.GOAL_SHARED,
        goal: goal,
        team: team,
        sharedBy: { id: user?.id, name: user?.name },
        canEdit,
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now()
    };

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
};
