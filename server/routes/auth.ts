import { Router } from "express";
import { registerUser, loginUser, changeUserPassword } from "../services/auth.js";
import { AuthRequest } from "../types.js";
import { authenticateToken } from "../middleware/auth.js";

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

router.post("/change-password", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: req.i18n.t('auth.passwordsRequired'),
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: req.i18n.t('auth.passwordTooShort'),
      });
    }

    await changeUserPassword(req.user!.id, req.user!.site, currentPassword, newPassword, req.i18n);
    res.json({ message: req.i18n.t('auth.passwordChanged') });
  } catch (error) {
    res
      .status(400)
      .json({
        message: error instanceof Error ? error.message : req.i18n.t('auth.passwordChangeFailed'),
      });
  }
});

export { router as authRouter };