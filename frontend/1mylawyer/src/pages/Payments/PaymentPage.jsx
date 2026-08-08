/**
 * PaymentPage.jsx  —  Module 1 + Module 2: Payment Dashboard + Razorpay Flow
 * ---------------------------------------------------------------------------
 * Route: /payment  (protected)
 *
 * MODULE 2 ADDITIONS over Module 1:
 *  - Processing overlay while Razorpay modal is open (prevents double-click)
 *  - Dashboard refresh (loadSummary) called on BOTH success AND cancellation
 *  - Cancellation stays on dashboard — does NOT redirect to failure page
 *  - Payment failure redirects to /payment/status?status=failed
 *  - Toast messages differentiated: success / cancelled / failed
 *
 * Backend contract (paymentRoutes.js) — unchanged:
 *  GET  /api/payments/summary       → { summary: { totalPaid, totalDue, pendingPayments, totalInvoices, pendingPaymentList } }
 *  GET  /api/payments/getkey        → { key: "rzp_test_..." }
 *  POST /api/payments/create-order  → body: { paymentId }  → { order: { id, amount, currency }, paymentId }
 *  POST /api/payments/verify        → body: { razorpayOrderId, razorpayPaymentId, razorpaySignature } → { paymentId }
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";


import PaymentSummary  from "../../components/Payments/PaymentSummary";
import PendingPayment  from "../../components/Payments/PendingPayment";
import PaymentLoader   from "../../components/Payments/PaymentLoader";

import {
  fetchPaymentSummary,
  fetchRazorpayKey,
  createOrder,
  verifyPayment,
  createTestPayment,
} from "../../services/paymentService";
import { useRazorpay } from "../../hooks/useRazorpay";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { ready: rzpReady, openCheckout } = useRazorpay();

  /* ── State ── */
  const [summary,           setSummary          ] = useState(null);
  const [loading,           setLoading          ] = useState(true);
  const [error,             setError            ] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [creatingTest,      setCreatingTest     ] = useState(false);

  /* ── Fetch summary (also called after payment to refresh cards) ── */
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPaymentSummary();
      setSummary(res.data.summary);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load payment data. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  /* ── Create a test Pending payment so Pay Now button appears ──── */
  const handleCreateTest = async () => {
    setCreatingTest(true);
    try {
      // Fetch first available advocate
      const { default: api } = await import("../../services/api");
      const advRes   = await api.get("/api/advocates?limit=1");
      const advocates = advRes.data.advocates || [];

      if (advocates.length === 0) {
        toast.error("No advocates found. Please add an advocate via the Admin panel first.");
        return;
      }

      const adv = advocates[0];
      await createTestPayment({
        advocateId:  adv._id,
        amount:      adv.fees || 1500,
        serviceName: adv.specialization || "Legal Consultation",
      });

      toast.success("✅ Test payment created! Click Pay Now to open Razorpay.");
      await loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create test payment.");
    } finally {
      setCreatingTest(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────
   * handlePayNow  —  MODULE 2: Complete Razorpay flow
   *
   * Flow:
   *  1. Guard: SDK must be ready
   *  2. Show processing overlay (setPaymentProcessing true)
   *  3. GET  /api/payments/getkey         → Razorpay public key
   *  4. POST /api/payments/create-order   → { paymentId } → Razorpay order
   *  5. openCheckout(options)             → user pays in Razorpay modal
   *  6. POST /api/payments/verify         → verify HMAC signature
   *  7a. SUCCESS  → refresh dashboard → toast success → navigate to status page
   *  7b. CANCELLED → refresh dashboard → toast info → stay on dashboard
   *  7c. FAILED   → toast error → navigate to status page with failure
   *  8. Always: setPaymentProcessing false
   * ─────────────────────────────────────────────────────────────────*/
  const handlePayNow = async (pendingPayment) => {
    /* Guard: Razorpay SDK must be loaded */
    if (!rzpReady) {
      toast.warning("Payment gateway is loading. Please wait a moment and try again.");
      return;
    }

    /* Guard: prevent double-click */
    if (paymentProcessing) return;

    setPaymentProcessing(true);

    try {
      /* STEP 1 — Fetch Razorpay public key from backend */
      const keyRes = await fetchRazorpayKey();
      const key    = keyRes.data.key;

      if (!key) throw new Error("Razorpay key not available. Please contact support.");

      /* STEP 2 — Create order on backend (backend multiplies by 100 for paise) */
      const orderRes           = await createOrder(pendingPayment._id);
      const { order, paymentId } = orderRes.data;

      /* STEP 3 — Open Razorpay checkout modal and await user action */
      const rzpResponse = await openCheckout({
        key,
        amount:      order.amount,    // paise — set by backend
        currency:    order.currency || "INR",
        name:        "1MyLawyer",
        description: pendingPayment.serviceName || "Legal Consultation",
        order_id:    order.id,        // Razorpay order ID (not our MongoDB ID)
        prefill: {
          /* User details pre-filled in checkout — convenience only, not security */
          name:    pendingPayment.userId?.name    || "",
          email:   pendingPayment.userId?.email   || "",
          contact: pendingPayment.userId?.phone   || "",
        },
        notes: {
          /* These are stored on the Razorpay order for reference */
          paymentId: paymentId?.toString() || "",
        },
      });

      /* STEP 4 — Verify HMAC signature on backend */
      /* razorpay_order_id + "|" + razorpay_payment_id signed with KEY_SECRET */
      const verifyRes = await verifyPayment({
        razorpayOrderId:   rzpResponse.razorpay_order_id,
        razorpayPaymentId: rzpResponse.razorpay_payment_id,
        razorpaySignature: rzpResponse.razorpay_signature,
      });

      /* STEP 5a — SUCCESS */
      toast.success("Payment successful! Your account has been updated. 🎉");

      /* Refresh dashboard summary so cards show updated amounts immediately */
      await loadSummary();

      /* Navigate to success status page */
      navigate(
        `/payment/status?status=success` +
        `&paymentId=${verifyRes.data.paymentId}` +
        `&txn=${rzpResponse.razorpay_payment_id}`
      );

    } catch (err) {

      /* STEP 5b — CANCELLED (user closed the modal) */
      if (err.message === "Payment cancelled by user.") {
        toast.info("Payment was cancelled. Your pending payments are unchanged.");
        /*
         * Refresh dashboard — in case the backend created a Razorpay order
         * before the user cancelled, the order still exists on Razorpay's
         * side. Our MongoDB payment record remains "Pending" which is correct.
         * Refreshing ensures the UI reflects the true current state.
         */
        await loadSummary();
        return; // stay on /payment page — do NOT navigate to failure page
      }

      /* STEP 5c — PAYMENT FAILED (Razorpay reported failure or verify rejected) */
      const msg = err.response?.data?.message || err.message || "Payment failed. Please try again.";
      toast.error(msg);

      /* Navigate to failure status page with the error message */
      navigate(
        `/payment/status?status=failed&message=${encodeURIComponent(msg)}`
      );

    } finally {
      /* Always remove processing state regardless of outcome */
      setPaymentProcessing(false);
    }
  };

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <>
      

      {/* Page header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="lm-gold-bar" />
              <h1 style={{
                fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)",
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                marginBottom: ".3rem",
              }}>
                Payments &amp; Billing
              </h1>
              <p style={{ opacity: .75, marginBottom: 0, fontSize: ".9rem" }}>
                Manage your legal consultation payments
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/payment/history" className="btn btn-outline-gold btn-sm px-3">
                Payment History
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container py-4 py-lg-5" style={{ position: "relative" }}>

        {/*
         * MODULE 2: Processing overlay
         * ────────────────────────────
         * Shown while the Razorpay modal is open or while create-order / verify
         * API calls are in-flight. Prevents the user from clicking "Pay Now"
         * on another row while a payment is already being processed.
         */}
        {paymentProcessing && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 14, 30, 0.65)",
            zIndex: 1050,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
          }}>
            <div style={{
              width: 56, height: 56,
              border: "4px solid rgba(201,168,76,.25)",
              borderTopColor: "#c9a84c",
              borderRadius: "50%",
              animation: "paymentSpin .75s linear infinite",
            }} />
            <p style={{
              color: "#ffffff",
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "1.05rem",
              margin: 0,
              opacity: .9,
            }}>
              Processing your payment…
            </p>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem", margin: 0 }}>
              Please do not close this window.
            </p>
            <style>{`@keyframes paymentSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Loading state */}
        {loading && <PaymentLoader message="Loading your payment summary..." />}

        {/* Error state */}
        {!loading && error && (
          <div
            className="alert d-flex align-items-center justify-content-between flex-wrap gap-3"
            role="alert"
            style={{
              background: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.25)",
              borderRadius: "var(--radius-md, 12px)",
              color: "#b91c1c",
              padding: "1.1rem 1.5rem",
            }}
          >
            <span>⚠️ {error}</span>
            <button
              className="btn btn-sm"
              onClick={loadSummary}
              style={{
                background: "#b91c1c", color: "#fff",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: ".82rem", fontWeight: 600,
                border: "none", padding: ".35rem 1rem",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Data loaded */}
        {!loading && !error && summary && (
          <>
            {/* Summary Cards */}
            <PaymentSummary summary={summary} />

            {/* Pending Payments Table */}
            <PendingPayment
              payments={summary.pendingPaymentList || []}
              handlePayNow={handlePayNow}
              paymentProcessing={paymentProcessing}
            />

            {/* Empty state — with Create Test Payment button */}
            {(summary.pendingPaymentList || []).length === 0 && (
              <div
                className="text-center mt-4 py-5"
                style={{
                  background: "var(--white, #fff)",
                  borderRadius: "var(--radius-lg, 18px)",
                  border: "1px solid var(--gray-200, #e2e6ed)",
                  boxShadow: "var(--shadow-md)",
                  padding: "3rem 1.5rem",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💳</div>
                <h5 style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "var(--navy-800, #0a1628)", fontWeight: 700, marginBottom: ".5rem" }}>
                  No Pending Payments
                </h5>
                <p style={{ color: "var(--gray-500, #6b7280)", fontSize: ".9rem", marginBottom: "1.5rem", maxWidth: 420, margin: "0 auto 1.5rem" }}>
                  You have no outstanding payments. To test the Razorpay Pay Now flow, click the button below to create a demo pending payment.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <button
                    onClick={handleCreateTest}
                    disabled={creatingTest}
                    className="btn btn-gold px-4"
                  >
                    {creatingTest
                      ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</>
                      : "⚡ Create Test Payment"}
                  </button>
                  <Link to="/payment/history" className="btn btn-outline-gold px-4">
                    View History
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

      </div>

    
    </>
  );
}
