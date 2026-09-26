/**
 * SiNilai SMK — Secure API Client
 * Automatically attaches Bearer JWT token to authorized requests.
 *
 * URL backend dibaca dari environment variable VITE_API_URL:
 *   - Development: set di .env.local (tidak di-commit ke Git)
 *   - Production : set di Vercel Dashboard > Settings > Environment Variables
 *
 * JANGAN hardcode URL atau credential di sini.
 */

// Baca dari env Vite (hanya variabel VITE_* yang aman diekspos ke browser)
const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:8000/api';

export const apiClient = {
  getToken(): string | null {
    return sessionStorage.getItem('sinilai_jwt_token');
  },

  setToken(token: string) {
    sessionStorage.setItem('sinilai_jwt_token', token);
  },

  removeToken() {
    sessionStorage.removeItem('sinilai_jwt_token');
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status} Request failed`;
      const error = new Error(errorMsg);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  },

  async login(identifier: string, password: string) {
    const cleanId = (identifier || '').trim();
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: cleanId,
        email: cleanId,
        nip: cleanId,
        password,
      }),
    });
  },

  async getMe() {
    return this.request('/me');
  },

  async getGrades(subjectId: number, classId: number) {
    return this.request(`/grades?subject_id=${subjectId}&class_id=${classId}`);
  },

  async saveGrade(gradeData: any) {
    return this.request('/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
  },

  async submitGrades(subjectId: number, classId: number) {
    return this.request('/grades/submit', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, class_id: classId }),
    });
  },

  async getStats(subjectId: number, classId: number) {
    return this.request(`/monitoring/stats?subject_id=${subjectId}&class_id=${classId}`);
  },

  async setDeadline(subjectId: number, deadline: string) {
    return this.request('/monitoring/deadline', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, deadline }),
    });
  },

  async returnRevision(subjectId: number, classId: number, reason: string) {
    return this.request('/monitoring/return-revision', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, class_id: classId, reason }),
    });
  },

  async getTracker() {
    return this.request('/tracker/submissions');
  },
};
