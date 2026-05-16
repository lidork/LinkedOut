const router = require("express").Router();
const c = require("../controllers/usersController");
const { auth, requireSelf } = require("../middleware/auth");

router.get("/", auth, c.list);
router.get("/:id", auth, requireSelf, c.getOne);
router.put("/:id", auth, requireSelf, c.update);
router.delete("/:id", auth, requireSelf, c.remove);

router.get("/:id/friends", auth, requireSelf, c.getFriends);
router.delete("/:id/friends/:friendId", auth, c.removeFriend);

router.get("/:id/friend-requests", auth, requireSelf, c.getFriendRequests);
router.post("/:id/friend-request", auth, c.sendFriendRequest);
router.post("/:id/friend-request/accept", auth, c.acceptFriendRequest);
router.delete("/:id/friend-request", auth, c.declineFriendRequest);

module.exports = router;
