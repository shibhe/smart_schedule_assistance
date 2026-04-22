import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/authMiddleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

// Register
router.post("/register", async (req, res): Promise<void> => {
  const { username, email, password, fullName } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email, and password are required" });
    return;
  }

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser) {
      res.status(400).json({ error: "User already exists with this email" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        username,
        email,
        passwordHash,
        fullName,
      })
      .returning();

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login
router.post("/login", async (req, res): Promise<void> => {
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    res.status(400).json({ error: "Email/Username and password are required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, identifier))
      .limit(1);

    if (!user) {
      // Try by username
      const [userByUsername] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, identifier))
        .limit(1);
      
      if (!userByUsername) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      return performLogin(userByUsername, password, res);
    }

    return performLogin(user, password, res);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

async function performLogin(user: any, password: any, res: any) {
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    },
    token,
  });
}

// Logout (mostly a frontend concern, but cleared server side if using cookies)
router.post("/logout", (req, res) => {
  res.json({ success: true });
});

// Get current user (Me)
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
