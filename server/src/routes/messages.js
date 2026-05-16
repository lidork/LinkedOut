const router = require("express").Router();
const { auth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/messages?with=:userId — conversation history between caller and another user
router.get("/", auth, asyncHandler(async (req, res) => {
  const { with: otherId } = req.query;
  if (!otherId) return res.status(400).json({ error: "with query param required" });
  const meId = req.user._id;
  const messages = await Message.find({
    $or: [
      { from: meId, to: otherId },
      { from: otherId, to: meId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("from", "username displayName avatar")
    .populate("to",   "username displayName avatar");
  res.json({ messages });
}));

// GET /api/messages/conversations — list of users the caller has exchanged messages with
router.get("/conversations", auth, asyncHandler(async (req, res) => {
  const meId = req.user._id;
  // $cond selects the other party in each message — group by that to get one entry per conversation
  const msgs = await Message.aggregate([
    { $match: { $or: [{ from: meId }, { to: meId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ["$from", meId] }, "$to", "$from"],
        },
        lastMessage: { $first: "$$ROOT" },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  const partnerIds = msgs.map(({ _id }) => _id);
  const partners = await User.find({ _id: { $in: partnerIds } }).select("username displayName avatar");
  const partnerMap = Object.fromEntries(partners.map((p) => [p._id.toString(), p]));
  const conversations = msgs.map(({ _id, lastMessage }) => ({
    partner: partnerMap[_id.toString()],
    lastMessage,
  }));
  res.json({ conversations });
}));

module.exports = router;
