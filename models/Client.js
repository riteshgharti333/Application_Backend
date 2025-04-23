// models/Client.js
import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  upstoxAccessToken: {
    type: String,
    required: true,
  },
  upstoxTokenFetchedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Client", clientSchema);
