import { create } from 'zustand';

interface Participant {
    id: string;
    name: string;
    isOnline: boolean;
    cursorPosition?: { line: number; column: number };
}

interface InterviewState {
    // Current interview data
    interview: any | null;
    roomCode: string | null;

    // Editor state
    code: string;
    language: string;

    // Participants
    participants: Participant[];

    // UI state
    isConnected: boolean;
    isExecuting: boolean;
    output: string;

    // Actions
    setInterview: (interview: any) => void;
    setRoomCode: (code: string) => void;
    setCode: (code: string) => void;
    setLanguage: (language: string) => void;
    setParticipants: (participants: Participant[]) => void;
    updateParticipant: (id: string, data: Partial<Participant>) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    setConnected: (connected: boolean) => void;
    setExecuting: (executing: boolean) => void;
    setOutput: (output: string) => void;
    reset: () => void;
}

const initialState = {
    interview: null,
    roomCode: null,
    code: '// Write your code here\n',
    language: 'javascript',
    participants: [],
    isConnected: false,
    isExecuting: false,
    output: '',
};

export const useInterviewStore = create<InterviewState>((set) => ({
    ...initialState,

    setInterview: (interview) => set({ interview }),
    setRoomCode: (roomCode) => set({ roomCode }),
    setCode: (code) => set({ code }),
    setLanguage: (language) => set({ language }),

    setParticipants: (participants) => set({ participants }),

    updateParticipant: (id, data) => set((state) => ({
        participants: state.participants.map((p) =>
            p.id === id ? { ...p, ...data } : p
        ),
    })),

    addParticipant: (participant) => set((state) => ({
        participants: state.participants.some((p) => p.id === participant.id)
            ? state.participants
            : [...state.participants, participant],
    })),

    removeParticipant: (id) => set((state) => ({
        participants: state.participants.filter((p) => p.id !== id),
    })),

    setConnected: (isConnected) => set({ isConnected }),
    setExecuting: (isExecuting) => set({ isExecuting }),
    setOutput: (output) => set({ output }),

    reset: () => set(initialState),
}));
