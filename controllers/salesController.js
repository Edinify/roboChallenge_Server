import mongoose from "mongoose";
import { calcDate, calcDateWithMonthly } from "../calculate/calculateDate.js";
import { Consultation } from "../models/consultationModel.js";

export const getChartData = async (req, res) => {
  const { monthCount, startDate, endDate, courseId } = req.query;

  try {
    let targetDate;
    let chartData = {};
    let filterObj = {};

    if (courseId) {
      filterObj.course = new mongoose.Types.ObjectId(courseId);
    }

    if (monthCount) {
      targetDate = calcDate(monthCount);
    } else if (startDate && endDate) {
      targetDate = calcDateWithMonthly(startDate, endDate);
    }

    if (monthCount == 1 || (startDate && startDate === endDate)) {
      chartData = await getChartDataOneMonth(targetDate, filterObj);
    } else {
      chartData = await getChartDataManyMonth(targetDate, filterObj);
    }

    res.status(200).json(chartData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

async function getChartDataOneMonth(targetDate, filterObj) {
  const result = {
    series: [
      {
        name: "Lead",
        data: [],
      },
      // {
      //   name: "Planlanan",
      //   data: [],
      // },
      // {
      //   name: "Konsultasiya",
      //   data: [],
      // },
      {
        name: "Satış",
        data: [],
      },
    ],

    categories: [],
  };

  // const plansCountList = await Consultation.aggregate([
  //   {
  //     $match: {
  //       ...filterObj,
  //       contactDate: {
  //         $gte: targetDate.startDate,
  //         $lte: targetDate.endDate,
  //       },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: { $dateToString: { format: "%d", date: "$contactDate" } },
  //       total: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $sort: { _id: 1 },
  //   },
  // ]);

  // const consultationsCountList = await Consultation.aggregate([
  //   {
  //     $match: {
  //       constDate: {
  //         $gte: targetDate.startDate,
  //         $lte: targetDate.endDate,
  //       },
  //       status: { $in: ["sold", "cancelled", "thinks"] },
  //       ...filterObj,
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         $dateToString: { format: "%d", date: "$constDate" },
  //       },
  //       total: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $sort: { _id: 1 },
  //   },
  // ]);

  const salesCountList = await Consultation.aggregate([
    {
      $match: {
        salesDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        status: "sold",
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%d", date: "$salesDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const leadCountList = await Consultation.aggregate([
    {
      $match: {
        contactDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        ...filterObj,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%d", date: "$contactDate" } },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const currentDate = new Date(targetDate.startDate);

  while (currentDate < targetDate.endDate) {
    const currentDay = currentDate.getDate();

    const currLeadCount = leadCountList.find((item) => item._id == currentDay);
    // const currPlanCount = plansCountList.find((item) => item._id == currentDay);
    // const currConsultationCount = consultationsCountList.find(
    //   (item) => item._id == currentDay
    // );
    const currSaleCount = salesCountList.find((item) => item._id == currentDay);

    if (currLeadCount) {
      result.series[0].data.push(currLeadCount.total);
    } else {
      result.series[0].data.push(0);
    }

    // if (currPlanCount) {
    //   result.series[1].data.push(currPlanCount.total);
    // } else {
    //   result.series[1].data.push(0);
    // }

    // if (currConsultationCount) {
    //   result.series[2].data.push(currConsultationCount.total);
    // } else {
    //   result.series[2].data.push(0);
    // }

    if (currSaleCount) {
      result.series[1].data.push(currSaleCount.total);
    } else {
      result.series[1].data.push(0);
    }

    result.categories.push(currentDay);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

async function getChartDataManyMonth(targetDate, filterObj) {
  const result = {
    series: [
      {
        name: "Lead",
        data: [],
      },
      // {
      //   name: "Planlanan",
      //   data: [],
      // },
      // {
      //   name: "Konsultasiya",
      //   data: [],
      // },
      {
        name: "Satış",
        data: [],
      },
    ],

    categories: [],
  };

  const months = [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "Iyn",
    "Iyn",
    "Avq",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ];
  // const plansCountList = await Consultation.aggregate([
  //   {
  //     $match: {
  //       contactDate: {
  //         $gte: targetDate.startDate,
  //         $lte: targetDate.endDate,
  //       },
  //       status: "appointed",
  //       ...filterObj,
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         year: { $year: "$contactDate" },
  //         month: { $month: "$contactDate" },
  //       },
  //       total: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $sort: { "_id.year": 1, "_id.month": 1 },
  //   },
  // ]);

  // const consultationsCountList = await Consultation.aggregate([
  //   {
  //     $match: {
  //       constDate: {
  //         $gte: targetDate.startDate,
  //         $lte: targetDate.endDate,
  //       },
  //       status: { $ne: "appointed" },
  //       ...filterObj,
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         year: { $year: "$constDate" },
  //         month: { $month: "$constDate" },
  //       },
  //       total: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $sort: { "_id.year": 1, "_id.month": 1 },
  //   },
  // ]);

  const salesCountList = await Consultation.aggregate([
    {
      $match: {
        salesDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        status: "sold",
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$salesDate" },
          month: { $month: "$salesDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const leadCountList = await Consultation.aggregate([
    {
      $match: {
        contactDate: {
          $gte: targetDate.startDate,
          $lte: targetDate.endDate,
        },
        ...filterObj,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$contactDate" },
          month: { $month: "$contactDate" },
        },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  const currentDate = new Date(targetDate.startDate);

  while (currentDate < targetDate.endDate) {
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currLeadCount = leadCountList.find(
      (item) => item._id.year == currentYear && item._id.month == currentMonth
    );

    // const currPlanCount = plansCountList.find(
    //   (item) => item._id.year == currentYear && item._id.month == currentMonth
    // );

    // const currConsultationCount = consultationsCountList.find(
    //   (item) => item._id.year == currentYear && item._id.month == currentMonth
    // );

    const currSaleCount = salesCountList.find(
      (item) => item._id.year == currentYear && item._id.month == currentMonth
    );

    if (currLeadCount) {
      result.series[0].data.push(currLeadCount.total);
    } else {
      result.series[0].data.push(0);
    }

    // if (currPlanCount) {
    //   result.series[1].data.push(currPlanCount.total);
    // } else {
    //   result.series[1].data.push(0);
    // }

    // if (currConsultationCount) {
    //   result.series[2].data.push(currConsultationCount.total);
    // } else {
    //   result.series[2].data.push(0);
    // }

    if (currSaleCount) {
      result.series[1].data.push(currSaleCount.total);
    } else {
      result.series[1].data.push(0);
    }

    result.categories.push(`${currentYear}, ${months[currentMonth - 1]}`);

    currentDate.setMonth(currentMonth);
  }

  return result;
}
