import Case from "../models/Case.js";
import Advocate from "../models/Advocate.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { createNotification } from "../utils/notificationHelper.js";

/**
 * generateCaseNumber
 * ------------------
 * Private helper — not exported, only used inside this file.
 * Format: CASE-{year}-{random6digits}
 * Example: CASE-2026-482951
 *
 * WHY year prefix?
 *   Makes cases sortable and human-readable by year.
 *   "CASE-2026-482951" immediately tells you this case was opened in 2026.
 *
 * WHY random 6 digits (not sequential)?
 *   Sequential numbers are predictable — a user could guess
 *   another user's case number. Random numbers prevent enumeration.
 *   The unique: true constraint on the model is the final safety net
 *   in the extremely unlikely event of a collision.
 */
export const generateCaseNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000); // 6-digit: 100000-999999
  return `CASE-${year}-${random}`;
};

/**
 * createCase
 * ----------
 * Creates a new legal case for the logged-in user.
 * Protected route — requires valid JWT (authMiddleware).
 *
 * BUGS FIXED FROM ORIGINAL:
 *   ✅ userId now comes from req.user.id (JWT) — not from req.body
 *   ✅ caseNumber is auto-generated — not accepted from client
 *   ✅ Full input validation added
 *   ✅ Advocate existence verified before saving
 *   ✅ console.log("Case Controller Loaded") removed
 *
 * Auto-creates first timeline entry: "Case Created"
 */
