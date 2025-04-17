// utils/upstoxTokenManager.js

export const refreshUpstoxToken = async (user) => {
  const response = await fetch(
    "https://api.upstox.com/v2/login/authorization/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: user.upstoxRefreshToken,
        client_id: process.env.UPSTOX_API_KEY,
        client_secret: process.env.UPSTOX_API_SECRET,
        grant_type: "refresh_token",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Failed to refresh token:", data);
    throw new Error("Failed to refresh Upstox token");
  }

  const { access_token, refresh_token } = data;

  // Update in DB
  user.upstoxAccessToken = access_token;
  user.upstoxRefreshToken = refresh_token;
  
  await user.save();

  return access_token;
};
