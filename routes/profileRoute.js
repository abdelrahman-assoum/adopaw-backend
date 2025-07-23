const express = require("express");
const profileController = require("../controllers/profileController");
const { verifySupabaseToken } = require("../middlewares/supabaseAuth");
const router = express.Router();

router.get("/:supaId", verifySupabaseToken, profileController.getProfileBySupaId);
router.post("/", verifySupabaseToken, profileController.createProfile);
router.put("/:supaId", verifySupabaseToken, profileController.updateProfile);
router.delete("/:supaId", verifySupabaseToken, profileController.deleteProfile);

module.exports = router;