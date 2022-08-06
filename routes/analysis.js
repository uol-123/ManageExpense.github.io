const router = require("express").Router();
const TransactionModel = require("../models/transactions");

//
router.get("/", async (req, res) => {
  let aggregates = await TransactionModel.aggregate([
    {
      $match: { userId: req.session.user._id, amount: { $lt: 0 } },
    },
    {
      $group: {
        _id: "$date",
        amount: { $sum: { $multiply: ["$amount", -1] } },
      },
    },
    {
      $group: {
        _id: null,
        min: { $min: "$amount" },
        max: { $max: "$amount" },
        totalExpenses: { $sum: "$amount" },
      },
    },
  ]);

  let total = await TransactionModel.aggregate([
    {
      $match: { userId: req.session.user._id },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  aggregates = aggregates[0]
    ? aggregates[0]
    : { min: 0, max: 0, totalExpenses: 0 };
  let amountLeft = total[0] ? total[0].total : 0;
  let expenses = aggregates.totalExpenses;
  total = amountLeft + expenses;

  const expensePercentage = Math.round((expenses / total) * 100);

  let bestDays = await TransactionModel.aggregate([
    {
      $match: { userId: req.session.user._id, amount: { $lt: 0 } },
    },
    {
      $group: {
        _id: "$date",
        amount: { $sum: { $multiply: ["$amount", -1] } },
      },
    },
    {
      $match: { amount: aggregates.min },
    },
  ]);

  let worstDays = await TransactionModel.aggregate([
    {
      $match: { userId: req.session.user._id, amount: { $lt: 0 } },
    },
    {
      $group: {
        _id: "$date",
        amount: { $sum: { $multiply: ["$amount", -1] } },
      },
    },
    {
      $match: { amount: aggregates.max },
    },
  ]);

  bestDays = bestDays.map((day) => day._id);
  worstDays = worstDays.map((day) => day._id);

  const analysis = {
    total,
    amountLeft,
    expenses,
    minExpense: { amount: aggregates.min, days: bestDays },
    maxExpense: { amount: aggregates.max, days: worstDays },
    expensePercentage: expensePercentage ? expensePercentage : 0,
  };

  res.render("analysis", {
    analysis,
  });
});

module.exports = router;
