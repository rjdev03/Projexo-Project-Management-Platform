import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return next();
  } catch (error: unknown) {
    console.error("Auth Middleware Error:", error);

    let errorMessage = "Authentication failed";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null && "message" in error) {
      errorMessage = String((error as { message: unknown }).message);
    }

    res.status(401).json({ message: errorMessage });
  }
};