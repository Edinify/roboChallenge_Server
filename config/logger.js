import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "../logs");

const createLogger = (panel) => {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({
        filename: path.join(logDir, `${panel}.log`),
        maxFiles: 1,
      }),
    ],
  });
};

const loggers = {
  consultation: createLogger("consultation"),
  leads: createLogger("leads"),
  students: createLogger("students"),
  teachers: createLogger("teachers"),
  workers: createLogger("workers"),
  tuitionFee: createLogger("tuitionFee"),
  syllabus: createLogger("syllabus"),
  lessons: createLogger("lessons"),
  courses: createLogger("courses"),
  career: createLogger("career"),
  rooms: createLogger("rooms"),
  diploma: createLogger("diploma"),
  events: createLogger("events"),
  groups: createLogger("groups"),
};

const getLogger = (panel) => {
  if (loggers[panel] === undefined) {
    console.log("Logger not found for panel: ", panel);
    return;
  }

  return loggers[panel];
};

export default getLogger;
