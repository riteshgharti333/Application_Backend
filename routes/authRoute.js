import express from "express";

import {
  changePassword,
  forgotPassword,
  login,
  logout,
  profile,
  register,
  resetPassword,
} from "../controllers/AuthController.js";

import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", isAuthenticated, logout);

router.put("/change-password", isAuthenticated, changePassword);

router.get("/profile", isAuthenticated, profile);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:id/:token", resetPassword);

export default router;
