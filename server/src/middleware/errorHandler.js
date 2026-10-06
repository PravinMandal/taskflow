// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Mongoose bad ObjectId / cast errors
  if (err?.name === "CastError") {
    return res.status(400).json({
      error: "Bad Request",
      message: "That ID doesn't look valid. Please check and try again.",
    });
  }
  // Duplicate key (e.g. email already registered)
  if (err?.code === 11000) {
    return res.status(409).json({
      error: "Conflict",
      message: "An account with that email already exists. Try logging in instead.",
    });
  }
  // Mongoose schema validation
  if (err?.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Error",
      message: details[0] || "Some fields are invalid.",
      details,
    });
  }
  const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
  return res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.error || "Error",
    message:
      status === 500
        ? "Something went wrong on our end. Please try again in a moment."
        : err.message || "Something went wrong.",
  });
}

/** Final 404 for unknown API routes. */
export function notFound(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `No API route matches ${req.method} ${req.originalUrl}.`,
  });
}
