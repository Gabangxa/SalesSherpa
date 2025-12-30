import { Request, Response } from "express";
import { storage } from "../storage";

export const getSalesMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await storage.getSalesMetrics(req.body.userId);

    if (!metrics) {
      return res.status(404).json({ message: "Sales metrics not found" });
    }

    return res.status(200).json(metrics);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateSalesMetrics = async (req: Request, res: Response) => {
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
};
