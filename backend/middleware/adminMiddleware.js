/**
 * adminMiddleware.js
 * ------------------
 * PURPOSE:
 *   Checks that the already-authenticated user has the "admin" role.
 *   This middleware ALWAYS runs AFTER authMiddleware in the route chain.
 *
 * WHY A SEPARATE FILE?
 *   authMiddleware answers: "Is this user logged in?"
 *   adminMiddleware answers: "Is this logged-in user an admin?"
 *   Two separate concerns = two separate middlewares. Single Responsibility Principle.
 *
 * USAGE IN ROUTES:
 *   import authMiddleware from "../middleware/authMiddleware.js";
 *   import adminMiddleware from "../middleware/adminMiddleware.js";
 *
 *   router.get("/stats", authMiddleware, adminMiddleware, getDashboardStats);
 *
 *   Request flow:
 *     1. authMiddleware  → verifies JWT, sets req.user = { id, role }
 *     2. adminMiddleware → checks req.user.role === "admin"
 *     3. Controller      → runs only if both pass
 *
 * WHY IS req.user.role AVAILABLE HERE?
 *   Because in Task 3 we added role to the JWT payload:
 *     jwt.sign({ id: user._id, role: user.role }, ...)
 *   authMiddleware decodes the token and sets req.user = decoded.
 *   So req.user.role is available without any extra DB query.
 *   This is called "stateless authorization" — fast, scalable, no DB hit.
 */

const adminMiddleware = (req, res, next) => {
  // req.user is set by authMiddleware which must run before this
  // If somehow this runs without authMiddleware, req.user will be undefined
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please login first.",
    });
  }

  // Check the role from the decoded JWT payload
  // Only "admin" role is allowed past this point
  if (req.user.role !== "admin") {
    // 403 Forbidden — the user IS authenticated but does NOT have permission
    // Difference from 401:
    //   401 Unauthorized = not logged in (identity unknown)
    //   403 Forbidden    = logged in but access denied (identity known, no permission)
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  // Role is "admin" — allow the request to proceed to the controller
  next();
};

export default adminMiddleware;
