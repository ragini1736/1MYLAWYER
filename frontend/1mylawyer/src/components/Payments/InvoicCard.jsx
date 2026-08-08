import React from "react";

const PaymentHistoryTable = ({
  payments = [],
  handleInvoice,
}) => {
  return (
    <div className="card shadow-lg border-0 rounded-4 mt-5">

      <div className="card-header bg-white border-0 py-3">
        <h4 className="fw-bold mb-1">Payment History</h4>
        <p className="text-muted mb-0">
          View all your completed and failed transactions.
        </p>
      </div>

      <div className="card-body">

        {payments.length > 0 ? (

          <div className="table-responsive">

            <table className="table table-hover align-middle">

              <thead className="table-light">

                <tr>
                  <th>Invoice ID</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>

              </thead>

              <tbody>

                {payments.map((item) => (

                  <tr key={item._id}>

                    <td>
                      {item.invoiceNumber || item._id.slice(-8)}
                    </td>

                    <td>
                      {item.serviceName}
                    </td>

                    <td className="fw-bold text-success">
                      ₹{item.amount}
                    </td>

                    <td>
                      {item.paidAt
                        ? new Date(item.paidAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>

                      {item.status === "Paid" ? (
                        <span className="badge bg-success rounded-pill px-3 py-2">
                          Paid
                        </span>
                      ) : (
                        <span className="badge bg-danger rounded-pill px-3 py-2">
                          Failed
                        </span>
                      )}

                    </td>

                    <td>

                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        onClick={() => handleInvoice(item._id)}
                      >
                        Download
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="text-center py-5">

            <i className="fas fa-file-invoice fa-4x text-secondary mb-3"></i>

            <h5>No Payment History</h5>

            <p className="text-muted">
              Your completed payments will appear here.
            </p>

          </div>

        )}

      </div>

    </div>
  );
};

export default PaymentHistoryTable;