'use client';

import { cn } from '@/lib/utils';
import { useInterviewStore } from '@/store/interview.store';

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚙️' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
];

interface LanguageSelectorProps {
    onLanguageChange?: (language: string) => void;
    disabled?: boolean;
}

export function LanguageSelector({ onLanguageChange, disabled }: LanguageSelectorProps) {
    const { language, setLanguage } = useInterviewStore();

    const handleChange = (newLanguage: string) => {
        setLanguage(newLanguage);
        onLanguageChange?.(newLanguage);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Language:</span>
            <div className="flex gap-1">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.value}
                        onClick={() => handleChange(lang.value)}
                        disabled={disabled}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                            'hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed',
                            language === lang.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground'
                        )}
                        title={lang.label}
                    >
                        <span className="mr-1">{lang.icon}</span>
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
