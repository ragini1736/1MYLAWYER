import express from 'express';
import { 
    createPaymentOrder, 
    verifyPayment, 
    getKey, 
    getPaymentHistory,
    downloadInvoice, 
    getPaymentSummary,
    createTestPayment,
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET api/payments/summary
// @desc    Get payment summary for the logged-in user
// @access  Private
router.get('/summary', authMiddleware, getPaymentSummary);

// @route   GET api/payments/getkey
// @desc    Get Razorpay key
// @access  Public
router.get('/getkey', getKey);

// @route   POST api/payments/create-order
// @desc    Create a Razorpay order for a pending payment
// @access  Private
router.post('/create-order', authMiddleware, createPaymentOrder);

// @route   POST api/payments/verify
// @desc    Verify payment signature and save payment details
// @access  Private
router.post('/verify', authMiddleware, verifyPayment);

// @route   GET api/payments/history
// @desc    Get payment records (Paid, Failed) for the logged-in user
// @access  Private
router.get('/history', authMiddleware, getPaymentHistory);

// @route   GET api/payments/invoice/:id
// @desc    Get invoice details by payment ID
// @access  Private
router.get('/invoice/:id', authMiddleware, downloadInvoice);

// @route   POST api/payments/create-test-payment
// @desc    Creates a test Pending payment for development/demo testing
// @access  Private
router.post('/create-test-payment', authMiddleware, createTestPayment);

export default router;
