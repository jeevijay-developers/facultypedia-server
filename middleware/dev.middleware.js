export const ensureDevEnvironment = (_req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Hide dev-only endpoints entirely in production
    return res.status(404).json({
      success: false,
      message: "Resource not found",
    });
  }

  return next();
};
