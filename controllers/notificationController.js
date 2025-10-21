import { calcDate } from "../calculate/calculateDate.js";
import { Admin } from "../models/adminModel.js";
import { Notification } from "../models/notificationModel.js";
import { Teacher } from "../models/teacherModel.js";
import { Worker } from "../models/workerModel.js";

// Create notifications

export const createEventNotifications = async (
  event,
  type = "created-event"
) => {
  try {
    const workers = await Worker.find();
    const admins = await Admin.find();
    const teachers = await Teacher.find({ deleted: false });

    const workersIds = workers.map((worker) => worker._id);
    const adminsIds = admins.map((admin) => admin._id);
    const teachersIds = teachers.map((teacher) => teacher._id);

    const recipientsIds = workersIds.concat(adminsIds);

    const newNotifications = recipientsIds.map((recipient) => {
      return {
        title: "event",
        event: event._id,
        recipient,
        type,
        category: "event",
      };
    });

    await Notification.insertMany(newNotifications);

    return true;
  } catch (error) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const createHistoryNotifications = async (history, type) => {
  try {
    const workers = await Worker.find();
    const admins = await Admin.find();

    const workersIds = [];
    const adminsIds = admins.map((admin) => admin._id);

    workers.forEach((worker) => {
      const power = worker.profiles.find(
        (item) =>
          item.profile === "students" ||
          item.profile === "tuitionFee" ||
          item.profile === "groups"
      );

      if (power) {
        workersIds.push(worker._id);
      }
    });

    const recipientsIds = workersIds.concat(adminsIds);

    const newNotifications = recipientsIds.map((recipient) => {
      return {
        title: "updates",
        history: history._id,
        recipient,
        category: history.modelName,
        type,
      };
    });

    await Notification.insertMany(newNotifications);

    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

// Get notifications
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, category } = req.query;
  try {
    const filterObj = { recipient: userId };

    if (startDate && endDate) {
      const targetDate = calcDate(null, startDate, endDate);
      filterObj.createdAt = {
        $gte: targetDate.startDate,
        $lte: targetDate.endDate,
      };
    }

    if (category) {
      filterObj.category = category;
    }

    const notifications = await Notification.find(filterObj)
      .populate("history event")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getNewNotificationsCount = async (req, res) => {
  const userId = req.user.id;
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isView: false,
    });

    res.status(200).json(count);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Viewed notifications

export const viewNotifications = async (req, res) => {
  const { id } = req.user;
  try {
    await Notification.updateMany(
      {
        recipient: id,
        isView: false,
      },
      {
        isView: true,
      }
    );

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.log({ message: { error: err.message } });
    return false;
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    // await Notification.findByIdAndUpdate(id, {});

    return true;
  } catch (err) {
    console.log({ message: { error: err.message } });
    return false;
  }
};
