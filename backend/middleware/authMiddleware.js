import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Header se token lena
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // "Bearer token" me se sirf token nikalna
    const token = authHeader.split(" ")[1];

    // Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User id request me save karna
    req.user = decoded;

    // Route/controller ko aage chalne dena
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default verifyToken;