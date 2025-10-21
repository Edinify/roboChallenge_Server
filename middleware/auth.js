import jwt from "jsonwebtoken";
import { Admin } from "../models/adminModel.js";
import { Teacher } from "../models/teacherModel.js";
import { Student } from "../models/studentModel.js";
import { Worker } from "../models/workerModel.js";
import { Visitor } from "../models/visitorModel.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.sendStatus(401);
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      let existingUser;

      switch (decoded.role) {
        case "super-admin":
          existingUser = await Admin.findById(decoded.id);
          break;
        case "worker":
          existingUser = await Worker.findById(decoded.id);
          break;
        case "teacher":
          existingUser = await Teacher.findOne({
            _id: decoded.id,
            deleted: false,
          });
          break;
        case "student":
          existingUser = await Student.findOne({
            _id: decoded.id,
            deleted: false,
          });
          break;
        case "visitor":
          existingUser = await Visitor.findOne({
            _id: decoded.id,
          });
          break;
        default:
          return res.status(401).json({ message: "Invalid role" });
      }

      if (!existingUser) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: "Authorization header is missing" });
  }
};

// Check super admin role
export const checkSuperAdmin = async (req, res, next) => {
  if (req.user.role !== "super-admin") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};

// Check admin role
export const checkAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};

// Check admin and super admin
export const checkAdminAndSuperAdmin = async (req, res, next) => {
  console.log("checkAdminAndSuperAdmin");
  if (req.user.role !== "admin" && req.user.role !== "super-admin") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};

// Check teacher
export const checkTeacher = async (req, res, next) => {
  console.log("checkTeacher");
  if (req.user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "You don't have permission to access this resource" });
  }
  next();
};
