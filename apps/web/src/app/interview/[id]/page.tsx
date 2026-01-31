'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { LanguageSelector } from '@/components/editor/LanguageSelector';
import { NotesPanel } from '@/components/interview/NotesPanel';
import { CodeAnalysisPanel } from '@/components/interview/CodeAnalysisPanel';
import { useAuthStore } from '@/store/auth.store';
import { useInterviewStore } from '@/store/interview.store';
import { api } from '@/lib/api';
import {
    initializeSocket,
    disconnectSocket,
    joinRoom,
    leaveRoom,
    getSocket,
    emitLanguageChange,
} from '@/lib/socket';
import { cn, getInitials } from '@/lib/utils';
import {
    Code2,
    ArrowLeft,
    Play,
    Square,
    Users,
    MessageSquare,
    Settings,
    Copy,
    CheckCircle,
    Loader2,
    Video,
    VideoOff,
    Mic,
    MicOff,
    MonitorUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function InterviewPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    const { user, isAuthenticated, checkAuth } = useAuthStore();
    const {
        interview,
        setInterview,
        roomCode,
        setRoomCode,
        code,
        language,
        participants,
        setParticipants,
        isConnected,
        setConnected,
        isExecuting,
        setExecuting,
        output,
        setOutput,
        reset,
    } = useInterviewStore();

    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [showOutput, setShowOutput] = useState(false);
    const [isHost, setIsHost] = useState(false);

    // Determine if user is host
    useEffect(() => {
        if (interview && user) {
            setIsHost(interview.creatorId === user.id);
        }
    }, [interview, user]);

    // Check auth
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Fetch interview data
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        const fetchInterview = async () => {
            try {
                const response = await api.getInterview(interviewId);
                setInterview(response.data);
                setRoomCode(response.data.roomCode);
            } catch (error: any) {
                toast.error('Interview not found');
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInterview();
    }, [interviewId, isAuthenticated, router, setInterview, setRoomCode]);

    // Initialize socket connection
    useEffect(() => {
        if (!isAuthenticated || !roomCode) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = initializeSocket(token);

        socket.on('connect', () => {
            setConnected(true);
            joinRoom(roomCode);
            toast.success('Connected to interview room');
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('user-joined', (data) => {
            toast.info(`${data.userName} joined the interview`);
        });

        socket.on('user-left', (data) => {
            toast.info(`${data.userName} left the interview`);
        });

        socket.on('code-update', (data) => {
            // Code is synced via Yjs/CRDT in production
            // For demo, we just show notification
            console.log('Code update from:', data.userName);
        });

        socket.on('presence-sync', (data) => {
            setParticipants(data.users.map((u: any) => ({
                id: u.userId,
                name: u.name,
                isOnline: u.isOnline,
                cursorPosition: u.cursorPosition,
            })));
        });

        return () => {
            if (roomCode) {
                leaveRoom(roomCode);
            }
            disconnectSocket();
        };
    }, [isAuthenticated, roomCode, setConnected, setParticipants]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    const handleCopyRoomCode = () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            toast.success('Room code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRunCode = async () => {
        setExecuting(true);
        setShowOutput(true);

        try {
            // Simulated code execution (in production, this calls the backend)
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Mock output
            const mockOutput = language === 'python'
                ? 'Hello, World!\n\nProcess finished with exit code 0'
                : language === 'javascript'
                    ? 'Hello, World!\n\nExecution completed in 42ms'
                    : 'Compilation successful\nOutput: Hello, World!';

            setOutput(mockOutput);
            toast.success('Code executed successfully');
        } catch (error: any) {
            setOutput(`Error: ${error.message}`);
            toast.error('Execution failed');
        } finally {
            setExecuting(false);
        }
    };

    const handleLanguageChange = (newLanguage: string) => {
        if (roomCode) {
            emitLanguageChange(roomCode, newLanguage);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading interview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold">{interview?.title || 'Interview'}</h1>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className={cn('w-2 h-2 rounded-full', isConnected ? 'status-online' : 'status-offline')} />
                                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Room Code */}
                    <button
                        onClick={handleCopyRoomCode}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm font-mono hover:bg-accent transition-colors"
                    >
                        <span className="text-muted-foreground">Room:</span>
                        <span>{roomCode}</span>
                        {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>

                    {/* Participants */}
                    <div className="flex items-center -space-x-2">
                        {participants.slice(0, 3).map((p) => (
                            <div
                                key={p.id}
                                className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                                title={p.name}
                            >
                                {getInitials(p.name)}
                            </div>
                        ))}
                        {participants.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{participants.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Code Editor Panel */}
                <div className="flex-1 flex flex-col">
                    {/* Editor Toolbar */}
                    <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-card/50">
                        <LanguageSelector onLanguageChange={handleLanguageChange} />

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleRunCode}
                                disabled={isExecuting}
                            >
                                {isExecuting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4 mr-2" />
                                )}
                                Run Code
                            </Button>
                            <CodeAnalysisPanel code={code} language={language} />
                        </div>
                    </div>

                    {/* Editor */}
                    <div className={cn('flex-1', showOutput ? 'h-[60%]' : 'h-full')}>
                        <CodeEditor roomId={roomCode || undefined} />
                    </div>

                    {/* Output Panel */}
                    {showOutput && (
                        <div className="h-[40%] border-t border-border flex flex-col">
                            <div className="h-10 flex items-center justify-between px-4 bg-card/50">
                                <span className="text-sm font-medium">Output</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowOutput(false)}
                                >
                                    <Square className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex-1 p-4 overflow-auto font-mono text-sm bg-[#1e1e1e]">
                                {isExecuting ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Running...</span>
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap text-green-400">{output || 'No output yet'}</pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Video/Chat Sidebar */}
                <div className="w-80 border-l border-border flex flex-col bg-card">
                    {/* Video Section */}
                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-medium mb-3">Video Call</h2>
                        <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center mb-3">
                            {videoEnabled ? (
                                <div className="text-sm text-muted-foreground">Camera feed</div>
                            ) : (
                                <VideoOff className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant={videoEnabled ? 'secondary' : 'destructive'}
                                size="icon"
                                onClick={() => setVideoEnabled(!videoEnabled)}
                            >
                                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant={audioEnabled ? 'secondary' : 'destructive'}
                                size="icon"
                                onClick={() => setAudioEnabled(!audioEnabled)}
                            >
                                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            </Button>
                            <Button variant="secondary" size="icon">
                                <MonitorUp className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="p-4 border-b border-border">
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Participants ({participants.length})
                        </h2>
                        <div className="space-y-2">
                            {participants.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Waiting for participants...</p>
                            ) : (
                                participants.map((p) => (
                                    <div key={p.id} className="flex items-center gap-2 text-sm">
                                        <div className={cn('w-2 h-2 rounded-full', p.isOnline ? 'status-online' : 'status-offline')} />
                                        <span>{p.name}</span>
                                        {p.id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes Panel */}
                    <div className="flex-1 p-4 min-h-0">
                        <NotesPanel
                            interviewId={interviewId}
                            currentUserId={user?.id || ''}
                            isHost={isHost}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
