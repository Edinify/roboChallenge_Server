import express from "express";
import {
  exportTuitionFeeExcel,
  getTutionFees,
  updateTuitionFee,
} from "../controllers/tutionFeeController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getTutionFees);
router.get("/excel", authMiddleware, exportTuitionFeeExcel);
router.patch("/payment", authMiddleware, updateTuitionFee);

export default router;
