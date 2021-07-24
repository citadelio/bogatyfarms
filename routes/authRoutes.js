const router = require("express").Router();
const { check } = require("express-validator");


const {
    login,
    register,
    resendActivation,
    activateAccount,
    forgotPassword,
    getResetPassword,
    postResetPassword,
    changePassword,
  } = require("../controllers/AuthController");
  const protectedRoute = require("../middlewares/protectedRoute");
  
  /* LOCAL AUTHENTICATION */
  router.post("/login", [check("email").isEmail()], login);
  router.post(
    "/register",
    [
      check("email").isEmail(),
      check("password").isLength({ min: 6 }),
      check("firstname").not().isEmpty(),
      check("lastname").not().isEmpty(),
    ],
    register
  );
  
  router.post("/resend-activation", protectedRoute, resendActivation);
  router.get("/activate-account/:code", activateAccount);
  router.post(
    "/forgot-password",
    [check("email").not().isEmpty()],
    forgotPassword
  );
  router.get("/reset-password/:code", getResetPassword);
  router.post(
    "/reset-password/:code",
    [
      check("password").not().isEmpty().isLength({ min: 6 }),
      check("confirmpassword").not().isEmpty().isLength({ min: 6 }),
    ],
    postResetPassword
  );
  
  router.post(
    "/change-password",
    [
      check("oldpassword").not().isEmpty().isLength({ min: 6 }),
      check("password").not().isEmpty().isLength({ min: 6 }),
      check("confirmpassword").not().isEmpty().isLength({ min: 6 }),
    ],
    protectedRoute,
    changePassword
  );


module.exports = router;