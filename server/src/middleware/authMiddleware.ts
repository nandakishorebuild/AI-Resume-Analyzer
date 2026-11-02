import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Add userId to the request after verifying the token.
export interface AuthRequest extends Request {
  userId?: number;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // Check whether the Authorization header exists.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication token is required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured");
    res.status(500).json({ message: "Server configuration error" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Make sure the token contains a valid userId.
    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "number" ||
      !Number.isInteger(decoded.userId) ||
      decoded.userId <= 0
    ) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    (req as AuthRequest).userId = decoded.userId;

    next();
  } catch {
    res.status(401).json({ message: "Token is invalid or expired" });
  }
}