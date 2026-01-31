const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const token = this.getToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...headers,
            },
            ...(body && { body: JSON.stringify(body) }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'An error occurred');
        }

        return data;
    }

    // Auth endpoints
    async login(email: string, password: string) {
        const response = await this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        this.setToken(response.data.token);
        return response.data;
    }

    async register(email: string, password: string, name: string) {
        const response = await this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/register', {
            method: 'POST',
            body: { email, password, name },
        });
        this.setToken(response.data.token);
        return response.data;
    }

    async getProfile() {
        return this.request<{ success: boolean; data: any }>('/auth/me');
    }

    logout() {
        this.setToken(null);
    }

    // Interview endpoints
    async getInterviews(status?: string) {
        const query = status ? `?status=${status}` : '';
        return this.request<{ success: boolean; data: any[]; count: number }>(`/interviews${query}`);
    }

    async getInterview(id: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${id}`);
    }

    async getInterviewByRoomCode(roomCode: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/room/${roomCode}`);
    }

    async createInterview(data: { title: string; description?: string; scheduledAt?: string; duration?: number }) {
        return this.request<{ success: boolean; data: any }>('/interviews', {
            method: 'POST',
            body: data,
        });
    }

    async updateInterview(id: string, data: any) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteInterview(id: string) {
        return this.request<{ success: boolean }>(`/interviews/${id}`, {
            method: 'DELETE',
        });
    }

    async startInterview(id: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${id}/start`, {
            method: 'POST',
        });
    }

    async endInterview(id: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${id}/end`, {
            method: 'POST',
        });
    }

    async joinInterview(id: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${id}/join`, {
            method: 'POST',
        });
    }

    // Question endpoints
    async getQuestions(filters?: { difficulty?: string; category?: string; search?: string }) {
        const params = new URLSearchParams();
        if (filters?.difficulty) params.set('difficulty', filters.difficulty);
        if (filters?.category) params.set('category', filters.category);
        if (filters?.search) params.set('search', filters.search);
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request<{ success: boolean; data: any[]; count: number }>(`/questions${query}`);
    }

    async getQuestion(id: string) {
        return this.request<{ success: boolean; data: any }>(`/questions/${id}`);
    }

    async createQuestion(data: any) {
        return this.request<{ success: boolean; data: any }>('/questions', {
            method: 'POST',
            body: data,
        });
    }

    async getCategories() {
        return this.request<{ success: boolean; data: any[] }>('/questions/categories');
    }

    // Note endpoints
    async getNotes(interviewId: string) {
        return this.request<{ success: boolean; data: any[]; count: number }>(`/interviews/${interviewId}/notes`);
    }

    async createNote(interviewId: string, data: { content: string; isPrivate?: boolean }) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${interviewId}/notes`, {
            method: 'POST',
            body: data,
        });
    }

    async updateNote(noteId: string, data: { content: string; isPrivate?: boolean }) {
        return this.request<{ success: boolean; data: any }>(`/notes/${noteId}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteNote(noteId: string) {
        return this.request<{ success: boolean }>(`/notes/${noteId}`, {
            method: 'DELETE',
        });
    }

    // Interview summary and AI
    async getInterviewSummary(interviewId: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${interviewId}/summary`);
    }

    async getAIFeedback(interviewId: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${interviewId}/ai-feedback`);
    }

    async generateAISummary(interviewId: string) {
        return this.request<{ success: boolean; data: any }>(`/interviews/${interviewId}/ai-summary`, {
            method: 'POST',
        });
    }

    async analyzeCode(code: string, language: string) {
        return this.request<{ success: boolean; data: any }>('/ai/analyze-code', {
            method: 'POST',
            body: { code, language },
        });
    }

    // Code execution
    async executeCode(data: { code: string; language: string; input?: string; interviewId?: string; questionId?: string }) {
        return this.request<{ success: boolean; data: any }>('/execute', {
            method: 'POST',
            body: data,
        });
    }

    async runTests(data: { code: string; language: string; questionId: string }) {
        return this.request<{ success: boolean; data: any }>('/execute/tests', {
            method: 'POST',
            body: data,
        });
    }

    // Health check
    async healthCheck() {
        return this.request<{ success: boolean; data: any }>('/health');
    }
}

export const api = new ApiClient();
