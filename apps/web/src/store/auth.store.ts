import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const { user, token } = await api.login(email, password);
                    set({ user, token, isAuthenticated: true, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            register: async (email: string, password: string, name: string) => {
                set({ isLoading: true, error: null });
                try {
                    const { user, token } = await api.register(email, password, name);
                    set({ user, token, isAuthenticated: true, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                api.logout();
                set({ user: null, token: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                const token = get().token;
                if (!token) {
                    set({ isAuthenticated: false });
                    return;
                }

                try {
                    const { data } = await api.getProfile();
                    set({ user: data, isAuthenticated: true });
                } catch {
                    set({ user: null, token: null, isAuthenticated: false });
                    api.logout();
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
);
