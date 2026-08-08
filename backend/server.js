import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import AppointmentRoutes from "./routes/AppointmentRoutes.js";
import AdvocateRoutes from "./routes/AdvocateRoutes.js";
import CaseRoutes from "./routes/CaseRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import legalLibraryRoutes from "./routes/legalLibraryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";



// ─────────────────────────────────────────────
// 0. ES MODULE PATH SETUP
// ─────────────────────────────────────────────
// __dirname is not available in ES modules.
// This is the standard workaround to get the current directory path.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ─────────────────────────────────────────────
// 1. LOAD ENVIRONMENT VARIABLES
// ─────────────────────────────────────────────
dotenv.config();

// ─────────────────────────────────────────────
// 2. CREATE EXPRESS APP + HTTP SERVER
// ─────────────────────────────────────────────
const app = express();

/**
 * WHY createServer(app) instead of app.listen()?
 *
 * Socket.io attaches to a Node.js HTTP server, not an Express app.
 * createServer(app) wraps Express inside a native HTTP server.
 * Both REST requests AND WebSocket upgrade requests arrive on port 5000.
 *   HTTP requests  → Express handles them (all REST routes)
 *   WS upgrades    → Socket.io intercepts them (real-time chat)
 * One port. Two protocols. Both working simultaneously.
 */
const httpServer = createServer(app);


  

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


 


// ─────────────────────────────────────────────
// 3. GLOBAL MIDDLEWARE
// ─────────────────────────────────────────────

// cors() allows cross-origin requests from the React frontend.
// Without this, the browser blocks all API calls from localhost:5173 to localhost:5000.
// In production, replace cors() with cors({ origin: "https://yourdomain.com" })
// to restrict which domains can call your API.
app.use(cors());

// express.json() parses incoming requests with JSON bodies.
// Without this, req.body is undefined on POST/PUT requests.
// Must be registered before any routes that read req.body.
app.use(express.json());

// ─────────────────────────────────────────────
// 4. STATIC FILE SERVING — uploads folder
// ─────────────────────────────────────────────
// Serves uploaded files directly from disk.
// Must be registered BEFORE routes and the 404 handler.
//
// URL pattern → disk path:
//   /uploads/documents/filename.pdf
//     → backend/uploads/documents/filename.pdf
//   /uploads/legal-library/filename.pdf
//     → backend/uploads/legal-library/filename.pdf
//
// The broad /uploads mount is a safety fallback — it catches any
// sub-path under /uploads without needing to enumerate every folder.

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    // Set correct MIME types and allow range requests (needed for PDF preview)
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);


// ─────────────────────────────────────────────
// 5. CONNECT TO MONGODB
// ─────────────────────────────────────────────
// Calling connectDB() here (not inside a route) ensures the DB
// connection is established once at startup before any request arrives.
// connectDB() is async but we don't await it at the top level —
// Express starts accepting requests immediately while the connection
// establishes in the background. If it fails, connectDB calls process.exit(1).
connectDB();

// ─────────────────────────────────────────────
// 6. HEALTH CHECK ROUTE
// ─────────────────────────────────────────────
// A simple GET / route used to verify the server is running.
// Returns JSON (consistent with every other endpoint in the app).
// Monitoring tools, Docker health checks, and load balancers ping this route.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "1MyLawyer API is running",
  });
});

// ─────────────────────────────────────────────
// 7. API ROUTES
// ─────────────────────────────────────────────
// Each app.use() call mounts a router at a base path.
// Express strips the base path before passing the request to the router.
// Example: POST /api/auth/login → authRoutes handles /login
app.use("/api/auth", authRoutes);                    // Register, Login
app.use("/api/user", userRoutes);                    // Profile, Update Profile, Change Password
app.use("/api/appointments", AppointmentRoutes);     // Full Appointment Management
app.use("/api/advocates", AdvocateRoutes);           // Advocate CRUD + Search + Filter
app.use("/api/cases", CaseRoutes);                   // Case Tracker
app.use("/api/payments", paymentRoutes);             // Razorpay Payments + Receipts
app.use("/api/documents", documentRoutes);           // Document Vault + File Upload
app.use("/api/notifications", notificationRoutes);   // Notification System
app.use("/api/admin", adminRoutes);  
app.use("/api/legal-library",legalLibraryRoutes);    
app.use("/api/contact",contactRoutes);        // Admin Dashboard + Analytics
app.use("/api/admin/settings", adminSettingsRoutes);
// ─────────────────────────────────────────────
// 8. 404 HANDLER — Unknown Routes
// ─────────────────────────────────────────────
// This runs when no route above matched the incoming request.
// Without this, Express returns an ugly HTML "Cannot GET /xyz" page.
// Must be registered AFTER all valid routes.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─────────────────────────────────────────────
// 9. GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
// Express identifies this as an error handler because it has FOUR parameters.
// The first parameter is the error object — this is the Express convention.
// Any middleware or controller that calls next(error) lands here.
//
// Why is this needed?
//   Without it, unhandled errors either crash the server or send an
//   HTML stack trace to the client — both are unacceptable in production.
//   This catches everything and always sends a clean JSON response.
//
// Must be registered LAST — after all routes and the 404 handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log the full stack trace on the server for debugging
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);

  // Send a clean JSON error response to the client
  // err.status allows controllers to set a specific status code via: const err = new Error("msg"); err.status = 400; next(err);
  // Falls back to 500 Internal Server Error if no status was set
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─────────────────────────────────────────────
// 10. START THE SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

/**
 * httpServer.listen() — NOT app.listen()
 *
 * The HTTP server (not Express) must bind to the port.
 * If app.listen() stayed here, Socket.io would never receive
 * WebSocket connections — they'd arrive on a separate server instance
 * that has no Socket.io attached.
 */
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, "uploads")}`);
});