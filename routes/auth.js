const router = require("express").Router();
const UserModel = require("../models/user");

router.use((req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
});

// validate function

const validate = async (input, value, unique = false) => {
  let err = null;
  try {
    switch (input) {
      case "name":
        if (value == "") {
          err = "required!";
        } else if (value.length > 100) {
          err = "must not exceed 100 characters!";
        } else if (!/^[a-zA-Z-' ]*$/.test(value)) {
          err = "must not contain numbers or special characters!";
        }
        break;

      case "email":
        if (value == "") {
          err = "required!";
        } else if (value.length > 100) {
          err = "must not exceed 100 characters!";
        } else if (
          !/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(
            value
          )
        ) {
          err = "email is not valid!";
        } else if (unique) {
          const user = await UserModel.findOne({ email: value });

          if (user) {
            err = "email already exist!";
          }
        }
        break;
      case "password":
        if (value == "") {
          err = "required!";
        } else if (value.length > 30) {
          err = "must not exceed 30 characters!";
        }
        break;
    }
  } catch (t) {}

  return err;
};

// login routes
router.get("/login", (req, res) => {
  let message = null;

  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }

  res.render("login", {
    email: { val: "", err: "" },
    password: { val: "", err: "" },
    message,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //validations

  const emailErr = await validate("email", email);
  const passwordErr = await validate("password", password);

  if (emailErr || passwordErr) {
    res.render("login", {
      message: null,
      email: { val: email, err: emailErr },
      password: { val: password, err: passwordErr },
    });

    return;
  }

  const user = await UserModel.findOne({ email, password });

  if (user) {
    req.session.user = user;
    res.redirect("/index");
    return;
  }

  res.render("login", {
    email: { val: email, err: "" },
    password: { val: password, err: "" },
    message: { text: "wrong email or password.", type: "error" },
  });
});

// sign up routes
router.get("/register", (req, res) => {
  res.render("register", {
    message: null,
    firstName: { val: "", err: "" },
    lastName: { val: "", err: "" },
    email: { val: "", err: "" },
    password: { val: "", err: "" },
  });
});

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  //validations
  const firstNameErr = await validate("name", firstName);
  const lastNameErr = await validate("name", lastName);
  const emailErr = await validate("email", email, true);
  const passwordErr = await validate("password", password);

  if (firstNameErr || lastNameErr || emailErr || passwordErr) {
    res.render("register", {
      firstName: { val: firstName, err: firstNameErr },
      lastName: { val: lastName, err: lastNameErr },
      email: { val: email, err: emailErr },
      password: { val: password, err: passwordErr },
    });

    return;
  }

  const user = new UserModel({ firstName, lastName, email, password });

  user
    .save()
    .then(() => {
      req.session.message = {
        text: "your account has been created please login here.",
        type: "success",
      };
      res.redirect("/login");
    })
    .catch((e) => {
      console.log(e);
      res.send("error while processing data!");
    });
});

module.exports = router;
