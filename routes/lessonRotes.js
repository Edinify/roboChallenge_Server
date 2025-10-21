import express from "express";
import {
  cancelLessonChanges,
  confirmLessonChanges,
  createLesson,
  deleteLesson,
  getLessons,
  updateLesson,
} from "../controllers/lessonController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createLesson);
router.get("/", authMiddleware, getLessons);
router.patch("/:id", authMiddleware, updateLesson);
router.patch("/changes/confirm/:id", authMiddleware, confirmLessonChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelLessonChanges);
router.delete("/:id", authMiddleware, deleteLesson);

// router.delete("/delete-current",deleteCurrentLesson);

export default router;
