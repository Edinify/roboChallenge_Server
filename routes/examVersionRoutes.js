import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createExamVersion,
  deleteExamVersion,
  getAllExamVersions,
  getExamVersionById,
} from "../controllers/examVersionController.js";

const router = express.Router();

router.post("/:examId", authMiddleware, createExamVersion);
router.get("/all/:examId", authMiddleware, getAllExamVersions);
router.get("/:id", authMiddleware, getExamVersionById);
router.delete("/:id", authMiddleware, deleteExamVersion);

export default router;
