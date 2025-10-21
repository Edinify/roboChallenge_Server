import express from "express";

import { authMiddleware } from "../middleware/auth.js";
import {
  completeStudentExam,
  getExamsResultsForPagination,
  getStudentExamById,
  getStudentExams,
  getUncompletedStudentExams,
  startStudentExam,
} from "../controllers/studentExamController.js";

const router = express.Router();

router.post("/start-exam", authMiddleware, startStudentExam);
router.patch("/complete-exam/:id", authMiddleware, completeStudentExam);
router.get("/all", authMiddleware, getStudentExams);
router.get("/uncompleted", authMiddleware, getUncompletedStudentExams);
router.get("/results", authMiddleware, getExamsResultsForPagination);
router.get("/:id", authMiddleware, getStudentExamById);

export default router;
