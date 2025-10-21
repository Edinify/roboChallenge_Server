import express from "express";
import {
  getNewNotificationsCount,
  getNotifications,
  viewNotifications,
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.get("/count", authMiddleware, getNewNotificationsCount);
router.patch("/viewed", authMiddleware, viewNotifications);

export default router;
