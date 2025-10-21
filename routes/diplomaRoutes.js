import express from "express";
import {
  getDiplomas,
  updateDiploma,
} from "../controllers/diplomaController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getDiplomas);
// router.get("/excel", exportCareersExcel);
router.patch("/", authMiddleware, updateDiploma);

export default router;
