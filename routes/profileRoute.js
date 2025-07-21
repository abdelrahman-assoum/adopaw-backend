const express = require("express");
const profileController = require("../controllers/profileController");
const router = express.Router();

router.get("/:supaId", profileController.getProfileBySupaId);
router.post("/", profileController.createProfile);
router.put("/:supaId", profileController.updateProfile);
router.delete("/:supaId", profileController.deleteProfile);

module.exports = router;