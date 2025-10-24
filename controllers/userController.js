import { Admin } from "../models/adminModel.js";
import { Student } from "../models/studentModel.js";

export const getCurrentUser = async (userId, role) => {
  try {
    let currentUser;

    if (role === "super-admin" || role === "admin") {
      currentUser = await Admin.findById(userId);
    } else if (role === "student") {
      currentUser = await Student.findById(userId);
    }

    currentUser = currentUser
      ? {
          _id: currentUser._id,
          fullName: currentUser?.fullName || "",
          email: currentUser?.email || "",
          role: currentUser?.role || "",
          phone: currentUser?.phone || "",
          fin: currentUser?.fin || "",
          position: currentUser?.position || "",
          profiles: currentUser?.profiles || [],
        }
      : null;

    return currentUser;
  } catch (err) {
    console.log(err);
    return null;
  }
};
