import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  cancelGroupChanges,
  confirmGroupChanges,
  createGroup,
  deleteGroup,
  getGroups,
  getGroupsForPagination,
  getGroupsWithCourseId,
  getGroupsWithMentorId,
  getGroupsWithStudentId,
  getGroupsWithTeacherId,
  updateGroup,
} from "../controllers/groupController.js";
import { getCoursesForPagination } from "../controllers/courseController.js";

const router = express.Router();

router.get("/", authMiddleware, getGroups);
router.get("/with-teacher", authMiddleware, getGroupsWithTeacherId);
router.get("/with-mentor", authMiddleware, getGroupsWithMentorId);
router.get("/with-student", authMiddleware, getGroupsWithStudentId);
router.get("/with-course", authMiddleware, getGroupsWithCourseId);
router.get("/pagination", authMiddleware, getGroupsForPagination);
router.post("/", authMiddleware, createGroup);
router.patch("/:id", authMiddleware, updateGroup);
router.patch("/changes/confirm/:id", authMiddleware, confirmGroupChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelGroupChanges);
router.delete("/:id", authMiddleware, deleteGroup);

export default router;
