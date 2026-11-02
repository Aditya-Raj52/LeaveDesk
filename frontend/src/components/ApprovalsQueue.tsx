import React, { useState } from 'react';
import { LeaveRequest } from '../types';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Calendar, User, Clock, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  pendingRequests: LeaveRequest[];
  onRefresh: () => void;
}

export const ApprovalsQueue: React.FC<Props> = ({ pendingRequests, onRefresh }) => {
  const [comments, setComments] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    setSuccessMsg(null);
    try {
      const comment = comments[id] || '';
      await api.reviewLeave(id, { status, manager_comment: comment });
      setSuccessMsg(`Leave request #${id} successfully ${status.toLowerCase()}! Balance updated atomically.`);
      setTimeout(() => setSuccessMsg(null), 3500);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to process approval');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCommentChange = (id: number, text: string) => {
    setComments((prev) => ({ ...prev, [id]: text }));
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Manager Approval Desk
            </h3>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
            }}>
              {pendingRequests.length} Pending
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            One-click atomic balance conversions & ACID transaction commit
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'var(--status-approved-bg)',
          border: '1px solid var(--status-approved-border)',
          color: 'var(--status-approved-text)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
        }}>
          <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            All Clear! No pending leaves to review
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            All employee requests within your scope have been processed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
              }}
            >
              {/* Left: Employee & Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontSize: '0.85rem',
                  }}>
                    {req.user_name ? req.user_name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {req.user_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {req.department} • Request #{req.id}
                    </div>
                  </div>
                  <span style={{
                    marginLeft: 'auto',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}>
                    {req.leave_type}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  <Calendar size={15} color="var(--accent-indigo)" />
                  <span><strong>{req.start_date}</strong> to <strong>{req.end_date}</strong> ({req.total_days} business days)</span>
                </div>

                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Reason:</strong> {req.reason}
                </div>
              </div>

              {/* Right: Review Comment & Decision Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Optional review note (e.g. Have a great vacation!)..."
                    value={comments[req.id] || ''}
                    onChange={(e) => handleCommentChange(req.id, e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.8rem', padding: '0.55rem 0.75rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={() => handleReview(req.id, 'APPROVED')}
                    disabled={processingId === req.id}
                    className="btn-success"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve & Debit</span>
                  </button>

                  <button
                    onClick={() => handleReview(req.id, 'REJECTED')}
                    disabled={processingId === req.id}
                    className="btn-danger"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <XCircle size={16} />
                    <span>Reject & Refund</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
