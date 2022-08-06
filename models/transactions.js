const mongoose = require("mongoose");

const TransactionsSchema = mongoose.Schema(
  {
    amount: Number,
    description: String,
    date: Date,
    userId: String,
    type:String,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Transactions", TransactionsSchema);
