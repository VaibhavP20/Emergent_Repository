import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getProperties, createProperty, updateProperty, deleteProperty, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Building2, MapPin, Edit, Trash2, Home, Users } from 'lucide-react';

const PROPERTY_IMAGES = [
    'https://images.unsplash.com/photo-1771287490603-fbf9b6211cc3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGJyaWdodHxlbnwwfHx8fDE3NzI1MDIyNTh8MA&ixlib=rb-4.1.0&q=85&w=400',
    'https://images.unsplash.com/photo-1758548157747-285c7012db5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGJyaWdodHxlbnwwfHx8fDE3NzI1MDIyNTh8MA&ixlib=rb-4.1.0&q=85&w=400',
    'https://images.unsplash.com/photo-1757439402190-99b73ac8e807?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGJyaWdodHxlbnwwfHx8fDE3NzI1MDIyNTh8MA&ixlib=rb-4.1.0&q=85&w=400',
];

export default function PropertiesPage() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        property_type: '',
        units: 1,
        description: '',
        landlord_id: '',
        image_url: '',
    });

    const isManager = user?.role === 'property_manager';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [propertiesRes, landlordsRes] = await Promise.all([
                getProperties(),
                isManager ? getUsers('landlord') : Promise.resolve({ data: [] }),
            ]);
            setProperties(propertiesRes.data);
            setLandlords(landlordsRes.data);
        } catch (error) {
            toast.error('Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                ...formData,
                units: parseInt(formData.units) || 1,
                image_url: formData.image_url || PROPERTY_IMAGES[Math.floor(Math.random() * PROPERTY_IMAGES.length)],
            };
            
            if (editingProperty) {
                await updateProperty(editingProperty.id, dataToSend);
                toast.success('Property updated successfully');
            } else {
                await createProperty(dataToSend);
                toast.success('Property created successfully');
            }
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Operation failed');
        }
    };

    const handleEdit = (property) => {
        setEditingProperty(property);
        setFormData({
            name: property.name,
            address: property.address,
            property_type: property.property_type,
            units: property.units,
            description: property.description || '',
            landlord_id: property.landlord_id || '',
            image_url: property.image_url || '',
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this property?')) return;
        try {
            await deleteProperty(id);
            toast.success('Property deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete property');
        }
    };

    const resetForm = () => {
        setEditingProperty(null);
        setFormData({
            name: '',
            address: '',
            property_type: '',
            units: 1,
            description: '',
            landlord_id: '',
            image_url: '',
        });
    };

    const openAddDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout title="Properties">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Properties">
            <div className="space-y-6" data-testid="properties-page">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-slate-500">
                            {isManager ? 'Manage all properties in the system' : 'View your properties'}
                        </p>
                    </div>
                    {isManager && (
                        <Button onClick={openAddDialog} className="bg-slate-900 hover:bg-slate-800" data-testid="add-property-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Property
                        </Button>
                    )}
                </div>

                {/* Properties Grid */}
                {properties.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <Building2 className="empty-state-icon" />
                            <h3 className="empty-state-title">No properties yet</h3>
                            <p className="empty-state-description">
                                {isManager ? 'Get started by adding your first property.' : 'No properties assigned to you yet.'}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property, index) => (
                            <Card key={property.id} className="overflow-hidden card-hover animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }} data-testid={`property-card-${property.id}`}>
                                <div className="h-40 bg-slate-200 relative">
                                    <img
                                        src={property.image_url || PROPERTY_IMAGES[index % PROPERTY_IMAGES.length]}
                                        alt={property.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className="badge badge-info">{property.property_type}</span>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg text-slate-800 mb-2">{property.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                        <MapPin className="w-4 h-4" />
                                        <span>{property.address}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <Home className="w-4 h-4" />
                                            <span>{property.units} units</span>
                                        </div>
                                        {property.landlord_name && (
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <Users className="w-4 h-4" />
                                                <span>{property.landlord_name}</span>
                                            </div>
                                        )}
                                    </div>
                                    {isManager && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(property)}
                                                className="flex-1"
                                                data-testid={`edit-property-${property.id}`}
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(property.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                data-testid={`delete-property-${property.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg" data-testid="property-dialog">
                    <DialogHeader>
                        <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Property Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Sunset Apartments"
                                required
                                data-testid="property-name-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="123 Main St, City, State"
                                required
                                data-testid="property-address-input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Property Type</Label>
                                <Select
                                    value={formData.property_type}
                                    onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                                >
                                    <SelectTrigger data-testid="property-type-select">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="condo">Condo</SelectItem>
                                        <SelectItem value="townhouse">Townhouse</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="units">Number of Units</Label>
                                <Input
                                    id="units"
                                    type="number"
                                    min="1"
                                    value={formData.units}
                                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                    data-testid="property-units-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="landlord">Assign Landlord</Label>
                            <Select
                                value={formData.landlord_id || "none"}
                                onValueChange={(value) => setFormData({ ...formData, landlord_id: value === "none" ? "" : value })}
                            >
                                <SelectTrigger data-testid="property-landlord-select">
                                    <SelectValue placeholder="Select landlord (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No landlord assigned</SelectItem>
                                    {landlords.map((landlord) => (
                                        <SelectItem key={landlord.id} value={landlord.id}>
                                            {landlord.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the property"
                                rows={3}
                                data-testid="property-description-input"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-property-button">
                                {editingProperty ? 'Update' : 'Create'} Property
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
