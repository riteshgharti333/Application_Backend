import fetch from "node-fetch"; // or use global fetch if using Node 18+

export const getUpstoxUserProfile = async (accessToken) => {
  try {
    const response = await fetch("https://api.upstox.com/v2/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to fetch profile:", data);
      return null;
    }

    console.log("✅ User profile:", data);
    return data;
  } catch (error) {
    console.error("❌ Error calling Upstox user profile API:", error);
    return null;
  }
};
