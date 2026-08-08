import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate',
    required: true,
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: false,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false,
  },
  serviceName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paymentMethod: {
    type: String,
  },
  razorpayOrderId: {
    type: String,
    required: false,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  invoiceNumber: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);

