'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/utils';
import {
    Code2,
    Plus,
    Calendar,
    Clock,
    Users,
    Play,
    Settings,
    LogOut,
    Search,
    MoreVertical,
    Video
} from 'lucide-react';
import { toast } from 'sonner';

interface Interview {
    id: string;
    title: string;
    description?: string;
    roomCode: string;
    status: string;
    scheduledAt?: string;
    duration: number;
    createdAt: string;
    _count: {
        questions: number;
        submissions: number;
    };
    participants: Array<{
        role: string;
        hostUser: {
            name: string;
            email: string;
        };
    }>;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, checkAuth, isAuthenticated } = useAuthStore();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInterview, setNewInterview] = useState({ title: '', description: '' });

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        fetchInterviews();
    }, [isAuthenticated, router]);

    const fetchInterviews = async () => {
        try {
            const response = await api.getInterviews();
            setInterviews(response.data);
        } catch (error: any) {
            toast.error('Failed to load interviews');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInterview = async () => {
        if (!newInterview.title) {
            toast.error('Please enter a title');
            return;
        }

        try {
            const response = await api.createInterview(newInterview);
            setInterviews((prev) => [response.data, ...prev]);
            setShowCreateModal(false);
            setNewInterview({ title: '', description: '' });
            toast.success('Interview created!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create interview');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const filteredInterviews = interviews.filter((interview) =>
        interview.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'IN_PROGRESS':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'COMPLETED':
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl">CodeView</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                                <div className="w-2 h-2 rounded-full status-online" />
                                <span className="text-muted-foreground">{user?.email}</span>
                            </div>

                            <Button variant="ghost" size="icon" onClick={handleLogout}>
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Interviews</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and conduct your technical interviews
                        </p>
                    </div>

                    <Button onClick={() => setShowCreateModal(true)} className="glow">
                        <Plus className="w-4 h-4 mr-2" />
                        New Interview
                    </Button>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search interviews..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Interviews Grid */}
                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-xl bg-card animate-pulse" />
                        ))}
                    </div>
                ) : filteredInterviews.length === 0 ? (
                    <Card className="py-12 text-center">
                        <CardContent className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Video className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first interview to get started
                            </p>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Interview
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredInterviews.map((interview) => (
                            <Card key={interview.id} className="group hover:border-primary/50 transition-all">
                                <CardHeader className="flex-row items-start justify-between space-y-0">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{interview.title}</CardTitle>
                                        <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border mt-2 ${getStatusColor(interview.status)}`}>
                                            {interview.status}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{interview.scheduledAt ? formatDate(interview.scheduledAt) : 'Not scheduled'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatDuration(interview.duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>{interview.participants.length} participants</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-border flex items-center gap-2">
                                        <code className="flex-1 px-2 py-1 rounded bg-secondary text-xs font-mono text-center">
                                            {interview.roomCode}
                                        </code>
                                        <Link href={`/interview/${interview.id}`}>
                                            <Button size="sm" variant="secondary">
                                                <Play className="w-4 h-4 mr-1" />
                                                Enter
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Interview Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Create New Interview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                label="Title"
                                placeholder="e.g., Senior Frontend Developer Interview"
                                value={newInterview.title}
                                onChange={(e) => setNewInterview((prev) => ({ ...prev, title: e.target.value }))}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description (optional)</label>
                                <textarea
                                    className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Add any notes or context for this interview..."
                                    value={newInterview.description}
                                    onChange={(e) => setNewInterview((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                        <div className="flex items-center justify-end gap-2 p-6 pt-0">
                            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateInterview}>
                                Create Interview
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
