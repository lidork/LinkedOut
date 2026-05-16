/**
 * Wraps an async route handler so any rejected promise is forwarded to
 * Express's next(err) without a try/catch in every controller.
 * @param {Function} fn - async (req, res, next) handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

module.exports = asyncHandler;
