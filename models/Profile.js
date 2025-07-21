const mongoose = require("mongoose");

const petPreferenceSchema = new mongoose.Schema({
  species: {
    type: [String], // e.g., ['dog', 'cat']
    enum: ["dog", "cat", "rabbit", "bird", "reptile", "other"],
  },
  ageRange: {
    min: { type: Number, min: 0 },
    max: { type: Number },
  },
  size: {
    type: [String],
    enum: ["small", "medium", "large"],
  },
  goodWithKids: Boolean,
  goodWithOtherPets: Boolean,
  activityLevel: {
    type: String,
    enum: ["low", "medium", "high"],
  },
  specialNeedsOkay: Boolean,
  notes: {
    type: String,
  },
});

const ProfileSchema = new mongoose.Schema(
  {
    supaId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (v) {
            return Array.isArray(v) && v.length === 2;
          },
          message:
            "Coordinates must be an array of two numbers [longitude, latitude]",
        },
      },
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    petPreferences: petPreferenceSchema,
  },
  {
    timestamps: true,
  }
);


const Profile = mongoose.model("Profile", ProfileSchema);
module.exports = Profile;
