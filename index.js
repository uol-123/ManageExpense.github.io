const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");

require("dotenv").config({ path: "./config.env" });
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// database connection
try {
  mongoose
    .connect(process.env.MONGO_URI, {
      // userNewUrlParser:true,
      // useCreateIndex : true,
      // useUnifiedToplology:true
    })
    .then((conn) => {
      console.log("mongodb connected:" + conn.connection.host);
    });
} catch (err) {
  console.log("error:" + err.message);
  process.exit(1);
}

// setting middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: "shhhh, very secret",
    // cookie: {
    //   httpOnly: true,
    //   maxAge: 80000,
    // },
  })
);

// auth check function
const restrict = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

// index route

const TransactionModel = require("./models/transactions");
app.get("/", restrict, async (req, res) => {
  let balance = await TransactionModel.aggregate([
    {
      $match: { userId: req.session.user._id },
    },
    { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  ]);
  res.render("index", { balance: balance[0] ? balance[0].totalAmount : 0 });
});

app.get("/logout", restrict, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// bill split routes

const billsplitRoutes = require("./routes/billsplit");
app.use("/billsplit", restrict, billsplitRoutes);

// income expense routes

const incomeExpenseRoutes = require("./routes/income-expense");
app.use("/income-expense", restrict, incomeExpenseRoutes);

// loan routes

const loanRoutes = require("./routes/loan");
app.use("/loan", restrict, loanRoutes);

// analysis routes

const analysisRoutes = require("./routes/analysis");
app.use("/analysis", restrict, analysisRoutes);

// profile routes

const profileRoutes = require("./routes/profile");
app.use("/profile", restrict, profileRoutes);

// auth routes

const authRoutes = require("./routes/auth");

app.use(authRoutes);

app.listen(3000, () => {
  console.log("server is up and running");
});