export const createCase = async (req, res) => {
  try {
    const {
      advocateId, appointmentId, paymentId,
      caseTitle, clientName, category, caseType,
      courtName, description, filingDate,
      paymentAmount, paymentStatus, paymentDueDate
    } = req.body;

    // Validate required fields
    if (!advocateId || !caseTitle || !clientName || !category ||
        !caseType || !courtName || !description) {
      return res.status(400).json({
        success: false,
        message: "Required: advocateId, caseTitle, clientName, category, caseType, courtName, description",
      });
    }

    // Verify the advocate exists
    const advocate = await Advocate.findById(advocateId);
    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    // Fetch user's name for the timeline entry
    const user = await User.findById(req.user.id).select("name");

    // Auto-generate a unique case number
    let caseNumber = generateCaseNumber();
    // Collision guard — regenerate if the number already exists (extremely rare)
    let exists = await Case.findOne({ caseNumber });
    while (exists) {
      caseNumber = generateCaseNumber();
      exists = await Case.findOne({ caseNumber });
    }

    // Build the initial timeline event — auto-created on case creation
    const initialTimeline = [{
      event: "Case Created",
      description: `Case "${caseTitle}" created and assigned to Advocate ${advocate.fullName}`,
      performedBy: user?.name || "User",
      date: new Date(),
    }];

    const newCase = await Case.create({
      userId: req.user.id,        // ✅ FIXED: from JWT, never from req.body
      advocateId:advocateId,
      appointmentId: appointmentId || null,
      paymentId: paymentId || null,
      caseNumber,                 // ✅ FIXED: auto-generated, never from req.body
      caseTitle,
      clientName,
      category,
      caseType,
      courtName,
      description,
      filingDate: filingDate || new Date(),
      status: "Pending",
      timeline: initialTimeline,
      paymentAmount: paymentAmount || 0,
      paymentStatus: paymentStatus || "Pending",
      paymentDueDate: paymentDueDate || null,
    });

    const populated = await Case.findById(newCase._id)
      .populate("userId", "name email phone")
      .populate("advocateId", "fullName specialization fees");

    res.status(201).json({
      success: true,
      message: "Case created successfully",
      case: populated,
    });

    // Fire-and-forget — response already sent, notification runs in background
    // caseNumber and caseTitle are in scope — captured above before Case.create()
    createNotification({
      userId: req.user.id,
      type: "case_created",
      title: "Case Created",
      message: `Your case ${caseNumber} — "${caseTitle}" has been created and assigned to Adv. ${advocate.fullName}.`,
      referenceId: newCase._id,
      referenceModel: "Case",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getMyCases
 * ----------
 * Returns all cases belonging to the logged-in user.
 * Protected route — user only.
 *
 * Supports query parameters:
 *   ?status=Pending|In Progress|Hearing|Closed   → filter by status
 *   ?category=Civil Law|Criminal Law|...          → filter by category
 *   ?search=keyword                               → regex search on caseTitle + caseNumber
 *   ?page=1&limit=10                              → pagination (default: page 1, limit 10)
 *   ?sort=latest|oldest                           → sort by createdAt (default: latest)
 */
export const getMyCases = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10, sort = "latest" } = req.query;

    // Build query — always scoped to the logged-in user
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { caseTitle: { $regex: search, $options: "i" } },
        { caseNumber: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = sort === "oldest" ? 1 : -1; // latest = -1 (newest first)
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCases = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate("advocateId", "fullName specialization fees profileImage")
      .populate("paymentId")
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      totalCases,
      totalPages: Math.ceil(totalCases / limitNum),
      currentPage: pageNum,
      count: cases.length,
      cases,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getCaseById
 * -----------
 * Returns a single case by MongoDB ObjectId.
 * Protected route — user sees only their own; admin sees any.
 *
 * Fully populated: user, advocate, appointment, payment.
 * One request gives the frontend everything needed to render the case detail page.
 */
export const getCaseById = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("advocateId", "fullName specialization fees phone email profileImage")
      .populate("appointmentId", "service appointmentDate timeSlot status")
      .populate("paymentId", "amount status invoiceNumber paidAt");

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    // Ownership check — user can only view their own case; admin bypasses
    if (caseDoc.userId._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own cases.",
      });
    }

    res.status(200).json({ success: true, case: caseDoc });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * updateCaseStatus
 * ----------------
 * Admin updates the status of a case.
 * Protected route — admin only (enforced in routes).
 *
 * Auto-appends a "Status Changed" timeline entry with old and new status.
 * Validates the new status is one of the 4 allowed enum values.
 */

// ... (rest of the file is unchanged until updateCaseStatus)

export const updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "In Progress", "Hearing", "Closed"];

    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    const previousStatus = caseDoc.status;
    
    // --- Create a corresponding Payment record ---
    // ✅ FIXED: This operation is now wrapped in its own try-catch block.
    // A failure to create a payment record (e.g., due to old data) will
    // be logged but will NOT crash the entire case status update.
    try {
      if (
        previousStatus === "Pending" &&
        status === "In Progress" &&
        caseDoc.paymentAmount > 0 &&
        caseDoc.advocateId
      ) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        await Payment.create({
          userId: caseDoc.userId,
          advocateId: caseDoc.advocateId,
          caseId: caseDoc._id,
          serviceName: caseDoc.caseTitle,
          amount: caseDoc.paymentAmount * 100, // Rupees to paise
          dueDate: dueDate,
          status: "Pending",
        });
      }
    } catch (paymentError) {
      console.error(
        `❌ Warning: Failed to create payment record for case ${caseDoc._id}.`,
        paymentError
      );
      // Do not re-throw; allow the status update to proceed.
    }
    // -----------------------------------------


    // Append timeline event before saving
    caseDoc.timeline.push({
      event: "Status Changed",
      description: `Status changed from "${previousStatus}" to "${status}"`,
      performedBy: "Admin",
      date: new Date(),
    });

    caseDoc.status = status;
    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: `Case status updated to "${status}"`,
      case: caseDoc,
    });

    // previousStatus is already captured above — reuse it in the message
    // userId comes from caseDoc — notifies the case owner, not the admin making the change
    createNotification({
      userId: caseDoc.userId,
      type: "case_status_changed",
      title: "Case Status Updated",
      message: `Your case ${caseDoc.caseNumber} status has changed from "${previousStatus}" to "${status}".`,
      referenceId: caseDoc._id,
      referenceModel: "Case",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * addHearingDate
 * --------------
 * Admin schedules a new hearing date for a case.
 * Protected route — admin only.
 *
 * Actions performed:
 *   1. Validates the date is not in the past
 *   2. Pushes the new date to hearingDates array (preserves full history)
 *   3. Updates nextHearingDate to the new date
 *   4. Advances status to "Hearing" if still Pending or In Progress
 *   5. Appends "Hearing Scheduled" timeline event
 */
export const addHearingDate = async (req, res) => {
  try {
    const { hearingDate } = req.body;

    if (!hearingDate) {
      return res.status(400).json({ success: false, message: "hearingDate is required" });
    }

    const newHearingDate = new Date(hearingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newHearingDate < today) {
      return res.status(400).json({ success: false, message: "Hearing date cannot be in the past" });
    }

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    // Push to hearing history array
    caseDoc.hearingDates.push(newHearingDate);
    // Update the quick-access next hearing field
    caseDoc.nextHearingDate = newHearingDate;

    // Auto-advance status if case hasn't reached Hearing stage yet
    if (["Pending", "In Progress"].includes(caseDoc.status)) {
      caseDoc.status = "Hearing";
    }

    // Append timeline event
    caseDoc.timeline.push({
      event: "Hearing Scheduled",
      description: `Hearing scheduled for ${newHearingDate.toDateString()}`,
      performedBy: "Admin",
      date: new Date(),
    });

    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: "Hearing date added successfully",
      case: caseDoc,
    });

    // newHearingDate is in scope — .toDateString() gives "Sat Sep 20 2026"
    // caseDoc.userId notifies the case owner
    createNotification({
      userId: caseDoc.userId,
      type: "hearing_scheduled",
      title: "Hearing Scheduled",
      message: `A hearing has been scheduled for ${newHearingDate.toDateString()} in your case ${caseDoc.caseNumber}.`,
      referenceId: caseDoc._id,
      referenceModel: "Case",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * addCaseNote
 * -----------
 * Adds a note to the case. Available to both users (own cases) and admins (any case).
 *
 * Ownership check:
 *   Regular users can only add notes to their own cases.
 *   Admins can add notes to any case.
 *
 * Auto-appends "Note Added" timeline event.
 * Stores who added the note and their role for display purposes.
 */
export const addCaseNote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    // Ownership check — user can only add notes to their own cases
    if (caseDoc.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only add notes to your own cases.",
      });
    }

    // Fetch the note author's name from the DB
    const author = await User.findById(req.user.id).select("name");

    const newNote = {
      text: text.trim(),
      addedBy: author?.name || "Unknown",
      addedByRole: req.user.role,
      date: new Date(),
    };

    caseDoc.notes.push(newNote);

    // Append timeline event
    caseDoc.timeline.push({
      event: "Note Added",
      description: `Note added by ${req.user.role === "admin" ? "Admin" : author?.name}`,
      performedBy: author?.name || "User",
      date: new Date(),
    });

    await caseDoc.save();

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      note: caseDoc.notes[caseDoc.notes.length - 1],
      case: caseDoc,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * closeCase
 * ---------
 * Admin closes a case. Only non-closed cases can be closed.
 * Auto-appends "Case Closed" timeline entry.
 * Protected route — admin only.
 */
export const closeCase = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (caseDoc.status === "Closed") {
      return res.status(400).json({ success: false, message: "Case is already closed" });
    }

    caseDoc.timeline.push({
      event: "Case Closed",
      description: `Case closed from status "${caseDoc.status}"`,
      performedBy: "Admin",
      date: new Date(),
    });

    caseDoc.status = "Closed";
    await caseDoc.save();

    res.status(200).json({ success: true, message: "Case closed successfully", case: caseDoc });

    // Notify the case owner their case has been closed
    createNotification({
      userId: caseDoc.userId,
      type: "case_status_changed",
      title: "Case Closed",
      message: `Your case ${caseDoc.caseNumber} — "${caseDoc.caseTitle}" has been closed.`,
      referenceId: caseDoc._id,
      referenceModel: "Case",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * reopenCase
 * ----------
 * Admin reopens a closed case. Only "Closed" cases can be reopened.
 * Status resets to "In Progress".
 * Auto-appends "Case Reopened" timeline entry.
 * Protected route — admin only.
 */
export const reopenCase = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (caseDoc.status !== "Closed") {
      return res.status(400).json({
        success: false,
        message: `Only closed cases can be reopened. Current status: "${caseDoc.status}"`,
      });
    }

    caseDoc.timeline.push({
      event: "Case Reopened",
      description: "Closed case reopened and set to In Progress",
      performedBy: "Admin",
      date: new Date(),
    });

    caseDoc.status = "In Progress";
    await caseDoc.save();

    res.status(200).json({ success: true, message: "Case reopened successfully", case: caseDoc });

    // Notify the case owner their case has been reopened
    createNotification({
      userId: caseDoc.userId,
      type: "case_status_changed",
      title: "Case Reopened",
      message: `Your case ${caseDoc.caseNumber} — "${caseDoc.caseTitle}" has been reopened and is now In Progress.`,
      referenceId: caseDoc._id,
      referenceModel: "Case",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * assignAdvocateToCase
 * --------------------
 * Admin re-assigns a case to a different advocate.
 * Protected route — admin only.
 *
 * Actions:
 *   1. Validates advocateId is provided.
 *   2. Verifies both case and new advocate exist.
 *   3. Updates case.advocateId.
 *   4. Appends "Advocate Reassigned" to the timeline.
 *   5. Notifies the user of the change.
 */
export const assignAdvocateToCase = async (req, res) => {
  try {
    const { advocateId } = req.body;
    const { id: caseId } = req.params;

    if (!advocateId) {
      return res.status(400).json({ success: false, message: "advocateId is required" });
    }

    const [caseDoc, newAdvocate] = await Promise.all([
      Case.findById(caseId).populate("advocateId", "fullName"),
      Advocate.findById(advocateId).select("fullName"),
    ]);

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }
    if (!newAdvocate) {
      return res.status(404).json({ success: false, message: "New advocate not found" });
    }
    
    const oldAdvocateName = caseDoc.advocateId?.fullName || "N/A";

    if (caseDoc.advocateId?._id.toString() === newAdvocate._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: `Case is already assigned to ${newAdvocate.fullName}` 
      });
    }

    caseDoc.advocateId = newAdvocate._id;

    caseDoc.timeline.push({
      event: "Advocate Reassigned",
      description: `Case reassigned from Adv. ${oldAdvocateName} to Adv. ${newAdvocate.fullName}.`,
      performedBy: "Admin",
      date: new Date(),
    });

    await caseDoc.save();
    
    const populatedCase = await Case.findById(caseId)
      .populate("userId", "name email phone")
      .populate("advocateId", "fullName specialization fees phone email profileImage");

    res.status(200).json({
      success: true,
      message: `Case assigned to ${newAdvocate.fullName}`,
      case: populatedCase,
    });

    createNotification({
      userId: caseDoc.userId,
      type: "case_advocate_changed",
      title: "Advocate Changed",
      message: `Advocate for your case ${caseDoc.caseNumber} has been changed to ${newAdvocate.fullName}.`,
      referenceId: caseDoc._id,
      referenceModel: "Case",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getAllCases
 * -----------
 * Admin-only: Returns all cases in the system with full filtering,
 * search, sorting, and pagination.
 *
 * Supports all query params simultaneously:
 *   ?status=Pending|In Progress|Hearing|Closed
 *   ?category=Civil Law|...
 *   ?advocateId=<ObjectId>      → all cases for a specific advocate
 *   ?userId=<ObjectId>          → all cases for a specific user
 *   ?search=keyword             → regex on caseTitle, caseNumber, clientName
 *   ?page=1&limit=10            → pagination
 *   ?sort=latest|oldest
 */
export const getAllCases = async (req, res) => {
  try {
    const {
      status, category, advocateId, userId,
      search, page = 1, limit = 10, sort = "latest",
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (advocateId) query.advocateId = advocateId;
    if (userId) query.userId = userId;
    if (search) {
      query.$or = [
        { caseTitle: { $regex: search, $options: "i" } },
        { caseNumber: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = sort === "oldest" ? 1 : -1;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalCases = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate("advocateId", "fullName specialization fees")
       .populate("userId", "name email phone")
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      totalCases,
      totalPages: Math.ceil(totalCases / limitNum),
      currentPage: pageNum,
      count: cases.length,
      cases,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getCasesByAdvocate
 * ------------------
 * Admin-only: Returns all cases assigned to a specific advocate.
 * Used in the admin dashboard advocate management view.
 */
export const getCasesByAdvocate = async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.advocateId);
    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    const cases = await Case.find({ advocateId: req.params.advocateId })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      advocate: { name: advocate.fullName, specialization: advocate.specialization },
      count: cases.length,
      cases,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getCaseTimeline
 * ---------------
 * Returns only the timeline array for a specific case.
 * User/admin — ownership check applied.
 *
 * WHY a separate endpoint?
 *   The timeline tab on the frontend only needs the timeline array.
 *   Fetching the entire case document (with all notes, hearing dates, etc.)
 *   just to render a timeline is wasteful.
 *   This endpoint returns only what the timeline tab needs.
 */
export const getCaseTimeline = async (req, res) => {
  try {
    const caseDoc = await Case.findById(req.params.id).select("userId timeline caseTitle caseNumber");

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    if (caseDoc.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own case timeline.",
      });
    }

    res.status(200).json({
      success: true,
      caseNumber: caseDoc.caseNumber,
      caseTitle: caseDoc.caseTitle,
      timeline: caseDoc.timeline,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




