const mongoose = require("mongoose");

const BillsplitSchema = mongoose.Schema(
  {
    amount: Number,
    members: Array,
    purpose: String,
    dividedAmount: Number,
    userId: String,
    transactionId: String,
    loanId: String,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("billsplits", BillsplitSchema);
