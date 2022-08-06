const router = require("express").Router();
const TransactionModal = require("../models/transactions");

// validate function

const validate = (input, value) => {
  let err = null;
  try {
    switch (input) {
      case "description":
        if (value == "") {
          err = "required!";
        } else if (value.length > 1000) {
          err = "must not exceed 1000 characters!";
        }
        break;

      case "date":
        if (value == "") {
          err = "required!";
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

  TransactionModal.find({ userId: req.session.user._id }).then(
    (transactions) => {
      res.render("income-expense", {
        message,
        transactions,
      });
    }
  );
});

// add routes
router.get("/add", async (req, res) => {
  let message = null;
  let transaction = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;

    transaction = await TransactionModal.findById(req.session.transactionId);
    delete req.session.transactionId;
  }
  res.render("add-money", {
    message,
    transaction,
    amount: { val: "", err: "" },
    description: { val: "", err: "" },
    date: { val: "", err: "" },
  });
});
router.post("/add", (req, res) => {
  const { amount, description, date } = req.body;
  //validations
  const amountErr = validate("amount", amount);
  const descriptionErr = validate("description", description.trim());
  const dateErr = validate("date", date);
  if (amountErr || descriptionErr || dateErr) {
    res.render("add-money", {
      message: null,
      transaction: null,
      amount: { val: amount, err: amountErr },
      description: { val: description, err: descriptionErr },
      date: { val: date, err: dateErr },
    });
    return;
  }

  const transaction = new TransactionModal({
    amount,
    description,
    date,
    userId: req.session.user._id,
    type:'general'
  });
  transaction
    .save()
    .then((data) => {
      req.session.message = {
        text: "your transaction is successful.",
        type: "success",
      };
      req.session.transactionId = data._id;
      res.redirect("/income-expense/add/");

      return;
    })
    .catch((e) => {
      console.log(e);
      res.send("error while processing data!");
    });
});

router.get("/add/expense", async (req, res) => {
  let message = null;
  let transaction = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;

    transaction = await TransactionModal.findById(req.session.transactionId);
    delete req.session.transactionId;
  }
  res.render("add-expense", {
    message,
    transaction,
    amount: { val: "", err: "" },
    description: { val: "", err: "" },
    date: { val: "", err: "" },
  });
});
router.post("/add/expense", (req, res) => {
  let { amount, description, date } = req.body;
  amount*=-1;
  //validations
  const amountErr = validate("amount", amount);
  const descriptionErr = validate("description", description.trim());
  const dateErr = validate("date", date);
  if (amountErr || descriptionErr || dateErr) {
    res.render("add-expense", {
      message: null,
      transaction: null,
      amount: { val: amount, err: amountErr },
      description: { val: description, err: descriptionErr },
      date: { val: date, err: dateErr },
    });
    return;
  }

  const transaction = new TransactionModal({
    amount,
    description,
    date,
    userId: req.session.user._id,
    type:'general'
  });
  transaction
    .save()
    .then((data) => {
      req.session.message = {
        text: "your transaction is successful.",
        type: "success",
      };
      req.session.transactionId = data._id;
      res.redirect("/income-expense/add/expense");

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
  let transaction = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  TransactionModal.findById(req.params.id)
    .then((transaction) => {
      res.render("edit-transaction", {
        message,
        transaction,
        amount: { val: transaction.amount, err: "" },
        description: { val: transaction.description, err: "" },
        date: { val: getInputDate(transaction.date), err: "" },
      });
    })
    .catch((error) => {
      res.send("error processing request!");
    });
});
router.post("/edit/:id", (req, res) => {
  let{ amount, description, date } = req.body;
  //validations
   const amountErr = validate("amount", amount);
   const descriptionErr = validate("description", description.trim());
   const dateErr = validate("date", date);
   TransactionModal.findById(req.params.id)
    .then((transaction) => {

      

      if (amountErr || descriptionErr || dateErr) {
        res.render("edit-transaction", {
          message: null,
          transaction,
          amount: { val: amount, err: amountErr },
          description: { val: description, err: descriptionErr },
          date: { val: date, err: dateErr },
        });
        return;
      }

      if(transaction.amount<0){
        amount*=-1;
      }

      TransactionModal.findByIdAndUpdate(transaction._id, {
        amount,
        description,
        date,
      })
        .then((data) => {
          req.session.message = {
            text: "transaction update is successful.",
            type: "success",
          };
          req.session.transactionId = data._id;
          res.redirect("/income-expense/edit/" + transaction._id);

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
  TransactionModal.findByIdAndDelete(req.params.id)
    .then(() => {
      req.session.message = {
        text: "transaction has been deleted!",
        type: "success",
      };
      res.redirect("/income-expense");
    })
    .catch((err) => {
      req.session.message = {
        text: err,
        type: "error",
      };

      res.redirect("/income-expense");
    });
});

module.exports = router;
