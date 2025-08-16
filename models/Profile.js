const mongoose = require("mongoose");

const petPreferenceSchema = new mongoose.Schema({
  species: {
    type: [String], // e.g., ['dog', 'cat']
  },
  gender: {
    type: [String],
  },
  ageRange: {
    min: {
      value: { type: Number },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
      },
      max: {
        value: { type: Number },
        unit: {
          type: String,
          enum: ["days", "months", "years"],
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
