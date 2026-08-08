/**
 * paymentController.js
 * --------------------
 * All Razorpay payment endpoints.
 * Detailed logging added to every step for debugging.
 */
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Case from '../models/Case.js';
import Appointment from '../models/Appointment.js';

/* ─────────────────────────────────────────────────────────────────
 * Razorpay singleton
 * ─────────────────────────────────────────────────────────────────
 * Lazily initialised so the server can start even if keys are absent
 * (they will be absent during unit-test runs etc.).
 * getRazorpayInstance() throws a clear error if the keys are missing.
 */
let razorpayInstance;

const getRazorpayInstance = () => {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log('[Razorpay] KEY_ID present    :', !!keyId,     keyId     ? `(${keyId.slice(0, 12)}...)` : 'MISSING');
  console.log('[Razorpay] KEY_SECRET present:', !!keySecret, keySecret ? `(${keySecret.slice(0, 6)}...)` : 'MISSING');

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
    );
  }

  // Validate key format
  if (!keyId.startsWith('rzp_')) {
    throw new Error(
      `RAZORPAY_KEY_ID looks invalid (got "${keyId.slice(0, 20)}…"). ` +
      'It must start with "rzp_test_" (test mode) or "rzp_live_" (live mode).'
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    console.log('[Razorpay] Instance created successfully');
  }

  return razorpayInstance;
};

/* ─────────────────────────────────────────────────────────────────
 * Helper: extract a human-readable message from any error
 * Razorpay SDK wraps API errors inside error.error.description
 * ─────────────────────────────────────────────────────────────────*/
const extractError = (error) => {
  // Razorpay API error (e.g. bad credentials, invalid amount)
  if (error?.error?.description) return error.error.description;
  if (error?.response?.data?.error?.description) return error.response.data.error.description;
  // Standard JS error
  if (error?.message) return error.message;
  return 'Unknown server error';
};

/* ═══════════════════════════════════════════════════════════════════
 * 1. GET /api/payments/getkey
 *    Returns the Razorpay public key to the frontend.
 *    Frontend uses this in the Razorpay Checkout widget options.
 * ═══════════════════════════════════════════════════════════════════*/
export const getKey = (req, res) => {
  const key = process.env.RAZORPAY_KEY_ID;
  console.log('[getKey] Returning key:', key ? `${key.slice(0, 12)}...` : 'MISSING');

  if (!key) {
    return res.status(500).json({
      success: false,
      message: 'RAZORPAY_KEY_ID is not set in .env',
    });
  }

  // Warn in logs if it looks like a placeholder
  if (!key.startsWith('rzp_')) {
    console.warn('[getKey] WARNING: RAZORPAY_KEY_ID does not start with "rzp_". It may be a placeholder.');
  }

  res.status(200).json({ key });
};

/* ═══════════════════════════════════════════════════════════════════
 * 2. POST /api/payments/create-order
 *    Body: { paymentId }  — MongoDB _id of a Pending Payment document
 *    Returns: { order: { id, amount, currency }, paymentId }
 * ═══════════════════════════════════════════════════════════════════*/
