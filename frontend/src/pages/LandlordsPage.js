import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getUsers, deleteUser } from '../services/api';
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
import { toast } from 'sonner';
import { UserCircle, Mail, Phone, Trash2, Calendar, Plus } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandlordsPage() {
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        fetchLandlords();
    }, []);

    const fetchLandlords = async () => {
        try {
            const response = await getUsers('landlord');
            setLandlords(response.data);
        } catch (error) {
            toast.error('Failed to fetch landlords');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API}/users/`, {
                ...formData,
                role: 'landlord'
            });
            if (response.data.email_sent) {
                toast.success('Landlord created! Login credentials sent to their email.');
            } else {
                toast.success('Landlord created! (Email notification may have failed)');
            }
            setDialogOpen(false);
            resetForm();
            fetchLandlords();
        } catch (error) {
            toast.error(error.response?.data?.email?.[0] || error.response?.data?.detail || 'Failed to create landlord');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name}? This will also delete their login access.`)) return;
        try {
            await deleteUser(id);
            toast.success('Landlord removed successfully');
            fetchLandlords();
        } catch (error) {
            toast.error('Failed to remove landlord');
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
            <DashboardLayout title="Landlords">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Landlords">
            <div className="space-y-6" data-testid="landlords-page">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-slate-500">Manage all landlords registered in the system</p>
                    </div>
                    <Button 
                        onClick={() => { resetForm(); setDialogOpen(true); }} 
                        className="bg-slate-900 hover:bg-slate-800"
                        data-testid="add-landlord-button"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Landlord
                    </Button>
                </div>

                {landlords.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <UserCircle className="empty-state-icon" />
                            <h3 className="empty-state-title">No landlords yet</h3>
                            <p className="empty-state-description">
                                Add your first landlord to get started.
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
                                    {landlords.map((landlord) => (
                                        <tr key={landlord.id} data-testid={`landlord-row-${landlord.id}`}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {landlord.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium text-slate-800">{landlord.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    {landlord.email}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    {landlord.phone || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {formatDate(landlord.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(landlord.id, landlord.name)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    data-testid={`delete-landlord-${landlord.id}`}
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

            {/* Add Landlord Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md" data-testid="add-landlord-dialog">
                    <DialogHeader>
                        <DialogTitle>Add New Landlord</DialogTitle>
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
                                data-testid="landlord-name-input"
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
                                    placeholder="landlord@example.com"
                                    className="pl-10"
                                    required
                                    data-testid="landlord-email-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="pl-10"
                                    required
                                    minLength={6}
                                    data-testid="landlord-password-input"
                                />
                            </div>
                            <p className="text-xs text-slate-500">Minimum 6 characters. Share this with the landlord for login.</p>
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
                                    data-testid="landlord-phone-input"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-landlord-button">
                                Create Landlord
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
