const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    species: {
      type: String,
      enum: ["dog", "cat", "rabbit", "bird", "reptile", "other"],
      required: true,
    },

    breed: String,

    gender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },

    age: {
      value: { type: Number, required: true, min: 0 },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        required: true,
        default: "months",
      },
    },

    color: {
      type: [String],
      default: [],
    },

    size: {
      type: String,
      enum: ["small", "medium", "large"],
    },

    activityLevel: {
      type: String,
      enum: ["low", "medium", "high"],
    },

    description: { type: String, trim: true },

    // Health & adoption-related flags
    sterilized: { type: Boolean },
    dewormed: { type: Boolean },
    hasPassport: { type: Boolean, default: false },
    specialNeeds: { type: Boolean, default: false },
    healthNotes: { type: String },

    // Images
    images: [String],

    // Adoption status
    status: {
      type: String,
      enum: ["available", "pending", "adopted", "removed"],
      default: "available",
    },

    // GeoJSON + readable location
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
          message: "Coordinates must be [longitude, latitude]",
        },
      },
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    // Reference to who posted this pet
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  },
  {
    timestamps: true,
  }
);

petSchema.plugin(mongoosePaginate);

// 2dsphere index for geospatial queries
petSchema.index({ location: "2dsphere" });

const Pet = mongoose.model("Pet", petSchema);
module.exports = Pet;
