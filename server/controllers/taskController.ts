import { Request, Response } from "express";
import { storage } from "../storage";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await storage.getTasks(req.body.userId);
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createTask = async (req: Request, res: Response) => {
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
};

export const updateTask = async (req: Request, res: Response) => {
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
};

export const deleteTask = async (req: Request, res: Response) => {
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
};
