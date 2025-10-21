import express from "express";
import {
  deleteStudent,
  getStudents,
  updateStudent,
  getStudentsForPagination,
  getActiveStudents,
  updateStudentPassword,
} from "../controllers/studentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getStudents);
router.get("/pagination-by-admin", authMiddleware, getStudentsForPagination);
router.get("/active", authMiddleware, getActiveStudents);
router.patch("/:id", authMiddleware, updateStudent);
router.patch("/own/password", authMiddleware, updateStudentPassword);
router.delete("/:id", authMiddleware, deleteStudent);

export default router;
