import React, { useState } from 'react';

const PaymentMethods = () => {
    const [selectedMethod, setSelectedMethod] = useState('razorpay');

    const methods = [
        { id: 'razorpay', name: 'Razorpay' },
        { id: 'upi', name: 'UPI' },
        { id: 'card', name: 'Credit/Debit Card' },
        { id: 'netbanking', name: 'Net Banking' },
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h5 className="card-title mb-0">Payment Methods</h5>
            </div>
            <div className="card-body">
                <div className="list-group">
                    {methods.map((method) => (
                        <label
                            key={method.id}
                            className={`list-group-item list-group-item-action ${selectedMethod === method.id ? 'active' : ''}`}
                            onClick={() => setSelectedMethod(method.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={method.id}
                                checked={selectedMethod === method.id}
                                className="form-check-input me-2"
                                readOnly
                            />
                            {method.name}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentMethods;
