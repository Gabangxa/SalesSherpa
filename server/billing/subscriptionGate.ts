import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function requirePro(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const sub = await storage.getSubscription(userId);
  const isActive = sub?.status === "active" && sub?.plan !== "free";

  if (!isActive) {
    res.status(403).json({
      message: "upgrade_required",
      details: "This feature requires a Pro subscription.",
    });
    return;
  }

  next();
}
