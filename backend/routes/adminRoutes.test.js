import request from 'supertest';
import express from 'express';
import adminRoutes from './adminRoutes';

// Mock the middleware to simulate an authenticated admin user
jest.mock('../middleware/authMiddleware.js', () => jest.fn((req, res, next) => {
  req.user = { id: 'admin123', role: 'admin' };
  next();
}));

// We will also mock the admin middleware to control its behavior in tests
const adminMiddleware = jest.requireMock('../middleware/adminMiddleware.js');
jest.mock('../middleware/adminMiddleware.js', () => jest.fn((req, res, next) => next()));


// Mock all the controller functions to isolate the router logic
const mockGetDashboardStats = jest.fn((req, res) => res.sendStatus(200));
const mockGetRevenueAnalytics = jest.fn((req, res) => res.sendStatus(200));
const mockGetUsersReport = jest.fn((req, res) => res.sendStatus(200));
const mockGetAppointmentsReport = jest.fn((req, res) => res.sendStatus(200));
const mockGetCasesReport = jest.fn((req, res) => res.sendStatus(200));
const mockGetAllUsers = jest.fn((req, res) => res.sendStatus(200));
const mockGetUserDetails = jest.fn((req, res) => res.sendStatus(200));
const mockUpdateUserRole = jest.fn((req, res) => res.sendStatus(200));
const mockDeleteUser = jest.fn((req, res) => res.sendStatus(200));
const mockGetAllAdvocates = jest.fn((req, res) => res.sendStatus(200));
const mockGetAdvocateDetails = jest.fn((req, res) => res.sendStatus(200));
const mockGetAllAppointments = jest.fn((req, res) => res.sendStatus(200));
const mockGetAllCases = jest.fn((req, res) => res.sendStatus(200));
const mockGetAllDocuments = jest.fn((req, res) => res.sendStatus(200));

// Hijack the controller modules to use our mocks
jest.mock('../controllers/adminController.js', () => ({
  getDashboardStats: mockGetDashboardStats,
  getRevenueAnalytics: mockGetRevenueAnalytics,
  getUsersReport: mockGetUsersReport,
  getAppointmentsReport: mockGetAppointmentsReport,
  getCasesReport: mockGetCasesReport,
  getAllUsers: mockGetAllUsers,
  getUserDetails: mockGetUserDetails,
  updateUserRole: mockUpdateUserRole,
  deleteUser: mockDeleteUser,
  getAllAdvocates: mockGetAllAdvocates,
  getAdvocateDetails: mockGetAdvocateDetails,
}));
jest.mock('../controllers/appointmentController.js', () => ({ getAllAppointments: mockGetAllAppointments }));
jest.mock('../controllers/caseController.js', () => ({ getAllCases: mockGetAllCases }));
jest.mock('../controllers/documentController.js', () => ({ getAllDocuments: mockGetAllDocuments }));

// Set up a test instance of an Express app
const app = express();
app.use('/api/admin', adminRoutes);

describe('Admin Routes', () => {

  // Clear all mocks after each test to ensure a clean state
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Analytics Routes', () => {
    it('GET /api/admin/stats should call getDashboardStats', async () => {
      await request(app).get('/api/admin/stats');
      expect(mockGetDashboardStats).toHaveBeenCalledTimes(1);
    });

    it('GET /api/admin/reports/revenue should call getRevenueAnalytics', async () => {
      await request(app).get('/api/admin/reports/revenue');
      expect(mockGetRevenueAnalytics).toHaveBeenCalledTimes(1);
    });

    it('GET /api/admin/reports/users should call getUsersReport', async () => {
      await request(app).get('/api/admin/reports/users');
      expect(mockGetUsersReport).toHaveBeenCalledTimes(1);
    });
    
    it('GET /api/admin/reports/appointments should call getAppointmentsReport', async () => {
        await request(app).get('/api/admin/reports/appointments');
        expect(mockGetAppointmentsReport).toHaveBeenCalledTimes(1);
    });

    it('GET /api/admin/reports/cases should call getCasesReport', async () => {
        await request(app).get('/api/admin/reports/cases');
        expect(mockGetCasesReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Management Routes', () => {
    it('GET /api/admin/users should call getAllUsers', async () => {
      await request(app).get('/api/admin/users');
      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
    });

    it('GET /api/admin/users/:userId should call getUserDetails', async () => {
      await request(app).get('/api/admin/users/test-user-id');
      expect(mockGetUserDetails).toHaveBeenCalledTimes(1);
    });

    it('PUT /api/admin/users/:userId/role should call updateUserRole', async () => {
      await request(app).put('/api/admin/users/test-user-id/role');
      expect(mockUpdateUserRole).toHaveBeenCalledTimes(1);
    });

    it('DELETE /api/admin/users/:userId should call deleteUser', async () => {
      await request(app).delete('/api/admin/users/test-user-id');
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Advocate Management Routes', () => {
      it('GET /api/admin/advocates should call getAllAdvocates', async () => {
        await request(app).get('/api/admin/advocates');
        expect(mockGetAllAdvocates).toHaveBeenCalledTimes(1);
      });

      it('GET /api/admin/advocates/:advocateId should call getAdvocateDetails', async () => {
        await request(app).get('/api/admin/advocates/test-advocate-id');
        expect(mockGetAdvocateDetails).toHaveBeenCalledTimes(1);
      });
  });

  describe('Reused Resource Routes', () => {
    it('GET /api/admin/appointments should call getAllAppointments', async () => {
      await request(app).get('/api/admin/appointments');
      expect(mockGetAllAppointments).toHaveBeenCalledTimes(1);
    });

    it('GET /api/admin/cases should call getAllCases', async () => {
      await request(app).get('/api/admin/cases');
      expect(mockGetAllCases).toHaveBeenCalledTimes(1);
    });

    it('GET /api/admin/documents should call getAllDocuments', async () => {
      await request(app).get('/api/admin/documents');
      expect(mockGetAllDocuments).toHaveBeenCalledTimes(1);
    });
  });

  describe('Middleware Protection', () => {
    it('should be protected by admin middleware', async () => {
        // Check if our mock admin middleware was called on a sample route
        await request(app).get('/api/admin/stats');
        expect(adminMiddleware).toHaveBeenCalled();
    });
  });
});
