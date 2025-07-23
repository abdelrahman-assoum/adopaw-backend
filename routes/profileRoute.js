const express = require("express");
const profileController = require("../controllers/profileController");
const authenticate = require("../middlewares/supabaseAuth");
const router = express.Router();

router.get("/:supaId", authenticate, profileController.getProfileBySupaId);
router.post("/", authenticate, profileController.createProfile);
router.put("/:supaId", authenticate, profileController.updateProfile);
router.delete("/:supaId", authenticate, profileController.deleteProfile);

module.exports = router;