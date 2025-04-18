import express from "express";

import { getAllStocks, getStock } from "../controllers/stockController.js";

const router = express.Router();

router.get("/all-stocks", getAllStocks);

router.get("/:symbol", getStock);


export default router;
