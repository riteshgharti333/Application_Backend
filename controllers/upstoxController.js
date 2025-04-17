import upstox from "upstox-js-sdk";
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Auth } from "../models/authModel.js";

import { startUpstoxFeed } from "../services/upstoxFeed.js";
import { getUpstoxUserProfile } from "../services/getProfile.js";
import { refreshUpstoxToken } from "../utils/upstoxTokenManager.js";

export const upstoxCallback = catchAsyncError(async (req, res, next) => {
  const { code, state } = req.query;

  console.log("✅ Callback route hit");
  console.log("✅ Received code:", code);

  if (!code) return next(new ErrorHandler("Authorization code missing", 400));
  if (!state) return next(new ErrorHandler("User info (state) missing", 400));

  try {
    const response = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.UPSTOX_API_KEY,
        client_secret: process.env.UPSTOX_API_SECRET,
        redirect_uri: process.env.UPSTOX_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error from Upstox token API:", data);
      return next(
        new ErrorHandler(data?.errors?.[0]?.message || "Token request failed", 500)
      );
    }

    const { access_token, refresh_token } = data;
    const userId = state;

    await Auth.findByIdAndUpdate(userId, {
      upstoxAccessToken: access_token,
      upstoxRefreshToken: refresh_token,
    });

    const user = await Auth.findById(userId);

    try {
      await getUpstoxUserProfile(user.upstoxAccessToken);
    } catch (err) {
      console.log("⚠️ Access token expired. Refreshing...");
      await refreshUpstoxToken(user);
    }

    try {
      startUpstoxFeed(user.upstoxAccessToken);
    } catch (err) {
      const newAccessToken = await refreshUpstoxToken(user);
      startUpstoxFeed(newAccessToken);
    }

    res.status(200).json({
      result: 1,
      message: "Upstox access token stored successfully",
      access_token,
    });
  } catch (err) {
    console.error("❌ Token exchange failed:", err);
    return next(new ErrorHandler("Upstox Auth failed", 500));
  }
});

// Get Login URL
export const getLoginUrl = catchAsyncError(async (req, res, next) => {
  try {
    const loginUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${
      process.env.UPSTOX_API_KEY
    }&redirect_uri=${encodeURIComponent(
      process.env.UPSTOX_REDIRECT_URI
    )}&scope=profile_read&state=${req.user._id}`;

    res.status(200).json({
      result: 1,
      message: "Login URL generated successfully",
      data: {
        loginUrl,
      },
    });
  } catch (err) {
    console.error("Upstox login URL error:", err);
    return next(
      new ErrorHandler(
        err.message || "Failed to generate login URL",
        err.statusCode || 500
      )
    );
  }
});

// // Get user profile
// export const getUserProfile = catchAsyncError(async (req, res, next) => {
//   try {
//     // Assuming you've stored the access token in the request (from middleware)
//     const accessToken = req.user.upstoxAccessToken;

//     if (!accessToken) {
//       return next(new ErrorHandler("Not authenticated with Upstox", 401));
//     }

//     const profile = await upstox.getUserProfile(accessToken);

//     res.status(200).json({
//       success: true,
//       data: profile
//     });
//   } catch (err) {
//     console.error('Upstox profile error:', err);
//     return next(new ErrorHandler(
//       err.message || "Failed to fetch profile",
//       err.statusCode || 500
//     ));
//   }
// });
