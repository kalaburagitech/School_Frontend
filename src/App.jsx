import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import StudentManagement from './pages/StudentManagement';
import TeacherManagement from './pages/TeacherManagement';
import TransportManagement from './pages/TransportManagement';
import AttendanceDashboard from './pages/AttendanceDashboard';
import ExamManagement from './pages/ExamManagement';
import FeeManagement from './pages/FeeManagement';
import UserManagement from './pages/UserManagement';
import FinancialAnalytics from './pages/FinancialAnalytics';
import EmployeeRegistration from './pages/EmployeeRegistration';
import EmployeeManagement from './pages/EmployeeManagement';
import OwnerDashboard from './pages/OwnerDashboard';
import OperationsHub from './pages/OperationsHub'; // Others Tab
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="owner-dashboard" element={<OwnerDashboard />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="teachers" element={<TeacherManagement />} />
        <Route path="transport" element={<TransportManagement />} />
        <Route path="tracking" element={<LiveTracking />} />
        <Route path="attendance" element={<AttendanceDashboard />} />
        <Route path="operations" element={<OperationsHub />} />
        <Route path="exams" element={<ExamManagement />} />
        <Route path="fees" element={<FeeManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="employees/new" element={<EmployeeRegistration />} />
        <Route path="analytics/finance" element={<FinancialAnalytics />} />
      </Route>
    </Routes>
  );
}

export default App;
