import SiteSettings from "../models/SiteSettings.js";

// GET /api/admin/settings
export const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();

    // Agar settings pehle se nahi hain
    if (!settings) {
      settings = await SiteSettings.create({
        siteName: "1MyLawyer",
        contactEmail: "admin@1mylawyer.com",
        maintenanceMode: false,
        allowRegistration: true,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// PUT /api/admin/settings
export const updateSiteSettings = async (req, res) => {
  try {
    const {
      siteName,
      contactEmail,
      maintenanceMode,
      allowRegistration,
    } = req.body;

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      {
        siteName,
        contactEmail,
        maintenanceMode,
        allowRegistration,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Site settings updated successfully",
      settings,
    });

  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};