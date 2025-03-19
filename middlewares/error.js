// Error Handling Middleware

export const errorMiddleware = (err, req, res, next) => {
  // Default message and status
  let message = err.message || "Internal Server Error!";
  let statusCode = err.statusCode || 500;

  // Log the error for debugging
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 200;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Send the response
  res.status(statusCode).json({
    result: 0,
    message: message,
  });
};
