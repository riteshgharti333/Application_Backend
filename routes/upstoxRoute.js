import express from "express";

import { isAuthenticated } from "../middlewares/auth.js";
import {
  getLoginUrl,
  upstoxCallback,
} from "../controllers/upstoxController.js";

const router = express.Router();

router.post("/login", isAuthenticated, getLoginUrl);
router.get("/callback", isAuthenticated , upstoxCallback);

export default router;
