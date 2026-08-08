import React, { useEffect } from 'react';
import api from '../../services/api';

const BillingDetails = ({ billingDetails, setBillingDetails }) => {

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const { data } = await api.get('/api/user/profile');
                setBillingDetails({
                    name: data.user.name,
                    email: data.user.email,
                    phone: data.user.phone || '',
                    address: data.user.address || '',
                });
            } catch (error) {
                console.error('Failed to fetch user profile', error);
            }
        };

        fetchUserProfile();
    }, [setBillingDetails]);

    const handleChange = (e) => {
        setBillingDetails({
            ...billingDetails,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="card-title mb-0">Billing Details</h5>
            </div>
            <div className="card-body">
                <form>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={billingDetails.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={billingDetails.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="phone" className="form-label">Phone</label>
                        <input
                            type="tel"
                            className="form-control"
                            id="phone"
                            name="phone"
                            value={billingDetails.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="address" className="form-label">Address</label>
                        <textarea
                            className="form-control"
                            id="address"
                            name="address"
                            rows="3"
                            value={billingDetails.address}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillingDetails;
