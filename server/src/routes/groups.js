const router = require("express").Router();
const c = require("../controllers/groupsController");
const { auth } = require("../middleware/auth");

router.get("/", auth, c.list);
router.get("/:id", auth, c.getOne);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/join", auth, c.requestJoin);
router.put("/:id/members/:userId/approve", auth, c.approveMember);
router.delete("/:id/members/:userId", auth, c.removeMember);
router.post("/:id/members/:userId/block", auth, c.blockMember);
router.delete("/:id/members/:userId/block", auth, c.unblockMember);

module.exports = router;
