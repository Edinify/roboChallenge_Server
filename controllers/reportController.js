import { Student } from "../models/studentModel.js";
import { calcDate } from "../calculate/calculateDate.js";
import moment from "moment-timezone";
import { Consultation } from "../models/consultationModel.js";
import { Group } from "../models/groupModel.js";
import { Lesson } from "../models/lessonModel.js";

// Get total contract payments for continue students
export const getTotalAmountSumOfContinuesStudents = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    const dateFilterObj = {};

    if (monthCount || (startDate && endDate)) {
      let targetDate = calcDate(monthCount, startDate, endDate);

      dateFilterObj["groups.payments.paymentDate"] = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }
    console.log(dateFilterObj);

    const totalAmountSum = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $match: {
          "groups.status": "continue",
        },
      },
      {
        $unwind: "$groups.payments",
      },
      {
        $match: dateFilterObj,
      },
      {
        $group: {
          _id: null,
          totalPaymentSum: { $sum: "$groups.payments.payment" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaymentSum: 1,
        },
      },
    ]);

    const result =
      totalAmountSum.length > 0 ? totalAmountSum[0].totalPaymentSum : 0;

    res.status(200).json(result.toFixed(2));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get total debt by continues students
export const getTotalDebtOfContinueStudents = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  console.log(monthCount, startDate, endDate);

  try {
    let targetEndDate = moment.tz("Asia/Baku").endOf("day").toDate();

    if (monthCount || (startDate && endDate)) {
      const targetDate = calcDate(monthCount, startDate, endDate);

      if (targetDate.endDate < targetEndDate) {
        targetEndDate = targetDate.endDate;
      }
    }

    const totalDebtResult = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $match: {
          "groups.status": "continue",
        },
      },
      {
        $addFields: {
          filteredPayments: {
            $filter: {
              input: "$groups.payments",
              as: "payment",
              cond: {
                $lte: ["$$payment.paymentDate", targetEndDate],
              },
            },
          },
          filteredPaids: {
            $filter: {
              input: "$groups.paids",
              as: "paid",
              cond: {
                $and: [
                  { $eq: ["$$paid.confirmed", true] },
                  { $lte: ["$$paid.paymentDate", targetEndDate] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          paymentsSum: {
            $sum: {
              $map: {
                input: "$filteredPayments",
                as: "payment",
                in: { $ifNull: ["$$payment.payment", 0] },
              },
            },
          },
          paidsSum: {
            $sum: {
              $map: {
                input: "$filteredPaids",
                as: "paid",
                in: { $ifNull: ["$$paid.payment", 0] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          groupDebt: {
            $max: [{ $subtract: ["$paymentsSum", "$paidsSum"] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDebt: { $sum: "$groupDebt" },
        },
      },
      {
        $project: {
          _id: 0,
          totalDebt: 1,
        },
      },
    ]);

    const totalDebt =
      totalDebtResult.length > 0 ? totalDebtResult[0].totalDebt : 0;

    res.status(200).json(totalDebt);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get total debt by stopped and freeze students
export const getTotalDebtOfDisabledStudents = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;
  try {
    let targetEndDate = moment.tz("Asia/Baku").endOf("day").toDate();

    if (monthCount || (startDate && endDate)) {
      const targetDate = calcDate(monthCount, startDate, endDate);

      if (targetDate.endDate < targetEndDate) {
        targetEndDate = targetDate.endDate;
      }
    }

    const totalDebtResult = await Student.aggregate([
      { $match: { deleted: false } },
      { $unwind: "$groups" },
      {
        $match: { "groups.status": { $in: ["stopped", "freeze"] } },
      },
      {
        $addFields: {
          totalPaymentsDue: {
            $sum: "$groups.payments.payment",
          },
          totalPaids: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$groups.paids",
                    as: "paid",
                    cond: { $eq: ["$$paid.confirmed", true] },
                  },
                },
                as: "paid",
                in: "$$paid.payment",
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalDebt: {
            $max: [{ $subtract: ["$totalPaymentsDue", "$totalPaids"] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDebtSum: { $sum: "$totalDebt" },
        },
      },
      {
        $project: {
          _id: 0,
          totalDebtSum: 1,
        },
      },
    ]);

    const result = totalDebtResult[0]?.totalDebtSum || 0;

    res.status(200).json(result.toFixed(2));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get total contract payments for waiting students
export const getTotalAmountSumOfWaitingStudents = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  console.log(req.query);
  try {
    const dateFilterObj = {};

    if (monthCount || (startDate && endDate)) {
      let targetDate = calcDate(monthCount, startDate, endDate);

      dateFilterObj["groups.payments.paymentDate"] = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }

    const totalAmountSum = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $match: {
          "groups.status": "waiting",
        },
      },
      {
        $unwind: "$groups.payments",
      },
      {
        $match: dateFilterObj,
      },
      {
        $group: {
          _id: null,
          totalPaymentSum: { $sum: "$groups.payments.payment" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaymentSum: 1,
        },
      },
    ]);

    const result =
      totalAmountSum.length > 0 ? totalAmountSum[0].totalPaymentSum : 0;

    res.status(200).json(result.toFixed(2));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get continues students count for each course
export const getContinuesStudentsCountForEachCourse = async (req, res) => {
  try {
    const result = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $lookup: {
          from: "groups",
          localField: "groups.group",
          foreignField: "_id",
          as: "groupDetails",
        },
      },
      {
        $unwind: "$groupDetails",
      },
      {
        $match: {
          "groups.status": "continue",
        },
      },
      {
        $group: {
          _id: "$groupDetails.course",
          studentsCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: "$courseDetails",
      },
      {
        $project: {
          _id: 0,
          courseId: "$_id",
          courseName: "$courseDetails.name",
          studentsCount: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get incomes
export const getStudentsIncomes = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    const targetDate = calcDate(monthCount, startDate, endDate);

    console.log(targetDate, "target Date in incomesssssssss");

    const totalStudentsIncomesByPartPayment = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $match: {
          "groups.paymentPart": { $gt: 1 },
        },
      },
      {
        $unwind: "$groups.paids",
      },
      {
        $match: {
          "groups.paids.confirmed": true,
          "groups.paids.paymentDate": {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidSum: { $sum: "$groups.paids.payment" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidSum: 1,
        },
      },
    ]);

    const totalStudentsIncomesByFullPayment = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $match: {
          "groups.paymentPart": 1,
        },
      },
      {
        $unwind: "$groups.paids",
      },
      {
        $match: {
          "groups.paids.confirmed": true,
          "groups.paids.paymentDate": {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidSum: { $sum: "$groups.paids.payment" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidSum: 1,
        },
      },
    ]);

    const totalWaitingStudentsIncomes = await Student.aggregate([
      {
        $match: {
          deleted: false,
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $match: {
          "groups.status": "waiting",
        },
      },
      {
        $unwind: "$groups.paids",
      },
      {
        $match: {
          "groups.paids.confirmed": true,
          "groups.paids.paymentDate": {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidSum: { $sum: "$groups.paids.payment" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidSum: 1,
        },
      },
    ]);

    const totalStudentIncomeByPartPaymentResult =
      totalStudentsIncomesByPartPayment.length > 0
        ? totalStudentsIncomesByPartPayment[0].totalPaidSum
        : 0;

    const totalStudentIncomeByFullPaymentResult =
      totalStudentsIncomesByFullPayment.length > 0
        ? totalStudentsIncomesByFullPayment[0].totalPaidSum
        : 0;
    const totalWaitingStudentIncomesResult =
      totalWaitingStudentsIncomes.length > 0
        ? totalWaitingStudentsIncomes[0].totalPaidSum
        : 0;

    res.status(200).json({
      partPaymentStudentIncome: totalStudentIncomeByPartPaymentResult,
      fullPaymentStudentIncome: totalStudentIncomeByFullPaymentResult,
      waitingStudentIncome: totalWaitingStudentIncomesResult,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get sold consultations count by course
export const getSoldConsultationsCountByCourse = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    const targetDate = calcDate(monthCount, startDate, endDate);

    const result = await Consultation.aggregate([
      {
        $match: {
          status: "sold",
          salesDate: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: "$course",
          studentsCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: "$courseDetails",
      },
      {
        $project: {
          _id: 0,
          courseId: "$_id",
          courseName: "$courseDetails.name",
          studentsCount: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get waiting groups with studentsCount
export const getWaitingGroupsWithStudentsCount = async (req, res) => {
  try {
    const result = await Group.aggregate([
      {
        $match: {
          status: "waiting",
        },
      },
      {
        $addFields: {
          studentsCount: { $size: "$students" },
        },
      },
      {
        $project: {
          _id: 0,
          groupId: "$_id",
          name: 1,
          createdAt: 1,
          studentsCount: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get substituted lessons count by teacher
export const getSubstitutedLessonsCountByTeacher = async (req, res) => {
  try {
    const currentGroups = await Group.find({
      status: "current",
    });

    const currentGroupsIds = currentGroups.map((group) => group._id);
    const result = await Lesson.aggregate([
      {
        $match: {
          status: "cancelled",
          group: { $in: currentGroupsIds },
          teacher: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            teacher: "$teacher",
            group: "$group",
          },
          substitutedLessonsCount: { $sum: 1 },
          firstCancelledLessonDate: { $min: "$date" },
        },
      },
      {
        $lookup: {
          from: "teachers",
          localField: "_id.teacher",
          foreignField: "_id",
          as: "teacherDetails",
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "_id.group",
          foreignField: "_id",
          as: "groupDetails",
        },
      },
      {
        $unwind: "$teacherDetails",
      },
      {
        $unwind: "$groupDetails",
      },
      {
        $project: {
          _id: 0,
          teacher: "$teacherDetails",
          group: "$groupDetails",
          substitutedLessonsCount: 1,
          firstCancelledLessonDate: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get consultation statistics
export const getConsultationStatistics = async (req, res) => {
  const { monthCount, startDate, endDate } = req.query;

  try {
    let targetDate = calcDate(monthCount, startDate, endDate);

    console.log(targetDate, "target date in consultation statistics");
    const leadsCount = await Consultation.aggregate([
      {
        $match: {
          contactDate: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalLead: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalLead: 1,
        },
      },
    ]);

    const plansCount = await Consultation.aggregate([
      {
        $match: {
          contactDate: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalPlans: 1,
        },
      },
    ]);

    const consultationsCount = await Consultation.aggregate([
      {
        $match: {
          constDate: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
          status: { $in: ["sold", "cancelled", "thinks"] },
        },
      },
      {
        $group: {
          _id: null,
          totalConsultations: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalConsultations: 1,
        },
      },
    ]);

    const salesCount = await Consultation.aggregate([
      {
        $match: {
          salesDate: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
          status: "sold",
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
        },
      },
    ]);

    const totalLead = leadsCount.length > 0 ? leadsCount[0].totalLead : 0;
    const totalPlans = plansCount.length > 0 ? plansCount[0].totalPlans : 0;
    const totalConsultation =
      consultationsCount.length > 0
        ? consultationsCount[0].totalConsultations
        : 0;
    const totalSales = salesCount.length > 0 ? salesCount[0].totalSales : 0;

    res
      .status(200)
      .json({ totalLead, totalPlans, totalConsultation, totalSales });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

//  Get students count and total contract amount by status
export const getStudentsCountAndTotalContractAmountByStatus = async (
  req,
  res
) => {
  const { monthCount, startDate, endDate } = req.query;
  try {
    const targetDate = calcDate(monthCount, startDate, endDate);
    const currentDate = moment.tz("Asia/Baku").endOf("day").toDate();

    console.log(targetDate);
    const result = await Student.aggregate([
      {
        $match: {
          "groups.0": { $exists: true },
          deleted: false,
        },
      },
      { $unwind: "$groups" },
      {
        $addFields: {
          totalPayments: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$groups.payments",
                    as: "p",
                    cond: {
                      $and: [
                        { $gte: ["$$p.paymentDate", targetDate.startDate] },
                        { $lte: ["$$p.paymentDate", targetDate.endDate] },
                      ],
                    },
                  },
                },
                as: "p",
                in: "$$p.payment",
              },
            },
          },
          totalPaids: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$groups.paids",
                    as: "p",
                    cond: { $eq: ["$$p.confirmed", true] },
                  },
                },
                as: "p",
                in: "$$p.payment",
              },
            },
          },
          totalAllPayments: {
            $sum: "$groups.payments.payment",
          },
        },
      },
      {
        $addFields: {
          debtForContinue: {
            $max: [
              {
                $subtract: [
                  {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: "$groups.payments",
                            as: "p",
                            cond: {
                              $lte: ["$$p.paymentDate", currentDate],
                            },
                          },
                        },
                        as: "p",
                        in: "$$p.payment",
                      },
                    },
                  },
                  "$totalPaids",
                ],
              },
              0,
            ],
          },

          debtForStoppedAndFreezeAndGraduate: {
            $max: [
              {
                $subtract: [
                  {
                    $sum: "$groups.payments.payment",
                  },
                  "$totalPaids",
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          isDebtorContinue: {
            $and: [
              { $eq: ["$groups.status", "continue"] },
              { $gt: ["$debtForContinue", 0] },
            ],
          },
          isDebtorGraduate: {
            $and: [
              {
                $or: [
                  { $eq: ["$groups.status", "graduate"] },
                  { $eq: ["$groups.status", "debtor-graduate"] },
                ],
              },
              { $gt: ["$debtForStoppedAndFreezeAndGraduate", 0] },
            ],
          },
          isDebtorStopped: {
            $and: [
              { $eq: ["$groups.status", "stopped"] },
              {
                $gt: ["$debtForStoppedAndFreezeAndGraduate", 0],
              },
            ],
          },
          isDebtorFreeze: {
            $and: [
              { $eq: ["$groups.status", "freeze"] },
              {
                $gt: ["$debtForStoppedAndFreezeAndGraduate", 0],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          manualStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$groups.status", "waiting"] },
                  then: "waiting",
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$groups.status", "graduate"] },
                      { $eq: ["$groups.status", "debtor-graduate"] },
                    ],
                  },
                  then: "graduate",
                },
                {
                  case: { $eq: ["$groups.status", "continue"] },
                  then: "continue",
                },
                {
                  case: { $eq: ["$groups.status", "stopped"] },
                  then: "stopped",
                },
                { case: { $eq: ["$groups.status", "freeze"] }, then: "freeze" },
              ],
              default: "unknown",
            },
          },
          debtorStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$isDebtorContinue", true] },
                  then: "debtor-continue",
                },
                {
                  case: { $eq: ["$isDebtorGraduate", true] },
                  then: "debtor-graduate",
                },
                {
                  case: { $eq: ["$isDebtorStopped", true] },
                  then: "debtor-stopped",
                },
                {
                  case: { $eq: ["$isDebtorFreeze", true] },
                  then: "debtor-freeze",
                },
              ],
              default: null,
            },
          },
        },
      },
      {
        $facet: {
          manualStatuses: [
            {
              $group: {
                _id: "$manualStatus",
                studentIds: { $addToSet: "$_id" },
                totalPaymentsSum: { $sum: "$totalPayments" },
              },
            },
            {
              $project: {
                status: "$_id",
                studentCount: { $size: "$studentIds" },
                totalPaymentsSum: 1,
              },
            },
          ],
          debtorStatuses: [
            { $match: { debtorStatus: { $ne: null } } },
            {
              $group: {
                _id: "$debtorStatus",
                studentIds: { $addToSet: "$_id" },
                totalPaymentsSum: {
                  $sum: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $in: ["$debtorStatus", ["debtor-continue"]],
                          },
                          then: "$debtForContinue",
                        },
                        {
                          case: {
                            $in: [
                              "$debtorStatus",
                              [
                                "debtor-stopped",
                                "debtor-freeze",
                                "debtor-graduate",
                              ],
                            ],
                          },
                          then: "$debtForStoppedAndFreezeAndGraduate",
                        },
                      ],
                      default: 0,
                    },
                  },
                },
              },
            },
            {
              $project: {
                status: "$_id",
                studentCount: { $size: "$studentIds" },
                totalPaymentsSum: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          statuses: {
            $concatArrays: ["$manualStatuses", "$debtorStatuses"],
          },
        },
      },
      {
        $unwind: "$statuses",
      },
      {
        $replaceRoot: {
          newRoot: "$statuses",
        },
      },

      {
        $project: {
          _id: 0,
          status: "$_id",
          studentCount: 1,
          totalPaymentsSum: 1,
        },
      },
      { $sort: { status: 1 } },
    ]);

    res.status(200).json(result);
  } catch (error) {
    console.error("Aggregation error:", error);
  }
};

// Get total students payments by each group
export const getTotalStudentsPaymentsByEachGroup = async (req, res) => {
  try {
    const currentDate = moment.tz("Asia/Baku").endOf("day").toDate();
    const currentGroups = await Group.find({
      status: "current",
    });

    const currentGroupsIds = currentGroups.map((group) => group._id);

    const result = await Student.aggregate([
      { $unwind: "$groups" },
      {
        $match: {
          "groups.group": { $in: currentGroupsIds },
        },
      },
      {
        $addFields: {
          groupId: "$groups.group",
          paymentPart: "$groups.paymentPart",
          groupPayments: {
            $cond: [
              {
                $in: ["$groups.status", ["freeze", "stopped"]],
              },
              {
                $filter: {
                  input: "$groups.payments",
                  as: "p",
                  cond: {
                    $lte: [
                      "$$p.paymentDate",
                      {
                        $cond: [
                          { $eq: ["$groups.status", "freeze"] },
                          "$groups.freezeDate",
                          "$groups.stoppedDate",
                        ],
                      },
                    ],
                  },
                },
              },
              "$groups.payments",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$groupId",
          studentCount: { $sum: 1 },
          totalFullPayments: {
            $sum: {
              $cond: [
                { $eq: ["$paymentPart", 1] },
                { $sum: "$groupPayments.payment" },
                0,
              ],
            },
          },
          totalPartPayments: {
            $sum: {
              $cond: [
                { $gt: ["$paymentPart", 1] },
                { $sum: "$groupPayments.payment" },
                0,
              ],
            },
          },
          totalNextMonthsPayments: {
            $sum: {
              $cond: [
                { $gt: ["$paymentPart", 1] },
                {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$groupPayments",
                          as: "p",
                          cond: {
                            $gt: ["$$p.paymentDate", currentDate],
                          },
                        },
                      },
                      as: "p",
                      in: "$$p.payment",
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "_id",
          foreignField: "_id",
          as: "groupInfo",
        },
      },
      { $unwind: "$groupInfo" },
      {
        $project: {
          _id: 0,
          groupId: "$_id",
          groupName: "$groupInfo.name",
          studentCount: 1,
          totalFullPayments: 1,
          totalPartPayments: 1,
          totalNextMonthsPayments: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

// Get students count by sales type

export const getStudentsCountBySalesType = async (req, res) => {
  try {
    const { monthCount, startDate, endDate } = req.query;
    const targetDate = calcDate(monthCount, startDate, endDate);

    const result = await Student.aggregate([
      {
        $match: {
          deleted: false,
          createdAt: {
            $gte: targetDate.startDate,
            $lte: targetDate.endDate,
          },
          salesType: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$salesType",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log(result);

    res.status(200).json(result);
  } catch {
    res.status(500).json({ message: { error: err.message } });
  }
};
