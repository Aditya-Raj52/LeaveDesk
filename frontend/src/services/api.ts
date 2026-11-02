import { 
  User, LeaveBalance, LeaveRequest, LeaveCreatePayload, 
  LeaveReviewPayload, PolicyResponse, AuditLog, SuggestedPrompt 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('leavedesk_jwt');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('leavedesk_jwt', token);
    } else {
      localStorage.removeItem('leavedesk_jwt');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const res = await this.request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Leaves Endpoints
  async getMyBalances(): Promise<LeaveBalance[]> {
    return this.request<LeaveBalance[]>('/leaves/balances');
  }

  async getMyRequests(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>('/leaves/my');
  }

  async submitLeave(payload: LeaveCreatePayload): Promise<LeaveRequest> {
    return this.request<LeaveRequest>('/leaves', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async cancelLeave(requestId: number): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leaves/${requestId}/cancel`, {
      method: 'POST',
    });
  }

  // Manager & HR Approvals
  async getPendingApprovals(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>('/leaves/pending');
  }

  async reviewLeave(requestId: number, payload: LeaveReviewPayload): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/leaves/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Calendar & Team Schedule
  async getTeamCalendar(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>('/leaves/team-calendar');
  }

  // HR Admin Endpoints
  async getAllLeaves(statusFilter?: string): Promise<LeaveRequest[]> {
    const query = statusFilter ? `?status_filter=${statusFilter}` : '';
    return this.request<LeaveRequest[]>(`/leaves/all${query}`);
  }

  async adjustBalance(userId: number, leaveType: string, totalDays: number, reason: string): Promise<LeaveBalance> {
    return this.request<LeaveBalance>('/leaves/balance-adjust', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        leave_type: leaveType,
        total_days: totalDays,
        reason,
      }),
    });
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return this.request<AuditLog[]>(`/leaves/audit-logs?limit=${limit}`);
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  // Policy AI Assistant (RAG)
  async queryPolicy(question: string): Promise<PolicyResponse> {
    return this.request<PolicyResponse>('/policy/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getSuggestedPrompts(): Promise<SuggestedPrompt[]> {
    return this.request<SuggestedPrompt[]>('/policy/suggested');
  }
}

export const api = new ApiService();
