const router = require("express").Router();
const c = require("../controllers/postsController");
const { auth } = require("../middleware/auth");

router.get("/feed", auth, c.feed);
router.get("/", auth, c.list);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/clap", auth, c.clap);

module.exports = router;
