const router = require("express").Router();
const UserModel = require("../models/user");

// validate function

const validate = async (input, value, userId) => {
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

      case "password":
        if (value == "") {
          err = "required!";
        } else if (value.length > 30) {
          err = "must not exceed 30 characters!";
        }
        break;

      case "prevPassword":
        if (value == "") {
          err = "required!";
        } else {
          const user = await UserModel.findById(userId);

          if (user.password != value) {
            err = "wrong password!";
          }
        }
        break;
    }
  } catch (t) {}

  return err;
};

// update route

router.get("/", (req, res) => {
  let message = null;
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message;
  }
  const user = req.session.user;
  res.render("profile", {
    message,
    user,
    firstName: { val: user.firstName, err: "" },
    lastName: { val: user.lastName, err: "" },
    password: { val: "", err: "" },
    prevPassword: { val: "", err: "" },
  });
});
router.post("/", async (req, res) => {
  const { firstName, lastName } = req.body;

  const user = req.session.user;
  //validations
  const firstNameErr = await validate("name", firstName);
  const lastNameErr = await validate("name", lastName);
  //const passwordErr = validate("password", password);

  if (firstNameErr || lastNameErr) {
    res.render("profile", {
      message: null,
      user,
      firstName: { val: firstName, err: firstNameErr },
      lastName: { val: lastName, err: lastNameErr },
      password: { val: "", err: "" },
      prevPassword: { val: "", err: "" },
    });

    return;
  }
  UserModel.findByIdAndUpdate(user._id, {
    firstName,
    lastName,
  })
    .then((data) => {
      req.session.message = {
        text: "profile update is successful.",
        type: "success",
      };
      req.session.user.firstName = firstName;
      req.session.user.lastName = lastName;
      res.redirect("/profile");

      return;
    })
    .catch((e) => {
      console.log(e);
      res.send("error while processing data!");
    });
});

// password update
router.post("/password", async (req, res) => {
  const { prevPassword, password } = req.body;

  const user = req.session.user;
  //validations
  const prevPasswordErr = await validate(
    "prevPassword",
    prevPassword,
    user._id
  );
  const passwordErr = await validate("password", password);

  if (prevPasswordErr || passwordErr) {
    res.render("profile", {
      message: null,
      user,
      firstName: { val: user.firstName, err: "" },
      lastName: { val: user.lastName, err: "" },
      password: { val: password, err: passwordErr },
      prevPassword: { val: prevPassword, err: prevPasswordErr },
    });

    return;
  }
  UserModel.findByIdAndUpdate(user._id, {
    password,
  })
    .then((data) => {
      req.session.message = {
        text: "password update is successful.",
        type: "success",
      };

      res.redirect("/profile");

      return;
    })
    .catch((e) => {
      console.log(e);
      res.send("error while processing data!");
    });
});
module.exports = router;
