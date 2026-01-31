'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

interface CodeAnalysis {
    quality: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    score: number;
    strengths: string[];
    improvements: string[];
    patterns: string[];
    complexity: 'low' | 'medium' | 'high';
}

interface CodeAnalysisPanelProps {
    code: string;
    language: string;
}

export function CodeAnalysisPanel({ code, language }: CodeAnalysisPanelProps) {
    const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const analyzeCode = async () => {
        if (!code.trim() || loading) return;

        setLoading(true);
        try {
            const response = await api.analyzeCode(code, language);
            setAnalysis(response.data);
            setIsOpen(true);
        } catch (error) {
            console.error('Failed to analyze code:', error);
        } finally {
            setLoading(false);
        }
    };

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'text-green-400 bg-green-500/20';
            case 'good': return 'text-emerald-400 bg-emerald-500/20';
            case 'needs_improvement': return 'text-yellow-400 bg-yellow-500/20';
            case 'poor': return 'text-red-400 bg-red-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'low': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'high': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="relative">
            <button
                onClick={analyzeCode}
                disabled={loading || !code.trim()}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analyzing...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analyze Code
                    </>
                )}
            </button>

            {/* Analysis Modal */}
            {isOpen && analysis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <span className="text-lg">🔍</span> AI Code Analysis
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                            {/* Score and Quality */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 bg-slate-800 rounded-xl p-4 text-center">
                                    <div className={`text-4xl font-bold mb-1 ${getScoreColor(analysis.score)}`}>
                                        {analysis.score}
                                    </div>
                                    <div className="text-sm text-slate-400">Score</div>
                                </div>
                                <div className="flex-1 bg-slate-800 rounded-xl p-4 text-center">
                                    <div className={`text-lg font-semibold mb-1 px-3 py-1 rounded-full inline-block ${getQualityColor(analysis.quality)}`}>
                                        {analysis.quality.replace('_', ' ').toUpperCase()}
                                    </div>
                                    <div className="text-sm text-slate-400">Quality</div>
                                </div>
                                <div className="flex-1 bg-slate-800 rounded-xl p-4 text-center">
                                    <div className={`text-lg font-semibold mb-1 ${getComplexityColor(analysis.complexity)}`}>
                                        {analysis.complexity.toUpperCase()}
                                    </div>
                                    <div className="text-sm text-slate-400">Complexity</div>
                                </div>
                            </div>

                            {/* Patterns */}
                            {analysis.patterns.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-cyan-400 mb-2">📋 Patterns Detected</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.patterns.map((pattern, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30"
                                            >
                                                {pattern}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strengths */}
                            {analysis.strengths.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-green-400 mb-2">✓ Strengths</h4>
                                    <ul className="space-y-1">
                                        {analysis.strengths.map((strength, i) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                <span className="text-green-400 mt-0.5">•</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Improvements */}
                            {analysis.improvements.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-400 mb-2">⚡ Suggested Improvements</h4>
                                    <ul className="space-y-1">
                                        {analysis.improvements.map((improvement, i) => (
                                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                <span className="text-yellow-400 mt-0.5">•</span>
                                                {improvement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
