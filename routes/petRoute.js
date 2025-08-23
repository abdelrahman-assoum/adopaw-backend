const express = require("express");
const petController = require("../controllers/petController");
const supabaseAuth = require("../middlewares/supabaseAuth");
const router = express.Router();

router.get("/", supabaseAuth, petController.getPets);
router.get("/by/", supabaseAuth, petController.getPetsPaginated);
router.get("/nearby/", supabaseAuth, petController.getPetsByNearestLocation);
router.get("/owner/:profileId", supabaseAuth, petController.getPetsByOwner);
router.get("/:id", supabaseAuth, petController.getPets);
router.post("/", supabaseAuth, petController.createPet);
router.put("/:id", supabaseAuth, petController.updatePet);
router.delete("/:id", supabaseAuth, petController.deletePet);

module.exports = router;
