import { Student } from "../models/studentModel.js";
import exceljs from "exceljs";
import moment from "moment-timezone";
import mongoose from "mongoose";
import { getCurrentUser } from "./userController.js";
import getLogger from "../config/logger.js";
import { History } from "../models/historyModel.js";
import { Worker } from "../models/workerModel.js";
import { createHistoryNotifications } from "./notificationController.js";

export const getTutionFees = async (req, res) => {
  const { searchQuery, groupsIds, coursesIds, length, status } = req.query;
  const limit = 20;

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");
    const currentDate = moment.tz("Asia/Baku").toDate();

    const filterObj = {
      fullName: { $regex: regexSearchQuery },
      "groups.0": { $exists: true },
      deleted: false,
    };
    const groupsFilterObj = {};
    const courseFilterObj = {};
    const statusFilterObj = {};
    const debtorFilterObj = {};

    if (groupsIds)
      groupsFilterObj["groups.group"] = {
        $in: groupsIds.split(",").map((id) => new mongoose.Types.ObjectId(id)),
      };
    if (coursesIds)
      courseFilterObj["course._id"] = {
        $in: coursesIds.split(",").map((id) => new mongoose.Types.ObjectId(id)),
      };

    if (status === "continue") statusFilterObj["groups.status"] = "continue";
    if (status === "graduate")
      statusFilterObj.$or = [
        { "groups.status": "debtor-graduate" },
        { "groups.status": "graduate" },
      ];
    if (status === "stopped") statusFilterObj["groups.status"] = "stopped";
    if (status === "freeze") statusFilterObj["groups.status"] = "freeze";
    if (status === "waiting") statusFilterObj["groups.status"] = "waiting";

    if (status === "debtor-continue") {
      statusFilterObj["groups.status"] = "continue";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }
    if (status === "debtor-graduate") {
      statusFilterObj.$or = [
        { "groups.status": "debtor-graduate" },
        { "groups.status": "graduate" },
      ];
      debtorFilterObj.currentDebt = { $gt: 0 };
    }
    if (status === "debtor-stopped") {
      statusFilterObj["groups.status"] = "stopped";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }
    if (status === "debtor-freeze") {
      statusFilterObj["groups.status"] = "freeze";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }

    console.log(statusFilterObj);

    const students = await Student.aggregate([
      { $match: filterObj },
      { $unwind: "$groups" },
      {
        $match: { ...statusFilterObj, ...groupsFilterObj },
      },
      {
        $addFields: {
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
                as: "confirmedPaid",
                in: "$$confirmedPaid.payment",
              },
            },
          },
          totalPaymentsDue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$groups.payments",
                    as: "payment",
                    cond: {
                      $or: [
                        { $eq: ["$groups.status", "stopped"] },
                        { $eq: ["$groups.status", "freeze"] },
                        { $eq: ["$groups.status", "graduate"] },
                        { $eq: ["$groups.status", "debtor-graduate"] },
                        {
                          $lte: ["$$payment.paymentDate", currentDate],
                        },
                      ],
                    },
                  },
                },
                as: "duePayment",
                in: "$$duePayment.payment",
              },
            },
          },
        },
      },
      {
        $addFields: {
          currentDebt: {
            $cond: {
              if: { $eq: ["$groups.status", "waiting"] },
              then: 0,
              else: {
                $max: [{ $subtract: ["$totalPaymentsDue", "$totalPaids"] }, 0],
              },
            },
          },
          totalRest: {
            $max: [{ $subtract: ["$groups.totalAmount", "$totalPaids"] }, 0],
          },
          monthlyPayment: {
            $cond: {
              if: { $gt: [{ $size: "$groups.payments" }, 0] },
              then: { $arrayElemAt: ["$groups.payments.payment", 0] },
              else: 0,
            },
          },
        },
      },
      { $match: debtorFilterObj },
      {
        $addFields: {
          latedPaymentCount: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$currentDebt", 0] },
                  { $gt: ["$monthlyPayment", 0] },
                ],
              },
              then: { $ceil: { $divide: ["$currentDebt", "$monthlyPayment"] } },
              else: 0,
            },
          },
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groups.group",
          foreignField: "_id",
          as: "group",
        },
      },
      { $unwind: "$group" },
      {
        $lookup: {
          from: "courses",
          localField: "group.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $match: courseFilterObj },
      { $skip: +length },
      { $limit: limit },
      {
        $addFields: {
          calcedPayments: {
            $reduce: {
              input: "$groups.payments",
              initialValue: {
                remainingTotalPaids: "$totalPaids",
                paymentsWithStatus: [],
              },
              in: {
                remainingTotalPaids: {
                  $max: [
                    {
                      $subtract: [
                        "$$value.remainingTotalPaids",
                        "$$this.payment",
                      ],
                    },
                    0,
                  ],
                },
                paymentsWithStatus: {
                  $concatArrays: [
                    "$$value.paymentsWithStatus",
                    [
                      {
                        $mergeObjects: [
                          "$$this",
                          {
                            paid: {
                              $gte: [
                                "$$value.remainingTotalPaids",
                                "$$this.payment",
                              ],
                            },
                            rest: {
                              $cond: {
                                if: {
                                  $gte: [
                                    "$$value.remainingTotalPaids",
                                    "$$this.payment",
                                  ],
                                },
                                then: 0,
                                else: {
                                  $subtract: [
                                    "$$this.payment",
                                    "$$value.remainingTotalPaids",
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    ],
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          paymentsTable: "$calcedPayments.paymentsWithStatus",
        },
      },
      {
        $project: {
          fullName: 1,
          phone: 1,
          studentId: "$_id",
          currentDebt: 1,
          monthlyPayment: 1,
          totalPaids: 1,
          totalRest: 1,
          latedPaymentCount: 1,
          group: 1,
          course: 1,
          paymentsTable: 1,
          contractStartDate: "$groups.contractStartDate",
          contractEndDate: "$groups.contractEndDate",
          contractId: "$groups.contractId",
          paymentStartDate: "$groups.paymentStartDate",
          payment: "$groups.payment",
          paymentPart: "$groups.paymentPart",
          amount: "$groups.amount",
          totalAmount: "$groups.totalAmount",
          discountReason: "$groups.discountReason",
          discount: "$groups.discount",
          payments: "$groups.payments",
          paids: "$groups.paids",
          status: "$groups.status",
          stoppedDate: "$groups.stoppedDate",
          freezeDate: "$groups.freezeDate",
          _id: {
            $concat: [{ $toString: "$_id" }, "-", { $toString: "$group._id" }],
          },
        },
      },
    ]);

    res.status(200).json({
      tutionFees: students,
      currentLength: +length + students.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateTuitionFee = async (req, res) => {
  const { studentId, fullName, group, paids } = req.body;
  const { id: userId, role } = req.user;
  const currentUser = await getCurrentUser(userId, role);

  try {
    if (role !== "worker") {
      return res.status(403).json({
        key: "invalid-user",
        message: "You are not authorized to perform this action",
      });
    }

    let student = await Student.findById(studentId).populate("groups.group");
    let oldStudent = await Student.findById(studentId).populate("groups.group");

    if (!student?.groups || student.groups.length === 0) {
      return res.status(404).json({
        key: "student-group-not-found",
        message: "Student group not found",
      });
    }

    const oldTargetStudentGroup = oldStudent.groups.find(
      (item) => item.group._id.toString() === group._id.toString()
    );

    const targetStudentGroup = student.groups.find(
      (item) => item.group._id.toString() === group._id.toString()
    );

    if (!targetStudentGroup) {
      return res.status(404).json({
        key: "student-group-not-found",
        message: "Student group not found",
      });
    }

    targetStudentGroup.paids = paids;

    student = await Student.findByIdAndUpdate(
      student._id,
      { groups: student.groups },
      { new: true }
    );

    const worker = await Worker.findById(userId);

    const sender = worker.toObject();
    delete sender.password;

    const oldData = {
      student: {
        _id: student._id,
        fullName: student.fullName,
        email: student.email,
        fin: student.fin,
        seria: student.seria,
        phone: student.phone,
      },
      group: oldTargetStudentGroup.group?.toObject(),
      paids: oldTargetStudentGroup.paids,
    };

    const newData = {
      student: {
        _id: student._id,
        fullName: student.fullName,
        email: student.email,
        fin: student.fin,
        seria: student.seria,
        phone: student.phone,
      },
      group: targetStudentGroup.group?.toObject(),
      paids: targetStudentGroup.paids,
    };

    const history = new History({
      sender,
      recipient: sender,
      documentId: student._id,
      action: "update",
      modelName: "tuition-fee",
      oldData: oldData,
      newData: newData,
      status: "confirmed",
      groupId: targetStudentGroup.group._id,
    });

    await history.save();

    getLogger("tuitionFee").info({
      message: "INFO: Tuition Fee updated",
      oldData: {
        _id: student._id,
        fullName: student?.fullName || "",
        email: student?.email || "",
        phone: student?.phone || "",
        paids: oldTargetStudentGroup.paids,
        groupName: group?.name || "",
      },
      updatedData: {
        _id: student._id,
        fullName: student?.fullName || "",
        email: student?.email || "",
        phone: student?.phone || "",
        paids: targetStudentGroup.paids,
        groupName: group?.name || "",
      },
      user: currentUser,
      status: 200,
      method: "PATCH",
    });

    const currentDate = moment.tz("Asia/Baku").toDate();

    const updatedStudent = await Student.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(student._id),
        },
      },
      { $unwind: "$groups" },
      {
        $match: {
          "groups.group": new mongoose.Types.ObjectId(targetStudentGroup.group),
        },
      },
      {
        $addFields: {
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
                as: "confirmedPaid",
                in: "$$confirmedPaid.payment",
              },
            },
          },
          totalPaymentsDue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$groups.payments",
                    as: "payment",
                    cond: {
                      $or: [
                        { $eq: ["$groups.status", "stopped"] },
                        { $eq: ["$groups.status", "freeze"] },
                        { $eq: ["$groups.status", "graduate"] },
                        { $eq: ["$groups.status", "debtor-graduate"] },
                        {
                          $lte: ["$$payment.paymentDate", currentDate],
                        },
                      ],
                    },
                  },
                },
                as: "duePayment",
                in: "$$duePayment.payment",
              },
            },
          },
        },
      },
      {
        $addFields: {
          currentDebt: {
            $max: [{ $subtract: ["$totalPaymentsDue", "$totalPaids"] }, 0],
          },
          totalRest: {
            $max: [{ $subtract: ["$groups.totalAmount", "$totalPaids"] }, 0],
          },
          monthlyPayment: {
            $let: {
              vars: {
                firstPaymentObj: { $arrayElemAt: ["$groups.payments", 0] },
              },
              in: "$$firstPaymentObj.payment",
            },
          },
        },
      },
      {
        $addFields: {
          latedPaymentCount: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$currentDebt", 0] },
                  { $gt: ["$monthlyPayment", 0] },
                ],
              },
              then: { $ceil: { $divide: ["$currentDebt", "$monthlyPayment"] } },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          calcedPayments: {
            $reduce: {
              input: "$groups.payments",
              initialValue: {
                remainingTotalPaids: "$totalPaids",
                paymentsWithStatus: [],
              },
              in: {
                remainingTotalPaids: {
                  $max: [
                    {
                      $subtract: [
                        "$$value.remainingTotalPaids",
                        "$$this.payment",
                      ],
                    },
                    0,
                  ],
                },
                paymentsWithStatus: {
                  $concatArrays: [
                    "$$value.paymentsWithStatus",
                    [
                      {
                        $mergeObjects: [
                          "$$this",
                          {
                            paid: {
                              $gte: [
                                "$$value.remainingTotalPaids",
                                "$$this.payment",
                              ],
                            },
                            rest: {
                              $cond: {
                                if: {
                                  $gte: [
                                    "$$value.remainingTotalPaids",
                                    "$$this.payment",
                                  ],
                                },
                                then: 0,
                                else: {
                                  $subtract: [
                                    "$$this.payment",
                                    "$$value.remainingTotalPaids",
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    ],
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          paymentsTable: "$calcedPayments.paymentsWithStatus",
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groups.group",
          foreignField: "_id",
          as: "group",
        },
      },
      { $unwind: "$group" },
      {
        $lookup: {
          from: "courses",
          localField: "group.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          fullName: 1,
          phone: 1,
          studentId: "$_id",
          currentDebt: 1,
          monthlyPayment: 1,
          totalPaids: 1,
          totalRest: 1,
          latedPaymentCount: 1,
          group: 1,
          course: 1,
          paymentsTable: 1,
          contractStartDate: "$groups.contractStartDate",
          contractEndDate: "$groups.contractEndDate",
          contractId: "$groups.contractId",
          paymentStartDate: "$groups.paymentStartDate",
          payment: "$groups.payment",
          paymentPart: "$groups.paymentPart",
          amount: "$groups.amount",
          totalAmount: "$groups.totalAmount",
          discountReason: "$groups.discountReason",
          discount: "$groups.discount",
          payments: "$groups.payments",
          paids: "$groups.paids",
          status: "$groups.status",
          stoppedDate: "$groups.stoppedDate",
          freezeDate: "$groups.freezeDate",
          _id: {
            $concat: [{ $toString: "$_id" }, "-", { $toString: "$group._id" }],
          },
        },
      },
    ]);

    await createHistoryNotifications(history, "update-directly");

    const io = req.app.get("socketio");

    io.emit("newEvent", true);

    const result = updatedStudent[0];

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    getLogger("tuitionFee").error({
      message: `ERROR: ${err.message}`,
      user: currentUser,
      payload: {
        fullName: fullName,
        groupName: group?.name || "",
        paids,
      },
      status: 500,
      method: "PATCH",
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Export excel file
export const exportTuitionFeeExcel = async (req, res) => {
  const { searchQuery, groupsIds, coursesIds, status } = req.query;

  console.log(req.query, "tuition queries");

  const studentStatus = [
    { key: "waiting", name: "Gözləmədə" },
    { key: "continue", name: "Davam edir" },
    { key: "graduate", name: "Məzun" },
    { key: "stopped", name: "Dayandırdı" },
    { key: "freeze", name: "Dondurdu" },
  ];

  const headerStyle = {
    font: { bold: true },
  };

  try {
    const regexSearchQuery = new RegExp(searchQuery?.trim() || "", "i");
    const currentDate = moment.tz("Asia/Baku").toDate();

    const filterObj = {
      fullName: { $regex: regexSearchQuery },
      "groups.0": { $exists: true },
      deleted: false,
    };
    const groupsFilterObj = {};
    const courseFilterObj = {};
    const statusFilterObj = {};
    const debtorFilterObj = {};

    if (groupsIds)
      groupsFilterObj["groups.group"] = {
        $in: groupsIds.split(",").map((id) => new mongoose.Types.ObjectId(id)),
      };
    if (coursesIds)
      courseFilterObj["course._id"] = {
        $in: coursesIds.split(",").map((id) => new mongoose.Types.ObjectId(id)),
      };

    if (status === "continue") statusFilterObj["groups.status"] = "continue";
    if (status === "graduate") statusFilterObj["groups.status"] = "graduate";
    if (status === "stopped") statusFilterObj["groups.status"] = "stopped";
    if (status === "freeze") statusFilterObj["groups.status"] = "freeze";
    if (status === "waiting") statusFilterObj["groups.status"] = "waiting";

    if (status === "debtor-continue") {
      statusFilterObj["groups.status"] = "continue";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }
    if (status === "debtor-graduate") {
      statusFilterObj["groups.status"] = "graduate";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }
    if (status === "debtor-stopped") {
      statusFilterObj["groups.status"] = "stopped";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }
    if (status === "debtor-freeze") {
      statusFilterObj["groups.status"] = "freeze";
      debtorFilterObj.currentDebt = { $gt: 0 };
    }

    console.log(groupsFilterObj, "group filter obj");

    const students = await Student.aggregate([
      { $match: filterObj },
      { $unwind: "$groups" },
      {
        $match: { ...statusFilterObj, ...groupsFilterObj },
      },
      {
        $addFields: {
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
                as: "confirmedPaid",
                in: "$$confirmedPaid.payment",
              },
            },
          },
          totalPaymentsDue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$groups.payments",
                    as: "payment",
                    cond: {
                      $or: [
                        { $eq: ["$groups.status", "stopped"] },
                        { $eq: ["$groups.status", "freeze"] },
                        { $eq: ["$groups.status", "graduate"] },
                        { $eq: ["$groups.status", "debtor-graduate"] },
                        {
                          $lte: ["$$payment.paymentDate", currentDate],
                        },
                      ],
                    },
                  },
                },
                as: "duePayment",
                in: "$$duePayment.payment",
              },
            },
          },
        },
      },
      {
        $addFields: {
          currentDebt: {
            $cond: {
              if: { $eq: ["$groups.status", "waiting"] },
              then: 0,
              else: {
                $max: [{ $subtract: ["$totalPaymentsDue", "$totalPaids"] }, 0],
              },
            },
          },
          totalRest: {
            $max: [{ $subtract: ["$groups.totalAmount", "$totalPaids"] }, 0],
          },
          monthlyPayment: {
            $cond: {
              if: { $gt: [{ $size: "$groups.payments" }, 0] },
              then: { $arrayElemAt: ["$groups.payments.payment", 0] },
              else: 0,
            },
          },
        },
      },
      { $match: debtorFilterObj },
      {
        $addFields: {
          latedPaymentCount: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$currentDebt", 0] },
                  { $gt: ["$monthlyPayment", 0] },
                ],
              },
              then: { $ceil: { $divide: ["$currentDebt", "$monthlyPayment"] } },
              else: 0,
            },
          },
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groups.group",
          foreignField: "_id",
          as: "group",
        },
      },
      { $unwind: "$group" },
      {
        $lookup: {
          from: "courses",
          localField: "group.course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      { $match: courseFilterObj },
      {
        $addFields: {
          calcedPayments: {
            $reduce: {
              input: "$groups.payments",
              initialValue: {
                remainingTotalPaids: "$totalPaids",
                paymentsWithStatus: [],
              },
              in: {
                remainingTotalPaids: {
                  $max: [
                    {
                      $subtract: [
                        "$$value.remainingTotalPaids",
                        "$$this.payment",
                      ],
                    },
                    0,
                  ],
                },
                paymentsWithStatus: {
                  $concatArrays: [
                    "$$value.paymentsWithStatus",
                    [
                      {
                        $mergeObjects: [
                          "$$this",
                          {
                            paid: {
                              $gte: [
                                "$$value.remainingTotalPaids",
                                "$$this.payment",
                              ],
                            },
                            rest: {
                              $cond: {
                                if: {
                                  $gte: [
                                    "$$value.remainingTotalPaids",
                                    "$$this.payment",
                                  ],
                                },
                                then: 0,
                                else: {
                                  $subtract: [
                                    "$$this.payment",
                                    "$$value.remainingTotalPaids",
                                  ],
                                },
                              },
                            },
                          },
                        ],
                      },
                    ],
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          paymentsTable: "$calcedPayments.paymentsWithStatus",
        },
      },
      {
        $project: {
          fullName: 1,
          phone: 1,
          studentId: "$_id",
          currentDebt: 1,
          monthlyPayment: 1,
          totalPaids: 1,
          totalRest: 1,
          latedPaymentCount: 1,
          group: 1,
          course: 1,
          paymentsTable: 1,
          contractStartDate: "$groups.contractStartDate",
          contractEndDate: "$groups.contractEndDate",
          contractId: "$groups.contractId",
          paymentStartDate: "$groups.paymentStartDate",
          payment: "$groups.payment",
          paymentPart: "$groups.paymentPart",
          amount: "$groups.amount",
          totalAmount: "$groups.totalAmount",
          discountReason: "$groups.discountReason",
          discount: "$groups.discount",
          payments: "$groups.payments",
          paids: "$groups.paids",
          status: "$groups.status",
          stoppedDate: "$groups.stoppedDate",
          freezeDate: "$groups.freezeDate",
          _id: {
            $concat: [{ $toString: "$_id" }, "-", { $toString: "$group._id" }],
          },
        },
      },
    ]);

    const workbook = new exceljs.Workbook();

    const sheet = workbook.addWorksheet("tuitionfee");

    sheet.columns = [
      { header: "Tələbə adı", key: "fullName", width: 30 },
      { header: "Mobil nörmə", key: "phone", width: 30 },
      { header: "İxtisas", key: "course", width: 20 },
      { header: "Qrup", key: "group", width: 20 },
      { header: "Gecikmiş ödəniş sayı", key: "latedPaymentCount", width: 20 },
      { header: "", key: "paymentPart", width: 10 },
      { header: "Tam / Aylıq ödəniş", key: "monthlyPayment", width: 20 },
      { header: "Cari borc", key: "currentDebt", width: 20 },
      { header: "Məbləğ", key: "amount", width: 8 },
      { header: "Endirim", key: "discount", width: 10 },
      { header: "Yekun Məbləğ", key: "totalAmount", width: 15 },
      { header: "Yekun Qalıq", key: "totalRest", width: 15 },
      { header: "Ödəniş növü", key: "paymentType", width: 20 },
      { header: "Status", key: "status", width: 20 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
    });

    students.forEach((item) => {
      sheet.addRow({
        fullName: item?.fullName ? item.fullName : "",
        phone: item?.phone || "",
        course: item?.course?.name || "",
        group: item?.group?.name || "",
        latedPaymentCount: item?.latedPaymentCount ?? "",
        paymentPart:
          item?.paymentPart > 1
            ? `${item.paymentPart} aylıq`
            : item.paymentPart === 1
            ? "tam"
            : "",
        monthlyPayment: item?.monthlyPayment
          ? parseFloat(item.monthlyPayment.toFixed(2))
          : "",
        currentDebt: item?.currentDebt
          ? parseFloat(item.currentDebt.toFixed(2))
          : "",
        amount: item?.amount ? parseFloat(item.amount.toFixed(2)) : "",
        discount: item?.discount ? `${item.discount}%` : "",
        totalAmount: parseFloat((item?.totalAmount || 0).toFixed(2)),
        totalRest: parseFloat((item?.totalRest || 0).toFixed(2)),
        paymentType: item?.payment?.paymentType || "",
        status: `${item.currentDebt > 0 ? "Borclu " : ""}${
          studentStatus.find((status) => status.key == item.status)?.name
        }`,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tuitionfee.xlsx"
    );
    workbook.xlsx.write(res);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
