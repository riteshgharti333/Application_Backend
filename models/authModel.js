import mongoose from "mongoose";
import bcrypt from "bcrypt";

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: function (v) {
          return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
        },
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      select: false,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      validate: {
        validator: function (v) {
          return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
            v
          );
        },
        message:
          "Password must contain at least one uppercase letter, one number, and one special character",
      },
    },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving to the database
authSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // 🔹 Ensure we are not hashing an already hashed password
  if (!this.password.startsWith("$2b$")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

authSchema.methods.updatePassword = async function (newPassword) {
  // ✅ Validate new password format BEFORE hashing
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new Error(
      "New Password must contain at least one uppercase letter, one number, and one special character."
    );
  }

  // ✅ Hash the new password before saving
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // ✅ Directly update password field and use `validateBeforeSave: true`
  this.password = hashedPassword;

  try {
    await this.save({ validateBeforeSave: true }); // 🔹 Ensure full validation
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }

  return this.password;
};


export const Auth = mongoose.model("Auth", authSchema);
