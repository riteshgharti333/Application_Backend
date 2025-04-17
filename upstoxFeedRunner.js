import mongoose from "mongoose";
import dotenv, { config } from "dotenv";
import { startUpstoxFeed } from "./services/upstoxFeed.js";
import {Auth} from "./models/authModel.js";

config({
  path: "./data/config.env",
});

// Connect to DB first
await mongoose.connect(process.env.MONGODB_URL);

// Get the latest user token (or your logic to get it)
const user = await Auth.findOne({ upstoxAccessToken: { $exists: true } });
if (!user) {
  console.error("No user with access token found");
  process.exit(1);
}

startUpstoxFeed(user.upstoxAccessToken);
