const Pet = require("../models/Pet");
const { PaginationParameters } = require("mongoose-paginate-v2");


const speciesEnum = ["dog", "cat", "rabbit", "bird", "reptile", "other"];

// Create a new pet
exports.createPet = async (req, res) => {
  try {
    const {
      name,
      species,
      breed,
      gender,
      age,
      color,
      size,
      activityLevel,
      description,
      sterilized,
      dewormed,
      vaccinated,
      hasPassport,
      specialNeeds,
      healthNotes,
      images,
      status,
      location,
      postedBy,
    } = req.body;

    // Required fields validation
    if (
      !name ||
      !species ||
      !age ||
      typeof age !== "object" ||
      age.value === undefined ||
      age.unit === undefined
    ) {
      return res.status(400).json({
        message:
          "'name', 'species', and 'age' (with value and unit) are required fields.",
      });
    }

    // Validate species enum
    if (!speciesEnum.includes(species)) {
      return res
        .status(400)
        .json({ message: `Species must be one of: ${speciesEnum.join(", ")}` });
    }

    // Validate gender enum if provided
    if (gender && !["male", "female", "unknown"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Gender must be 'male', 'female', or 'unknown'." });
    }

    // Validate age.unit enum
    const ageUnitEnum = ["days", "months", "years"];
    if (!ageUnitEnum.includes(age.unit)) {
      return res.status(400).json({
        message: `Age unit must be one of: ${ageUnitEnum.join(", ")}`,
      });
    }

    // Validate size enum if provided
    if (size && !["small", "medium", "large"].includes(size)) {
      return res
        .status(400)
        .json({ message: "Size must be 'small', 'medium', or 'large'." });
    }

    // Validate activityLevel enum if provided
    if (activityLevel && !["low", "medium", "high"].includes(activityLevel)) {
      return res.status(400).json({
        message: "Activity level must be 'low', 'medium', or 'high'.",
      });
    }

    // Validate status enum if provided
    if (
      status &&
      !["available", "pending", "adopted", "removed"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be one of: 'available', 'pending', 'adopted', 'removed'.",
      });
    }

    // Validate location.coordinates array if provided
    if (location && location.coordinates) {
      if (
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({
          message:
            "Location.coordinates must be an array of two numbers [longitude, latitude].",
        });
      }
    }

    // Create pet instance
    const pet = new Pet({
      name,
      species,
      breed,
      gender,
      age,
      color,
      size,
      activityLevel,
      description,
      vaccinated,
      sterilized,
      dewormed,
      hasPassport,
      specialNeeds,
      healthNotes,
      images,
      status,
      location,
      postedBy,
    });

    const savedPet = await pet.save();
    return res.status(201).json(savedPet);
  } catch (error) {
    console.error("Error creating pet:", error);
    return res
      .status(500)
      .json({ message: "Server error while creating pet." });
  }
};

// Get pet by ID
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate(
      "postedBy",
      "name email"
    );
    if (!pet) return res.status(404).json({ message: "Pet not found." });
    res.json(pet);
  } catch (error) {
    console.error("Error fetching pet:", error);
    res.status(500).json({ message: "Server error while fetching pet." });
  }
};

// Update pet by ID (partial update)
exports.updatePet = async (req, res) => {
  try {
    const updateData = req.body;

    // Optional: Add validation here for enums and required fields if you want
    // For brevity, this example skips that but you can reuse validation from createPet

    const updatedPet = await Pet.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPet) return res.status(404).json({ message: "Pet not found." });
    res.json(updatedPet);
  } catch (error) {
    console.error("Error updating pet:", error);
    res.status(500).json({ message: "Server error while updating pet." });
  }
};

// Delete pet by ID
exports.deletePet = async (req, res) => {
  try {
    const deletedPet = await Pet.findByIdAndDelete(req.params.id);
    if (!deletedPet) return res.status(404).json({ message: "Pet not found." });
    res.json({ message: "Pet deleted successfully." });
  } catch (error) {
    console.error("Error deleting pet:", error);
    res.status(500).json({ message: "Server error while deleting pet." });
  }
};

// Get all pets with optional filters (example: species, status, city)
exports.getPets = async (req, res) => {
  try {
    const filters = {};
    if (req.query.species) filters.species = req.query.species;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.city) filters["location.city"] = req.query.city;

    const pets = await Pet.find(filters).populate("postedBy", "name email");
    res.json(pets);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({ message: "Server error while fetching pets." });
  }
};


exports.getPetsPaginated = async (req, res) => {
  try {
    const filters = {};
    if (req.query.species) filters.species = req.query.species;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.city) filters["location.city"] = req.query.city;

    // Extract pagination params from the request
    const paginationParams = new PaginationParameters(req).get();
    const options = {
      ...paginationParams[1], // includes page, limit, etc.
      populate: { path: "postedBy", select: "name email avatarUrl" },
    };

    const result = await Pet.paginate(filters, options);

    res.json(result);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({ message: "Server error while fetching pets." });
  }
};

// exports.getPetsByNearestLocation = async (req, res) => {
//   try {
//     const { longitude, latitude, maxDistance } = req.query;

//     if (!longitude || !latitude) {
//       return res
//         .status(400)
//         .json({ message: "longitude and latitude are required query params." });
//     }

//     const lng = parseFloat(longitude);
//     const lat = parseFloat(latitude);
//     const maxDist = maxDistance ? parseInt(maxDistance) : 5000; // default 5km

//     if (isNaN(lng) || isNaN(lat) || (maxDistance && isNaN(maxDist))) {
//       return res.status(400).json({
//         message: "Invalid longitude, latitude or maxDistance format.",
//       });
//     }

//     // Query pets sorted by nearest location
//     const pets = await Pet.find({
//       location: {
//         $near: {
//           $geometry: { type: "Point", coordinates: [lng, lat] },
//           $maxDistance: maxDist,
//         },
//       },
//       status: "available", // for example, only available pets
//     });

//     res.json(pets);
//   } catch (error) {
//     console.error("Error getting pets by location:", error);
//     res.status(500).json({ message: "Server error retrieving pets." });
//   }
// };



exports.getPetsByNearestLocation = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        message: "longitude and latitude are required query params.",
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDist = maxDistance ? parseInt(maxDistance) : 5000; // default 5km

    if (isNaN(lng) || isNaN(lat) || (maxDistance && isNaN(maxDist))) {
      return res.status(400).json({
        message: "Invalid longitude, latitude or maxDistance format.",
      });
    }

    // Build query and options for pagination
    const query = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDist,
        },
      },
      status: "available",
    };

    const paginationParams = new PaginationParameters(req).get();
    const options = {
      ...paginationParams[1], // page, limit, etc.
      forceCountFn: true, // required for $near queries
    };

    const result = await Pet.paginate(query, options);

    res.json(result);
  } catch (error) {
    console.error("Error getting pets by location:", error);
    res.status(500).json({ message: "Server error retrieving pets." });
  }
};
