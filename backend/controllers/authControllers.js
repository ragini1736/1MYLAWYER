import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * registerUser
 * ------------
 * Creates a new user account.
 *
 * Flow:
 *  1. Validate all required fields are present
 *  2. Check the email is not already registered
 *  3. Hash the plain-text password with bcrypt
 *  4. Save the new user to MongoDB
 *  5. Return the user object — with password stripped out
 *
 * Why do we NOT return a JWT token here?
 *   Industry standard is: register → redirect to login → login returns token.
 *   Returning a token on register would auto-login the user, which bypasses
 *   any email verification step you might add later.
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Step 1: Check all fields are present
    // We validate in the controller, not just rely on Mongoose,
    // because we want a clean JSON response — not a Mongoose validation error object.
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Step 2: Check for duplicate email
    // findOne is faster than find() — stops at the first match
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // ✅ FIXED: 409 Conflict is semantically correct here.
      // 400 Bad Request = the request itself is malformed.
      // 409 Conflict = the request is valid BUT conflicts with existing data.
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Step 3: Hash the password
    // bcrypt.hash(plainText, saltRounds)
    // saltRounds = 10 is the industry standard.
    //   - Too low (< 8): fast to crack with brute force
    //   - Too high (> 12): slows down every login noticeably
    // bcrypt automatically generates a unique salt and embeds it in the hash,
    // so two users with the same password will have different hashes.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Create and save the user document
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword, // NEVER store plain text
    });

    // Step 5: Strip password before sending response
    // user.toObject() converts the Mongoose document to a plain JS object
    // so we can use destructuring to remove the password field.
    // ✅ FIXED: original code sent the full user object including the hashed password.
    const { password: _removed, ...userData } = user.toObject();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userData, // password field is not present here
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * loginUser
 * ---------
 * Authenticates a user and returns a signed JWT.
 *
 * Flow:
 *  1. Validate email and password are present
 *  2. Find the user by email
 *  3. Compare the submitted password against the stored bcrypt hash
 *  4. Sign a JWT containing id AND role
 *  5. Return the token + safe user data (no password)
 *
 * Why include role in the JWT payload?
 *   The admin middleware reads req.user.role from the decoded token.
 *   If role is not in the token, every admin route would need a
 *   DB query to check: "is this user an admin?" — one extra DB hit
 *   on every single protected request. Embedding role in the token
 *   makes that check instant and stateless.
 *
 * Why are both "user not found" and "wrong password" the same message?
 *   Security practice called "credential stuffing prevention".
 *   If we say "user not found", an attacker knows that email doesn't exist
 *   and can move on. Keeping the message vague prevents email enumeration.
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Step 2: Find user by email
    // We do NOT use .select("-password") here because we need the
    // hashed password in Step 3 to compare against the submitted password.
    const user = await User.findOne({ email });

    if (!user) {
      // ✅ FIXED: 401 Unauthorized, not 400 Bad Request.
      // The request format is fine — it's the credentials that are wrong.
      return res.status(401).json({
        success: false,
        message: "Invalid email or password", // Vague on purpose — security best practice
      });
    }

    // Step 3: Compare plain-text password against the stored bcrypt hash
    // bcrypt.compare() extracts the salt from the stored hash, re-hashes
    // the submitted password with the same salt, then compares the results.
    // This is why bcrypt is secure — even with the hash, you can't reverse it.
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password", // Same message as above — intentional
      });
    }

    // Step 4: Sign the JWT
    // Payload: { id, role }
    //   id   — used in protected routes to fetch the user: User.findById(req.user.id)
    //   role — used in admin middleware to check access without a DB query
    // ✅ FIXED: original token only had { id } — role was missing
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days — user must re-login after that
    );

    // Step 5: Send response — never include password in the response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
