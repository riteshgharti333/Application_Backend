import Stock from "../models/stockModel.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";

export const getStock = catchAsyncError(async (req, res, next) => {
  const { symbol } = req.params;

  const stock = await Stock.findOne({ symbol });

  if (!stock) {
    throw new ErrorHandler("Stock not found", 404);
  }

  res.status(200).json({ success: true, data: stock });
});


export const getAllStocks = catchAsyncError(async (req, res, next) => {
  const stocks = await Stock.find();

  if (!stocks || stocks.length === 0) {
    throw new ErrorHandler("No stock data found", 404);
  }

  res.status(200).json({
    success: true,
    data: stocks,
  });
});
