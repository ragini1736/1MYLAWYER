
import React from "react";

const PendingPayment = ({
  payments = [],
  handlePayNow,
  paymentProcessing,
}) => {
  return (
    <div className="card shadow-lg border-0 rounded-4 mt-4">

      <div className="card-header bg-white border-0 py-3">
        <h4 className="fw-bold mb-1">Pending Payments</h4>
        <p className="text-muted mb-0">
          Complete your pending payments to continue your legal services.
        </p>
      </div>

      <div className="card-body">

        {payments.length > 0 ? (
          <div className="table-responsive">

            <table className="table table-hover align-middle">

              <thead className="table-light">
                <tr>
                  <th>Case ID</th>
                  <th>Service</th>
                  <th>Advocate</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {payments.map((item) => (
                  <tr key={item._id}>

                    <td>{item.caseId?.caseNumber || "N/A"}</td>

                    <td>{item.serviceName}</td>

                    <td>{item.advocateId?.fullName || "N/A"}</td>

                    <td className="fw-bold text-primary">
                      ₹{item.amount}
                    </td>

                    <td>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </td>

                    <td>
                      <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-warning btn-sm rounded-pill px-4"
                        onClick={() => handlePayNow(item)}
                        disabled={paymentProcessing}
                      >
                        {paymentProcessing ? "Processing..." : "Pay Now"}
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        ) : (
          <div className="text-center py-5">

            <i className="fas fa-wallet fa-4x text-secondary mb-3"></i>

            <h5>No Pending Payments</h5>

            <p className="text-muted">
              You don't have any pending payments.
            </p>

          </div>
        )}

      </div>

    </div>
  );
};

export default PendingPayment;