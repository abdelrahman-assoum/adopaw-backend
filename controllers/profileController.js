const Profile = require("../models/Profile");

exports.createProfile = async (req, res) => {
  try {
    const {
      supaId,
      email,
      name,
      avatarUrl,
      bio,
      phone,
      location,
      petPreferences,
    } = req.body;

    if (!supaId || !email) {
      return res
        .status(400)
        .json({ message: "'supaId' and 'email' are required." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    // Check if profile already exists for the given supaId
    const existingProfile = await Profile.findOne({ supaId: supaId });
    if (existingProfile) {
      return res
        .status(409)
        .json({ message: "Profile already exists for this supaId." });
    }

    // Validate optional fields
    if (name && typeof name !== "string") {
      return res.status(400).json({ message: "Name must be a string." });
    }

    if (avatarUrl && typeof avatarUrl !== "string") {
      return res.status(400).json({ message: "Avatar URL must be a string." });
    }
    if (bio && typeof bio !== "string") {
      return res.status(400).json({ message: "Bio must be a string." });
    }
    if (phone && typeof phone !== "string") {
      return res.status(400).json({ message: "Phone must be a string." });
    }

    // Validate location coordinates if provided
    if (location?.coordinates) {
      if (
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== "number" ||
        typeof location.coordinates[1] !== "number"
      ) {
        return res.status(400).json({
          message:
            "Location.coordinates must be [longitude, latitude] (numbers).",
        });
      }
    }

    const profile = new Profile({
      supaId,
      email,
      name,
      avatarUrl,
      bio,
      phone,
      location,
      petPreferences,
    });

    const savedProfile = await profile.save();
    res.status(201).json(savedProfile);
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Server error while creating profile." });
  }
};

exports.getProfileBySupaId = async (req, res) => {
  try {
    const { supaId } = req.params;

    const profile = await Profile.findOne({ supaId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { supaId } = req.params;
    const { email, supaId: bodySupaId, ...allowedFields } = req.body;

    const updatedProfile = await Profile.findOneAndUpdate(
      { supaId: supaId },
      allowedFields,
      { new: true, runValidators: true }
    );
    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found to update." });
    }

    res.status(200).json(updatedProfile);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const { supaId } = req.params;

    const deletedProfile = await Profile.findOneAndDelete({ supaId: supaId });
    if (!deletedProfile) {
      return res.status(404).json({ message: "Profile not found to delete." });
    }

    res.status(200).json({ message: "Profile deleted successfully." });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ message: "Server error while deleting profile." });
  }
};
