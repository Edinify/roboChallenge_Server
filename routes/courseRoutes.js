import express from "express";
import {
  cancelCourseChanges,
  confirmCourseChanges,
  createCourse,
  deleteCourse,
  exportCoursesExcel,
  getCourses,
  getCoursesForPagination,
  updateCourse,
} from "../controllers/courseController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/all", authMiddleware, getCourses);
router.get("/pagination", authMiddleware, getCoursesForPagination);
router.get("/excel", authMiddleware, exportCoursesExcel);
router.post("/", authMiddleware, createCourse);
router.patch("/:id", authMiddleware, updateCourse);
router.patch("/changes/confirm/:id", authMiddleware, confirmCourseChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelCourseChanges);
router.delete("/:id", authMiddleware, deleteCourse);

export default router;
