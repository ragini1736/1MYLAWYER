import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";




// Admin-specific controller functions
import {
  getDashboardStats,
  getRevenueAnalytics,
  getUsersReport,
  getAppointmentsReport,
  getCasesReport,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  deleteUser,
  getAllAdvocates,
  getAdvocateDetails,
  approveAdvocate,
  rejectAdvocate,
   
  
} from "../controllers/adminController.js";

// Legal Library
import {
  getLegalLibrary,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  incrementDownload,
  legalLibraryUpload,
} from "../controllers/legalLibraryController.js";

// Admin Notifications
import {
  getAdminNotifications,
  sendAdminNotification,
} from "../controllers/adminNotificationController.js";

// Reused from existing controllers — no duplication needed
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from "../controllers/appointmentController.js";
import {
   getAllCases,
  updateCaseStatus,
  assignAdvocateToCase,
} from "../controllers/caseController.js";
import { getAllDocuments, deleteDocument } from "../controllers/documentController.js";
import { getAllPayments } from "../controllers/paymentController.js";

// Advocate CRUD (uses AdvocateRoutes controller directly)
import {
  createAdvocate,
  updateAdvocate,
  deleteAdvocate,
  toggleAdvocateStatus,
} from "../controllers/advocateController.js";
import { advocateUpload } from "../middleware/advocateUploadMiddleware.js";

const router = express.Router();

// All routes below require: valid JWT token + role === "admin"
router.use(authMiddleware);
router.use(adminMiddleware);

// ── Analytics ──────────────────────────────────────────────
router.get("/stats",                getDashboardStats);
router.get("/reports/revenue",      getRevenueAnalytics);
router.get("/reports/users",        getUsersReport);
router.get("/reports/appointments", getAppointmentsReport);
router.get("/reports/cases",        getCasesReport);

// ── User Management ────────────────────────────────────────
router.get("/users",              getAllUsers);
router.get("/users/:userId",      getUserDetails);
router.put("/users/:userId/role", updateUserRole);
router.delete("/users/:userId",   deleteUser);

// ── Advocate Management ────────────────────────────────────
router.get("/advocates",                    getAllAdvocates);
router.get("/advocates/:advocateId",        getAdvocateDetails);
router.post("/advocates",                   advocateUpload.single("profilePhoto"), createAdvocate);
router.put("/advocates/:advocateId",        advocateUpload.single("profilePhoto"), updateAdvocate);
router.delete("/advocates/:advocateId",     deleteAdvocate);
router.patch("/advocates/:advocateId/toggle-status", toggleAdvocateStatus);
router.post("/advocates/:advocateId/approve", approveAdvocate);
router.post("/advocates/:advocateId/reject",  rejectAdvocate);


router.put(
  "/appointments/:id/status",
  updateAppointmentStatus
);





// ── Reused controllers ─────────────────────────────────────
router.get("/appointments", getAllAppointments);
router.delete("/appointments/:id", deleteAppointment);
router.get("/cases",        getAllCases);
router.put("/cases/:id/status", updateCaseStatus);   // admin updates case status
router.put("/cases/:id/assign", assignAdvocateToCase); // admin assigns advocate to case
router.get("/documents",    getAllDocuments);
router.delete("/documents/:id", deleteDocument);      // admin deletes any document
router.get("/payments",     getAllPayments);







// ── Legal Library ──────────────────────────────────────────
router.get("/legal-library",      getLegalLibrary);
router.post("/legal-library",     legalLibraryUpload.single("file"), createLegalDocument);
router.put("/legal-library/:id",  updateLegalDocument);
router.delete("/legal-library/:id", deleteLegalDocument);
// Download route — increments counter + serves file (admin access)
router.get("/legal-library/:id/download", incrementDownload);

// ── Notifications ───────────────────────────────────────────
// NOTE: /send must be registered BEFORE /:id to avoid Express
// treating "send" as an ObjectId parameter.
router.get("/notifications",      getAdminNotifications);
router.post("/notifications/send", sendAdminNotification);

export default router;
