import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "1MyLawyer",
    },

    contactEmail: {
      type: String,
      default: "admin@1mylawyer.com",
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    allowRegistration: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SiteSettings", siteSettingsSchema);