const router = require("express").Router();
const LoanModel = require("../models/loan");

// validate function

const validate = (input, value, value1) => {
  let err = null;
  try {
    switch (input) {
      case "name":
        if (value.length > 100) {
          err = "must not exceed 100 characters!";
        } else if (!/^[a-zA-Z-' ]*$/.test(value)) {
          err = "must not contain numbers or special characters!";
        }
        break;
      case "date":
        if (value == "") {
          err = "required!";
        }
        break;

      case "returningDate":
        if (value == "") {
          err = "required!";
        } else {
          const loanDate = new Date(value).getTime();
          const loanReturningDate = new Date(value1).getTime();

          if (loanDate > loanReturningDate) {
            err = "returning date must be greater!";
          }
        }
        break;
      case "amount":
        if (value == "") {
          err = "required!";
        } else if (value < 1) {
          err = "value must be greater than 0!";
        }
        break;

      case "type":
        if (value == "") {
          err = "required!";
        } else if (value.length > 10) {
          err = "err!";
        } else if (value != "return" && value != "get back") {
          err = "err!";
        }
        break;
    }
  } catch (t) {}

  return err;
};

// date format function

const getInputDate = (dt) => {
  const sdt = new Date(dt);
  return `${sdt.getFullYear().toString().padStart("4", 0)}-${(
    sdt.getMonth() + 1
  )
    .toString()
    .padStart("2", 0)}-${sdt.getDate().toString().padStart("2", 0)}`;
};

//
router.get("/", (req, res) => {
  let message = null;

  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  LoanModel.find({ userId: req.session.user._id, type: "return" })
    .sort([["loanDate", -1]])
    .then((loans) => {
      res.render("loan", {
        message,
        loans,
      });
    });
});

router.get("/lend", (req, res) => {
  let message = null;

  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  LoanModel.find({
    userId: req.session.user._id,
    type: { $ne: "return" },
  })
    .sort([["loanDate", -1]])
    .then((loans) => {
      res.render("loan-to-get-back", {
        message,
        loans,
      });
    });
});

// add routes
router.get("/add", async (req, res) => {
  let message = null;
  let loan = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;

    loan = await LoanModel.findById(req.session.loanId);
    delete req.session.loanId;
  }
  res.render("add-loan", {
    message,
    loan,
    name: { val: "", err: "" },
    amount: { val: "", err: "" },
    loanDate: { val: "", err: "" },
    loanReturningDate: { val: "", err: "" },
    type: { val: "", err: "" },
  });
});

router.post("/add", (req, res) => {
  const { amount, loanDate, loanReturningDate, type, name } = req.body;
  //validations
  const nameErr = validate("name", name);
  const amountErr = validate("amount", amount);
  const loanDateErr = validate("date", loanDate);
  const loanReturningDateErr = validate(
    "returningDate",
    loanDate,
    loanReturningDate
  );

  const typeErr = validate("type", type);
  if (amountErr || loanReturningDateErr || loanDateErr || typeErr || nameErr) {
    res.render("add-loan", {
      message: null,
      loan: null,
      name: { val: "", err: "" },
      amount: { val: amount, err: amountErr },
      loanDate: { val: loanDate, err: loanDateErr },
      loanReturningDate: { val: loanReturningDate, err: loanReturningDateErr },
      type: { val: type, err: typeErr },
    });
    return;
  }

  const date1 = new Date(loanDate).getTime();
  const date2 = new Date(loanReturningDate).getTime();
  const secondsInMonth = 30 * 86400000;
  const months = Math.ceil((date2 - date1) / secondsInMonth);

  const amountPerMonth = (amount / months).toFixed(2);
  const loan = new LoanModel({
    name,
    amount,
    loanDate,
    loanReturningDate,
    amountPerMonth,
    userId: req.session.user._id,
    type,
  });
  loan
    .save()
    .then((data) => {
      req.session.message = {
        text: "loan calculation is successful.",
        type: "success",
      };
      req.session.loanId = data._id;
      res.redirect("/loan/add/");

      return;
    })
    .catch((e) => {
      console.log(e);
      res.send("error while processing data!");
    });
});

// update route

router.get("/edit/:id", (req, res) => {
  let message = null;
  let loan = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  LoanModel.findById(req.params.id)
    .then((loan) => {
      res.render("edit-loan", {
        message,
        loan,
        name: { val: loan.name, err: "" },
        amount: { val: loan.amount, err: "" },
        loanDate: { val: getInputDate(loan.loanDate), err: "" },
        loanReturningDate: {
          val: getInputDate(loan.loanReturningDate),
          err: "",
        },
      });
    })
    .catch((error) => {
      res.send("error processing request!");
    });
});
router.post("/edit/:id", (req, res) => {
  const { amount, loanDate, loanReturningDate, name } = req.body;
  //validations

  const nameErr = validate("name", name);
  const amountErr = validate("amount", amount);
  const loanDateErr = validate("date", loanDate);
  const loanReturningDateErr = validate(
    "returningDate",
    loanDate,
    loanReturningDate
  );

  LoanModel.findById(req.params.id)
    .then((loan) => {
      if (amountErr || loanReturningDateErr || loanDateErr || nameErr) {
        res.render("add-loan", {
          message: null,
          loan,
          name: { val: name, err: "" },
          amount: { val: amount, err: amountErr },
          loanDate: { val: loanDate, err: loanDateErr },
          loanReturningDate: {
            val: loanReturningDate,
            err: loanReturningDateErr,
          },
        });
        return;
      }

      const date1 = new Date(loanDate).getTime();
      const date2 = new Date(loanReturningDate).getTime();
      const secondsInMonth = 30 * 86400000;
      const months = Math.ceil((date2 - date1) / secondsInMonth);

      const amountPerMonth = (amount / months).toFixed(2);
      LoanModel.findByIdAndUpdate(loan._id, {
        name,
        amount,
        loanDate,
        loanReturningDate,
        amountPerMonth,
      })
        .then((data) => {
          req.session.message = {
            text: "loan update is successful.",
            type: "success",
          };

          res.redirect("/loan/edit/" + loan._id);

          return;
        })
        .catch((e) => {
          console.log(e);
          res.send("error while processing data!");
        });
    })
    .catch((error) => {
      res.send("error processing request!");
    });
});

// delete route
router.get("/delete/:id", (req, res) => {
  LoanModel.findByIdAndDelete(req.params.id)
    .then(() => {
      req.session.message = {
        text: "loan has been deleted!",
        type: "success",
      };
      res.redirect("/loan");
    })
    .catch((err) => {
      req.session.message = {
        text: err,
        type: "error",
      };

      res.redirect("/loan");
    });
});

router.get("/delete/lend/:id", (req, res) => {
  LoanModel.findByIdAndDelete(req.params.id)
    .then(() => {
      req.session.message = {
        text: "loan has been deleted!",
        type: "success",
      };
      res.redirect("/loan/lend");
    })
    .catch((err) => {
      req.session.message = {
        text: err,
        type: "error",
      };

      res.redirect("/loan/lend");
    });
});

module.exports = router;
