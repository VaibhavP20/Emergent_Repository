import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getUsers, deleteUser } from '../services/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { UserCircle, Mail, Phone, Trash2, Calendar } from 'lucide-react';

export default function LandlordsPage() {
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this landlord?')) return;
        try {
            await deleteUser(id);
            toast.success('Landlord removed successfully');
            fetchLandlords();
        } catch (error) {
            toast.error('Failed to remove landlord');
        }
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
                <div>
                    <p className="text-slate-500">Manage all landlords registered in the system</p>
                </div>

                {landlords.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <UserCircle className="empty-state-icon" />
                            <h3 className="empty-state-title">No landlords yet</h3>
                            <p className="empty-state-description">
                                Landlords will appear here once they register.
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
                                                    onClick={() => handleDelete(landlord.id)}
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
        </DashboardLayout>
    );
}
