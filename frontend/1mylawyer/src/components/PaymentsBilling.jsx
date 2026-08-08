import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api, { getRazorpayKey, createRazorpayOrder, verifyRazorpayPayment } from "../services/api";
import { Link, useNavigate } from "react-router-dom";

function PaymentsBilling() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    if (loggedInUser) {
        setUser(loggedInUser);
    }
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/case/my-cases");
      setCases(res.data.cases);
    } catch {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (caseItem) => {
    if (!user) {
        toast.error("Please log in to proceed with the payment.");
        return;
    }

    try {
        const key = await getRazorpayKey();
        const order = await createRazorpayOrder({ 
            amount: caseItem.paymentAmount,
            caseId: caseItem._id,
            advocateId: caseItem.advocateId._id,
        });

        const options = {
            key,
            amount: order.amount,
            currency: "INR",
            name: "1MyLawyer",
            description: `Payment for Case: ${caseItem.caseTitle}`,
            order_id: order.id,
            handler: async (response) => {
                try {
                    const verificationResult = await verifyRazorpayPayment({
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature,
                        amount: caseItem.paymentAmount,
                    });
                    navigate('/payment/status', { 
                        state: { 
                            success: true,
                            paymentId: verificationResult.paymentId,
                            orderId: verificationResult.orderId 
                        } 
                    });
                } catch (error) {
                    navigate('/payment/status', { state: { success: false } });
                }
            },
            prefill: {
                name: user.name || "User",
                email: user.email,
                contact: user.phone || ""
            },
            notes: {
                caseId: caseItem._id,
                caseTitle: caseItem.caseTitle,
            },
            theme: {
                color: "#c9a84c" 
            }
        };

        const razor = new window.Razorpay(options);
        razor.open();
    } catch (error) {
        toast.error("Payment initiation failed. Please try again.");
    }
  };

  const handleDownloadInvoice = (paymentId) => {
    // This will be handled by a new component or a direct link
    navigate(`/invoice/${paymentId}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="spinner-border" style={{ color: "var(--gold-500)" }} />
      </div>
    );
  }

  const pendingPayments = cases.filter(c => c.paymentStatus === 'Pending' && c.paymentAmount > 0);
  const paidPayments = cases.filter(c => c.paymentStatus === 'Paid');

  return (
    <div className="lm-card">
      <div className="lm-card-header d-flex justify-content-between align-items-center">
        <h5 className="lm-card-title mb-0">Payments & Billing</h5>
        <ul className="nav nav-pills">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
          </li>
        </ul>
      </div>

      <div className="p-3 p-md-4">
        {activeTab === 'pending' && (
          <div>
            {pendingPayments.length === 0 ? (
              <div className="text-center p-4">
                <p className="mb-0" style={{ color: "var(--gray-600)"}}>You have no pending payments.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table lm-table">
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Advocate</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((caseItem) => (
                      <tr key={caseItem._id}>
                        <td>{caseItem.caseNumber}</td>
                        <td>{caseItem.advocateId.fullName}</td>
                        <td>₹{caseItem.paymentAmount.toLocaleString()}</td>
                        <td>{caseItem.paymentDueDate ? new Date(caseItem.paymentDueDate).toLocaleDateString() : 'N/A'}</td>
                        <td><span className={`badge bg-warning text-dark`}>{caseItem.paymentStatus}</span></td>
                        <td><button className="btn btn-sm btn-gold" onClick={() => handlePayNow(caseItem)}>Pay Now</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {paidPayments.length === 0 ? (
              <div className="text-center p-4">
                <p className="mb-0" style={{ color: "var(--gray-600)"}}>You have no paid invoices.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table lm-table">
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Advocate</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidPayments.map((caseItem) => (
                      <tr key={caseItem._id}>
                        <td>{caseItem.caseNumber}</td>
                        <td>{caseItem.advocateId.fullName}</td>
                        <td>₹{caseItem.paymentAmount.toLocaleString()}</td>
                        <td>{caseItem.paymentId.paymentDate ? new Date(caseItem.paymentId.paymentDate).toLocaleDateString() : 'N/A'}</td>
                        <td><button className="btn btn-sm btn-outline-gold" onClick={() => handleDownloadInvoice(caseItem.paymentId._id)}>Download Invoice</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-center mt-4">
                <Link to="/payment-history" className="btn btn-navy">View Full History</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentsBilling;