export const createPaymentOrder = async (req, res) => {
  try {
    console.log('\n[createPaymentOrder] ── START ──');
    console.log('[createPaymentOrder] req.body  :', req.body);
    console.log('[createPaymentOrder] req.user  :', req.user);

    const { paymentId } = req.body;
    const userId = req.user?.id || req.user?._id;

    // ── Guard: paymentId must be present ──────────────────────────
    if (!paymentId) {
      console.error('[createPaymentOrder] FAIL: paymentId missing from request body');
      return res.status(400).json({ success: false, message: 'paymentId is required in request body' });
    }

    // ── Guard: userId must be present (auth middleware) ───────────
    if (!userId) {
      console.error('[createPaymentOrder] FAIL: req.user has no id — auth middleware may be broken');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // ── Step 1: Look up the Payment document ──────────────────────
    console.log('[createPaymentOrder] Step 1 — looking up Payment:', paymentId, 'for user:', userId);

    const payment = await Payment.findOne({ _id: paymentId, userId, status: 'Pending' });

    if (!payment) {
      // Try to find the payment without the userId filter to give a better error
      const anyPayment = await Payment.findById(paymentId);
      if (!anyPayment) {
        console.error('[createPaymentOrder] FAIL: No Payment found with _id:', paymentId);
        return res.status(404).json({ success: false, message: `Payment not found (id: ${paymentId})` });
      }
      if (anyPayment.userId.toString() !== userId.toString()) {
        console.error('[createPaymentOrder] FAIL: Payment belongs to different user');
        return res.status(403).json({ success: false, message: 'Access denied — payment belongs to a different user' });
      }
      if (anyPayment.status !== 'Pending') {
        console.error('[createPaymentOrder] FAIL: Payment status is', anyPayment.status, '— not Pending');
        return res.status(400).json({ success: false, message: `Payment is already ${anyPayment.status}. Only Pending payments can be paid.` });
      }
    }

    console.log('[createPaymentOrder] Step 1 OK — payment found:', {
      _id: payment._id,
      amount: payment.amount,
      status: payment.status,
      advocateId: payment.advocateId,
    });

    // ── Step 2: Validate amount ───────────────────────────────────
    const amountPaise = Math.round(payment.amount * 100);
    if (!amountPaise || amountPaise < 100) {
      console.error('[createPaymentOrder] FAIL: amount too low:', payment.amount, '(paise:', amountPaise, ')');
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payment.amount}) is too low. Minimum is ₹1.`,
      });
    }

    // ── Step 3: Initialise Razorpay ───────────────────────────────
    console.log('[createPaymentOrder] Step 2 — initialising Razorpay instance');
    const razorpay = getRazorpayInstance(); // throws if keys missing/invalid

    // ── Step 4: Create Razorpay order ────────────────────────────
    const orderOptions = {
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `rcpt_${payment._id.toString().slice(-10)}`,
      notes: {
        paymentId:     payment._id.toString(),
        userId:        userId.toString(),
        caseId:        payment.caseId?.toString()       || '',
        appointmentId: payment.appointmentId?.toString() || '',
      },
    };

    console.log('[createPaymentOrder] Step 3 — calling razorpay.orders.create with:', orderOptions);

    let order;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch (razorpayError) {
      const msg = extractError(razorpayError);
      console.error('[createPaymentOrder] FAIL at razorpay.orders.create:', msg);
      console.error('[createPaymentOrder] Full Razorpay error:', JSON.stringify(razorpayError, null, 2));
      return res.status(502).json({
        success: false,
        message: `Razorpay order creation failed: ${msg}`,
        detail:  process.env.NODE_ENV !== 'production' ? razorpayError : undefined,
      });
    }

    console.log('[createPaymentOrder] Step 3 OK — Razorpay order created:', {
      id: order.id, amount: order.amount, currency: order.currency, status: order.status,
    });

    // ── Step 5: Persist Razorpay order ID on payment document ────
    payment.razorpayOrderId = order.id;
    await payment.save();
    console.log('[createPaymentOrder] Step 4 OK — razorpayOrderId saved to Payment document');

    console.log('[createPaymentOrder] ── DONE — responding 201 ──\n');
    return res.status(201).json({
      success:   true,
      order,
      paymentId: payment._id,
    });

  } catch (error) {
    const msg = extractError(error);
    console.error('[createPaymentOrder] Unhandled error:', msg);
    console.error(error);
    return res.status(500).json({
      success: false,
      message: msg,
      stack:   process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
};

/* ═══════════════════════════════════════════════════════════════════
 * 3. POST /api/payments/verify
 *    Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 *    Verifies HMAC-SHA256 signature, marks payment Paid, returns paymentId
 * ═══════════════════════════════════════════════════════════════════*/
export const verifyPayment = async (req, res) => {
  try {
    console.log('\n[verifyPayment] ── START ──');
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    console.log('[verifyPayment] body:', { razorpayOrderId, razorpayPaymentId, razorpaySignature: razorpaySignature?.slice(0, 10) + '…' });

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are all required',
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'RAZORPAY_KEY_SECRET not set in .env' });
    }

    // ── Step 1: HMAC-SHA256 signature verification ─────────────────
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    console.log('[verifyPayment] expected digest:', digest.slice(0, 12) + '…');
    console.log('[verifyPayment] received sig   :', razorpaySignature.slice(0, 12) + '…');

    if (digest !== razorpaySignature) {
      console.error('[verifyPayment] FAIL: signature mismatch — possible tampered request');
      return res.status(400).json({ success: false, message: 'Payment signature is invalid. Transaction rejected.' });
    }

    console.log('[verifyPayment] Step 1 OK — signature verified');

    // ── Step 2: Find Payment document ─────────────────────────────
    const payment = await Payment.findOne({ razorpayOrderId });

    if (!payment) {
      console.error('[verifyPayment] FAIL: no Payment found for razorpayOrderId:', razorpayOrderId);
      return res.status(404).json({ success: false, message: 'Payment record not found for this order ID.' });
    }

    // ── Step 3: Idempotency check ──────────────────────────────────
    if (payment.status === 'Paid') {
      console.log('[verifyPayment] Already paid — returning success');
      return res.status(200).json({ success: true, message: 'Payment already verified.', paymentId: payment._id });
    }

    // ── Step 4: Mark paid ──────────────────────────────────────────
    payment.status             = 'Paid';
    payment.razorpayPaymentId  = razorpayPaymentId;
    payment.razorpaySignature  = razorpaySignature;
    payment.paymentDate        = new Date();
    payment.invoiceNumber      = `INV-${Date.now()}`;
    await payment.save();

    console.log('[verifyPayment] Step 2 OK — payment marked Paid:', payment._id.toString());

    // ── Step 5: Update related Case ────────────────────────────────
    if (payment.caseId) {
      await Case.findByIdAndUpdate(payment.caseId, { paymentStatus: 'Paid' });
      console.log('[verifyPayment] Step 3 OK — case paymentStatus updated');
    }

    console.log('[verifyPayment] ── DONE ──\n');
    return res.json({
      success:   true,
      message:   'Payment verified and saved successfully',
      paymentId: payment._id,
    });

  } catch (error) {
    const msg = extractError(error);
    console.error('[verifyPayment] Unhandled error:', msg);
    console.error(error);
    return res.status(500).json({
      success: false,
      message: msg,
      stack:   process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
};

/* ═══════════════════════════════════════════════════════════════════
 * 4. GET /api/payments/summary
 * ═══════════════════════════════════════════════════════════════════*/
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    console.log('[getPaymentSummary] userId:', userId);

    const allUserPayments = await Payment.find({ userId });

    const totalPaid = allUserPayments
      .filter(p => p.status === 'Paid')
      .reduce((acc, p) => acc + p.amount, 0);

    const totalDue = allUserPayments
      .filter(p => p.status === 'Pending')
      .reduce((acc, p) => acc + p.amount, 0);

    const totalInvoices = allUserPayments.filter(p => p.status === 'Paid').length;

    const pendingPaymentList = await Payment.find({ userId, status: 'Pending' })
      .populate('advocateId', 'fullName')
      .sort({ dueDate: 1 });

    console.log('[getPaymentSummary] pending:', pendingPaymentList.length, '| paid:', totalInvoices);

    return res.json({
      success: true,
      summary: {
        totalPaid,
        totalDue,
        pendingPayments:    pendingPaymentList.length,
        totalInvoices,
        pendingPaymentList,
      },
    });
  } catch (error) {
    const msg = extractError(error);
    console.error('[getPaymentSummary] error:', msg);
    return res.status(500).json({ success: false, message: msg });
  }
};

/* ═══════════════════════════════════════════════════════════════════
 * 5. GET /api/payments/history
 * ═══════════════════════════════════════════════════════════════════*/
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const payments = await Payment.find({ userId, status: { $in: ['Paid', 'Failed'] } })
      .populate('advocateId', 'fullName')
      .sort({ paymentDate: -1 });

    console.log('[getPaymentHistory] userId:', userId, '| records:', payments.length);
    return res.json({ success: true, payments });
  } catch (error) {
    const msg = extractError(error);
    console.error('[getPaymentHistory] error:', msg);
    return res.status(500).json({ success: false, message: msg });
  }
};

/* ═══════════════════════════════════════════════════════════════════
 * 6. GET /api/payments/invoice/:id
 * ═══════════════════════════════════════════════════════════════════*/
export const downloadInvoice = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    console.log('[downloadInvoice] id:', req.params.id, 'userId:', userId);

    const payment = await Payment.findOne({ _id: req.params.id, status: 'Paid' })
      .populate('userId',     'name email')
      .populate('advocateId', 'fullName specialization');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Invoice not found or payment is not yet paid.' });
    }

    if (payment.userId._id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, invoice: payment });
  } catch (error) {
    const msg = extractError(error);
    console.error('[downloadInvoice] error:', msg);
    return res.status(500).json({ success: false, message: msg });
  }
};

/* ═══════════════════════════════════════════════════════════════════
 * 7. POST /api/payments/create-test-payment
 *    Dev/demo only — creates a Pending payment for testing Pay Now
 * ═══════════════════════════════════════════════════════════════════*/
export const createTestPayment = async (req, res) => {
  try {
    const { advocateId, amount, serviceName } = req.body;
    const userId = req.user?.id || req.user?._id;

    console.log('[createTestPayment] userId:', userId, 'body:', req.body);

    if (!advocateId || !amount || !serviceName) {
      return res.status(400).json({
        success: false,
        message: 'advocateId, amount, and serviceName are required',
      });
    }

    const payment = await Payment.create({
      userId,
      advocateId,
      serviceName,
      amount:  Number(amount),
      status:  'Pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    console.log('[createTestPayment] created payment:', payment._id.toString());
    return res.status(201).json({ success: true, message: 'Test pending payment created', payment });
  } catch (error) {
    const msg = extractError(error);
    console.error('[createTestPayment] error:', msg);
    return res.status(500).json({ success: false, message: msg });
  }
};

/* ═══════════════════════════════════════════════════════════════════
 * 8. GET /api/admin/payments (Admin only)
 *    Returns all payments with filtering and pagination.
 * ═══════════════════════════════════════════════════════════════════*/
export const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = "latest" } = req.query;

    const query = {};
    if (status) query.status = status;

    const sortOrder = sort === "oldest" ? 1 : -1;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate("userId", "name email")
        .populate("advocateId", "fullName")
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      count: payments.length,
      payments,
    });
  } catch (error) {
    const msg = extractError(error);
    console.error("[getAllPayments] error:", msg);
    res.status(500).json({ success: false, message: msg });
  }
};
