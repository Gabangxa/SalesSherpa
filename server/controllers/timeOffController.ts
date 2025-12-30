import { Request, Response } from "express";
import { storage } from "../storage";
import { insertTimeOffSchema } from "@shared/schema";
import { z } from "zod";

export const getTimeOff = async (req: Request, res: Response) => {
  try {
    const timeOffPeriods = await storage.getTimeOffPeriods(req.body.userId);
    return res.status(200).json(timeOffPeriods);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createTimeOff = async (req: Request, res: Response) => {
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
};
