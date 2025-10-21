import { WhereComing } from "../models/whereComingModel.js";
import { Worker } from "../models/workerModel.js";

// Get whereComing
export const getAllWhereComing = async (req, res) => {
  try {
    const whereComing = await WhereComing.find();

    res.status(200).json(whereComing);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getActiveWhereComing = async (req, res) => {
  try {
    const whereComing = await WhereComing.find({ isActive: true });

    res.status(200).json(whereComing);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Create whereComing
export const createWhereComing = async (req, res) => {
  try {
    const newData = new WhereComing(req.body);
    await newData.save();

    // getLogger("courses").info({
    //   message: "INFO: New course created",
    //   data: req.body,
    //   user: currentUser,
    //   status: 201,
    //   method: "POST",
    // });

    res.status(201).json(newData);
  } catch (err) {
    // getLogger("courses").error({
    //   message: `ERROR: ${err.message}`,
    //   user: currentUser,
    //   payload: req.body,
    //   status: 500,
    //   method: "POST",
    // });
    res.status(500).json({ error: err.message });
  }
};

// Update whereComing
export const updateWhereComing = async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user;
  let updatedData = req.body;
  try {
    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "whereHeard"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;

        updatedData = { changes: updatedData };
      }
    }

    const updatedWhereComing = await WhereComing.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
      }
    );

    if (!updatedWhereComing) {
      return res.status(404).json({ message: "whereComing not found" });
    }

    // getLogger("courses").info({
    //   message: "INFO: Course updated",
    //   oldData: oldCourse.toObject(),
    //   updatedData: updatedCourse.toObject(),
    //   user: currentUser,
    //   status: 200,
    //   method: "PATCH",
    // });

    res.status(200).json(updatedWhereComing);
  } catch (err) {
    console.log(err);
    // getLogger("courses").error({
    //   message: `ERROR: ${err.message}`,
    //   user: currentUser,
    //   payload: req.body,
    //   status: 500,
    //   method: "PATCH",
    // });

    res.status(500).json({ message: { error: err.message } });
  }
};
