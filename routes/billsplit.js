const router = require("express").Router();
const BillsplitModel = require("../models/billsplit");
const TransactionModal = require("../models/transactions");
const LoanModel = require("../models/loan");

// validate function

const validate = (input, value) => {
  let err = null;
  try {
    switch (input) {
      case "purpose":
        if (value == "") {
          err = "required!";
        } else if (value.length > 1000) {
          err = "must not exceed 1000 characters!";
        }
        break;

      case "member":
        if (value == "") {
          err = "required!";
        } else if (value.length > 100) {
          err = "must not exceed 100 characters!";
        } else if (!/^[a-zA-Z-' ]*$/.test(value)) {
          err = "must not contain numbers or special characters!";
        }
        break;
      case "amount":
        if (value == "") {
          err = "required!";
        }
        break;
    }
  } catch (t) {}

  return err;
};

//
router.get("/", (req, res) => {
  let message = null;

  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  BillsplitModel.find({ userId: req.session.user._id }).then((billsplit) => {
    res.render("billsplit", {
      message,
      billsplit,
    });
  });
});

// add routes
router.get("/add", async (req, res) => {
  let message = null;
  let billsplit = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;

    billsplit = await BillsplitModel.findById(req.session.billsplitId);
    delete req.session.billsplitId;
  }
  res.render("add-billsplit", {
    message,
    billsplit,
    amount: { val: "", err: "" },
    members: [
      { val: "", err: "" },
      { val: "", err: "" },
    ],
    purpose: { val: "", err: "" },
  });
});

router.post("/add", async (req, res) => {
  const { amount, purpose, members } = req.body;

  //validations
  const amountErr = validate("amount", amount);
  const purposeErr = validate("purpose", purpose.trim());
  let membersErr = false;

  members.forEach(function (member, i) {
    if (validate("member", member)) {
      membersErr = true;
    }
    members[i] = { val: member, err: validate("member", member) };
  });

  if (amountErr || purposeErr || membersErr) {
    res.render("add-billsplit", {
      message: null,
      billsplit: null,
      amount: { val: amount, err: amountErr },
      purpose: { val: purpose, err: purposeErr },
      members,
    });
    return;
  }

  const transaction = new TransactionModal({
    amount: amount * -1,
    description: purpose,
    date: new Date(),
    userId: req.session.user._id,
    type: "Bill Split",
  });
  transaction
    .save()
    .then((data) => {
      const billsplit = new BillsplitModel({
        amount,
        purpose,
        members: members.map((member) => member.val),
        dividedAmount: (amount / members.length).toFixed(2),
        userId: req.session.user._id,
        transactionId: data._id,
      });
      billsplit
        .save()
        .then((data) => {
          LoanModel.insertMany(
            members.map((member) => {
              return {
                name: member.val,
                amount: (amount / members.length).toFixed(2),
                loanDate: new Date(),
                amountPerMonth: "",
                userId: req.session.user._id,
                type: "get back",
                billSplitId: data._id,
              };
            })
          ).then((loans) => {
            req.session.message = {
              text: "your bill split is successful.",
              type: "success",
            };
            req.session.billsplitId = data._id;
            res.redirect("/billsplit/add/");
            return;
          });
        })
        .catch((e) => {
          console.log(e);
          res.send("error while processing data!");
        });
    })
    .catch((e) => {
      console.log(e);
      res.send("error while processing data!");
    });
});

// update route

router.get("/edit/:id", (req, res) => {
  let message = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  BillsplitModel.findById(req.params.id)
    .then((billsplit) => {
      res.render("edit-billsplit", {
        message,
        billsplit,
        amount: { val: billsplit.amount, err: "" },
        purpose: { val: billsplit.purpose, err: "" },
        members: billsplit.members.map((member) => {
          return { val: member, err: "" };
        }),
      });
    })
    .catch((error) => {
      res.send("error processing request!");
    });
});

router.post("/edit/:id", (req, res) => {
  const { amount, purpose, members } = req.body;

  //validations
  const amountErr = validate("amount", amount);
  const purposeErr = validate("purpose", purpose.trim());
  let membersErr = false;

  members.forEach(function (member, i) {
    if (validate("member", member)) {
      membersErr = true;
    }
    members[i] = { val: member, err: validate("member", member) };
  });
  BillsplitModel.findById(req.params.id)
    .then((billsplit) => {
      if (amountErr || purposeErr || membersErr) {
        res.render("edit-billsplit", {
          message: null,
          billsplit: billsplit,
          amount: { val: amount, err: amountErr },
          purpose: { val: purpose, err: purposeErr },
          members,
        });
        return;
      }

      TransactionModal.findByIdAndUpdate(billsplit.transactionId, {
        amount: amount * -1,
        description: purpose,
      }).then(() => {
        BillsplitModel.findByIdAndUpdate(billsplit._id, {
          amount,
          purpose,
          members: members.map((member) => member.val),
          dividedAmount: (amount / members.length).toFixed(2),
        })
          .then((data) => {
            LoanModel.deleteMany({ billSplitId: billsplit._id }).then(
              (loans) => {
                LoanModel.insertMany(
                  members.map((member) => {
                    return {
                      name: member.val,
                      amount: (amount / members.length).toFixed(2),
                      loanDate: billsplit.createdAt,
                      amountPerMonth: "",
                      userId: req.session.user._id,
                      type: "get back",
                      billSplitId: data._id,
                    };
                  })
                ).then((loans) => {
                  req.session.message = {
                    text: "bill split update is successful.",
                    type: "success",
                  };
                  res.redirect("/billsplit/edit/" + billsplit._id);

                  return;
                });
              }
            );
          })
          .catch((e) => {
            console.log(e);
            res.send("error processing data!");
          });
      });
    })
    .catch((error) => {
      res.send("error processing request!");
    });
});

// delete route
router.get("/delete/:id", (req, res) => {
  BillsplitModel.findByIdAndDelete(req.params.id)
    .then((billsplit) => {
      req.session.message = {
        text: "billsplit has been deleted!",
        type: "success",
      };

      TransactionModal.findByIdAndDelete(billsplit.transactionId).then(
        function () {
          LoanModel.deleteMany({ billSplitId: req.params.id }).then(() => {
            res.redirect("/billsplit");
          });
        }
      );
    })
    .catch((err) => {
      req.session.message = {
        text: err,
        type: "error",
      };

      res.redirect("/billsplit");
    });
});

module.exports = router;
