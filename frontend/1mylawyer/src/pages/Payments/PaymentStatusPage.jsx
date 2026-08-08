import { useSearchParams, Link } from "react-router-dom";

const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const status       = searchParams.get("status");
  const paymentId    = searchParams.get("paymentId");
  const txn          = searchParams.get("txn");
  const errorMessage = searchParams.get("message");

  const isSuccess = status === "success";
  const isFailed  = status === "failed";

  const renderStatus = () => {
    if (isSuccess) return (
      <>
        <div style={{ fontSize: 70, marginBottom: "1rem" }}>✅</div>
        <h2 className="card-title">Payment Successful!</h2>
        <p>Thank you for your payment. Your transaction has been completed successfully.</p>
        {txn       && <p><strong>Transaction ID:</strong> <span className="font-monospace">{txn}</span></p>}
        {paymentId && <p><strong>Payment ID:</strong> <span className="font-monospace">{paymentId}</span></p>}
        <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
          {paymentId && <Link to={`/invoice/${paymentId}`} className="btn btn-outline-primary">📄 View Invoice</Link>}
          <Link to="/payment/history" className="btn btn-primary">Payment History</Link>
          <Link to="/payment" className="btn btn-secondary">Back to Payments</Link>
        </div>
      </>
    );

    if (isFailed) return (
      <>
        <div style={{ fontSize: 70, marginBottom: "1rem" }}>❌</div>
        <h2 className="card-title">Payment Failed</h2>
        <p>Unfortunately, your payment could not be processed. No amount was deducted.</p>
        {errorMessage && <p className="text-muted">Reason: {decodeURIComponent(errorMessage)}</p>}
        <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
          <Link to="/payment" className="btn btn-danger">🔄 Try Again</Link>
          <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </>
    );

    return (
      <>
        <div style={{ fontSize: 70, marginBottom: "1rem" }}>⚠️</div>
        <h2 className="card-title">Unknown Payment Status</h2>
        <p>The payment status is unclear. Please check your payment history or contact support.</p>
        <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
          <Link to="/payment/history" className="btn btn-primary">Payment History</Link>
          <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container my-5 text-center">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                {renderStatus()}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentStatusPage;
