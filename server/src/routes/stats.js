const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { postsPerMonth, membersPerGroup } = require("../controllers/statsController");

router.use(auth);

router.get("/posts-per-month", postsPerMonth);
router.get("/members-per-group", membersPerGroup);

module.exports = router;
