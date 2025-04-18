// models/stockModel.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  ltp: Number,
  ltq: Number,
  cp: Number,
  ltt: Date,
  marketData: Object,
}, { timestamps: true });

export default mongoose.model("Stock", stockSchema);
