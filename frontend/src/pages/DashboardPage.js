import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getDashboardStats, getLeases, getRents, getComplaints, getPropertyTenants } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Users, MessageSquare, DollarSign, AlertTriangle, CheckCircle, Clock, Home, User } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentLeases, setRecentLeases] = useState([]);
    const [pendingRents, setPendingRents] = useState([]);
    const [openComplaints, setOpenComplaints] = useState([]);
    const [propertyTenants, setPropertyTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const promises = [
                getDashboardStats(),
                getLeases(),
                getRents(),
                getComplaints(),
            ];
            
            // Add property tenants for property managers and landlords
            if (user?.role === 'property_manager' || user?.role === 'landlord') {
                promises.push(getPropertyTenants());
            }
            
            const results = await Promise.all(promises);
            
            setStats(results[0].data);
            setRecentLeases(results[1].data.slice(0, 5));
            setPendingRents(results[2].data.filter(r => r.status === 'pending').slice(0, 5));
            setOpenComplaints(results[3].data.filter(c => c.status === 'open').slice(0, 5));
            
            if (results[4]) {
                setPropertyTenants(results[4].data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleTitle = () => {
        switch (user?.role) {
            case 'property_manager':
                return 'Property Manager Dashboard';
            case 'landlord':
                return 'Landlord Dashboard';
            case 'tenant':
                return 'Tenant Dashboard';
            default:
                return 'Dashboard';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout title={getRoleTitle()}>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={getRoleTitle()}>
            <div className="space-y-6" data-testid="dashboard">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white animate-fade-in">
                    <h2 className="text-2xl font-semibold mb-2">Welcome back, {user?.name}!</h2>
                    <p className="text-slate-300">
                        Here's what's happening with your properties today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
                    {user?.role === 'property_manager' && (
                        <>
                            <Card className="stats-card animate-fade-in stagger-1" data-testid="stat-properties">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Total Properties</p>
                                            <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_properties || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="stats-card animate-fade-in stagger-2" data-testid="stat-tenants">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Total Tenants</p>
                                            <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_tenants || 0}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                            <Users className="w-6 h-6 text-emerald-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    <Card className="stats-card animate-fade-in stagger-3" data-testid="stat-pending-rent">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Pending Rent</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.pending_rent || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="stats-card animate-fade-in stagger-4" data-testid="stat-complaints">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Open Complaints</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.pending_complaints || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {(user?.role === 'property_manager' || user?.role === 'landlord') && (
                        <Card className="stats-card animate-fade-in stagger-5" data-testid="stat-collected">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Rent Collected</p>
                                        <p className="text-2xl font-bold text-emerald-600 mt-1">
                                            {formatCurrency(stats?.total_rent_collected || 0)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Rents */}
                    <Card className="animate-fade-in" data-testid="pending-rents-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                Pending Rent Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingRents.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                                    <p>All rent payments are up to date!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRents.map((rent) => (
                                        <div
                                            key={rent.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                            data-testid={`pending-rent-${rent.id}`}
                                        >
                                            <div>
                                                <p className="font-medium text-slate-800">{rent.property_name || 'Property'}</p>
                                                <p className="text-sm text-slate-500">Due: {formatDate(rent.due_date)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-800">{formatCurrency(rent.amount)}</p>
                                                <span className="badge badge-warning">Pending</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Open Complaints */}
                    <Card className="animate-fade-in" data-testid="open-complaints-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Recent Complaints
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {openComplaints.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                                    <p>No open complaints!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {openComplaints.map((complaint) => (
                                        <div
                                            key={complaint.id}
                                            className="p-3 bg-slate-50 rounded-lg"
                                            data-testid={`complaint-${complaint.id}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-slate-800">{complaint.title}</p>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {complaint.property_name} • {complaint.tenant_name}
                                                    </p>
                                                </div>
                                                <span className={`badge priority-${complaint.priority}`}>
                                                    {complaint.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Leases */}
                {recentLeases.length > 0 && (
                    <Card className="animate-fade-in" data-testid="recent-leases-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Recent Leases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Property</th>
                                            <th>Tenant</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Monthly Rent</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLeases.map((lease) => (
                                            <tr key={lease.id} data-testid={`lease-row-${lease.id}`}>
                                                <td className="font-medium text-slate-800">{lease.property_name}</td>
                                                <td>{lease.tenant_name}</td>
                                                <td>{formatDate(lease.start_date)}</td>
                                                <td>{formatDate(lease.end_date)}</td>
                                                <td className="font-medium">{formatCurrency(lease.monthly_rent)}</td>
                                                <td>
                                                    <span className={`badge ${lease.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                                        {lease.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
