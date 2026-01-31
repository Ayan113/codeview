'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface Note {
    id: string;
    content: string;
    timestamp: string;
    isPrivate: boolean;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
}

interface AIFeedback {
    overallRating: number;
    technicalSkills: number;
    problemSolving: number;
    communication: number;
    strengths: string[];
    areasForGrowth: string[];
    recommendation: string;
    summary: string;
}

interface NotesPanelProps {
    interviewId: string;
    currentUserId: string;
    isHost: boolean;
}

export function NotesPanel({ interviewId, currentUserId, isHost }: NotesPanelProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [showAI, setShowAI] = useState(false);
    const notesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotes();
    }, [interviewId]);

    useEffect(() => {
        notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [notes]);

    const loadNotes = async () => {
        try {
            const response = await api.getNotes(interviewId);
            setNotes(response.data || []);
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || loading) return;

        setLoading(true);
        try {
            const response = await api.createNote(interviewId, {
                content: newNote.trim(),
                isPrivate,
            });
            setNotes([...notes, response.data]);
            setNewNote('');
        } catch (error) {
            console.error('Failed to create note:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noteId: string) => {
        try {
            await api.deleteNote(noteId);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    const generateAIFeedback = async () => {
        setAiLoading(true);
        try {
            const response = await api.getAIFeedback(interviewId);
            setAiFeedback(response.data);
            setShowAI(true);
        } catch (error) {
            console.error('Failed to generate AI feedback:', error);
        } finally {
            setAiLoading(false);
        }
    };

    const saveAISummary = async () => {
        setAiLoading(true);
        try {
            await api.generateAISummary(interviewId);
            await loadNotes();
            setShowAI(false);
        } catch (error) {
            console.error('Failed to save AI summary:', error);
        } finally {
            setAiLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-400';
        if (rating >= 3) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRecommendationColor = (rec: string) => {
        if (rec === 'strong_hire') return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (rec === 'hire') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (rec === 'maybe') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Interview Notes
                </h3>
                {isHost && (
                    <button
                        onClick={generateAIFeedback}
                        disabled={aiLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                        {aiLoading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        )}
                        AI Analysis
                    </button>
                )}
            </div>

            {/* AI Feedback Panel */}
            {showAI && aiFeedback && (
                <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-violet-300 flex items-center gap-2">
                            <span className="text-lg">🤖</span> AI Interview Analysis
                        </h4>
                        <button
                            onClick={() => setShowAI(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Recommendation Badge */}
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border mb-4 ${getRecommendationColor(aiFeedback.recommendation)}`}>
                        {aiFeedback.recommendation.replace('_', ' ').toUpperCase()}
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Overall</div>
                            <div className={`text-2xl font-bold ${getRatingColor(aiFeedback.overallRating)}`}>
                                {aiFeedback.overallRating}/5
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Technical</div>
                            <div className={`text-2xl font-bold ${getRatingColor(aiFeedback.technicalSkills)}`}>
                                {aiFeedback.technicalSkills}/5
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Problem Solving</div>
                            <div className={`text-2xl font-bold ${getRatingColor(aiFeedback.problemSolving)}`}>
                                {aiFeedback.problemSolving}/5
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Communication</div>
                            <div className={`text-2xl font-bold ${getRatingColor(aiFeedback.communication)}`}>
                                {aiFeedback.communication}/5
                            </div>
                        </div>
                    </div>

                    {/* Strengths & Areas */}
                    <div className="space-y-3 mb-4">
                        {aiFeedback.strengths.length > 0 && (
                            <div>
                                <div className="text-xs text-green-400 mb-1 font-medium">✓ Strengths</div>
                                <ul className="text-sm text-slate-300 space-y-1">
                                    {aiFeedback.strengths.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-green-400 mt-0.5">•</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {aiFeedback.areasForGrowth.length > 0 && (
                            <div>
                                <div className="text-xs text-yellow-400 mb-1 font-medium">⚡ Areas for Growth</div>
                                <ul className="text-sm text-slate-300 space-y-1">
                                    {aiFeedback.areasForGrowth.map((a, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-yellow-400 mt-0.5">•</span>
                                            {a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={saveAISummary}
                        disabled={aiLoading}
                        className="w-full py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {aiLoading ? 'Saving...' : 'Save as Note'}
                    </button>
                </div>
            )}

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No notes yet</p>
                        <p className="text-sm">Start taking notes during the interview</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            className={`p-3 rounded-lg border ${note.user.id === currentUserId
                                    ? 'bg-violet-500/10 border-violet-500/30'
                                    : 'bg-slate-800/50 border-slate-700/50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
                                        {note.user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">{note.user.name}</span>
                                    {note.isPrivate && (
                                        <span className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">Private</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{formatTime(note.timestamp)}</span>
                                    {note.user.id === currentUserId && (
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.content}</p>
                        </div>
                    ))
                )}
                <div ref={notesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-500 focus:ring-violet-500"
                        />
                        Private note (only you can see)
                    </label>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!newNote.trim() || loading}
                        className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
