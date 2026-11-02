import React, { useState, useEffect } from 'react';
import { User, AuditLog, LeaveType } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Sliders, History, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const HrAdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [newTotalDays, setNewTotalDays] = useState<number>(25);
  const [reason, setReason] = useState<string>('Discretionary tenure loyalty adjustment');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [uList, logs] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(30),
      ]);
      setUsers(uList);
      if (uList.length > 0 && !selectedUserId) {
        setSelectedUserId(uList[0].id);
      }
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed loading HR data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    setSuccess(null);
    try {
      await api.adjustBalance(Number(selectedUserId), leaveType, Number(newTotalDays), reason.trim());
      setSuccess(`Successfully adjusted ${leaveType} balance to ${newTotalDays} days!`);
      setTimeout(() => setSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              HR Administration & Governance Hub
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Manage employee allocations, entitlement policies, and examine immutable audit trails
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Balance Adjustment + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Balance Adjuster Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sliders size={18} color="var(--accent-indigo)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Adjust Employee Leave Entitlement
            </h4>
          </div>

          {success && (
            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--status-approved-bg)',
              border: '1px solid var(--status-approved-border)',
              color: 'var(--status-approved-text)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '1rem',
            }}>
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAdjustBalance} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Select Employee
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="input-field"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="input-field"
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="PARENTAL">Parental Leave</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  New Total Entitlement
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="0.5"
                  value={newTotalDays}
                  onChange={(e) => setNewTotalDays(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Mandatory Audit Justification
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Executive approval, seniority credit, or policy exception..."
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {loading ? 'Recording Audit...' : 'Execute Balance Adjustment'}
            </button>
          </form>
        </div>

        {/* Database & Constraint Info Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <FileText size={18} color="var(--accent-cyan)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                PostgreSQL GiST Exclusion Architecture
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.85rem' }}>
              LeaveDesk enforces date integrity directly at the PostgreSQL storage layer using a
              <code style={{ color: '#a5b4fc', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.35rem', borderRadius: '4px', margin: '0 0.3rem' }}>
                GiST exclusion constraint
              </code>:
            </p>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.75rem',
              color: '#34d399',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              lineHeight: '1.4'
            }}>
              {`EXCLUDE USING gist (
  user_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
) WHERE (status IN ('PENDING', 'APPROVED'));`}
            </pre>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.75rem',
            color: '#6ee7b7'
          }}>
            ✓ High-concurrency safe: Prevents race conditions and double bookings even across parallel database sessions.
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <History size={18} color="var(--accent-indigo)" />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Immutable Compliance Audit Logs
          </h4>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>Timestamp</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Action</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Actor</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Entity</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: log.action.includes('APPROVED') ? 'rgba(16, 185, 129, 0.15)' : log.action.includes('REJECTED') ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: log.action.includes('APPROVED') ? '#34d399' : log.action.includes('REJECTED') ? '#fb7185' : '#a5b4fc',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.actor_name}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {log.entity_type} #{log.entity_id}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
