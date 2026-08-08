/**
 * useRazorpay.js
 * --------------
 * Loads the Razorpay checkout.js script once and exposes openCheckout().
 *
 * Usage:
 *   const { ready, loading, openCheckout } = useRazorpay();
 *
 *   const response = await openCheckout({
 *     key, amount, currency, name, description,
 *     order_id, prefill: { name, email, contact }
 *   });
 *   // response = { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
import { useState, useEffect } from "react";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Script already loaded — resolve immediately
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [ready,   setReady  ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      if (loaded) setReady(true);
      else setError("Razorpay SDK failed to load. Check your internet connection.");
    });
  }, []);

  /**
   * openCheckout
   * Wraps window.Razorpay in a Promise so callers can use async/await.
   * Resolves with the Razorpay handler response on success.
   * Rejects on modal dismissal or payment failure.
   */
  const openCheckout = (options) =>
    new Promise((resolve, reject) => {
      if (!ready || !window.Razorpay) {
        reject(new Error("Razorpay SDK is not loaded yet."));
        return;
      }

      setLoading(true);

      const rzp = new window.Razorpay({
        ...options,
        handler(response) {
          setLoading(false);
          resolve(response);
        },
        modal: {
          ondismiss() {
            setLoading(false);
            reject(new Error("Payment cancelled by user."));
          },
        },
        theme: { color: "#0a1628" }, // Navy — matches platform theme
      });

      rzp.on("payment.failed", (resp) => {
        setLoading(false);
        reject(new Error(resp.error?.description || "Payment failed."));
      });

      rzp.open();
    });

  return { ready, loading, error, openCheckout };
}

export default useRazorpay;