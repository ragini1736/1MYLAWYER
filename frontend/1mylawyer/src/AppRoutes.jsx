import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import AdvocateListing from "../pages/AdvocateListing";
import AdvocateDetails from "../pages/AdvocateDetails";
import Appointment from "../pages/Appointment";
import MyAppointments from "../pages/MyAppointments";
import CaseTracker from "../pages/CaseTracker";
import DocumentVault from "../pages/DocumentVault";
import Profile from "../pages/Profile";
import Service from "../pages/Service";
import Contact from "../pages/Contact";
import NotFound from "../pages/NotFound";
import AdminDashboard from "../pages/AdminDashboard";
import Notification from "../pages/Notification";

// Payment and Chat Module Imports
import PaymentLayout from "../components/Payments/PaymentLayout";
import PaymentPage from "../pages/Payments/PaymentPage";
import PaymentStatusPage from "../pages/Payments/PaymentStatusPage";
import PaymentHistoryPage from "../pages/Payments/PaymentHistoryPage";
import InvoicePage from "../pages/Payments/InvoicePage";


const AppRoutes = () => {
  return (
    <Routes>
      {/* Existing Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/advocates" element={<AdvocateListing />} />
      <Route path="/advocates/:id" element={<AdvocateDetails />} />
      <Route path="/appointment" element={<Appointment />} />
      <Route path="/my-appointments" element={<MyAppointments />} />
      <Route path="/cases" element={<CaseTracker />} />
      <Route path="/document" element={<DocumentVault />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/service" element={<Service />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/notifications" element={<Notification />} />
      <Route path="/admin" element={<AdminDashboard />} />

      {/* Payment Module Routes (wrapped in a layout) */}
      <Route path="/payments" element={<PaymentHistoryPage />} /> 
      <Route path="/payment" element={<PaymentLayout />}>
        <Route path="checkout/:appointmentId" element={<PaymentPage />} />
      </Route>
      <Route path="/payment/status" element={<PaymentStatusPage />} />
      <Route path="/payment/invoice/:invoiceId" element={<InvoicePage />} />

      
      {/* 404 Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;