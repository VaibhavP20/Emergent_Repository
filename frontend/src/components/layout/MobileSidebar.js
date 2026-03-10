import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    LayoutDashboard, 
    Building2, 
    Users, 
    FileText, 
    MessageSquare, 
    DollarSign,
    LogOut,
    UserCircle,
    Home,
    X
} from 'lucide-react';

export const MobileSidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
    };

    const getNavItems = () => {
        const baseItems = [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ];

        if (user?.role === 'property_manager') {
            return [
                ...baseItems,
                { to: '/properties', icon: Building2, label: 'Properties' },
                { to: '/tenants', icon: Users, label: 'Tenants' },
                { to: '/landlords', icon: UserCircle, label: 'Landlords' },
                { to: '/leases', icon: FileText, label: 'Leases' },
                { to: '/rents', icon: DollarSign, label: 'Rent Tracking' },
                { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
            ];
        }

        if (user?.role === 'landlord') {
            return [
                ...baseItems,
                { to: '/properties', icon: Building2, label: 'My Properties' },
                { to: '/leases', icon: FileText, label: 'Leases' },
                { to: '/rents', icon: DollarSign, label: 'Rent Tracking' },
                { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
            ];
        }

        return [
            ...baseItems,
            { to: '/my-lease', icon: FileText, label: 'My Lease' },
            { to: '/my-rents', icon: DollarSign, label: 'Rent Status' },
            { to: '/my-complaints', icon: MessageSquare, label: 'Complaints' },
        ];
    };

    const navItems = getNavItems();

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 md:hidden flex flex-col animate-slide-in">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">House2home</h1>
                            <p className="text-xs text-slate-400">Property Management</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
