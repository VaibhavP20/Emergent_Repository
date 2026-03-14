import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            setSubmitted(true);
            toast.success('Reset link sent! Check your email.');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" data-testid="forgot-password-page">
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-teal-500/10 to-emerald-500/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <img src="/logo.png" alt="House2home" className="w-12 h-12 rounded-xl shadow-lg object-cover" />
                    <div>
                        <h1 className="text-2xl font-bold text-white">House2home</h1>
                        <p className="text-sm text-slate-300">Property Management</p>
                    </div>
                </div>

                <Card className="border-0 shadow-2xl bg-white">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
                        <CardDescription className="text-center">
                            {submitted 
                                ? "Check your email for reset instructions" 
                                : "Enter your email and we'll send you a reset link"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitted ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                                </div>
                                <p className="text-slate-600 mb-6">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <p className="text-sm text-slate-500 mb-6">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSubmitted(false)}
                                    className="mr-2"
                                >
                                    Try again
                                </Button>
                                <Link to="/login">
                                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                            data-testid="forgot-email-input"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={loading}
                                    data-testid="send-reset-button"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <Link 
                                to="/login" 
                                className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-500 mt-6">
                    © 2024 House2home Property Management. All rights reserved.
                </p>
            </div>
        </div>
    );
}
