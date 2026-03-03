import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
    Building2, 
    Users, 
    FileText, 
    MessageSquare, 
    DollarSign, 
    Shield,
    CheckCircle,
    ArrowRight,
    Star,
    Home,
    Bell,
    BarChart3,
    Clock,
    Smartphone
} from 'lucide-react';

export default function LandingPage() {
    const features = [
        {
            icon: Building2,
            title: 'Property Management',
            description: 'Add, edit, and organize all your properties in one centralized dashboard.',
            color: 'bg-blue-500'
        },
        {
            icon: FileText,
            title: 'Lease Tracking',
            description: 'Manage lease agreements, track expiration dates, and handle renewals effortlessly.',
            color: 'bg-emerald-500'
        },
        {
            icon: DollarSign,
            title: 'Rent Collection',
            description: 'Track rent payments, mark paid/unpaid status, and monitor collection rates.',
            color: 'bg-orange-500'
        },
        {
            icon: MessageSquare,
            title: 'Complaint System',
            description: 'Streamlined complaint submission and resolution workflow for tenants and managers.',
            color: 'bg-purple-500'
        },
        {
            icon: Bell,
            title: 'In-App Notifications',
            description: 'Stay updated with real-time alerts for rent dues, complaints, and lease updates.',
            color: 'bg-pink-500'
        },
        {
            icon: BarChart3,
            title: 'Dashboard Analytics',
            description: 'Visual insights into occupancy rates, revenue, and property performance.',
            color: 'bg-cyan-500'
        }
    ];

    const userTypes = [
        {
            title: 'Property Managers',
            icon: Shield,
            color: 'from-slate-800 to-slate-900',
            features: [
                'Full control over properties, tenants & landlords',
                'Create and manage lease agreements',
                'Track all rent payments',
                'Handle and resolve complaints',
                'Comprehensive dashboard analytics'
            ]
        },
        {
            title: 'Landlords',
            icon: Building2,
            color: 'from-emerald-600 to-emerald-700',
            features: [
                'View your property portfolio',
                'Track tenant rent payments',
                'Monitor lease agreements',
                'Respond to tenant complaints',
                'Revenue tracking & reports'
            ]
        },
        {
            title: 'Tenants',
            icon: Users,
            color: 'from-blue-600 to-blue-700',
            features: [
                'View lease details & duration',
                'Check rent payment status',
                'Submit maintenance complaints',
                'Track complaint resolution',
                'Receive important notifications'
            ]
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Property Manager',
            company: 'Urban Living Properties',
            content: 'PropManage has transformed how we handle our 50+ properties. The complaint system alone has saved us countless hours.',
            avatar: 'S'
        },
        {
            name: 'Michael Chen',
            role: 'Landlord',
            company: '12 Properties',
            content: 'Finally, a platform that gives me real visibility into my rental income. The rent tracking feature is incredibly intuitive.',
            avatar: 'M'
        },
        {
            name: 'Emily Rodriguez',
            role: 'Tenant',
            company: 'Sunset Apartments',
            content: 'I love being able to see my lease details and submit complaints directly through the app. No more phone tag!',
            avatar: 'E'
        }
    ];

    const stats = [
        { value: '10,000+', label: 'Properties Managed' },
        { value: '50,000+', label: 'Active Users' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.9/5', label: 'User Rating' }
    ];

    return (
        <div className="min-h-screen bg-slate-50" data-testid="landing-page">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-800">PropManage</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
                            <a href="#solutions" className="text-slate-600 hover:text-slate-900 transition-colors">Solutions</a>
                            <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/login">
                                <Button variant="ghost" className="text-slate-600" data-testid="nav-login">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button className="bg-slate-900 hover:bg-slate-800" data-testid="nav-register">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
                
                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Star className="w-4 h-4" />
                            Trusted by 10,000+ property managers
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                            Property Management
                            <span className="block text-emerald-400">Made Simple</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                            The all-in-one platform for property managers, landlords, and tenants. 
                            Streamline leases, track rent, and resolve complaints—all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register">
                                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg" data-testid="hero-cta">
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-6 text-lg">
                                    View Demo
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
                                <p className="text-slate-400 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Everything You Need to Manage Properties
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Powerful features designed to simplify property management for everyone involved.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 group" data-testid={`feature-${index}`}>
                                <CardContent className="p-6">
                                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                                    <p className="text-slate-600">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solutions Section */}
            <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Built for Every Role
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Tailored dashboards and features for property managers, landlords, and tenants.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {userTypes.map((type, index) => (
                            <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid={`solution-${index}`}>
                                <div className={`bg-gradient-to-r ${type.color} p-6 text-white`}>
                                    <type.icon className="w-10 h-10 mb-3" />
                                    <h3 className="text-2xl font-bold">{type.title}</h3>
                                </div>
                                <CardContent className="p-6">
                                    <ul className="space-y-3">
                                        {type.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/register" className="block mt-6">
                                        <Button className="w-full bg-slate-900 hover:bg-slate-800">
                                            Get Started
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Loved by Property Professionals
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            See what our users have to say about PropManage.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-0 shadow-lg" data-testid={`testimonial-${index}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white font-semibold">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{testimonial.name}</p>
                                            <p className="text-sm text-slate-500">{testimonial.role} • {testimonial.company}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to Streamline Your Property Management?
                    </h2>
                    <p className="text-lg text-slate-300 mb-10">
                        Join thousands of property professionals who trust PropManage. Start your free trial today—no credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register">
                            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg" data-testid="cta-register">
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-5 h-5" />
                            <span>14-day free trial</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                    <Home className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">PropManage</span>
                            </div>
                            <p className="text-slate-400 max-w-md">
                                The complete property management solution for modern landlords, property managers, and tenants.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                                <li><a href="#solutions" className="text-slate-400 hover:text-white transition-colors">Solutions</a></li>
                                <li><a href="#testimonials" className="text-slate-400 hover:text-white transition-colors">Testimonials</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Get Started</h4>
                            <ul className="space-y-2">
                                <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link></li>
                                <li><Link to="/register" className="text-slate-400 hover:text-white transition-colors">Create Account</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm">© 2024 PropManage. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Smartphone className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-500 text-sm">Available on Web, iOS & Android</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
