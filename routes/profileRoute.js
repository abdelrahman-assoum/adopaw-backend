const express = require("express");
const profileController = require("../controllers/profileController");
const supabaseAuth = require("../middlewares/supabaseAuth");
const router = express.Router();

router.get("/:supaId", supabaseAuth, profileController.getProfileBySupaId);
router.post("/", supabaseAuth, profileController.createProfile);
router.put("/:supaId", supabaseAuth, profileController.updateProfile);
router.delete("/:supaId", supabaseAuth, profileController.deleteProfile);

module.exports = router;