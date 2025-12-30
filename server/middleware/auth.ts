import { Request, Response, NextFunction } from "express";

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    console.log(`Authentication failed for ${req.method} ${req.path}, session ID: ${req.sessionID}`);
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Since we've checked isAuthenticated, we know req.user exists
  // TypeScript doesn't know this, so we need to assert it
  req.body.userId = req.user!.id;

  next();
};
