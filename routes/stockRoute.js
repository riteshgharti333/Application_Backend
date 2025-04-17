import express from "express";

import { getStock } from "../controllers/stockController.js";

const router = express.Router();

router.get("/:symbol", getStock);

export default router;
