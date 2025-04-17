import mongoose from "mongoose";

const smStockSchema = new mongoose.Schema({
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

export default mongoose.model("smStock", smStockSchema);
