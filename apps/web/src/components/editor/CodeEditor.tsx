'use client';

import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useInterviewStore } from '@/store/interview.store';
import { emitCodeChange, emitTypingStart, emitTypingStop } from '@/lib/socket';

const LANGUAGE_MAP: Record<string, string> = {
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    typescript: 'typescript',
};

interface CodeEditorProps {
    roomId?: string;
    readOnly?: boolean;
    onCodeChange?: (code: string) => void;
}

export function CodeEditor({ roomId, readOnly = false, onCodeChange }: CodeEditorProps) {
    const { code, language, setCode } = useInterviewStore();
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const editorRef = useRef<any>(null);

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const handleChange: OnChange = (value) => {
        const newCode = value || '';
        setCode(newCode);
        onCodeChange?.(newCode);

        // Real-time sync
        if (roomId) {
            emitCodeChange(roomId, newCode, language);

            // Typing indicator
            if (!isTyping) {
                setIsTyping(true);
                emitTypingStart(roomId);
            }

            // Reset typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                emitTypingStop(roomId);
            }, 1000);
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-border">
            <Editor
                height="100%"
                language={LANGUAGE_MAP[language] || 'javascript'}
                value={code}
                onChange={handleChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    bracketPairColorization: { enabled: true },
                    renderLineHighlight: 'all',
                    suggest: {
                        showKeywords: true,
                        showSnippets: true,
                    },
                }}
            />
        </div>
    );
}
