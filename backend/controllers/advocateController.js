/**
 * advocateController.js
 * ──────────────────────
 * All Advocate CRUD operations.
 *
 * PUBLIC routes (no auth):
 *   GET /api/advocates          — only isActive=true advocates
 *   GET /api/advocates/:id      — single advocate (any status)
 *
 * ADMIN routes (auth + admin middleware):
 *   POST   /api/advocates                    — create with photo upload
 *   PUT    /api/advocates/:id                — edit with optional photo
 *   DELETE /api/advocates/:id                — hard delete (blocks if future appts exist)
 *   PATCH  /api/advocates/:id/toggle-status  — toggle isActive true/false
 */

import Advocate    from "../models/Advocate.js";
import Appointment from "../models/Appointment.js";
import fs          from "fs";

/* ── shared param helper ─────────────────────────────────────
   Routes use :id (public) or :advocateId (admin).
   This resolves whichever param is present.                  */
const resolveId = (req) => req.params.id || req.params.advocateId;


/* ═══════════════════════════════════════════════════════════
   PUBLIC: getAllAdvocates
   Only isActive=true advocates are returned to the public site
   and appointment dropdown.
═══════════════════════════════════════════════════════════ */
export const getAllAdvocates = async (req, res) => {
  try {
    const { search, specialization, availability, isActive } = req.query;

    const query = {};

    /* Public calls never pass isActive — always restrict to active only.
       Admin list endpoint passes isActive=all to see everyone. */
    if (isActive === "all") {
      /* no isActive filter — admin sees all */
    } else {
      query.isActive = true;   // default: public only sees active
    }

    if (search) {
      query.$or = [
        { fullName:    { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
        { barCouncilNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (specialization) query.specialization = specialization;
    if (availability)   query.availability   = availability;

    const advocates = await Advocate.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: advocates.length, advocates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ═══════════════════════════════════════════════════════════
   PUBLIC: getAdvocateById
═══════════════════════════════════════════════════════════ */
export const getAdvocateById = async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.id);
    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }
    res.status(200).json({ success: true, advocate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ═══════════════════════════════════════════════════════════
   ADMIN: createAdvocate
   Accepts multipart/form-data (profile photo via multer).
═══════════════════════════════════════════════════════════ */
export const createAdvocate = async (req, res) => {
  try {
    const {
      fullName, email, phone, specialization, experience,
      qualification, location, fees, about, availability,
      barCouncilNumber, languages, isActive,
    } = req.body;

    const required = ["fullName","email","phone","specialization",
                      "experience","qualification","location","fees","about"];
    for (const k of required) {
      if (!req.body[k]?.toString().trim()) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: `${k} is required` });
      }
    }

    const existing = await Advocate.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        message: "An advocate with this email already exists",
      });
    }

    const profileImage = req.file
      ? "/" + req.file.path.replace(/\\/g, "/")
      : "";

    /* languages can arrive as JSON string or array */
    let parsedLanguages = ["English", "Hindi"];
    if (languages) {
      try { parsedLanguages = typeof languages === "string" ? JSON.parse(languages) : languages; }
      catch { parsedLanguages = languages.split(",").map((l) => l.trim()).filter(Boolean); }
    }

    const advocate = await Advocate.create({
      fullName:         fullName.trim(),
      email:            email.toLowerCase().trim(),
      phone,
      specialization,
      experience:       Number(experience),
      qualification,
      location,
      fees:             Number(fees),
      about,
      profileImage,
      availability:     availability     || "Available",
      barCouncilNumber: barCouncilNumber || "",
      languages:        parsedLanguages,
      isActive:         isActive === "false" ? false : true,
    });

    res.status(201).json({ success: true, message: "Advocate created successfully", advocate });
  } catch (error) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ═══════════════════════════════════════════════════════════
   ADMIN: updateAdvocate
   Supports partial updates + optional new profile photo.
═══════════════════════════════════════════════════════════ */
export const updateAdvocate = async (req, res) => {
  try {
    const id = resolveId(req);
    const existing = await Advocate.findById(id);
    if (!existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    const updates = {};
    const textFields = [
      "fullName","email","phone","specialization","qualification",
      "location","about","availability","barCouncilNumber",
    ];
    textFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    if (req.body.experience !== undefined) updates.experience = Number(req.body.experience);
    if (req.body.fees       !== undefined) updates.fees       = Number(req.body.fees);
    if (req.body.isActive   !== undefined) updates.isActive   = req.body.isActive !== "false";

    if (req.body.languages !== undefined) {
      try {
        updates.languages = typeof req.body.languages === "string"
          ? JSON.parse(req.body.languages)
          : req.body.languages;
      } catch {
        updates.languages = req.body.languages.split(",").map((l) => l.trim()).filter(Boolean);
      }
    }

    if (req.file) {
      updates.profileImage = "/" + req.file.path.replace(/\\/g, "/");
      if (existing.profileImage) {
        const old = existing.profileImage.replace(/^\//, "");
        try { if (fs.existsSync(old)) fs.unlinkSync(old); } catch (_) {}
      }
    }

    const advocate = await Advocate.findByIdAndUpdate(id, updates, {
      new: true, runValidators: true,
    });

    res.status(200).json({ success: true, message: "Advocate updated successfully", advocate });
  } catch (error) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ═══════════════════════════════════════════════════════════
   ADMIN: deleteAdvocate
   Guards against deletion when future appointments exist.
   Suggests deactivating instead.
═══════════════════════════════════════════════════════════ */
export const deleteAdvocate = async (req, res) => {
  try {
    const id = resolveId(req);
    if (!id) return res.status(400).json({ success: false, message: "Advocate id required" });

    const advocate = await Advocate.findById(id);
    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    /* Guard: block delete if future (pending/approved) appointments exist */
    const futureApptCount = await Appointment.countDocuments({
      advocateId: advocate._id,
      status:     { $in: ["Pending", "Approved"] },
      appointmentDate: { $gte: new Date() },
    });

    if (futureApptCount > 0) {
      return res.status(409).json({
        success: false,
        code:    "HAS_FUTURE_APPOINTMENTS",
        message: `This advocate has ${futureApptCount} upcoming appointment(s). Please deactivate instead of deleting, or cancel/reject the appointments first.`,
        futureAppointments: futureApptCount,
      });
    }

    /* Safe to delete */
    await Advocate.findByIdAndDelete(id);

    /* Clean up profile photo from disk */
    if (advocate.profileImage) {
      const filePath = advocate.profileImage.replace(/^\//, "");
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
    }

    res.status(200).json({ success: true, message: "Advocate deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ═══════════════════════════════════════════════════════════
   ADMIN: toggleAdvocateStatus
   PATCH /api/advocates/:id/toggle-status
   Flips isActive between true and false.
   Inactive advocates are hidden from the public site immediately.
═══════════════════════════════════════════════════════════ */
export const toggleAdvocateStatus = async (req, res) => {
  try {
    const id = resolveId(req);
    const advocate = await Advocate.findById(id);
    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    advocate.isActive = !advocate.isActive;
    await advocate.save();

    res.status(200).json({
      success:   true,
      message:   `Advocate ${advocate.isActive ? "activated" : "deactivated"} successfully`,
      isActive:  advocate.isActive,
      advocate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
