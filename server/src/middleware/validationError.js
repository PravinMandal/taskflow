import { validationResult } from "express-validator";

/** Send a 400 with the first friendly message when validators fail. */
export function validationError(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => e.msg);
  return res.status(400).json({
    error: "Validation Error",
    message: details[0],
    details,
  });
}
