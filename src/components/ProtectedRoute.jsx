import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Protected Route Component
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="unauthorized-container">
                <div className="unauthorized-card">
                    <h2>🚫 Access Denied</h2>
                    <p>You don't have permission to view this page.</p>
                    <div className="role-info">
                        <p><strong>Your role:</strong> <span className="badge">{user.role}</span></p>
                        <p><strong>Required roles:</strong> {allowedRoles.map(role => (
                            <span key={role} className="badge">{role}</span>
                        ))}</p>
                    </div>
                    <button onClick={() => window.history.back()}>Go Back</button>
                </div>
            </div>
        );
    }

    return children;
};

// Role-based conditional rendering component
export const RoleGuard = ({ children, allowedRoles }) => {
    const { hasRole } = useAuth();

    if (!hasRole(allowedRoles)) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
