import React, { useState, useEffect, useMemo } from 'react';
import { LeaveType, LeaveBalance, LeaveRequest } from '../types';
import { api } from '../services/api';
import { Calendar, AlertCircle, CheckCircle2, Info, ShieldAlert, Sparkles, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balances: LeaveBalance[];
  existingRequests: LeaveRequest[];
  initialType?: LeaveType;
}

export const ApplyLeaveModal: React.FC<Props> = ({
  isOpen, onClose, onSuccess, balances, existingRequests, initialType = 'ANNUAL'
}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>(initialType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialType) setLeaveType(initialType);
  }, [initialType]);

  // Calculate working days (excluding weekends)
  const workingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay(); // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  }, [startDate, endDate]);

  // Selected balance
  const currentBalance = balances.find((b) => b.leave_type === leaveType);
  const remainingDays = currentBalance ? currentBalance.remaining_days : 0;
  const hasInsufficientBalance = leaveType !== 'UNPAID' && workingDays > remainingDays;

  // Check client-side overlap against user's pending/approved leaves
  const overlappingRequest = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);

    return existingRequests.find((r) => {
      if (r.status !== 'PENDING' && r.status !== 'APPROVED') return false;
      const reqStart = new Date(r.start_date);
      const reqEnd = new Date(r.end_date);
      return reqStart <= e && reqEnd >= s;
    });
  }, [startDate, endDate, existingRequests]);

  // Check sick leave medical certificate rule (Clause 3.2)
  const requiresDoctorNote = useMemo(() => {
    if (leaveType !== 'SICK' || !startDate || !endDate) return false;
    if (workingDays > 2) return true;
    const s = new Date(startDate);
    const e = new Date(endDate);
    // Friday (5) or Monday (1)
    return s.getDay() === 1 || s.getDay() === 5 || e.getDay() === 1 || e.getDay() === 5;
  }, [leaveType, startDate, endDate, workingDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (overlappingRequest) {
      setError(`Cannot submit: Clashes with existing ${overlappingRequest.status} leave #${overlappingRequest.id} (${overlappingRequest.start_date} to ${overlappingRequest.end_date}).`);
      return;
    }

    if (hasInsufficientBalance) {
      setError(`Insufficient balance: You requested ${workingDays} days, but only ${remainingDays} days remain.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.submitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(15, 23, 42, 0.95)',
          padding: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), var(--shadow-glow-indigo)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Calendar size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Apply for Leave
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Transactional balance reservation & exclusion checks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'var(--status-rejected-bg)',
            border: '1px solid var(--status-rejected-border)',
            color: 'var(--status-rejected-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
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
            marginBottom: '1rem',
          }}>
            <CheckCircle2 size={18} />
            <span>Leave request submitted! Days placed in pending reserve.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Leave Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="input-field"
            >
              <option value="ANNUAL">Annual Vacation Leave</option>
              <option value="SICK">Sick & Medical Leave</option>
              <option value="CASUAL">Casual / Personal Discretionary</option>
              <option value="PARENTAL">Parental & Caregiver Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Available balance: <strong style={{ color: remainingDays > 0 ? '#34d399' : '#fb7185' }}>{remainingDays.toFixed(1)} days</strong></span>
              <span>Year: 2026</span>
            </div>
          </div>

          {/* Dates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Summary / Policy Notice Bar */}
          {workingDays > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-glass)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Calculated Working Days:</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{workingDays} business day(s)</strong>
              </div>

              {/* Overlapping Warning */}
              {overlappingRequest && (
                <div style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <AlertCircle size={14} />
                  <span>PostgreSQL Exclusion Conflict: Overlaps with request #{overlappingRequest.id}</span>
                </div>
              )}

              {/* Medical Note Requirement (Clause 3.2) */}
              {requiresDoctorNote && (
                <div style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <Info size={14} />
                  <span>Clause 3.2 Policy Notice: Medical certificate required (&gt;2 days or adjacent to weekend).</span>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Reason / Destination Context
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual family reunion travel, or doctor appointment..."
              className="input-field"
              required
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!overlappingRequest || hasInsufficientBalance}
              className="btn-primary"
              style={{
                opacity: (loading || !!overlappingRequest || hasInsufficientBalance) ? 0.6 : 1,
                cursor: (loading || !!overlappingRequest || hasInsufficientBalance) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Submitting...' : 'Confirm & Reserve Days'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
