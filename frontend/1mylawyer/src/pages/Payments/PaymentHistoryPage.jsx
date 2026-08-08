import React from 'react';
import { Link } from 'react-router-dom';
import PaymentHistoryTable from '../../components/Payments/PaymentHistoryTable';

const PaymentHistoryPage = () => {
  return (
    <>

      {/* Page Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="lm-gold-bar" />
              <h1 style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                fontWeight: 800,
                fontSize: 'clamp(1.5rem,4vw,2.2rem)',
                marginBottom: '.3rem',
              }}>
                Payment History
              </h1>
              <p style={{ opacity: .75, marginBottom: 0, fontSize: '.9rem' }}>
                View all your past transactions
              </p>
            </div>
            <Link to="/payment" className="btn btn-outline-gold btn-sm px-3">
              ← Back to Payments
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-4 py-lg-5">
        <PaymentHistoryTable />
      </div>

      <Footer />
    </>
  );
};

export default PaymentHistoryPage;
