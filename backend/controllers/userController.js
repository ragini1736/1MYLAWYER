import User from "../models/User.js";
import bcrypt from "bcryptjs";

/**
 * getProfile
 * ----------
 * Returns the logged-in user's profile data.
 *
 * Why .select("-password")?
 *   We never want to send the password hash to the frontend — not even
 *   the hash. .select("-password") tells Mongoose to fetch all fields
 *   EXCEPT password. The minus sign means "exclude this field".
 *
 * Where does req.user.id come from?
 *   authMiddleware decodes the JWT and sets req.user = { id, role }.
 *   So req.user.id is the authenticated user's MongoDB ObjectId.
 */
export const getProfile = async (req, res) => {
  try {
    // Find user by ID from JWT, exclude password field from result
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * updateProfile
 * -------------
 * Updates the logged-in user's name and phone number.
 *
 * Why only name and phone?
 *   Email is a unique identifier — changing it requires re-verification
 *   (email confirmation flow). That's a separate feature.
 *   Password change has its own security flow (changePassword below).
 *   Role cannot be changed by the user — only by an admin via DB.
 *
 * Why { new: true } in findByIdAndUpdate?
 *   By default, findByIdAndUpdate returns the document BEFORE the update.
 *   { new: true } tells Mongoose to return the document AFTER the update.
 *   Without it, you'd send the old data back to the frontend as "updated".
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Update only name and phone — nothing else
    // req.user.id comes from the JWT decoded by authMiddleware
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }         // Return the updated document, not the old one
    ).select("-password");  // Exclude password from the returned document

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * changePassword
 * --------------
 * Allows a logged-in user to change their own password.
 *
 * Why is this separate from updateProfile?
 *   Password change is a security-sensitive operation. It requires
 *   the user to PROVE they know their current password before setting
 *   a new one. updateProfile has no such verification — it just updates
 *   fields. Mixing security verification into a generic update function
 *   is poor architecture and a security risk.
 *
 * Flow:
 *  1. Extract currentPassword and newPassword from req.body
 *  2. Fetch the user WITH the password field (we need it for comparison)
 *  3. Compare currentPassword against the stored bcrypt hash
 *  4. If match: hash the newPassword and save it
 *  5. Return success
 *
 * Why do we fetch the user again instead of using req.user?
 *   req.user only has { id, role } from the JWT payload.
 *   We need the actual password hash from the database to compare.
 *   So we must do a fresh DB lookup — and we must NOT use .select("-password")
 *   because this is the one case we actually need the password field.
 *
 * Security note:
 *   The user ID comes from req.user.id (the JWT), NOT from req.body.
 *   This means a user can only change their OWN password.
 *   If we took userId from req.body, any logged-in user could change
 *   anyone else's password by passing a different ID — a critical exploit.
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Step 1: Validate both fields are present
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Step 2: Enforce minimum length on the new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Step 3: Prevent setting the same password again
    // This is a UX guard — there's no point "changing" to the same value
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Step 4: Fetch user WITH password field
    // We deliberately do NOT use .select("-password") here
    // because we need the hash to verify the current password
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 5: Verify current password against stored hash
    // bcrypt.compare(plainText, hash) → returns true or false
    // It re-hashes the plainText using the salt embedded in the stored hash,
    // then compares. This is why bcrypt is secure — you cannot reverse the hash.
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Step 6: Hash the new password before saving
    // Never save plain text. Always hash with the same salt rounds (10).
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Step 7: Update only the password field on this document
    // We use user.save() instead of findByIdAndUpdate here because
    // save() triggers any Mongoose pre-save hooks you might add later
    // (e.g., auto-hashing middleware). findByIdAndUpdate bypasses hooks.
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
