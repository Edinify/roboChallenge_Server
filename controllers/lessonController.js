import { Lesson } from "../models/lessonModel.js";
import { calcDate } from "../calculate/calculateDate.js";
import { Syllabus } from "../models/syllabusModel.js";
import { Worker } from "../models/workerModel.js";
import { Student } from "../models/studentModel.js";
import moment from "moment-timezone";
import getLogger from "../config/logger.js";
import { getCurrentUser } from "./userController.js";

// Create lesson
export const createLesson = async (req, res) => {
  const { date } = req.body;
  const day = new Date(date).getDay();
  const { id: userId, role } = req.user;
  const currentUser = await getCurrentUser(userId, role);

  try {
    const newLesson = new Lesson({
      ...req.body,
      day: day == 0 ? 7 : day,
    });

    await newLesson.save();

    console.log(newLesson);

    const lesson = await Lesson.findById(newLesson._id)
      .populate("teacher mentor")
      .populate({ path: "students.student", select: "-groups" })
      .populate({
        path: "group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    const lessonLogData = {
      _id: lesson._id,
      date: lesson?.date || "",
      day: lesson?.day || "",
      startTime: lesson?.startTime || "",
      endTime: lesson?.endTime || "",
      group: {
        _id: lesson?.group?._id || "",
        name: lesson?.group?.name || "",
      },
      teacher: {
        _id: lesson?.teacher?._id || "",
        name: lesson?.teacher?.fullName || "",
      },
      mentor: {
        _id: lesson?.mentor?._id || "",
        name: lesson?.mentor?.fullName || "",
      },
      topic: lesson?.topic || "",
      status: lesson?.status || "",
      isEduConfirmed: lesson?.isEduConfirmed || "",
    };

    getLogger("lessons").info({
      message: "INFO: New lessons created",
      data: lessonLogData,
      user: currentUser,
      status: 201,
      method: "POST",
    });

    res.status(201).json(lesson);
  } catch (err) {
    console.log(err);
    getLogger("lessons").error({
      message: `ERROR: ${err.message}`,
      user: currentUser,
      payload: req.body,
      status: 500,
      method: "POST",
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create lessons
export const createLessons = async (group) => {
  const {
    startDate,
    endDate,
    lessonDate,
    _id,
    course,
    students,
    teachers,
    mentors,
    status,
  } = group;

  console.log(startDate);
  console.log(new Date(startDate));
  try {
    if (
      !startDate ||
      !endDate ||
      lessonDate.length == 0 ||
      status === "waiting"
    )
      return true;

    const checkLessons = await Lesson.findOne({ group: _id });

    if (checkLessons) return true;

    const syllabus = await Syllabus.find({ courseId: course }).sort({
      orderNumber: 1,
    });
    let syllabusIndex = 0;
    const lessons = [];

    let currentStartDate = moment
      .tz(startDate, "UTC")
      .tz("Asia/Baku")
      .startOf("day");
    const endMoment = moment.tz(endDate, "UTC").tz("Asia/Baku").endOf("day");

    while (currentStartDate.isSameOrBefore(endMoment)) {
      // const currentDay = startDate.getDay() > 0 ? startDate.getDay() : 7;
      const currentDay =
        currentStartDate.day() > 0 ? currentStartDate.day() : 7;
      const checkDay = lessonDate?.find((item) => item.day === currentDay);

      if (checkDay) {
        // const currentDate = new Date(startDate);
        const currentDate = currentStartDate.toDate();
        const studentsObj = students.map((student) => ({
          student,
        }));
        let newLesson;

        if (checkDay?.practical) {
          newLesson = {
            group: _id,
            course: course,
            date: currentDate,
            day: checkDay.day,
            startTime: checkDay.startTime,
            endTime: checkDay.endTime,
            students: studentsObj,
            teacher: teachers[0],
            mentor: mentors[0],
            topic: {
              name: "Praktika",
            },
          };
        } else {
          newLesson = {
            group: _id,
            course: course,
            date: currentDate,
            day: checkDay.day,
            startTime: checkDay.startTime,
            endTime: checkDay.endTime,
            students: studentsObj,
            teacher: teachers[0],
            mentor: mentors[0],
            topic: syllabus[syllabusIndex],
          };
          syllabusIndex++;
        }

        lessons.push(newLesson);
      }

      // startDate.setDate(startDate.getDate() + 1);
      currentStartDate.add(1, "day");
    }

    const result = await Lesson.insertMany(lessons);

    return true;
  } catch (err) {
    console.log(err.message);
    return false;
  }
};

export const getLessons = async (req, res) => {
  const { length, groupId, startDate, endDate, status, teacherId } = req.query;
  const limit = 20;

  try {
    const filterObj = {
      group: groupId,
    };

    if (startDate && endDate) {
      const targetDate = calcDate(null, startDate, endDate);

      filterObj.date = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }

    if (
      status === "unviewed" ||
      status === "confirmed" ||
      status === "cancelled"
    ) {
      filterObj.status = status;
    }

    if (teacherId) filterObj.teacher = teacherId;

    const confirmedCount = await Lesson.countDocuments({
      group: groupId,
      status: "confirmed",
      isEduConfirmed: true,
    });
    const cancelledCount = await Lesson.countDocuments({
      group: groupId,
      status: "cancelled",
      isEduConfirmed: true,
    });
    const unviewedCount = await Lesson.countDocuments({
      group: groupId,
      isEduConfirmed: { $ne: true },
    });

    const totalLength = await Lesson.countDocuments({
      ...filterObj,
    });

    const skip = length || 0;

    const lessons = await Lesson.find(filterObj)
      .skip(skip)
      .limit(limit)
      .sort({ date: 1 })
      .populate("teacher mentor")
      .populate({ path: "students.student", select: "-groups" })
      .populate({
        path: "group",
        populate: {
          path: "course",
          model: "Course",
        },
      });

    res.status(200).json({
      lessons,
      confirmedCount,
      cancelledCount,
      unviewedCount,
      totalLength,
    });
  } catch (err) {
    console.log(err, "lesson error");
    res.status(500).json({ message: { error: err.message } });
  }
};

// const startDate = new Date("2023-1-1");
// const endDate = new Date("2023-12-31");
// startDate.setHours(16);
// endDate.setHours(16);

// const fakeGroup = {
//   _id: "657d9fdaa26257b6c52e8730",
//   course: "657da00da26257b6c52e873a",
//   students: [
//     { student: "658124cdc2a2bbccf7fd4083" },
//     { student: "65812502c2a2bbccf7fd4089" },
//     { student: "658124e4c2a2bbccf7fd4086" },
//   ],
//   startDate: startDate,
//   endDate: endDate,
//   lessonDate: [
//     {
//       day: 1,
//       time: "11:00",
//     },
//     {
//       day: 2,
//       time: "14:00",
//     },
//     {
//       day: 3,
//       time: "18:00",
//     },
//     {
//       day: 5,
//       time: "20:00",
//     },
//   ],
// };

// createLessons(fakeGroup);

// const lessonDate = [
//   {
//     day: 1,
//   },
//   {
//     day: 2,
//   },
//   {
//     day: 3,
//   },
//   {
//     day: 5,
//   },
// ];

// const startDate = new Date("2023-8-25");
// const endDate = new Date("2023-12-12");

// startDate.setHours(16);
// endDate.setHours(16);

// const dates = [];

// while (startDate <= endDate) {
//   const currentDay = startDate.getDay();
//   const checkDay = lessonDate.find((item) => item.day === currentDay);

//   if (checkDay) {
//     const currentDate = new Date(startDate);

//     dates.push(currentDate);
//   }

//   startDate.setDate(startDate.getDate() + 1);
// }

// Update lesson
export const updateLesson = async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  const currentUser = await getCurrentUser(userId, role);

  try {
    if (date) {
      const day = moment.tz(date, "Asia/Baku").day();
      updatedData.day = day == 0 ? 7 : day;
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "lessonTable"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;
        const mainLesson = await Lesson.findById(id);
        const mainLessonObj = mainLesson?.toObject();
        const changes = { ...mainLessonObj?.changes };
        delete mainLessonObj.changes;

        const changesObj = { ...mainLessonObj, ...changes, ...updatedData };

        const payload = new Lesson(changesObj);
        await payload.populate("teacher students.student group mentor");

        updatedData = {
          changes: payload.toObject(),
        };
      }
    }

    if (role === "teacher") {
      const targetLesson = await Lesson.findById(id).populate(
        "teacher students.student group mentor"
      );

      if (targetLesson.isEduConfirmed)
        return res.status(409).json({
          key: "already-lesson-confirmed",
          message: "Already lesson confirmed by edu",
        });
    }

    const oldLesson = await Lesson.findById(id).populate(
      "teacher group mentor"
    );
    const updatedLesson = await Lesson.findByIdAndUpdate(id, updatedData, {
      new: true,
    }).populate("teacher students.student group mentor");

    const confirmedCount = await Lesson.countDocuments({
      group: updatedLesson.group._id,
      status: "confirmed",
      isEduConfirmed: true,
    });
    const cancelledCount = await Lesson.countDocuments({
      group: updatedLesson.group._id,
      status: "cancelled",
      isEduConfirmed: true,
    });
    const unviewedCount = await Lesson.countDocuments({
      group: updatedLesson.group._id,
      isEduConfirmed: { $ne: true },
    });

    if (!updatedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    getLogger("lessons").info({
      message: "INFO: Lesson updated",
      oldData: {
        _id: oldLesson._id,
        date: oldLesson?.date || "",
        day: oldLesson?.day || "",
        startTime: oldLesson?.startTime || "",
        endTime: oldLesson?.endTime || "",
        group: {
          _id: oldLesson?.group?._id || "",
          name: oldLesson?.group?.name || "",
        },
        teacher: {
          _id: oldLesson?.teacher?._id || "",
          name: oldLesson?.teacher?.fullName || "",
        },
        mentor: {
          _id: oldLesson?.mentor?._id || "",
          name: oldLesson?.mentor?.fullName || "",
        },
        topic: oldLesson?.topic || "",
        status: oldLesson?.status || "",
        isEduConfirmed: oldLesson?.isEduConfirmed || "",
      },
      updatedData: {
        _id: updatedLesson._id,
        date: updatedLesson?.date || "",
        day: updatedLesson?.day || "",
        startTime: updatedLesson?.startTime || "",
        endTime: updatedLesson?.endTime || "",
        group: {
          _id: updatedLesson?.group?._id || "",
          name: updatedLesson?.group?.name || "",
        },
        teacher: {
          _id: updatedLesson?.teacher?._id || "",
          name: updatedLesson?.teacher?.fullName || "",
        },
        mentor: {
          _id: updatedLesson?.mentor?._id || "",
          name: updatedLesson?.mentor?.fullName || "",
        },
        topic: updatedLesson?.topic || "",
        status: updatedLesson?.status || "",
        isEduConfirmed: updatedLesson?.isEduConfirmed || "",
      },
      user: currentUser,
      status: 200,
      method: "PATCH",
    });

    res.status(200).json({
      lesson: updatedLesson,
      confirmedCount,
      cancelledCount,
      unviewedCount,
    });
  } catch (err) {
    console.log(err);
    getLogger("lessons").error({
      message: `ERROR: ${err.message}`,
      user: currentUser,
      payload: req.body,
      status: 500,
      method: "PATCH",
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;
  const currentUser = await getCurrentUser(userId, role);

  try {
    const lesson = await Lesson.findById(id).populate("teacher group mentor");
    const deletedLesson = await Lesson.findByIdAndDelete(id);

    if (!deletedLesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const groupId = deletedLesson.group;

    const confirmedCount = await Lesson.countDocuments({
      group: groupId,
      status: "confirmed",
      isEduConfirmed: true,
    });
    const cancelledCount = await Lesson.countDocuments({
      group: groupId,
      status: "cancelled",
      isEduConfirmed: true,
    });
    const unviewedCount = await Lesson.countDocuments({
      group: groupId,
      isEduConfirmed: { $ne: true },
    });

    getLogger("lessons").info({
      message: "INFO: Lesson deleted",
      deletedData: {
        _id: lesson._id,
        date: lesson?.date || "",
        day: lesson?.day || "",
        startTime: lesson?.startTime || "",
        endTime: lesson?.endTime || "",
        group: {
          _id: lesson?.group?._id || "",
          name: lesson?.group?.name || "",
        },
        teacher: {
          _id: lesson?.teacher?._id || "",
          name: lesson?.teacher?.fullName || "",
        },
        mentor: {
          _id: lesson?.mentor?._id || "",
          name: lesson?.mentor?.fullName || "",
        },
        topic: lesson?.topic || "",
        status: lesson?.status || "",
        isEduConfirmed: lesson?.isEduConfirmed || "",
      },
      user: currentUser,
      status: 200,
      method: "DELETE",
    });

    res
      .status(200)
      .json({ deletedLesson, confirmedCount, cancelledCount, unviewedCount });
  } catch (err) {
    getLogger("lessons").error({
      message: `ERROR: ${err.message}`,
      user: currentUser,
      deletedData: { id },
      status: 500,
      method: "DELETE",
    });
    res.status(500).json({ message: { error: err.message } });
  }
};

// Confirm lesson changes
export const confirmLessonChanges = async (req, res) => {
  const { id } = req.params;
  const { changes } = req.body;

  try {
    const lesson = await Lesson.findByIdAndUpdate(
      id,
      { ...changes, changes: {} },
      { new: true }
    ).populate("teacher students.student group mentor");

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.status(200).json(lesson);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Cancel lesson changes
export const cancelLessonChanges = async (req, res) => {
  const { id } = req.params;

  try {
    const lesson = await Lesson.findByIdAndUpdate(
      id,
      { changes: {} },
      { new: true }
    ).populate("teacher students.student group mentor");

    res.status(200).json(lesson);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};
