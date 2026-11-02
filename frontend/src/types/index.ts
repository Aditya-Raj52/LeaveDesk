export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'PARENTAL' | 'UNPAID';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  manager_id?: number | null;
  avatar_url?: string;
  created_at?: string;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  leave_type: LeaveType;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  department?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  manager_comment?: string | null;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveCreatePayload {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveReviewPayload {
  status: 'APPROVED' | 'REJECTED';
  manager_comment?: string;
}

export interface Citation {
  clause_id: string;
  section_title: string;
  snippet: string;
  relevance_score: number;
}

export interface PolicyResponse {
  question: string;
  answer: string;
  citations: Citation[];
  key_takeaways: string[];
  confidence: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  actor_id?: number | null;
  actor_name: string;
  details?: string;
  timestamp: string;
}

export interface SuggestedPrompt {
  id: string;
  title: string;
  prompt: string;
}
