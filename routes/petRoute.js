const express = require("express");
const petController = require("../controllers/petController");
const authenticate = require("../middlewares/supabaseAuth");
const router = express.Router();

router.get("/", authenticate, petController.getPets);
router.get("/by/", authenticate, petController.getPetsPaginated);
router.get("/nearby/", authenticate, petController.getPetsByNearestLocation);
router.get("/owner/:profileId", authenticate, petController.getPetsByOwner);
router.get("/:id", authenticate, petController.getPets);
router.post("/", authenticate, petController.createPet);
router.put("/:id", authenticate, petController.updatePet);
router.delete("/:id", authenticate, petController.deletePet);

module.exports = router;
