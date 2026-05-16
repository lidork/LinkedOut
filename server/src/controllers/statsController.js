const Post = require("../models/Post");
const Group = require("../models/Group");
const asyncHandler = require("../middleware/asyncHandler");

exports.postsPerMonth = asyncHandler(async (req, res) => {
  const data = await Post.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: "$_id", count: 1 } },
  ]);
  res.json(data);
});

exports.membersPerGroup = asyncHandler(async (req, res) => {
  const groups = await Group.find({}, "name members").lean();
  const data = groups
    .map((g) => ({ name: g.name, memberCount: g.members.length }))
    .sort((a, b) => b.memberCount - a.memberCount);
  res.json(data);
});
