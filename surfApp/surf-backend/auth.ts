import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// What we put inside the token when signing it (login endpoint).
interface JwtPayload {
  userId: number;
}

// Express's Request has no userId field by default. We add an optional one
// so routes behind this middleware can read req.userId.
export interface AuthRequest extends Request {
  userId?: number;
}

// Gatekeeper: verify the Bearer token, attach userId, or reject with 401.
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  // 1. read the Authorization header
  const header = req.headers.authorization;

  // 2. must exist and start with "Bearer "
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token." });
  }

  // 3. cut off "Bearer " -> just the token
  const token = header.slice(7);

  try {
    // 4. verify signature + expiry; throws if invalid
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 5. stash the user id on the request and let it through
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
