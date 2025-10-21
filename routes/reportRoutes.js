import express from "express";
import {
  getConsultationStatistics,
  getContinuesStudentsCountForEachCourse,
  getSoldConsultationsCountByCourse,
  getStudentsCountAndTotalContractAmountByStatus,
  getStudentsCountBySalesType,
  getStudentsIncomes,
  getSubstitutedLessonsCountByTeacher,
  getTotalAmountSumOfContinuesStudents,
  getTotalAmountSumOfWaitingStudents,
  getTotalDebtOfContinueStudents,
  getTotalDebtOfDisabledStudents,
  getTotalStudentsPaymentsByEachGroup,
  getWaitingGroupsWithStudentsCount,
} from "../controllers/reportController.js";

const router = express.Router();

router.get(
  "/total-contract-payments-by-continues-students",
  getTotalAmountSumOfContinuesStudents
);
router.get("/total-debt-by-continues-students", getTotalDebtOfContinueStudents);
router.get("/total-debt-by-disabled-students", getTotalDebtOfDisabledStudents);
router.get(
  "/total-contract-payments-by-waiting-students",
  getTotalAmountSumOfWaitingStudents
);
router.get(
  "/continues-students-count-for-each-course",
  getContinuesStudentsCountForEachCourse
);
router.get("/students-incomes", getStudentsIncomes);
router.get(
  "/sold-consultation-count-by-course",
  getSoldConsultationsCountByCourse
);
router.get(
  "/waiting-groups-with-students-count",
  getWaitingGroupsWithStudentsCount
);
router.get(
  "/substituted-lessons-count-by-teacher",
  getSubstitutedLessonsCountByTeacher
);
router.get("/consultation-statistics", getConsultationStatistics);
router.get(
  "/students-count-and-total-contract-amount-by-status",
  getStudentsCountAndTotalContractAmountByStatus
);
router.get(
  "/total-students-payments-by-each-group",
  getTotalStudentsPaymentsByEachGroup
);
router.get("/students-count-by-sales-type", getStudentsCountBySalesType);

export default router;
