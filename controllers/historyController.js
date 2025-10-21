import { Course } from "../models/courseModel.js";
import { Group } from "../models/groupModel.js";
import { Student } from "../models/studentModel.js";
import { Teacher } from "../models/teacherModel.js";
import { WhereComing } from "../models/whereComingModel.js";
import { History } from "../models/historyModel.js";
import { Worker } from "../models/workerModel.js";
import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";

export const getHistory = async (req, res) => {
  const { documentId } = req.params;
  const { modelName, groupId } = req.query;

  try {
    const filterObj = {
      documentId,
      modelName,
    };

    if (modelName === "tuition-fee" && groupId) {
      filterObj.groupId = groupId;
    }

    if (!documentId) {
      return res
        .status(400)
        .json({ key: "missing-document-id", message: "Missing document ID" });
    }

    const histories = await History.find(filterObj).sort({ createdAt: -1 });

    return res.status(200).json(histories);
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStudentHistoryStatus = async (req, res) => {
  const userId = req.user.id;
  const { historyId } = req.params;
  const { status } = req.body;

  try {
    const currentUser = await Worker.findById(userId);

    if (!currentUser) {
      return res
        .status(404)
        .json({ key: "user-not-found", message: "User not found" });
    }

    const power = currentUser.profiles.find(
      (item) => item.profile === "students"
    )?.power;

    if (
      (power !== "update" && power !== "all") ||
      (status === "confirmed" && power === "update")
    ) {
      return res.status(400).json({ key: "invalid-user" });
    }

    const history = await History.findById(historyId);

    if (!history) {
      return res
        .status(404)
        .json({ key: "history-not-found", message: "History not found" });
    }

    if (history.status !== "pending") {
      return res
        .status(400)
        .json({ key: "invalid-status", message: "Invalid status" });
    }

    if (status === "pending") {
      return res.status(200).json(history);
    }

    if (status === "confirmed") {
      const student = await Student.findById(history.documentId);

      let updatedData = {
        fullName: history.newData.fullName,
        fin: history.newData.fin,
        email: history.newData.email,
        seria: history.newData.seria,
        birthday: history.newData.birthday,
        phone: history.newData.phone,
        whereSend: history.newData.whereSend,
        salesType: history.newData.salesType,
        password: history.newData?.password || "",
      };

      updatedData.whereComing = history.newData.whereComing._id;
      updatedData.courses =
        history.newData?.courses?.map((course) => course._id) || [];

      updatedData.groups =
        history.newData?.groups?.map((item) => {
          const beforeGroupItem = student.groups.find(
            (beforeItem) =>
              beforeItem?.group?.toString() === item?.group?._id.toString()
          );

          console.log(beforeGroupItem, "Before group item");

          return {
            ...(beforeGroupItem ? beforeGroupItem.toObject() : {}),
            _id: item._id,
            group: item.group._id,
            contractStartDate: item.contractStartDate,
            contractEndDate: item.contractEndDate,
            contractId: item.contractId,
            paymentStartDate: item.paymentStartDate,
            payment: item.payment,
            paymentPart: item.paymentPart,
            amount: item.amount,
            totalAmount: item.totalAmount,
            discountReason: item.discountReason,
            discount: item.discount,
            payments: item.payments,
            status: item.status,
            stoppedDate: item.stoppedDate,
            freezeDate: item.freezeDate,
            degree: item.degree,
          };
        }) || [];

      const regexEmail = new RegExp(`^${updatedData.email}$`, "i");

      const existingAdmin = await Admin.findOne({
        email: { $regex: regexEmail },
      });
      const existingWorker = await Worker.findOne({
        email: { $regex: regexEmail },
      });
      const existingTeacher = await Teacher.findOne({
        email: { $regex: regexEmail },
      });
      const existingStudent = await Student.findOne({
        email: { $regex: regexEmail },
        _id: { $ne: history.documentId },
      });

      if (
        updatedData.email &&
        (existingTeacher || existingAdmin || existingWorker || existingStudent)
      ) {
        return res.status(409).json({ key: "email-already-exist" });
      }

      const fin = updatedData?.fin ? updatedData.fin.toUpperCase() : "";

      if (fin) {
        const existingStudent = await Student.findOne({
          fin,
          _id: { $ne: history.documentId },
          deleted: false,
        });

        if (existingStudent) {
          return res.status(409).json({
            key: "existing-student-fin",
            message: "student is available in this fin code",
          });
        }
      }

      if (updatedData.password && updatedData.password.length > 5) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updatedData.password, salt);
        updatedData = { ...updatedData, password: hashedPassword };
      } else {
        delete updatedData.password;
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        history.newData._id,
        updatedData,
        {
          new: true,
        }
      );

      if (!updatedStudent) {
        return res.status(404).json({ key: "student-not-found" });
      }
    }

    history.status = status;
    history.recipient = currentUser;

    await history.save();

    return res.status(200).json(history);
  } catch (error) {
    console.error("Error updating history entry:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
