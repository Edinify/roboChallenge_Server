import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  createWhereComing,
  getActiveWhereComing,
  getAllWhereComing,
  updateWhereComing,
} from "../controllers/whereComingController.js";

const router = express.Router();

router.get("/all", authMiddleware, getAllWhereComing);
router.get("/active", authMiddleware, getActiveWhereComing);

router.post("/", authMiddleware, createWhereComing);
router.patch("/:id", authMiddleware, updateWhereComing);

export default router;
