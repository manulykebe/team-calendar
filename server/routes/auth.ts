import { Router } from "express";
import { registerUser, loginUser } from "../services/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.json(result);
  } catch (error) {
    res
      .status(400)
      .json({
        message: error instanceof Error ? error.message : "Registration failed",
      });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    res
      .status(401)
      .json({
        message: error instanceof Error ? error.message : "Invalid credentials",
      });
  }
});

export { router as authRouter };
