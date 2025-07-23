const express = require("express");
const petController = require("../controllers/petController");
const { verifySupabaseToken } = require("../middlewares/supabaseAuth");
const router = express.Router();

router.get("/", verifySupabaseToken, petController.getPets);
router.get("/by/", verifySupabaseToken, petController.getPetsPaginated);
router.get("/nearby/", verifySupabaseToken, petController.getPetsByNearestLocation);
router.get("/:id", verifySupabaseToken, petController.getPets);
router.post("/", verifySupabaseToken, petController.createPet);
router.put("/:id", verifySupabaseToken, petController.updatePet);
router.delete("/:id", verifySupabaseToken, petController.deletePet);

module.exports = router;
