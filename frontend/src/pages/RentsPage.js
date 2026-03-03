import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getRents, createRent, updateRent, getLeases } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, DollarSign, CheckCircle, Clock, AlertTriangle, Building2, Calendar } from 'lucide-react';

export default function RentsPage() {
    const { user } = useAuth();
    const [rents, setRents] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        lease_id: '',
        amount: '',
        due_date: '',
        period: '',
    });

    const isManager = user?.role === 'property_manager';
    const canMarkPaid = isManager || user?.role === 'landlord';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rentsRes, leasesRes] = await Promise.all([
                getRents(),
                isManager ? getLeases() : Promise.resolve({ data: [] }),
            ]);
            setRents(rentsRes.data);
            setLeases(leasesRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createRent({
                ...formData,
                amount: parseFloat(formData.amount),
            });
            toast.success('Rent record created successfully');
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleMarkPaid = async (rentId) => {
        try {
            await updateRent(rentId, {
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0],
            });
            toast.success('Rent marked as paid');
            fetchData();
        } catch (error) {
            toast.error('Failed to update rent status');
        }
    };

    const handleMarkPending = async (rentId) => {
        try {
            await updateRent(rentId, { status: 'pending' });
            toast.success('Rent marked as pending');
            fetchData();
        } catch (error) {
            toast.error('Failed to update rent status');
        }
    };

    const resetForm = () => {
        setFormData({
            lease_id: '',
            amount: '',
            due_date: '',
            period: '',
        });
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
            return { label: 'Paid', class: 'badge-success', icon: CheckCircle };
        }
        const dueDate = new Date(rent.due_date);
        const now = new Date();
        if (dueDate < now) {
            return { label: 'Overdue', class: 'badge-error', icon: AlertTriangle };
        }
        return { label: 'Pending', class: 'badge-warning', icon: Clock };
    };

    // Calculate stats
    const totalRent = rents.reduce((sum, r) => sum + r.amount, 0);
    const paidRent = rents.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const pendingRent = rents.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);

    if (loading) {
        return (
            <DashboardLayout title="Rent Tracking">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Rent Tracking">
            <div className="space-y-6" data-testid="rents-page">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5" data-testid="total-rent-stat">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Rent</p>
                                <p className="text-xl font-bold text-slate-800">{formatCurrency(totalRent)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5" data-testid="paid-rent-stat">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Collected</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(paidRent)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5" data-testid="pending-rent-stat">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending</p>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(pendingRent)}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-slate-500">Track and manage rent payments</p>
                    </div>
                    {isManager && (
                        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-slate-900 hover:bg-slate-800" data-testid="add-rent-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rent Record
                        </Button>
                    )}
                </div>

                {/* Rent List */}
                {rents.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <DollarSign className="empty-state-icon" />
                            <h3 className="empty-state-title">No rent records yet</h3>
                            <p className="empty-state-description">
                                {isManager ? 'Create your first rent record.' : 'No rent records found.'}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Tenant</th>
                                        <th>Period</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Paid Date</th>
                                        <th>Status</th>
                                        {canMarkPaid && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rents.map((rent) => {
                                        const status = getRentStatus(rent);
                                        const StatusIcon = status.icon;
                                        return (
                                            <tr key={rent.id} data-testid={`rent-row-${rent.id}`}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium text-slate-800">{rent.property_name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td>{rent.tenant_name || 'N/A'}</td>
                                                <td>{rent.period}</td>
                                                <td className="font-semibold">{formatCurrency(rent.amount)}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {formatDate(rent.due_date)}
                                                    </div>
                                                </td>
                                                <td>{formatDate(rent.paid_date)}</td>
                                                <td>
                                                    <span className={`badge ${status.class} flex items-center gap-1 w-fit`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                {canMarkPaid && (
                                                    <td>
                                                        {rent.status === 'pending' ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleMarkPaid(rent.id)}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                data-testid={`mark-paid-${rent.id}`}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Mark Paid
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleMarkPending(rent.id)}
                                                                data-testid={`mark-pending-${rent.id}`}
                                                            >
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                Mark Pending
                                                            </Button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md" data-testid="rent-dialog">
                    <DialogHeader>
                        <DialogTitle>Add Rent Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Lease</Label>
                            <Select
                                value={formData.lease_id}
                                onValueChange={(value) => {
                                    const lease = leases.find(l => l.id === value);
                                    setFormData({ 
                                        ...formData, 
                                        lease_id: value,
                                        amount: lease ? lease.monthly_rent.toString() : '',
                                    });
                                }}
                            >
                                <SelectTrigger data-testid="rent-lease-select">
                                    <SelectValue placeholder="Select lease" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leases.map((lease) => (
                                        <SelectItem key={lease.id} value={lease.id}>
                                            {lease.property_name} - {lease.tenant_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount ($)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                data-testid="rent-amount-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                required
                                data-testid="rent-due-date"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Period</Label>
                            <Input
                                type="text"
                                placeholder="e.g., January 2024"
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                required
                                data-testid="rent-period-input"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-rent-button">
                                Create Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
