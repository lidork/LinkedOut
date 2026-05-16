const Group = require("../models/Group");
const asyncHandler = require("../middleware/asyncHandler");

/**
 * Middleware that verifies the caller is the group admin.
 * Attaches the fetched group to req.group so downstream handlers skip a second DB call.
 */
const requireGroupAdmin = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (group.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Only the group admin can do this" });
  }
  req.group = group;
  next();
});

exports.getOne = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("admin", "username displayName")
    .populate("members", "username displayName avatar")
    .populate("pendingMembers", "username displayName avatar")
    .populate("blockedMembers", "username displayName avatar");
  if (!group) return res.status(404).json({ error: "Group not found" });
  res.json({ group });
});

exports.list = asyncHandler(async (req, res) => {
  const { search, isPrivate, minMembers, maxMembers } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (isPrivate !== undefined) filter.isPrivate = isPrivate === "true";
  const groups = await Group.find(filter).populate("admin", "username");
  // Member-count filter applied in JS — MongoDB $size doesn't support range queries
  const result = groups.filter((g) => {
    const count = g.members.length;
    if (minMembers && count < Number(minMembers)) return false;
    if (maxMembers && count > Number(maxMembers)) return false;
    return true;
  });
  res.json({ groups: result });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const group = await Group.create({ name, description, isPrivate, admin: req.user._id, members: [req.user._id] });
  res.status(201).json({ group });
});

exports.update = [requireGroupAdmin, asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Group name is required" });
  Object.assign(req.group, { name: name.trim(), description, isPrivate });
  await req.group.save();
  res.json({ group: req.group });
})];

exports.remove = [requireGroupAdmin, asyncHandler(async (req, res) => {
  await req.group.deleteOne();
  res.json({ ok: true });
})];

// Public groups: instant join. Private groups: adds to pendingMembers for admin approval.
exports.requestJoin = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  const uid = req.user._id.toString();
  if (group.members.map(String).includes(uid)) {
    return res.status(400).json({ error: "Already a member" });
  }
  if (group.blockedMembers.map(String).includes(uid)) {
    return res.status(403).json({ error: "You are not allowed to join this group" });
  }
  if (group.isPrivate) {
    if (!group.pendingMembers.map(String).includes(uid)) {
      group.pendingMembers.push(req.user._id);
      await group.save();
    }
  } else {
    group.members.push(req.user._id);
    await group.save();
  }
  res.json({ ok: true });
});

exports.approveMember = [requireGroupAdmin, asyncHandler(async (req, res) => {
  const group = req.group;
  group.pendingMembers = group.pendingMembers.filter((id) => id.toString() !== req.params.userId);
  if (!group.members.map(String).includes(req.params.userId)) {
    group.members.push(req.params.userId);
  }
  await group.save();
  res.json({ ok: true });
})];

// Dual-purpose: admin kicks a member (targetId ≠ callerId) or member leaves themselves (isSelf)
exports.removeMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ error: "Group not found" });
  const callerId = req.user._id.toString();
  const targetId = req.params.userId;
  const isAdmin = group.admin.toString() === callerId;
  const isSelf = callerId === targetId;
  if (!isAdmin && !isSelf) return res.status(403).json({ error: "Not allowed" });
  group.members = group.members.filter((id) => id.toString() !== targetId);
  group.pendingMembers = group.pendingMembers.filter((id) => id.toString() !== targetId);
  await group.save();
  res.json({ ok: true });
});

exports.blockMember = [requireGroupAdmin, asyncHandler(async (req, res) => {
  const group = req.group;
  const targetId = req.params.userId;
  group.members = group.members.filter((id) => id.toString() !== targetId);
  group.pendingMembers = group.pendingMembers.filter((id) => id.toString() !== targetId);
  if (!group.blockedMembers.map(String).includes(targetId)) {
    group.blockedMembers.push(targetId);
  }
  await group.save();
  res.json({ ok: true });
})];

exports.unblockMember = [requireGroupAdmin, asyncHandler(async (req, res) => {
  const group = req.group;
  group.blockedMembers = group.blockedMembers.filter((id) => id.toString() !== req.params.userId);
  await group.save();
  res.json({ ok: true });
})];
