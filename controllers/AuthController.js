import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Auth } from "../models/authModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendCookie } from "../utils/features.js";
import bcrypt from "bcrypt";

// REGISTER
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check for empty fields
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ result: 0, message: "All fields are required!" });
  }

  // Check if the user already exists
  let existingUser = await Auth.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ result: 0, message: "User Already Exists" });
  }

  // Create new user
  await Auth.create({ name, email, password });

  // Send success response (only message)
  res.status(201).json({ success: true, message: "Registered Successfully" });
});

// LOGIN
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await Auth.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 400));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid Email or Password", 400));
  }

  // ✅ Ensure password is removed **only after** checking
  user.password = undefined;

  sendCookie(user, res, "Login Successfully", 200);
});

// LOGOUT
export const logout = catchAsyncError(async (req, res) => {
  res
    .status(200)
    .cookie("sessionToken", "", {
      expires: new Date(Date.now()),
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? false : true,
    })
    .json({
      success: true,
      message: "Logout Successfully",
    });
});

// UPDATE PASSWORD
export const changePassword = catchAsyncError(async (req, res, next) => {
  const { id, oldPassword, newPassword } = req.body;

  // 🔹 Ensure user is authenticated
  if (!req.user || req.user.id !== id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: You can only change your own password",
    });
  }

  // 🔹 Validate input fields
  if (!id || !oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "User ID, old password, and new password are required",
    });
  }

  // 🔹 Fetch user with password field
  const user = await Auth.findById(id).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // 🔹 Ensure user has a password set
  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: "Password not set",
    });
  }

  // 🔹 Check if old password matches
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Invalid old password",
    });
  }

  // 🔹 Prevent setting the same password again
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: "New password cannot be the same as the old one",
    });
  }

  // Ensure Mongoose validates password format** before saving
  try {
    user.password = newPassword;
    await user.save();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// PROFILE
export const profile = catchAsyncError(async (req, res, next) => {
  const user = req.user;

  sendCookie(user, res, 200);
});

// FORGOT PASSWORD

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await Auth.findOne({ email });

    if (!user) return next(new ErrorHandler("User not found", 400));

    const secret = process.env.JWT_SECRET;

    const sessionToken = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "30m",
    });

    const modifiedToken = sessionToken.replace(/\./g, "_");

    const link = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${modifiedToken}`;

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset Request",
      html: `
      <p>Hello ${user.name || "User"},</p>
      
      <p>We received a request to reset your password for your account associated with this email address: ${
        user.email
      }.</p>
      
      <p>To reset your password, please click the button below:</p>
      
      <p>
        <a href="${link}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
  
      <p>If you did not request a password reset, please ignore this email. Your password will not be changed until you click the button above and create a new password.</p>
  
      <p>For security reasons, this link will expire in 30 minutes. If you need a new password reset link, you can request another one through the password reset page.</p>
  
      <p>If you have any questions or need further assistance, please don’t hesitate to reach out.</p>
  
      <p>Thank you,<br/>Streamer</p>
    `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to send email." });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          message:
            "Please check your email, a reset link has been sent to you.",
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// RESET PASSWORD
export const resetPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { id, sessionToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await Auth.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const modifiedToken = sessionToken.replace(/_/g, ".");

    const secret = process.env.JWT_SECRET;

    try {
      jwt.verify(modifiedToken, secret);
    } catch (err) {
      console.log(err);
      return next(new ErrorHandler("Invalid or expired token", 401));
    }

    const encryptPassword = await bcrypt.hash(password, 10);

    await Auth.updateOne({ _id: id }, { $set: { password: encryptPassword } });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});
