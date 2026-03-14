import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getUsers, deleteUser, getProperties, createLease } from '../services/api';
import axios from 'axios';
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
import { Users, Mail, Phone, Trash2, Calendar, Plus, Building2, Home } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [assignData, setAssignData] = useState({
        property_id: '',
        start_date: '',
        end_date: '',
        monthly_rent: '',
        security_deposit: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tenantsRes, propertiesRes] = await Promise.all([
                getUsers('tenant'),
                getProperties()
            ]);
            setTenants(tenantsRes.data);
            setProperties(propertiesRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API}/users/`, {
                ...formData,
                role: 'tenant'
            });
            if (response.data.email_sent) {
                toast.success('Tenant created! Login credentials sent to their email.');
            } else {
                toast.success('Tenant created! (Email notification may have failed)');
            }
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.email?.[0] || error.response?.data?.detail || 'Failed to create tenant');
        }
    };

    const handleAssignProperty = (tenant) => {
        setSelectedTenant(tenant);
        setAssignData({
            property_id: '',
            start_date: '',
            end_date: '',
            monthly_rent: '',
            security_deposit: '',
        });
        setAssignDialogOpen(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await createLease({
                ...assignData,
                tenant_id: selectedTenant.id,
                monthly_rent: parseFloat(assignData.monthly_rent),
                security_deposit: parseFloat(assignData.security_deposit),
            });
            toast.success(`${selectedTenant.name} has been assigned to the property!`);
            setAssignDialogOpen(false);
            setSelectedTenant(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to assign property');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name}? This will also delete their login access.`)) return;
        try {
            await deleteUser(id);
            toast.success('Tenant removed successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove tenant');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="Tenants">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Tenants">
            <div className="space-y-6" data-testid="tenants-page">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-slate-500">Manage all tenants registered in the system</p>
                    </div>
                    <Button 
                        onClick={() => { resetForm(); setDialogOpen(true); }} 
                        className="bg-slate-900 hover:bg-slate-800"
                        data-testid="add-tenant-button"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tenant
                    </Button>
                </div>

                {tenants.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <Users className="empty-state-icon" />
                            <h3 className="empty-state-title">No tenants yet</h3>
                            <p className="empty-state-description">
                                Add your first tenant to get started.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenants.map((tenant) => (
                                        <tr key={tenant.id} data-testid={`tenant-row-${tenant.id}`}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-slate-600">
                                                            {tenant.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium text-slate-800">{tenant.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    {tenant.email}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    {tenant.phone || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {formatDate(tenant.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAssignProperty(tenant)}
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        data-testid={`assign-property-${tenant.id}`}
                                                    >
                                                        <Home className="w-4 h-4 mr-1" />
                                                        Assign Property
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(tenant.id, tenant.name)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    data-testid={`delete-tenant-${tenant.id}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Tenant Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md" data-testid="add-tenant-dialog">
                    <DialogHeader>
                        <DialogTitle>Add New Tenant</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                                data-testid="tenant-name-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Login Username)</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="tenant@example.com"
                                    className="pl-10"
                                    required
                                    data-testid="tenant-email-input"
                                />
                            </div>
                            <p className="text-xs text-slate-500">Login credentials will be sent to this email.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                    className="pl-10"
                                    data-testid="tenant-phone-input"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-tenant-button">
                                Create Tenant
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
