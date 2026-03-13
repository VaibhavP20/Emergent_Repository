import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getComplaints, createComplaint, updateComplaint, getProperties } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, MessageSquare, AlertCircle, CheckCircle, Clock, Building2, User, Reply, Upload, X, Image } from 'lucide-react';

export default function ComplaintsPage() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [formData, setFormData] = useState({
        property_id: '',
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        unit_number: '',
    });
    const [responseText, setResponseText] = useState('');
    const [photos, setPhotos] = useState([]);
    const fileInputRef = useRef(null);

    const isTenant = user?.role === 'tenant';
    const isManager = user?.role === 'property_manager';
    const isLandlord = user?.role === 'landlord';
    const canCreate = isTenant || isManager;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [complaintsRes, propertiesRes] = await Promise.all([
                getComplaints(),
                (isTenant || isManager) ? getProperties() : Promise.resolve({ data: [] }),
            ]);
            setComplaints(complaintsRes.data);
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
            // Convert photos to base64 for storage
            const photoData = photos.map(p => p.base64);
            await createComplaint({
                ...formData,
                photos: photoData
            });
            toast.success('Complaint submitted successfully');
            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to submit complaint');
        }
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 5) {
            toast.error('Maximum 5 photos allowed');
            return;
        }

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Max size is 5MB`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => [...prev, {
                    name: file.name,
                    base64: reader.result,
                    preview: URL.createObjectURL(file)
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleResponse = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;
        try {
            await updateComplaint(selectedComplaint.id, {
                response: responseText,
                status: 'in_progress',
            });
            toast.success('Response sent successfully');
            setResponseDialogOpen(false);
            setSelectedComplaint(null);
            setResponseText('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to send response');
        }
    };

    const handleResolve = async (complaintId) => {
        try {
            await updateComplaint(complaintId, { status: 'resolved' });
            toast.success('Complaint marked as resolved');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to resolve complaint');
        }
    };

    const openResponseDialog = (complaint) => {
        setSelectedComplaint(complaint);
        setResponseText(complaint.response || '');
        setResponseDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            property_id: '',
            title: '',
            description: '',
            priority: '',
            category: '',
            unit_number: '',
        });
        setPhotos([]);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return { label: 'Open', class: 'badge-info', icon: AlertCircle };
            case 'in_progress':
                return { label: 'In Progress', class: 'badge-warning', icon: Clock };
            case 'resolved':
                return { label: 'Resolved', class: 'badge-success', icon: CheckCircle };
            default:
                return { label: status, class: 'badge-neutral', icon: AlertCircle };
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return 'priority-high';
            case 'medium':
                return 'priority-medium';
            case 'low':
                return 'priority-low';
            default:
                return 'badge-neutral';
        }
    };

    const canRespond = (complaint) => {
        // Property managers can respond to tenant complaints
        if (complaint.complaint_type === 'tenant' && isManager) return true;
        // Landlords can respond to manager complaints
        if (complaint.complaint_type === 'manager' && isLandlord) return true;
        return false;
    };

    // Filter complaints based on tab
    const filteredComplaints = complaints.filter(c => {
        if (activeTab === 'all') return true;
        if (activeTab === 'tenant') return c.complaint_type === 'tenant';
        if (activeTab === 'manager') return c.complaint_type === 'manager';
        return true;
    });

    // Get page title and description based on role
    const getPageInfo = () => {
        if (isTenant) {
            return {
                title: 'My Complaints',
                description: 'Submit and track your complaints'
            };
        }
        if (isLandlord) {
            return {
                title: 'Property Manager Complaints',
                description: 'View and respond to complaints from property managers'
            };
        }
        return {
            title: 'Complaints',
            description: 'Manage tenant complaints and send complaints to landlords'
        };
    };

    const pageInfo = getPageInfo();

    if (loading) {
        return (
            <DashboardLayout title={pageInfo.title}>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={pageInfo.title}>
            <div className="space-y-6" data-testid="complaints-page">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-slate-500">{pageInfo.description}</p>
                    </div>
                    {canCreate && (
                        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-slate-900 hover:bg-slate-800" data-testid="new-complaint-button">
                            <Plus className="w-4 h-4 mr-2" />
                            {isTenant ? 'New Complaint' : 'Complaint to Landlord'}
                        </Button>
                    )}
                </div>

                {/* Tabs for Property Manager to filter complaint types */}
                {isManager && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="all" data-testid="tab-all">All Complaints</TabsTrigger>
                            <TabsTrigger value="tenant" data-testid="tab-tenant">From Tenants</TabsTrigger>
                            <TabsTrigger value="manager" data-testid="tab-manager">To Landlords</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}

                {filteredComplaints.length === 0 ? (
                    <Card className="p-12">
                        <div className="empty-state">
                            <MessageSquare className="empty-state-icon" />
                            <h3 className="empty-state-title">No complaints</h3>
                            <p className="empty-state-description">
                                {isTenant ? 'Submit a complaint if you have any issues.' : 
                                 isLandlord ? 'No complaints from property managers.' :
                                 'No complaints to review.'}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredComplaints.map((complaint, index) => {
                            const status = getStatusBadge(complaint.status);
                            const StatusIcon = status.icon;
                            return (
                                <Card key={complaint.id} className="p-5 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }} data-testid={`complaint-card-${complaint.id}`}>
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg text-slate-800">{complaint.title}</h3>
                                                <span className={`badge ${getPriorityBadge(complaint.priority)}`}>
                                                    {complaint.priority}
                                                </span>
                                                <span className={`badge ${status.class} flex items-center gap-1`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                                {isManager && (
                                                    <span className={`badge ${complaint.complaint_type === 'tenant' ? 'badge-info' : 'badge-warning'}`}>
                                                        {complaint.complaint_type === 'tenant' ? 'From Tenant' : 'To Landlord'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-600 mb-3">{complaint.description}</p>
                                            
                                            {/* Display photos if available */}
                                            {complaint.photos && complaint.photos.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {complaint.photos.map((photo, photoIndex) => (
                                                        <img
                                                            key={photoIndex}
                                                            src={photo}
                                                            alt={`Complaint photo ${photoIndex + 1}`}
                                                            className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                                            onClick={() => window.open(photo, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {complaint.property_name}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {complaint.complaint_type === 'tenant' 
                                                        ? complaint.tenant_name 
                                                        : `From: ${complaint.created_by_name || 'Property Manager'}`}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDate(complaint.created_at)}
                                                </div>
                                            </div>
                                            
                                            {complaint.response && (
                                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border-l-4 border-emerald-500">
                                                    <p className="text-sm font-medium text-slate-700 mb-1">
                                                        {complaint.complaint_type === 'tenant' ? 'Response from Property Manager:' : 'Response from Landlord:'}
                                                    </p>
                                                    <p className="text-sm text-slate-600">{complaint.response}</p>
                                                </div>
                                            )}
                                        </div>

                                        {canRespond(complaint) && complaint.status !== 'resolved' && (
                                            <div className="flex gap-2 lg:flex-col">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openResponseDialog(complaint)}
                                                    data-testid={`respond-complaint-${complaint.id}`}
                                                >
                                                    <Reply className="w-4 h-4 mr-1" />
                                                    Respond
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleResolve(complaint.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                    data-testid={`resolve-complaint-${complaint.id}`}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Resolve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New Complaint Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="complaint-dialog">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {isTenant ? 'Submit a Complaint' : 'Send Complaint to Landlord'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Tenant-specific form fields */}
                        {isTenant && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Your Name</Label>
                                    <Input
                                        value={user?.name || ''}
                                        disabled
                                        className="bg-slate-50"
                                        data-testid="complaint-name-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Unit Number</Label>
                                    <Input
                                        value={formData.unit_number}
                                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                        placeholder="Enter your unit number"
                                        required
                                        data-testid="complaint-unit-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger data-testid="complaint-category-select">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="plumbing">Plumbing</SelectItem>
                                            <SelectItem value="electrical">Electrical</SelectItem>
                                            <SelectItem value="hvac">HVAC / Air Conditioning</SelectItem>
                                            <SelectItem value="appliance">Appliance Issue</SelectItem>
                                            <SelectItem value="pest">Pest Control</SelectItem>
                                            <SelectItem value="structural">Structural / Building</SelectItem>
                                            <SelectItem value="security">Security Concern</SelectItem>
                                            <SelectItem value="noise">Noise Complaint</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                    >
                                        <SelectTrigger data-testid="complaint-priority-select">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low - Can wait a few days</SelectItem>
                                            <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
                                            <SelectItem value="high">High - Urgent issue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Issue Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Brief summary of the issue"
                                        required
                                        data-testid="complaint-title-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Detailed Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Please describe the issue in detail..."
                                        rows={4}
                                        required
                                        data-testid="complaint-description-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Upload Photos (Optional)</Label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handlePhotoUpload}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full border-dashed border-2 h-20 flex flex-col items-center justify-center gap-2 hover:bg-slate-50"
                                        data-testid="upload-photos-button"
                                    >
                                        <Upload className="w-5 h-5 text-slate-400" />
                                        <span className="text-sm text-slate-500">Click to upload photos (max 5)</span>
                                    </Button>
                                    
                                    {photos.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {photos.map((photo, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={photo.preview}
                                                        alt={`Upload ${index + 1}`}
                                                        className="w-16 h-16 object-cover rounded-lg border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Property Manager form fields */}
                        {isManager && (
                            <>
                                <div className="space-y-2">
                                    <Label>Property</Label>
                                    <Select
                                        value={formData.property_id}
                                        onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                                    >
                                        <SelectTrigger data-testid="complaint-property-select">
                                            <SelectValue placeholder="Select property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map((property) => (
                                                <SelectItem key={property.id} value={property.id}>
                                                    {property.name} - {property.address}
                                                    {property.landlord_name && ` (${property.landlord_name})`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500">
                                        This complaint will be sent to the landlord assigned to this property.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Brief summary of the issue"
                                        required
                                        data-testid="complaint-title-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                    >
                                        <SelectTrigger data-testid="complaint-priority-select">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the issue in detail"
                                        rows={4}
                                        required
                                        data-testid="complaint-description-input"
                                    />
                                </div>
                            </>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="submit-complaint-button">
                                Submit Complaint
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Response Dialog */}
            <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
                <DialogContent className="sm:max-w-lg" data-testid="response-dialog">
                    <DialogHeader>
                        <DialogTitle>Respond to Complaint</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleResponse} className="space-y-4">
                        {selectedComplaint && (
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-800">{selectedComplaint.title}</p>
                                <p className="text-sm text-slate-500 mt-1">{selectedComplaint.description}</p>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label>Your Response</Label>
                            <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder={isLandlord ? "Enter your response to the property manager" : "Enter your response to the tenant"}
                                rows={4}
                                required
                                data-testid="response-text-input"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setResponseDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="send-response-button">
                                Send Response
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
