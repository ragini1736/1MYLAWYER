import User from "../models/User.js";
import Advocate from "../models/Advocate.js";
import Appointment from "../models/Appointment.js";
import Case from "../models/Case.js";
import Payment from "../models/Payment.js";
import Document from "../models/Document.js";
import Notification from "../models/Notification.js";

/**
 * getDashboardStats
 * -----------------
 * Returns all top-level counts and revenue in one response.
 * Powers the main admin dashboard card widgets.
 *
 * WHY Promise.all()?
 *   Running 8 DB queries sequentially = 8× the latency.
 *   Promise.all() fires all queries simultaneously — total time equals
 *   the slowest single query, not the sum. Standard dashboard pattern.
 *
 * Revenue calculation:
 *   Payment.amount is stored in paise. $divide by 100 inside the
 *   aggregation pipeline converts to rupees server-side — client
 *   always receives rupees, never raw paise.
 */
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Run all queries in parallel — not sequentially
    const [
      totalUsers,
      totalAdvocates,
      totalAppointments,
      totalCases,
      totalDocuments,
      newUsersThisMonth,
      newAppointmentsThisMonth,
      revenueResult,
      appointmentsByStatus,
      casesByStatus,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Advocate.countDocuments(),
      Appointment.countDocuments(),
      Case.countDocuments(),
      Document.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: "user", createdAt: { $gte: monthStart } }),
      Appointment.countDocuments({ createdAt: { $gte: monthStart } }),

      // Total revenue from Paid payments — sum and convert paise → rupees
      Payment.aggregate([
        { $match: { status: "Paid" } },
        { $group: {
          _id: null,
          totalPaise: { $sum: "$amount" },
          count: { $sum: 1 },
        }},
        { $project: {
          _id: 0,
          totalRevenueRupees: { $divide: ["$totalPaise", 100] },
          count: 1,
        }},
      ]),

      // Appointment counts broken down by status
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),

      // Case counts broken down by status
      Case.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        advocates: {
          total: totalAdvocates,
        },
        appointments: {
          total: totalAppointments,
          newThisMonth: newAppointmentsThisMonth,
          byStatus: appointmentsByStatus,
        },
        cases: {
          total: totalCases,
          byStatus: casesByStatus,
        },
        documents: {
          total: totalDocuments,
        },
        revenue: {
          totalRupees: revenueResult[0]?.totalRevenueRupees || 0,
          totalPaidPayments: revenueResult[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getRevenueAnalytics
 * -------------------
 * Returns monthly revenue for the last 12 months.
 * Powers the revenue chart on the admin dashboard.
 *
 * MongoDB $dateToString formats the date into "YYYY-MM" for grouping.
 * This groups all payments in the same month together regardless of day.
 *
 * $divide converts paise → rupees inside the pipeline.
 * Frontend receives rupees directly — no conversion needed client-side.
 *
 * The result is sorted by month ascending so chart libraries
 * (Chart.js, Recharts) receive data in chronological order.
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "Paid",
          paidAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            // Format: "2026-07" — groups all payments in the same month
            month: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          },
          revenueRupees: { $sum: { $divide: ["$amount", 100] } },
          paymentCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          revenueRupees: { $round: ["$revenueRupees", 2] },
          paymentCount: 1,
        },
      },
      { $sort: { month: 1 } }, // Chronological order for chart display
    ]);

    // Also return total and average for summary cards
    const summary = await Payment.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: null,
          totalRupees: { $sum: { $divide: ["$amount", 100] } },
          totalCount: { $sum: 1 },
          avgRupees: { $avg: { $divide: ["$amount", 100] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalRupees: { $round: ["$totalRupees", 2] },
          totalCount: 1,
          avgRupees: { $round: ["$avgRupees", 2] },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      summary: summary[0] || { totalRupees: 0, totalCount: 0, avgRupees: 0 },
      monthlyRevenue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getUsersReport
 * --------------
 * New user registrations grouped by month for the last 12 months.
 * Powers the "User Growth" chart on the admin dashboard.
 */
export const getUsersReport = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [monthlyRegistrations, roleBreakdown] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: "$_id.month", count: 1 } },
        { $sort: { month: 1 } },
      ]),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $project: { _id: 0, role: "$_id", count: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      roleBreakdown,
      monthlyRegistrations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getAppointmentsReport
 * ---------------------
 * Appointments by status breakdown + monthly trend for last 12 months.
 * Also includes advocate workload — appointments per advocate.
 */
export const getAppointmentsReport = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [byStatus, monthlyTrend, topAdvocates] = await Promise.all([
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: "$_id.month", count: 1 } },
        { $sort: { month: 1 } },
      ]),
      // Top 5 advocates by appointment count
      Appointment.aggregate([
        { $group: { _id: "$advocateId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "advocates",
            localField: "_id",
            foreignField: "_id",
            as: "advocate",
          },
        },
        { $unwind: { path: "$advocate", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            count: 1,
            advocateName: "$advocate.fullName",
            specialization: "$advocate.specialization",
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      byStatus,
      monthlyTrend,
      topAdvocates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getCasesReport
 * --------------
 * Cases by status + by category + monthly trend.
 */
export const getCasesReport = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [byStatus, byCategory, monthlyTrend] = await Promise.all([
      Case.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Case.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { _id: 0, category: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      Case.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, month: "$_id.month", count: 1 } },
        { $sort: { month: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      byStatus,
      byCategory,
      monthlyTrend,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getAllUsers
 * -----------
 * Paginated user list with search, filter, and sort.
 * Admin manages users from this endpoint.
 *
 * Query params:
 *   ?search=rahul        → regex on name or email
 *   ?role=user|admin     → filter by role
 *   ?page=1&limit=10     → pagination
 *   ?sort=latest|oldest  → sort by createdAt
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10, sort = "latest" } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = sort === "oldest" ? 1 : -1;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password")
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getUserDetails
 * --------------
 * Returns a single user's full profile plus their activity:
 * appointments, cases, and payments in one response.
 * Admin uses this for the user detail page.
 */
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch all user activity in parallel
    const [appointments, cases, payments] = await Promise.all([
      Appointment.find({ user: userId })
        .populate("advocateId", "fullName specialization")
        .sort({ createdAt: -1 })
        .limit(10),
      Case.find({ userId })
        .populate("advocateId", "fullName specialization")
        .sort({ createdAt: -1 })
        .limit(10),
      Payment.find({ userId })
        .populate("appointmentId", "service appointmentDate")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Calculate totals for summary cards on the user detail page
    const [totalAppointments, totalCases, totalPaid] = await Promise.all([
      Appointment.countDocuments({ user: userId }),
      Case.countDocuments({ userId }),
      Payment.aggregate([
        { $match: { userId: user._id, status: "Paid" } },
        { $group: { _id: null, total: { $sum: { $divide: ["$amount", 100] } } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      user,
      summary: {
        totalAppointments,
        totalCases,
        totalSpentRupees: totalPaid[0]?.total || 0,
      },
      recentAppointments: appointments,
      recentCases: cases,
      recentPayments: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * updateUserRole
 * --------------
 * Promotes a user to admin or demotes an admin back to user.
 * The only way to create admin accounts — registration always creates "user".
 *
 * Safety guard: Admin cannot demote themselves.
 * This prevents the edge case where an admin accidentally removes
 * their own admin access, locking everyone out.
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role must be 'user' or 'admin'",
      });
    }

    // Prevent admin from demoting their own account
    if (userId === req.user.id && role === "user") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to "${role}"`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * deleteUser
 * ----------
 * Hard-deletes a user account by ID.
 * Admin use only — used for removing spam/fraudulent accounts.
 *
 * Safety guard: Admin cannot delete their own account.
 *
 * NOTE: This is a hard delete. In a stricter production system you
 * would add isActive: false (soft delete) and cascade-deactivate
 * their appointments and cases. For this project scope, hard delete
 * is acceptable and keeps the implementation clear.
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting their own account
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getAllAdvocates
 * ---------------
 * Admin-specific advocate list with full details and workload stats.
 * Extends the public advocate list with appointment and revenue counts.
 *
 * Uses $lookup (MongoDB JOIN) to count appointments per advocate
 * inside the aggregation pipeline — one DB round-trip for everything.
 *
 * Query params:
 *   ?search=ankesh
 *   ?specialization=Civil Law
 *   ?availability=Available|Busy|On Leave
 *   ?page=1&limit=10
 *   ?sort=latest|oldest
 */
export const getAllAdvocates = async (req, res) => {
  try {
    const {
      search, specialization, availability, isActive,
      page = 1, limit = 10, sort = "latest",
    } = req.query;

    const query = {};
    if (specialization) query.specialization = specialization;
    if (availability)   query.availability   = availability;
    /* isActive filter: "true" / "false" / omitted = show all */
    if (isActive === "true")  query.isActive = true;
    if (isActive === "false") query.isActive = false;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email:    { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = sort === "oldest" ? 1 : -1;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, advocates] = await Promise.all([
      Advocate.countDocuments(query),
      Advocate.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Enrich each advocate with their appointment count — one query
    // We use a simple countDocuments per advocate instead of a heavy aggregate
    // because we're already paginating (max 10 advocates per page)
    const enriched = await Promise.all(
      advocates.map(async (adv) => {
        const [appointmentCount, caseCount, revenue] = await Promise.all([
          Appointment.countDocuments({ advocateId: adv._id }),
          Case.countDocuments({ advocateId: adv._id }),
          Payment.aggregate([
            { $match: { advocateId: adv._id, status: "Paid" } },
            { $group: { _id: null, total: { $sum: { $divide: ["$amount", 100] } } } },
          ]),
        ]);

        return {
          ...adv.toObject(),
          appointmentCount: appointmentCount,   // top-level — frontend reads a.appointmentCount
          caseCount:        caseCount,          // top-level — frontend reads a.caseCount
          totalRevenue:     revenue[0]?.total || 0,
          stats: {
            totalAppointments: appointmentCount,
            totalCases: caseCount,
            totalRevenueRupees: revenue[0]?.total || 0,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      count: enriched.length,
      advocates: enriched,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getAdvocateDetails
 * ------------------
 * Full advocate profile with their cases, appointments, and revenue stats.
 * Admin uses this for the advocate detail management page.
 */
export const getAdvocateDetails = async (req, res) => {
  try {
    const { advocateId } = req.params;

    const advocate = await Advocate.findById(advocateId);
    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    const [appointments, cases, revenue, appointmentsByStatus] = await Promise.all([
      Appointment.find({ advocateId })
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .limit(10),
      Case.find({ advocateId })
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(10),
      Payment.aggregate([
        { $match: { advocateId: advocate._id, status: "Paid" } },
        { $group: {
          _id: null,
          totalRupees: { $sum: { $divide: ["$amount", 100] } },
          count: { $sum: 1 },
        }},
        { $project: { _id: 0, totalRupees: { $round: ["$totalRupees", 2] }, count: 1 } },
      ]),
      Appointment.aggregate([
        { $match: { advocateId: advocate._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),
    ]);

   

    const [totalAppointments, totalCases] = await Promise.all([
      Appointment.countDocuments({ advocateId }),
      Case.countDocuments({ advocateId }),
    ]);

    res.status(200).json({
      success: true,
      advocate: {
        ...advocate.toObject(),
        appointmentCount: totalAppointments,   // merged so frontend reads advocate.appointmentCount
        caseCount:        totalCases,          // merged so frontend reads advocate.caseCount
        totalRevenue:     revenue[0]?.totalRupees || 0,
      },
      summary: {
        totalAppointments,
        totalCases,
        totalRevenueRupees: revenue[0]?.totalRupees || 0,
        totalPaidConsultations: revenue[0]?.count || 0,
        appointmentsByStatus,
      },
      recentAppointments: appointments,
      recentCases: cases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// getAllAppointments for admin is handled by appointmentController.getAllAppointments
// (imported directly in adminRoutes.js — no duplicate needed here)


//notice — updateAppointmentStatus is handled by appointmentController.js
// (imported directly in adminRoutes.js — the correct implementation with
//  auto-case creation, category mapping, and generateCaseNumber is there)






/**
 * approveAdvocate
 * ---------------
 * Admin approves a pending advocate registration.
 * Protected route - admin only.
 */
export const approveAdvocate = async (req, res) => {
  try {
    const { advocateId } = req.params;
    const advocate = await Advocate.findById(advocateId);

    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    if (advocate.status === "Approved") {
      return res.status(400).json({ success: false, message: "Advocate is already approved" });
    }

    advocate.status = "Approved";
    await advocate.save();

    res.status(200).json({
      success: true,
      message: "Advocate approved successfully",
      advocate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * rejectAdvocate
 * --------------
 * Admin rejects a pending advocate registration.
 * Protected route - admin only.
 */
export const rejectAdvocate = async (req, res) => {
  try {
    const { advocateId } = req.params;
    const advocate = await Advocate.findById(advocateId);

    if (!advocate) {
      return res.status(404).json({ success: false, message: "Advocate not found" });
    }

    if (advocate.status === "Rejected") {
      return res.status(400).json({ success: false, message: "Advocate is already rejected" });
    }

    advocate.status = "Rejected";
    await advocate.save();

    res.status(200).json({
      success: true,
      message: "Advocate rejected successfully",
      advocate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// getAllCases for admin is handled by caseController.getAllCases
// (imported directly in adminRoutes.js — no duplicate needed here)