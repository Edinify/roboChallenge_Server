import express from "express";
import { authMiddleware, checkSuperAdmin } from "../middleware/auth.js";
import {
  getActiveStudentsCount,
  getAdvertisingStatistics,
  getAllEventsCount,
  getAllStudentsCount,
  getConsultationsData,
  getCoursesStatistics,
  getGroupsCount,
  getLessonsCountChartData,
  getTachersResults,
  getWeeklyGroupTable,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/all-students", authMiddleware, getAllStudentsCount);
router.get("/active-students", authMiddleware, getActiveStudentsCount);
router.get("/all-groups", authMiddleware, getGroupsCount);
router.get("/events", authMiddleware, getAllEventsCount);
router.get("/course-statistic", authMiddleware, getCoursesStatistics);
router.get("/consult-statistic", authMiddleware, getConsultationsData);
router.get("/group-table", authMiddleware, getWeeklyGroupTable);
router.get("/advertising", authMiddleware, getAdvertisingStatistics);
router.get("/leadboard", authMiddleware, getTachersResults);
router.get("/chart", authMiddleware, getLessonsCountChartData);

export default router;
