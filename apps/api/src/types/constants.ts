/**
 * Shared constants and types for the CodeView API
 * 
 * Since the Prisma schema uses strings for enum-like fields,
 * we define these as const objects to get type safety.
 */

// Interview statuses
export const InterviewStatus = {
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type InterviewStatusType = typeof InterviewStatus[keyof typeof InterviewStatus];

// Participant roles
export const ParticipantRole = {
    HOST: 'HOST',
    CANDIDATE: 'CANDIDATE',
    OBSERVER: 'OBSERVER',
} as const;

export type ParticipantRoleType = typeof ParticipantRole[keyof typeof ParticipantRole];

// User roles
export const UserRole = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    INTERVIEWER: 'INTERVIEWER',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Question difficulty
export const Difficulty = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
} as const;

export type DifficultyType = typeof Difficulty[keyof typeof Difficulty];

// Submission status
export const SubmissionStatus = {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    PASSED: 'PASSED',
    FAILED: 'FAILED',
    ERROR: 'ERROR',
    TIMEOUT: 'TIMEOUT',
} as const;

export type SubmissionStatusType = typeof SubmissionStatus[keyof typeof SubmissionStatus];
