import mongoose from "mongoose";

const Schema = mongoose.Schema;

const consultationSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
    },
    contactDate: {
      type: Date,
      required: true,
    },
    constDate: {
      type: Date,
    },
    salesDate: {
      type: Date,
      required: function () {
        return this.status === "sold";
      },
    },
    constTime: {
      type: String,
    },
    studentName: {
      type: String,
      required: function () {
        return this.status === "sold";
      },
    },
    fin: {
      type: String,
      required: function () {
        return this.status === "sold";
      },
    },
    studentPhone: {
      type: String,
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.status === "sold";
      },
      ref: "Course",
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    worker: {
      type: Object,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    whereComing: {
      type: Schema.Types.ObjectId,
      ref: "WhereComing",
    },
    knowledge: {
      type: String,
    },
    addInfo: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "new-lead",
        "appointed",
        "sold",
        "cancelled",
        "thinks",
        "not-open-call",
        "call-missing",
        "whatsapp_info",
      ],
      default: "new-lead",
    },
    cancelReason: {
      type: String,
    },
    changes: {
      type: Object,
    },
  },
  { timestamps: true }
);

consultationSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.fin) {
    update.fin = update.fin.toUpperCase();
  }
  next();
});

consultationSchema.index({ contactDate: 1 });

export const Consultation = mongoose.model("Consultation", consultationSchema);
