import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getLeases, createLease, updateLease, deleteLease, getProperties, getUsers } from '../services/api';
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
import { Plus, FileText, Edit, Trash2, Building2, User, Calendar, DollarSign, Upload, X } from 'lucide-react';

export default function LeasesPage() {
    const { user } = useAuth();
    const [leases, setLeases] = useState([]);
    const [properties, setProperties] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLease, setEditingLease] = useState(null);
    const [formData, setFormData] = useState({
        property_id: '',
        tenant_id: '',
        start_date: '',
        end_date: '',
        monthly_rent: '',
        security_deposit: '',
    });

    const isManager = user?.role === 'property_manager';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leasesRes, propertiesRes, tenantsRes] = await Promise.all([
                getLeases(),
                isManager ? getProperties() : Promise.resolve({ data: [] }),
                isManager ? getUsers('tenant') : Promise.resolve({ data: [] }),
            ]);
            setLeases(leasesRes.data);
            setProperties(propertiesRes.data);
            setTenants(tenantsRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                monthly_rent: parseFloat(formData.monthly_rent),
                security_deposit: parseFloat(formData.security_deposit),
            };

            if (editingLease) {
                await updateLease(editingLease.id, {
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    monthly_rent: dataToSend.monthly_rent,
                });
                toast.success('Lease updated successfully');
            } else {
                await createLease(dataToSend);
                toast.success('Lease created successfully');
            }
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleEdit = (lease) => {
        setEditingLease(lease);
        setFormData({
            property_id: lease.property_id,
            tenant_id: lease.tenant_id,
            start_date: lease.start_date,
            end_date: lease.end_date,
            monthly_rent: lease.monthly_rent.toString(),
            security_deposit: lease.security_deposit.toString(),
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lease?')) return;
        try {
            await deleteLease(id);
            toast.success('Lease deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete lease');
        }
    };

    const resetForm = () => {
        setEditingLease(null);
        setFormData({
            property_id: '',
            tenant_id: '',
            start_date: '',
            end_date: '',
            monthly_rent: '',
            security_deposit: '',
        });
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

    const getLeaseStatus = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) return { label: 'Expired', class: 'badge-error' };
        if (daysLeft <= 30) return { label: 'Expiring Soon', class: 'badge-warning' };
        return { label: 'Active', class: 'badge-success' };
    };

    if (loading) {
        return (
            <DashboardLayout title="Leases">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Leases">
            <div className="space-y-6" data-testid="leases-page">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-slate-500">
                            {isManager ? 'Manage all lease agreements' : 'View lease agreements'}
                        </p>
                    </div>
                    {isManager && (
                        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-slate-900 hover:bg-slate-800" data-testid="add-lease-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Lease
                        </Button>
                    )}
                </div>

                {leases.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <FileText className="empty-state-icon" />
                            <h3 className="empty-state-title">No leases yet</h3>
                            <p className="empty-state-description">
                                {isManager ? 'Create your first lease agreement.' : 'No lease agreements found.'}
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
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Monthly Rent</th>
                                        <th>Status</th>
                                        {isManager && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leases.map((lease) => {
                                        const status = getLeaseStatus(lease.end_date);
                                        return (
                                            <tr key={lease.id} data-testid={`lease-row-${lease.id}`}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        <div>
                                                            <p className="font-medium text-slate-800">{lease.property_name}</p>
                                                            <p className="text-xs text-slate-500">{lease.property_address}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        {lease.tenant_name}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {formatDate(lease.start_date)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {formatDate(lease.end_date)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium">{formatCurrency(lease.monthly_rent)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.class}`}>{status.label}</span>
                                                </td>
                                                {isManager && (
                                                    <td>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(lease)}
                                                                data-testid={`edit-lease-${lease.id}`}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(lease.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                data-testid={`delete-lease-${lease.id}`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
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

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg" data-testid="lease-dialog">
                    <DialogHeader>
                        <DialogTitle>{editingLease ? 'Edit Lease' : 'Create New Lease'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!editingLease && (
                            <>
                                <div className="space-y-2">
                                    <Label>Property</Label>
                                    <Select
                                        value={formData.property_id}
                                        onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                                    >
                                        <SelectTrigger data-testid="lease-property-select">
                                            <SelectValue placeholder="Select property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map((property) => (
                                                <SelectItem key={property.id} value={property.id}>
                                                    {property.name} - {property.address}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tenant</Label>
                                    <Select
                                        value={formData.tenant_id}
                                        onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                                    >
                                        <SelectTrigger data-testid="lease-tenant-select">
                                            <SelectValue placeholder="Select tenant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tenants.map((tenant) => (
                                                <SelectItem key={tenant.id} value={tenant.id}>
                                                    {tenant.name} ({tenant.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                    data-testid="lease-start-date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                    data-testid="lease-end-date"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monthly Rent ($)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.monthly_rent}
                                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                                    required
                                    data-testid="lease-monthly-rent"
                                />
                            </div>
                            {!editingLease && (
                                <div className="space-y-2">
                                    <Label>Security Deposit ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.security_deposit}
                                        onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                                        required
                                        data-testid="lease-security-deposit"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-lease-button">
                                {editingLease ? 'Update' : 'Create'} Lease
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
