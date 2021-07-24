const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Models
const UserModel = require("../models/User");
const Activation = require("../models/Activation");
const Reset = require("../models/PasswordReset");

//helpers
const { makeTitleCase, createUsername } = require("../middlewares/helpers");

//mail
const sendEmail = require("../middlewares/sendEmail");
const activationEmailTemplate = require("../middlewares/emailTemplates/activation");

 const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ errors: errors.array() });
  }
  const { email, password } = req.body;

  try {
    //Check if user exist
    let user = await UserModel.findOne({ email });

    if (!user) {
      return res.json({
        errors: [
          {
            statuscode: "E1",
            msg: "This email/password is incorrect",
          },
        ],
      });
    }

    //compare passwords to see if it matches
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({
        errors: [
          {
            statuscode: "E1",
            msg: "This email/password is incorrect",
          },
        ],
      });
    }
    let token = jwt.sign({ userid: user.id }, process.env.jwtSecret, {
      expiresIn: 72000,
    });
    return res
      .status(200)
      .cookie("AUTH-TOKEN", token, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
      })
      .json({ token, user, statuscode: "S1" });
  } catch (err) {
    return res.json({
      errors: [
        {
          err,
          msg: "An error occurred, try again",
        },
      ],
    });
  }
};

 const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ errors: errors.array() });
  }
  const { firstname, lastname, email, password } = req.body;

  try {
    //Check for already existing email
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.json({
        errors: [
          {
            msg: "An account already exist with this email, Login instead",
          },
        ],
      });
    }
    //Initialize a new User
    const user = new UserModel({
      firstname, lastname,
      email,
      username: createUsername(firstname),
      password,
    });

    //Encrypt password
    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    //Save new User
    user.save();

    //generate and save activation link
    const hash = crypto
      .createHmac("sha256", "random-secret")
      .update(new Date().valueOf().toString())
      .digest("hex");
    //activatio link expires in 24 hours
    let now = new Date();
    let expiry = now.setHours(now.getHours() + 24);

    const activationLink = new Activation({
      expiry,
      userid: user.id,
      code: hash,
    });

    activationLink.save();

    // send activation mail to user
    const from = `${process.env.APP_NAME_L} <activation@${process.env.APP_URL_S}>`;
    const subject = `Verify your ${process.env.APP_NAME_S} account`;
    const messageBody = activationEmailTemplate(user, activationLink);
    const verifyEmailSent = await sendEmail(
      from,
      user.email,
      subject,
      messageBody
    );
    // Generate token
    const token = jwt.sign({ userid: user.id }, process.env.jwtSecret, {
      expiresIn: 720000,
    });

    //return token
    return res
      .status(200)
      .cookie("AUTH-TOKEN", token, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
      })
      .json({ token, user });
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

 const resendActivation = async (req, res) => {
  const userid = req.userid;
  try {
    const user = await UserModel.findById(userid);
    if (!user) {
      return res.json({ status: false });
    }

    //generate and save activation link
    const hash = crypto
      .createHmac("sha256", "random-secret")
      .update(new Date().valueOf().toString())
      .digest("hex");

    let now = new Date();
    let expiry = now.setHours(now.getHours() + 1);

    const activationLink = new Activation({
      expiry,
      userid: user.id,
      code: hash,
    });

    activationLink.save();

    //send activation mail to user
    const from = `${process.env.APP_NAME_L} <activation@${process.env.APP_URL_S}>`;
    const subject = `Activate your ${process.env.APP_NAME_S} account`;
    const messageBody = activationEmailTemplate(user, activationLink);
    const emailSent = await sendEmail(from, user.email, subject, messageBody);
    return res.status(200).json(emailSent);
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

 const activateAccount = async (req, res) => {
  try {
    //check if code is still valid
    const activationDetails = await Activation.findOne({
      code: req.params.code,
    });
    if (!activationDetails) {
      return res.json({
        errors: [
          {
            msg: "Activation code is invalid",
          },
        ],
      });
    }

    if (new Date() > activationDetails.expiry) {
      return res.json({
        errors: [
          {
            msg: "Activation link is expired",
          },
        ],
      });
    }

    const userid = activationDetails.userid;
    const user = await UserModel.updateOne(
      { _id: userid },
      { activated: true }
    );
    if (user.n > 0) {
      return res.status(201).json({ success: [{ msg: "Account activated" }] });
    } else {
      return res.json({
        errors: [
          {
            msg: "An error occured while activating account. Try again",
          },
        ],
      });
    }
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

 const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.array() });
  }

  try {
    //check if email exist
    let user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.json({
        errors: [
          {
            msg: "This email does not exist on our system",
          },
        ],
      });
    }

    //generate and save reset link
    const hash = crypto
      .createHmac("sha256", "random-secret")
      .update(new Date().valueOf().toString())
      .digest("hex");

    let now = new Date();
    let expiry = now.setHours(now.getHours() + 1);

    const resetPasswordLink = new Reset({
      expiry,
      userid: user.id,
      email: req.body.email,
      code: hash,
    });

    const savedResetDetails = await resetPasswordLink.save();

    //send reset email to user
    const from = `"${process.env.APP_NAME_L}" <activation@${process.env.APP_URL_S}>`;
    const subject = `Reset your ${process.env.APP_NAME_S} password`;
    const resetPasswordEmailTemplate = require("../middlewares/emailTemplates/resetpassword");
    const messageBody = resetPasswordEmailTemplate(
      user,
      savedResetDetails,
      req.header("User-Agent")
    );
    const emailSent = await sendEmail(from, user.email, subject, messageBody);
        console.log(emailSent)
    return res
      .status(200)
      .json({ success: [{ msg: `Reset link sent to ${user.email}` }] });
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

 const getResetPassword = async (req, res) => {
  try {
    //check the code
    const resetDetails = await Reset.findOne({ code: req.params.code });
    if (!resetDetails) {
      return res.json({
        errors: [
          {
            msg: "Reset code is invalid",
          },
        ],
      });
    }
    return res.status(200).json({ success: [{ resetDetails }] });
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

 const postResetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.array() });
  }

  try {
    const resetDetails = await Reset.findOne({ code: req.params.code });
    if (!resetDetails) {
      return res.json({
        errors: [
          {
            msg: "Reset code is invalid",
          },
        ],
      });
    }

    const { password, confirmpassword } = req.body;
    //check if passwords match
    if (password !== confirmpassword) {
      return res.json({
        errors: [
          {
            msg: "Passwords do not match",
          },
        ],
      });
    }
    //Encrypt password
    let salt = await bcrypt.genSalt(10),
      hashedpassword = await bcrypt.hash(password, salt);
    //update user detail
    const updatedUser = await UserModel.updateOne(
      { _id: resetDetails.userid },
      {
        password: hashedpassword,
      }
    );
    if (updatedUser.n > 0) {
      res.status(200).json({
        success: [
          { msg: "Password has been changed, Kindly sign in to continue." },
        ],
      });
    } else {
      return res.json({
        errors: [
          {
            msg: "Couldn't update user details, Try again.",
          },
        ],
      });
    }
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

 const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.array() });
  }

  const userid = req.userid;
  const { oldpassword, password, confirmpassword } = req.body;
  // console.log(req.body);
  try {
    //get user's current password
    const user = await UserModel.findOne({ _id: userid });
    // console.log(user)
    //check to see if old password is correct
    const comparePasswords = await bcrypt.compare(oldpassword, user.password);
    //  console.log(comparePasswords)
    if (!comparePasswords) {
      return res.json({
        errors: [
          {
            msg: "The password you entered is incorrect",
          },
        ],
      });
    }
    //check if passwords match
    if (password !== confirmpassword) {
      return res.json({
        errors: [
          {
            msg: "New passwords do not match",
          },
        ],
      });
    }
    //Encrypt password
    let salt = await bcrypt.genSalt(10),
      hashedpassword = await bcrypt.hash(password, salt);
    //update user detail
    const updatedUser = await UserModel.updateOne(
      { _id: userid },
      {
        password: hashedpassword,
      }
    );
    if (updatedUser.n > 0) {
      res.status(200).json({
        msg: "Password has been changed, successfully!",
        status: true,
      });
    } else {
      return res.json({
        errors: [
          {
            msg: "Couldn't update user details, Try again.",
          },
        ],
      });
    }
  } catch (err) {
    return res.json({
      errors: [
        {
          msg: "An error occurred, try again",
          err,
        },
      ],
    });
  }
};

module.exports = {
    login,
    register,
    resendActivation,
    activateAccount,
    forgotPassword,
    getResetPassword,
    postResetPassword,
    changePassword,
  };