import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
    Building2, 
    Users, 
    FileText, 
    MessageSquare, 
    DollarSign, 
    ArrowRight,
    Check,
    Sparkles,
    Shield,
    Zap
} from 'lucide-react';

export default function LandingPage() {
    const features = [
        {
            icon: Building2,
            title: 'Property Management',
            description: 'Effortlessly manage all your properties in one place'
        },
        {
            icon: FileText,
            title: 'Lease Tracking',
            description: 'Keep track of all lease agreements and renewals'
        },
        {
            icon: DollarSign,
            title: 'Rent Collection',
            description: 'Monitor payments and track collection status'
        },
        {
            icon: MessageSquare,
            title: 'Complaint System',
            description: 'Streamlined communication between all parties'
        },
        {
            icon: Users,
            title: 'Tenant Management',
            description: 'Organize tenant information and history'
        },
        {
            icon: Shield,
            title: 'Secure Access',
            description: 'Role-based permissions for complete control'
        }
    ];

    const roles = [
        { name: 'Property Managers', color: 'from-violet-500 to-purple-600' },
        { name: 'Landlords', color: 'from-blue-500 to-cyan-500' },
        { name: 'Tenants', color: 'from-pink-500 to-rose-500' }
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA] overflow-hidden" data-testid="landing-page">
            {/* Floating gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-400/20 via-blue-400/20 to-violet-400/20 blur-3xl" />
                <div className="absolute -bottom-40 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-pink-400/25 via-rose-400/25 to-orange-400/25 blur-3xl" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="House2home" className="w-10 h-10 rounded-xl object-cover" />
                        <span className="text-xl font-semibold text-gray-900">House2home</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                                Sign in
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 pt-16 pb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left content */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 text-violet-700 text-sm font-medium">
                                <Sparkles className="w-4 h-4" />
                                Simplify your property management
                            </div>
                            
                            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Property management,{' '}
                                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    reimagined
                                </span>
                            </h1>
                            
                            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                                The all-in-one platform for property managers, landlords, and tenants. 
                                Streamline operations, track payments, and communicate seamlessly.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/register">
                                    <Button size="lg" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30">
                                        Start for free
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-gray-300">
                                        View demo
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center gap-8 pt-4">
                                {roles.map((role, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${role.color}`} />
                                        <span className="text-sm text-gray-600">{role.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right - Floating cards with gradient */}
                        <div className="relative h-[500px] hidden lg:block">
                            {/* Main gradient card */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/30 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                
                                {/* Floating UI elements */}
                                <div className="absolute top-8 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">Welcome back!</p>
                                            <p className="text-sm text-gray-500">Manage your properties</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-32 left-8 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-48">
                                    <p className="text-xs text-gray-500 mb-1">Properties</p>
                                    <p className="text-2xl font-bold text-gray-900">24</p>
                                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" />
                                    </div>
                                </div>

                                <div className="absolute top-32 right-8 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-48">
                                    <p className="text-xs text-gray-500 mb-1">Rent Collected</p>
                                    <p className="text-2xl font-bold text-emerald-600">$48,250</p>
                                    <p className="text-xs text-emerald-600 mt-1">+12% this month</p>
                                </div>

                                <div className="absolute bottom-24 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-medium text-gray-900">Recent Activity</p>
                                        <span className="text-xs text-violet-600">View all</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">Rent payment received</p>
                                                <p className="text-xs text-gray-500">Unit 4B • $1,200</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">Lease renewal signed</p>
                                                <p className="text-xs text-gray-500">Sunset Apartments</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 px-6 py-24 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything you need to manage properties
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed for modern property management
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
                                data-testid={`feature-${index}`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-violet-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Role Cards Section */}
            <section className="relative z-10 px-6 py-24">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Built for everyone
                        </h2>
                        <p className="text-xl text-gray-600">
                            Tailored experiences for each role
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Property Manager Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 text-white">
                                <Shield className="w-10 h-10 mb-4" />
                                <h3 className="text-2xl font-bold mb-3">Property Managers</h3>
                                <p className="text-violet-100 mb-6">Complete control over all properties, tenants, and operations.</p>
                                <ul className="space-y-3">
                                    {['Manage properties & units', 'Add tenants & landlords', 'Track all payments', 'Handle complaints'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-violet-200" />
                                            <span className="text-violet-100">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Landlord Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-8 text-white">
                                <Building2 className="w-10 h-10 mb-4" />
                                <h3 className="text-2xl font-bold mb-3">Landlords</h3>
                                <p className="text-blue-100 mb-6">Monitor your properties and track rental income easily.</p>
                                <ul className="space-y-3">
                                    {['View property portfolio', 'Track lease agreements', 'Monitor rent payments', 'Receive PM updates'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-blue-200" />
                                            <span className="text-blue-100">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Tenant Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-8 text-white">
                                <Users className="w-10 h-10 mb-4" />
                                <h3 className="text-2xl font-bold mb-3">Tenants</h3>
                                <p className="text-pink-100 mb-6">Stay informed and communicate with ease.</p>
                                <ul className="space-y-3">
                                    {['View lease details', 'Check rent status', 'Submit complaints', 'Track resolutions'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-pink-200" />
                                            <span className="text-pink-100">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-6 py-24">
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-50" />
                        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            
                            <div className="relative">
                                <Zap className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
                                <h2 className="text-4xl font-bold mb-4">
                                    Ready to get started?
                                </h2>
                                <p className="text-xl text-violet-100 mb-8 max-w-xl mx-auto">
                                    Join thousands of property professionals who trust House2home for their daily operations.
                                </p>
                                <Link to="/register">
                                    <Button size="lg" className="bg-white text-violet-600 hover:bg-violet-50 rounded-full px-10 py-6 text-lg font-semibold shadow-xl">
                                        Create free account
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-12 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="House2home" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="font-semibold text-gray-900">House2home</span>
                        </div>
                        <div className="flex items-center gap-8">
                            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
                            <Link to="/register" className="text-gray-600 hover:text-gray-900 transition-colors">Register</Link>
                        </div>
                        <p className="text-gray-500 text-sm">© 2024 House2home Property Management. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
