const express = require("express");
const petController = require("../controllers/petController");
const router = express.Router();

router.get("/", petController.getPets);
router.get("/by/", petController.getPetsPaginated);
router.get("/nearby/", petController.getPetsByNearestLocation);
router.get("/:id", petController.getPets);
router.post("/", petController.createPet);
router.put("/:id", petController.updatePet);
router.delete("/:id", petController.deletePet);

module.exports = router;
