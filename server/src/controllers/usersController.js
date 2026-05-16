const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

exports.list = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let filter = {};
  if (search) {
    const term = search.startsWith("@") ? search.slice(1) : search;
    filter = { $or: [
      { username: { $regex: term, $options: "i" } },
      { displayName: { $regex: term, $options: "i" } },
    ]};
  }
  const users = await User.find(filter).select("-password -friendRequests");
  res.json({ users });
});

exports.getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("friends", "username displayName avatar")
    .populate("friendRequests", "username displayName avatar");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

exports.update = asyncHandler(async (req, res) => {
  const { displayName, avatar, jobTitle, portfolioUrl, openToWork } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { displayName, avatar, jobTitle, portfolioUrl, openToWork },
    { new: true, runValidators: true }
  ).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

exports.remove = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

exports.getFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("friends")
    .populate("friends", "username displayName avatar jobTitle portfolioUrl openToWork");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ friends: user.friends });
});

exports.getFriendRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("friendRequests")
    .populate("friendRequests", "username displayName avatar");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ friendRequests: user.friendRequests });
});

exports.sendFriendRequest = asyncHandler(async (req, res) => {
  const fromId = req.user._id.toString();
  const toId = req.params.id;
  if (fromId === toId) return res.status(400).json({ error: "Cannot send a request to yourself" });

  const target = await User.findById(toId);
  if (!target) return res.status(404).json({ error: "User not found" });

  if (target.friends.map(String).includes(fromId)) {
    return res.status(400).json({ error: "Already friends" });
  }
  if (target.friendRequests.map(String).includes(fromId)) {
    return res.status(400).json({ error: "Request already sent" });
  }

  target.friendRequests.push(req.user._id);
  await target.save();
  res.json({ ok: true });
});

/**
 * Accepts an incoming friend request from :id.
 * Uses two different Mongoose update strategies intentionally:
 *   - .save() on `me` to atomically remove from friendRequests and push to friends in one document
 *   - $addToSet on the requester to add back-link without re-fetching their document
 */
exports.acceptFriendRequest = asyncHandler(async (req, res) => {
  const meId = req.user._id.toString();
  const fromId = req.params.id;

  const me = await User.findById(meId);
  if (!me.friendRequests.map(String).includes(fromId)) {
    return res.status(404).json({ error: "No pending request from this user" });
  }

  // Remove from pending, add to both friends arrays (bidirectional)
  me.friendRequests = me.friendRequests.filter((id) => id.toString() !== fromId);
  if (!me.friends.map(String).includes(fromId)) me.friends.push(fromId);
  await me.save();

  await User.findByIdAndUpdate(fromId, { $addToSet: { friends: meId } });
  res.json({ ok: true });
});

exports.declineFriendRequest = asyncHandler(async (req, res) => {
  const meId = req.user._id.toString();
  const otherId = req.params.id;

  // Decline incoming request (remove otherId from my friendRequests)
  await User.findByIdAndUpdate(meId, { $pull: { friendRequests: otherId } });
  // Also cancel outgoing request (remove me from other's friendRequests) — handles cancel-sent case
  await User.findByIdAndUpdate(otherId, { $pull: { friendRequests: meId } });
  res.json({ ok: true });
});

exports.removeFriend = asyncHandler(async (req, res) => {
  const meId = req.user._id.toString();
  const { friendId } = req.params;
  // Bidirectional removal
  await User.findByIdAndUpdate(meId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: meId } });
  res.json({ ok: true });
});
