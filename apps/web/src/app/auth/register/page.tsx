'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { Code2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.name || formData.name.length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Invalid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) return;

        try {
            await register(formData.email, formData.password, formData.name);
            toast.success('Account created successfully!');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.message || 'Registration failed');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <Code2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-2xl">CodeView</span>
                </Link>

                <Card className="glass">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Create an account</CardTitle>
                        <CardDescription>
                            Get started with your free CodeView account
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <Input
                                name="name"
                                type="text"
                                label="Full Name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                error={formErrors.name}
                                autoComplete="name"
                            />

                            <Input
                                name="email"
                                type="email"
                                label="Email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={formErrors.email}
                                autoComplete="email"
                            />

                            <Input
                                name="password"
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                error={formErrors.password}
                                autoComplete="new-password"
                            />

                            <Input
                                name="confirmPassword"
                                type="password"
                                label="Confirm Password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={formErrors.confirmPassword}
                                autoComplete="new-password"
                            />
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                Create Account
                            </Button>

                            <p className="text-sm text-muted-foreground text-center">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
