import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Auth } from "../models/authModel.js";
import { sendCookie } from "../utils/features.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// REGISTER
export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(200).json({
        result: 0,
        message: "All fields are required!",
      });
    }

    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      return res.status(200).json({
        result: 0,
        message: "Email Already Registered",
      });
    }

    const user = await Auth.create({ name, email, password });

    user.password = undefined;

    res.status(200).json({
      result: 1,
      message: "Registered Successfully",
      user,
    });
  } catch (error) {
    console.error("Error in registration:", error);

    res.status(500).json({
      result: 0,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

// LOGIN
export const login = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(200).json({
        result: 0,
        message: "Email and Password are required",
      });
    }

    const user = await Auth.findOne({ email }).select("+password");

    if (!user) {
      return res.status(200).json({
        result: 0,
        message: "Invalid Email or Password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(200).json({
        result: 0,
        message: "Invalid Email or Password",
      });
    }

    user.password = undefined;

    sendCookie(user, res, "Login Successfully", 200);
  } catch (error) {
    console.error("Error in login:", error);

    res.status(500).json({
      result: 0,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

// LOGOUT
export const logout = catchAsyncError(async (req, res) => {
  try {
    res
      .status(200)
      .cookie("sessionToken", "", {
        expires: new Date(Date.now()),
        sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "Development" ? false : true,
        httpOnly: true,
      })
      .json({
        result: 1,
        message: "Logout Successfully",
      });
  } catch (error) {
    console.error("Error in logout:", error);

    res.status(500).json({
      result: 0,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

// UPDATE PASSWORD USING SESSION TOKEN
export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!req.user || !req.user.id) {
    return res.status(401).json({
      result: 0,
      message: "Unauthorized: You must be logged in to change password",
    });
  }

  if (!oldPassword || !newPassword) {
    return res.status(200).json({
      result: 0,
      message: "Old password and new password are required",
    });
  }

  const user = await Auth.findById(req.user.id).select("+password");

  if (!user) {
    return res.status(200).json({
      result: 0,
      message: "User not found",
    });
  }

  if (!user.password) {
    return res.status(200).json({
      result: 0,
      message: "Password not set",
    });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(200).json({
      result: 0,
      message: "Invalid old password",
    });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return res.status(200).json({
      result: 0,
      message: "New password cannot be the same as the old one",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  try {
    user.password = newPassword;
    await user.save();
  } catch (error) {
    return res.status(200).json({
      result: 0,
      message: error.message,
    });
  }

  res.status(200).json({
    result: 1,
    message: "Password changed successfully",
  });
});

// PROFILE

export const profile = catchAsyncError(async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        result: 0,
        message: "Unauthorized: Please login to access profile",
      });
    }

    const user = await Auth.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        result: 0,
        message: "User not found",
      });
    }

    res.status(200).json({
      result: 1,
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error in fetching profile:", error);

    res.status(500).json({
      result: 0,
      message: "Internal Server Error. Please try again later.",
    });
  }
});

// FORGOT PASSWORD

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await Auth.findOne({ email });

    if (!user) {
      return res.status(200).json({
        result: 0,
        message: "User not found",
      });
    }

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
        return res.status(200).json({
          result: 0,
          message: "Failed to send email. Please try again later.",
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          result: 1,
          message: "Please check your email, a reset link has been sent.",
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      result: 0,
      message: "Something went wrong. Please try again later.",
    });
  }
});

// RESET PASSWORD
// RESET PASSWORD
export const resetPassword = catchAsyncError(async (req, res, next) => {
  try {
    const { id, sessionToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        result: 0,
        message: "Password is required",
      });
    }

    const user = await Auth.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({
        result: 0,
        message: "User not found",
      });
    }

    const modifiedToken = sessionToken.replace(/_/g, ".");

    try {
      jwt.verify(modifiedToken, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err);
      return res.status(401).json({
        result: 0,
        message: "Invalid or expired token",
      });
    }

    // ✅ Apply schema validation during password update
    user.password = password;

    // ✅ Trigger schema validation with `.save()`
    await user.save({ validateBeforeSave: true });

    return res.status(200).json({
      result: 1,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error(error);

    // ✅ Handle Mongoose Validation Errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return res.status(400).json({
        result: 0,
        message: validationErrors,
      });
    }

    return res.status(500).json({
      result: 0,
      message: "Server error, please try again later",
    });
  }
});
