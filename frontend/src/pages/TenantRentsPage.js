import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getRents } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DollarSign, CheckCircle, Clock, AlertTriangle, Calendar, Building2 } from 'lucide-react';

export default function TenantRentsPage() {
    const [rents, setRents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRents();
    }, []);

    const fetchRents = async () => {
        try {
            const response = await getRents();
            setRents(response.data);
        } catch (error) {
            console.error('Failed to fetch rents:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
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

    const getRentStatus = (rent) => {
        if (rent.status === 'paid') {
            return { label: 'Paid', class: 'badge-success', icon: CheckCircle, color: 'emerald' };
        }
        const dueDate = new Date(rent.due_date);
        const now = new Date();
        if (dueDate < now) {
            return { label: 'Overdue', class: 'badge-error', icon: AlertTriangle, color: 'red' };
        }
        return { label: 'Pending', class: 'badge-warning', icon: Clock, color: 'orange' };
    };

    // Stats
    const totalDue = rents.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = rents.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const overdueCount = rents.filter(r => {
        if (r.status === 'paid') return false;
        return new Date(r.due_date) < new Date();
    }).length;

    if (loading) {
        return (
            <DashboardLayout title="Rent Status">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Rent Status">
            <div className="space-y-6" data-testid="tenant-rents-page">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5" data-testid="due-stat">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Amount Due</p>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(totalDue)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5" data-testid="paid-stat">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Paid</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5" data-testid="overdue-stat">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Overdue</p>
                                <p className="text-xl font-bold text-red-600">{overdueCount}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Rent History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Rent History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rents.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>No rent records found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rents.map((rent) => {
                                    const status = getRentStatus(rent);
                                    const StatusIcon = status.icon;
                                    return (
                                        <div
                                            key={rent.id}
                                            className={`p-4 rounded-lg border ${
                                                status.color === 'red' 
                                                    ? 'bg-red-50 border-red-200' 
                                                    : status.color === 'emerald'
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-orange-50 border-orange-200'
                                            }`}
                                            data-testid={`rent-item-${rent.id}`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center`}>
                                                        <StatusIcon className={`w-5 h-5 text-${status.color}-600`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{rent.period}</p>
                                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                                            <Building2 className="w-3 h-3" />
                                                            {rent.property_name || 'Property'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                                    <div className="text-right">
                                                        <p className="font-semibold text-lg text-slate-800">{formatCurrency(rent.amount)}</p>
                                                        <div className="flex items-center gap-1 text-sm text-slate-500">
                                                            <Calendar className="w-3 h-3" />
                                                            Due: {formatDate(rent.due_date)}
                                                        </div>
                                                    </div>
                                                    <span className={`badge ${status.class}`}>{status.label}</span>
                                                </div>
                                            </div>
                                            {rent.paid_date && (
                                                <p className="text-sm text-emerald-600 mt-2 ml-13">
                                                    Paid on {formatDate(rent.paid_date)}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
