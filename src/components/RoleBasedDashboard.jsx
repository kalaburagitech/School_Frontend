import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RoleBasedDashboard = () => {
    const { user, hasRole } = useAuth();

    if (!user) return null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Welcome, {user.email}</h1>
                <span className="role-badge role-{user.role}">{user.role.toUpperCase()}</span>
            </div>

            <div className="dashboard-grid">
                {/* Admin Dashboard */}
                {hasRole('admin') && (
                    <>
                        <DashboardCard
                            title="All Modules"
                            description="Full access to Finance, Transport, and Academic modules"
                            links={[
                                { to: '/students', label: 'Manage Students' },
                                { to: '/teachers', label: 'Manage Teachers' },
                                { to: '/drivers', label: 'Manage Drivers' },
                                { to: '/buses', label: 'Manage Buses' },
                                { to: '/routes', label: 'Manage Routes' },
                                { to: '/subjects', label: 'Manage Subjects' },
                                { to: '/academic/marks', label: 'View All Marks' },
                                { to: '/academic/attendance', label: 'View All Attendance' },
                            ]}
                        />
                    </>
                )}

                {/* Principal Dashboard */}
                {hasRole('principal') && (
                    <>
                        <DashboardCard
                            title="Academic Management"
                            description="Manage teachers, students, and academic records"
                            links={[
                                { to: '/teachers', label: 'Manage Teachers' },
                                { to: '/students', label: 'Manage Students' },
                                { to: '/subjects', label: 'Manage Subjects' },
                                { to: '/academic/reports', label: 'Academic Reports' },
                            ]}
                        />
                    </>
                )}

                {/* Teacher Dashboard */}
                {hasRole('teacher') && (
                    <>
                        <DashboardCard
                            title="My Classes"
                            description="Manage attendance and marks for your classes"
                            links={[
                                { to: '/academic/mark-attendance', label: 'Mark Attendance' },
                                { to: '/academic/add-marks', label: 'Add Marks' },
                                { to: '/students', label: 'View Students' },
                                { to: '/subjects', label: 'My Subjects' },
                            ]}
                        />
                    </>
                )}

                {/* Driver Dashboard */}
                {hasRole('driver') && (
                    <>
                        <DashboardCard
                            title="My Route"
                            description="View your bus, route, and student pickup list"
                            links={[
                                { to: '/driver/my-bus', label: 'My Bus Details' },
                                { to: '/driver/my-route', label: 'My Route' },
                                { to: '/driver/my-students', label: 'Student Pickup List' },
                                { to: '/driver/report-issue', label: 'Report Issue / SOS' },
                            ]}
                        />
                    </>
                )}

                {/* Parent Dashboard */}
                {hasRole('parent') && (
                    <>
                        <DashboardCard
                            title="My Children"
                            description="View your child's attendance, marks, and bus location"
                            links={[
                                { to: '/parent/my-children', label: 'My Children' },
                                { to: '/parent/attendance', label: 'Attendance Records' },
                                { to: '/parent/marks', label: 'Academic Performance' },
                                { to: '/parent/bus-tracking', label: 'Live Bus Location' },
                            ]}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

const DashboardCard = ({ title, description, links }) => {
    return (
        <div className="dashboard-card">
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="card-links">
                {links.map((link, index) => (
                    <Link key={index} to={link.to} className="card-link">
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RoleBasedDashboard;
