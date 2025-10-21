import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getChartData } from "../controllers/salesController.js";

const router = express.Router();

router.get("/chart", authMiddleware, getChartData);

export default router;
