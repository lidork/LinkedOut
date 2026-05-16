const Post = require("../models/Post");
const Group = require("../models/Group");
const asyncHandler = require("../middleware/asyncHandler");

exports.list = asyncHandler(async (req, res) => {
  const { author, group, from, to } = req.query;
  const filter = {};
  if (author) filter.author = author;
  if (group) filter.group = group;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const posts = await Post.find(filter)
    .populate("author", "username displayName avatar jobTitle portfolioUrl openToWork")
    .populate("group", "name")
    .sort({ createdAt: -1 });
  res.json({ posts });
});

/**
 * Personalised feed query. Includes a post if ANY of these are true:
 *   1. Author is self/friend AND post has no group (personal post)
 *   2. Author is self/friend AND group is public
 *   3. Post belongs to a group the caller is a member of (public or private)
 * This means private-group posts are hidden from non-members even if posted by a friend.
 */
exports.feed = asyncHandler(async (req, res) => {
  const user = req.user;
  const memberGroups = await Group.find({ members: user._id }).select("_id");
  const groupIds = memberGroups.map((g) => g._id);

  // Only public groups matter for friend/own posts outside your membership
  const publicGroups = await Group.find({ isPrivate: false }).select("_id");
  const publicGroupIds = publicGroups.map((g) => g._id);
  const selfAndFriends = [user._id, ...user.friends];

  const posts = await Post.find({
    $or: [
      // Non-group posts from self or friends
      { author: { $in: selfAndFriends }, group: null },
      // Posts in public groups from self or friends
      { author: { $in: selfAndFriends }, group: { $in: publicGroupIds } },
      // All posts in groups you're a member of (private or public)
      { group: { $in: groupIds } },
    ],
  })
    .populate("author", "username displayName avatar jobTitle portfolioUrl openToWork")
    .populate("group", "name")
    .sort({ createdAt: -1 });

  res.json({ posts });
});

// Business rules: 280-char cap and no URLs in post body (portfolioUrl and DMs are exempt)
function validatePostContent(content) {
  if (!content) return "content is required";
  if (content.length > 280) return "Posts must be 280 characters or fewer. This isn't a novel.";
  if (/https?:\/\//i.test(content)) return "LinkedOut is a link-free zone. Say it with words.";
  return null;
}

exports.create = asyncHandler(async (req, res) => {
  const { content, group, mediaUrl } = req.body;
  const err = validatePostContent(content);
  if (err) return res.status(400).json({ error: err });
  const post = await Post.create({ author: req.user._id, content, group: group || null, mediaUrl });
  res.status(201).json({ post });
});

exports.update = asyncHandler(async (req, res) => {
  const err = validatePostContent(req.body.content);
  if (err) return res.status(400).json({ error: err });
  const post = await Post.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    { content: req.body.content, mediaUrl: req.body.mediaUrl, edited: true },
    { new: true, runValidators: true }
  );
  if (!post) return res.status(404).json({ error: "Post not found or not yours" });
  res.json({ post });
});

// Toggle clap — one clap per user, stored as an array of user IDs
exports.clap = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const alreadyClapped = post.claps.map(String).includes(userId.toString());
  if (alreadyClapped) {
    post.claps.pull(userId);
  } else {
    post.claps.push(userId);
  }
  await post.save();
  res.json({ claps: post.claps.length, clapped: !alreadyClapped });
});

exports.remove = asyncHandler(async (req, res) => {
  const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  if (!post) return res.status(404).json({ error: "Post not found or not yours" });
  res.json({ ok: true });
});
