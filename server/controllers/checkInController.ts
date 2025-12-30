import { Request, Response } from "express";
import { storage } from "../storage";
import { insertCheckInSchema, insertCheckInAlertSchema } from "@shared/schema";
import { z } from "zod";

// Check-ins
export const getCheckIns = async (req: Request, res: Response) => {
  try {
    const checkIns = await storage.getCheckIns(req.body.userId);
    return res.status(200).json(checkIns);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createCheckIn = async (req: Request, res: Response) => {
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
};

export const getCheckIn = async (req: Request, res: Response) => {
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
};

// Check-in Alerts
export const getCheckInAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await storage.getCheckInAlerts(req.body.userId);
    return res.status(200).json(alerts);
  } catch (error) {
    console.error("Error getting check-in alerts:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createCheckInAlert = async (req: Request, res: Response) => {
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
};

export const getCheckInAlert = async (req: Request, res: Response) => {
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
};

export const updateCheckInAlert = async (req: Request, res: Response) => {
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
};

export const deleteCheckInAlert = async (req: Request, res: Response) => {
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
};
