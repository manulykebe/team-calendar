import { Router } from "express";
import { registerUser, loginUser } from "../services/auth.js";
import { AuthRequest } from "../types.js";

const router = Router();

router.post("/register", async (req: AuthRequest, res) => {
  try {
    const result = await registerUser(req.body, req.i18n);
    res.json(result);
  } catch (error) {
    res
      .status(400)
      .json({
        message: error instanceof Error ? error.message : req.i18n.t('auth.registrationFailed'),
      });
  }
});

router.post("/login", async (req: AuthRequest, res) => {
  try {
    const result = await loginUser(req.body, req.i18n);
    res.json(result);
  } catch (error) {
    res
      .status(401)
      .json({
        message: error instanceof Error ? error.message : req.i18n.t('auth.invalidCredentials'),
      });
  }
});

export { router as authRouter };