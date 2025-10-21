import express from "express";
import {
  exportCareersExcel,
  getCareers,
  updateCareer,
} from "../controllers/careerController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getCareers);
router.get("/excel",authMiddleware, exportCareersExcel);
router.patch("/",authMiddleware, updateCareer);

export default router;
