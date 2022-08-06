const mongoose = require("mongoose");

const LoanSchema = mongoose.Schema(
  {
    name: String,
    amount: Number,
    loanDate: Date,
    loanReturningDate: Date,
    amountPerMonth: Number,
    userId: String,
    type: String,
    billSplitId: String,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Loans", LoanSchema);
