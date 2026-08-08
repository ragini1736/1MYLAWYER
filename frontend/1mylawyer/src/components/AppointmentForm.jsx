import React from "react";

function AppointmentForm() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 max-auto">

          <div className="card shadow p-4">
            <h2 className="text-center mb-4">
              Book Appointment
            </h2>

            <form>

              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Purpose</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe your legal issue"
                ></textarea>
              </div>

              <button className="btn btn-primary w-100">
                Book Appointment
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AppointmentForm;