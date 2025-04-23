// utils/upstoxUtils.js
export const generateOAuthUrl = (userId) => {
    const params = new URLSearchParams({
      client_id: process.env.UPSTOX_API_KEY,
      redirect_uri: process.env.UPSTOX_REDIRECT_URI,
      response_type: "code",
      state: userId, // Pass user ID to know which user to update later
      scope: "read", // Extended token
    });
  
    return `https://api.upstox.com/v2/login/authorization/dialog?${params.toString()}`;
  };
  