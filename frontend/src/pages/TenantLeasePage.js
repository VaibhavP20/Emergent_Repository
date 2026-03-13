import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getLeases } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, Calendar, DollarSign, User, FileText, Download, Eye } from 'lucide-react';

export default function TenantLeasePage() {
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeases();
    }, []);

    const fetchLeases = async () => {
        try {
            const response = await getLeases();
            setLeases(response.data);
        } catch (error) {
            console.error('Failed to fetch leases:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
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

    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) {
        return (
            <DashboardLayout title="My Lease">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="My Lease">
            <div className="space-y-6" data-testid="tenant-lease-page">
                {leases.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <FileText className="empty-state-icon" />
                            <h3 className="empty-state-title">No active lease</h3>
                            <p className="empty-state-description">
                                You don't have any active lease agreements.
                            </p>
                        </div>
                    </Card>
                ) : (
                    leases.map((lease, index) => {
                        const daysRemaining = getDaysRemaining(lease.end_date);
                        return (
                            <Card key={lease.id} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }} data-testid={`lease-detail-${lease.id}`}>
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Building2 className="w-6 h-6" />
                                        <h2 className="text-xl font-semibold">{lease.property_name}</h2>
                                    </div>
                                    <p className="text-slate-300">{lease.property_address}</p>
                                </div>
                                
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Lease Period</p>
                                                <p className="font-medium text-slate-800">
                                                    {formatDate(lease.start_date)}
                                                </p>
                                                <p className="text-sm text-slate-500">to {formatDate(lease.end_date)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Monthly Rent</p>
                                                <p className="font-semibold text-xl text-slate-800">
                                                    {formatCurrency(lease.monthly_rent)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Security Deposit</p>
                                                <p className="font-medium text-slate-800">
                                                    {formatCurrency(lease.security_deposit)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 ${daysRemaining <= 30 ? 'bg-red-50' : 'bg-slate-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <Calendar className={`w-5 h-5 ${daysRemaining <= 30 ? 'text-red-600' : 'text-slate-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Days Remaining</p>
                                                <p className={`font-semibold text-xl ${daysRemaining <= 30 ? 'text-red-600' : 'text-slate-800'}`}>
                                                    {daysRemaining > 0 ? daysRemaining : 'Expired'}
                                                </p>
                                                {daysRemaining <= 30 && daysRemaining > 0 && (
                                                    <p className="text-xs text-red-500">Expiring soon!</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {lease.landlord_name && (
                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Landlord</p>
                                                    <p className="font-medium text-slate-800">{lease.landlord_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </DashboardLayout>
    );
}
