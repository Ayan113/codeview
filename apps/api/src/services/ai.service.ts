import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

interface CodeAnalysis {
    quality: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    score: number;
    strengths: string[];
    improvements: string[];
    patterns: string[];
    complexity: 'low' | 'medium' | 'high';
}

interface InterviewFeedback {
    overallRating: number;
    technicalSkills: number;
    problemSolving: number;
    communication: number;
    strengths: string[];
    areasForGrowth: string[];
    recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
    summary: string;
}

export class AIService {
    /**
     * Analyze code quality and patterns
     */
    static async analyzeCode(code: string, language: string): Promise<CodeAnalysis> {
        const lines = code.split('\n').filter(l => l.trim().length > 0);

        let score = 70;
        const strengths: string[] = [];
        const improvements: string[] = [];
        const patterns: string[] = [];

        // Check for comments
        const commentPatterns: Record<string, RegExp> = {
            javascript: /\/\/|\/\*|\*\//,
            typescript: /\/\/|\/\*|\*\//,
            python: /#|"""|'''/,
            java: /\/\/|\/\*|\*\//,
            cpp: /\/\/|\/\*|\*\//,
        };

        const hasComments = lines.some(l => commentPatterns[language]?.test(l));
        if (hasComments) {
            score += 5;
            strengths.push('Good use of comments for code documentation');
        } else {
            improvements.push('Consider adding comments to explain complex logic');
        }

        // Check for error handling
        const hasErrorHandling = code.includes('try') && code.includes('catch') ||
            code.includes('except') ||
            code.includes('.catch(');
        if (hasErrorHandling) {
            score += 10;
            strengths.push('Implements error handling');
            patterns.push('Error Handling');
        } else {
            improvements.push('Add error handling for robustness');
        }

        // Check for functions/modular code
        const hasFunctions = /function\s+\w+|const\s+\w+\s*=\s*\(|def\s+\w+/.test(code);
        if (hasFunctions) {
            score += 5;
            strengths.push('Code is modular with defined functions');
            patterns.push('Modular Design');
        }

        // Check for edge case handling
        const hasEdgeCaseHandling = code.includes('if') && (
            code.includes('null') ||
            code.includes('undefined') ||
            code.includes('None') ||
            code.includes('length') ||
            code.includes('len(')
        );
        if (hasEdgeCaseHandling) {
            score += 5;
            strengths.push('Considers edge cases and null checks');
            patterns.push('Defensive Programming');
        } else {
            improvements.push('Consider handling edge cases (null, empty inputs)');
        }

        // Check code structure
        const avgLineLength = lines.reduce((acc, l) => acc + l.length, 0) / Math.max(1, lines.length);
        if (avgLineLength < 80) {
            score += 5;
            strengths.push('Clean, readable line lengths');
        } else {
            improvements.push('Some lines are too long; consider breaking them up');
        }

        // Check for variable naming
        const hasDescriptiveNames = /[a-z][A-Z]|_[a-z]/.test(code);
        if (hasDescriptiveNames) {
            strengths.push('Uses descriptive variable naming conventions');
        }

        // Determine complexity
        let complexity: 'low' | 'medium' | 'high' = 'low';
        const nestedLoops = (code.match(/for|while/g) || []).length;
        const conditionals = (code.match(/if|else|switch|case/g) || []).length;

        if (nestedLoops > 2 || conditionals > 5) {
            complexity = 'high';
        } else if (nestedLoops > 1 || conditionals > 3) {
            complexity = 'medium';
        }

        // Determine quality rating
        let quality: CodeAnalysis['quality'];
        if (score >= 90) quality = 'excellent';
        else if (score >= 75) quality = 'good';
        else if (score >= 60) quality = 'needs_improvement';
        else quality = 'poor';

        score = Math.min(100, Math.max(0, score));

        return {
            quality,
            score,
            strengths,
            improvements,
            patterns,
            complexity,
        };
    }

    /**
     * Generate AI-powered interview feedback
     */
    static async generateInterviewFeedback(interviewId: string, userId: string): Promise<InterviewFeedback> {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                participants: true,
                notes: true,
                submissions: {
                    include: {
                        question: true,
                    },
                },
                questions: {
                    include: {
                        question: true,
                    },
                },
            },
        });

        if (!interview) {
            throw new NotFoundError('Interview not found');
        }

        const isParticipant = interview.participants.some((p: any) => p.userId === userId);
        const isCreator = interview.creatorId === userId;

        if (!isParticipant && !isCreator) {
            throw new ForbiddenError('You do not have access to this interview');
        }

        const submissions = interview.submissions;
        const passedCount = submissions.filter((s: any) => s.status === 'PASSED').length;
        const totalSubmissions = submissions.length;
        const passRate = totalSubmissions > 0 ? passedCount / totalSubmissions : 0;

        // Calculate scores (1-5)
        let technicalSkills = 3;
        if (passRate >= 0.9) technicalSkills = 5;
        else if (passRate >= 0.7) technicalSkills = 4;
        else if (passRate >= 0.5) technicalSkills = 3;
        else if (passRate >= 0.3) technicalSkills = 2;
        else if (totalSubmissions > 0) technicalSkills = 1;

        let problemSolving = 3;
        const avgExecutionTime = submissions.reduce((acc: number, s: any) => acc + (s.executionTime || 0), 0) / Math.max(1, totalSubmissions);
        if (avgExecutionTime < 100) problemSolving = 5;
        else if (avgExecutionTime < 500) problemSolving = 4;
        else if (avgExecutionTime < 1000) problemSolving = 3;
        else problemSolving = 2;

        const notesCount = interview.notes.length;
        let communication = 3;
        if (notesCount >= 5) communication = 5;
        else if (notesCount >= 3) communication = 4;
        else if (notesCount >= 1) communication = 3;
        else communication = 2;

        const overallRating = Math.round((technicalSkills + problemSolving + communication) / 3);

        // Generate feedback
        const strengths: string[] = [];
        const areasForGrowth: string[] = [];

        if (passRate >= 0.7) {
            strengths.push('Strong problem-solving abilities with high success rate');
        } else if (totalSubmissions > 0) {
            areasForGrowth.push('Practice more coding challenges to improve accuracy');
        }

        if (avgExecutionTime < 500 && totalSubmissions > 0) {
            strengths.push('Efficient code execution with optimized solutions');
        } else if (totalSubmissions > 0) {
            areasForGrowth.push('Focus on code optimization for better performance');
        }

        if (notesCount >= 3) {
            strengths.push('Good communication with detailed explanations');
        } else {
            areasForGrowth.push('Improve explanation of thought process during coding');
        }

        const questionsAttempted = new Set(submissions.map((s: any) => s.questionId)).size;
        const totalQuestions = interview.questions.length;
        if (questionsAttempted === totalQuestions && totalQuestions > 0) {
            strengths.push('Completed all assigned coding challenges');
        } else if (totalQuestions > 0) {
            areasForGrowth.push('Work on completing all challenges within time limit');
        }

        // Recommendation
        let recommendation: InterviewFeedback['recommendation'];
        if (overallRating >= 4.5) recommendation = 'strong_hire';
        else if (overallRating >= 3.5) recommendation = 'hire';
        else if (overallRating >= 2.5) recommendation = 'maybe';
        else recommendation = 'no_hire';

        const summary = this.generateSummary(
            interview.title,
            technicalSkills,
            problemSolving,
            communication,
            passRate,
            questionsAttempted,
            totalQuestions
        );

        return {
            overallRating,
            technicalSkills,
            problemSolving,
            communication,
            strengths,
            areasForGrowth,
            recommendation,
            summary,
        };
    }

    private static generateSummary(
        title: string,
        technical: number,
        problemSolving: number,
        communication: number,
        passRate: number,
        attempted: number,
        total: number
    ): string {
        const ratingToWord = (r: number) => {
            if (r >= 4.5) return 'exceptional';
            if (r >= 3.5) return 'strong';
            if (r >= 2.5) return 'adequate';
            return 'developing';
        };

        return `Interview "${title}" Assessment Summary:

The candidate demonstrated ${ratingToWord(technical)} technical skills with a ${Math.round(passRate * 100)}% success rate on coding challenges. Problem-solving abilities were ${ratingToWord(problemSolving)}, and communication throughout the interview was ${ratingToWord(communication)}.

${attempted > 0 ? `Completed ${attempted} out of ${total} coding challenges.` : 'No coding challenges were attempted.'}

Overall, the candidate shows ${ratingToWord((technical + problemSolving + communication) / 3)} potential for the role.`;
    }

    /**
     * Save AI feedback as an interview note
     */
    static async saveAIFeedbackAsNote(interviewId: string, userId: string): Promise<any> {
        const feedback = await this.generateInterviewFeedback(interviewId, userId);

        const content = `## AI Interview Analysis

**Overall Rating:** ${feedback.overallRating}/5 ⭐
**Recommendation:** ${feedback.recommendation.replace('_', ' ').toUpperCase()}

### Scores
- Technical Skills: ${feedback.technicalSkills}/5
- Problem Solving: ${feedback.problemSolving}/5
- Communication: ${feedback.communication}/5

### Strengths
${feedback.strengths.length > 0 ? feedback.strengths.map(s => `- ${s}`).join('\n') : '- No notable strengths identified yet'}

### Areas for Growth
${feedback.areasForGrowth.length > 0 ? feedback.areasForGrowth.map(a => `- ${a}`).join('\n') : '- No specific areas identified'}

### Summary
${feedback.summary}

---
*Generated by CodeView AI Analysis*`;

        const note = await prisma.interviewNote.create({
            data: {
                interviewId,
                userId,
                content,
                isPrivate: false,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        return {
            note,
            feedback,
        };
    }
}
