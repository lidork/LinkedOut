const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * JWT auth middleware. Reads `Authorization: Bearer <token>`, verifies the
 * signature, and attaches the full user document (minus password) to req.user.
 * All 401 responses use generic messages intentionally — distinguishing
 * "wrong token" from "user deleted" would leak account-existence information.
 */
const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const requireSelf = (req, res, next) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

module.exports = { auth, adminOnly, requireSelf };
