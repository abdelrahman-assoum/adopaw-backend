const mongoose = require("mongoose");

const petPreferenceSchema = new mongoose.Schema({
  species: {
    type: [String], // e.g., ['dog', 'cat']
  },
  ageRange: {
    min: {
      value: { type: Number, required: true, min: 1 },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        required: true,
        default: "months",
      },
      max: {
        value: { type: Number, required: true, min: 1 },
        unit: {
          type: String,
          enum: ["days", "months", "years"],
          required: true,
          default: "months",
        },
      },
    },
  },
  colors: {
    type: [String],
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
      detailed: String,
    },

    petPreferences: petPreferenceSchema,
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("Profile", ProfileSchema);
module.exports = Profile;
