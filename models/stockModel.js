import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
  ltp: Number,
  ltt: String,
  ltq: Number,
  cp: Number,
  marketData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Stock", stockSchema);
