import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        
        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
            toast.success('Password reset successful!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 blur-3xl" />
                </div>
                
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white relative z-10">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
                        <p className="text-slate-600 mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Link to="/forgot-password">
                            <Button className="bg-emerald-600 hover:bg-emerald-700">
                                Request New Link
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" data-testid="reset-password-page">
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
                        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                        <CardDescription className="text-center">
                            {success 
                                ? "Your password has been reset" 
                                : "Enter your new password"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                                </div>
                                <p className="text-slate-600 mb-6">
                                    Your password has been successfully reset.
                                </p>
                                <Button 
                                    onClick={() => navigate('/login')}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Go to Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                            minLength={8}
                                            data-testid="new-password-input"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10"
                                            required
                                            data-testid="confirm-password-input"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={loading}
                                    data-testid="reset-password-button"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Resetting...
                                        </span>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-500 mt-6">
                    © 2024 House2home Property Management. All rights reserved.
                </p>
            </div>
        </div>
    );
}
