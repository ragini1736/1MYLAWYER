import express from "express";
import { registerUser,loginUser } from "../controllers/authControllers.js";

const router = express.Router();

// Register Route

router.post("/register", registerUser);
router.post("/login",loginUser);

export default router;