import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PropertiesPage from "./pages/PropertiesPage";
import TenantsPage from "./pages/TenantsPage";
import LandlordsPage from "./pages/LandlordsPage";
import LeasesPage from "./pages/LeasesPage";
import RentsPage from "./pages/RentsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import TenantLeasePage from "./pages/TenantLeasePage";
import TenantRentsPage from "./pages/TenantRentsPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

const LandingRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Landing Page */}
            <Route
                path="/"
                element={
                    <LandingRoute>
                        <LandingPage />
                    </LandingRoute>
                }
            />

            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <PublicRoute>
                        <AdminLoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                }
            />

            {/* Protected Routes - All Users */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            {/* Property Manager Routes */}
            <Route
                path="/properties"
                element={
                    <ProtectedRoute allowedRoles={['property_manager', 'landlord']}>
                        <PropertiesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tenants"
                element={
                    <ProtectedRoute allowedRoles={['property_manager']}>
                        <TenantsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/landlords"
                element={
                    <ProtectedRoute allowedRoles={['property_manager']}>
                        <LandlordsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/leases"
                element={
                    <ProtectedRoute allowedRoles={['property_manager', 'landlord']}>
                        <LeasesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/rents"
                element={
                    <ProtectedRoute allowedRoles={['property_manager', 'landlord']}>
                        <RentsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/complaints"
                element={
                    <ProtectedRoute allowedRoles={['property_manager', 'landlord']}>
                        <ComplaintsPage />
                    </ProtectedRoute>
                }
            />

            {/* Tenant Routes */}
            <Route
                path="/my-lease"
                element={
                    <ProtectedRoute allowedRoles={['tenant']}>
                        <TenantLeasePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/my-rents"
                element={
                    <ProtectedRoute allowedRoles={['tenant']}>
                        <TenantRentsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/my-complaints"
                element={
                    <ProtectedRoute allowedRoles={['tenant']}>
                        <ComplaintsPage />
                    </ProtectedRoute>
                }
            />

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
