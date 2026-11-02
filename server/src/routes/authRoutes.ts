
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { findUserByEmail, createUser } from "../models/userModel";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// Register a new user.
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body ?? {};

    // Check required fields.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Validate name.
    if (cleanName.length > 100) {
      res.status(400).json({ message: "Name must be 100 characters or fewer" });
      return;
    }

    // Validate email.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 150) {
      res.status(400).json({ message: "Please enter a valid email address" });
      return;
    }

    // Validate password.
    if (password.length < 6) {
      res.status(400).json({
        message: "Password must be at least 6 characters",
      });
      return;
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      res.status(400).json({
        message: "Password must not exceed 72 bytes",
      });
      return;
    }

    // Check whether the email is already registered.
    const existingUser = await findUserByEmail(cleanEmail);

    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // Hash the password before saving it.
    const passwordHash = await bcrypt.hash(password, 10);

    // Save the new user.
    const newUser = await createUser(
      cleanName,
      cleanEmail,
      passwordHash
    );

    res.status(201).json({
      message: "Registration successful",
      user: newUser,
    });
  } catch (error: unknown) {
    // Handle duplicate email in case two registrations happen together.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// Login an existing user.
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    // Check required fields.
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find the user.
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Compare the entered password with the stored password hash.
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    // Create a JWT token that expires after 7 days.
    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// Get information about the currently logged-in user.
router.get(
  "/me",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    res.status(200).json({
      message: "You are authenticated",
      userId: req.userId,
    });
  }
);

export default router;
