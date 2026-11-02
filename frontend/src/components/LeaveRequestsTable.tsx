import React, { useState } from 'react';
import { LeaveRequest, LeaveStatus } from '../types';
import { api } from '../services/api';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Trash2, Filter } from 'lucide-react';

interface Props {
  requests: LeaveRequest[];
  onRefresh: () => void;
  title?: string;
  isManagerView?: boolean;
}

export const LeaveRequestsTable: React.FC<Props> = ({
  requests, onRefresh, title = "My Leave Requests", isManagerView = false
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const filtered = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this leave request? Reserved days will be refunded back to your balance immediately.')) {
      return;
    }
    setCancellingId(id);
    try {
      await api.cancelLeave(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel leave request');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-pending"><Clock size={12} /> Pending</span>;
      case 'APPROVED':
        return <span className="badge badge-approved"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED':
        return <span className="badge badge-rejected"><XCircle size={12} /> Rejected</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled"><AlertCircle size={12} /> Cancelled</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Title & Filter Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Track application states, reviewer feedback, and audit history
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.25rem', borderRadius: '8px' }}>
          <Filter size={14} color="var(--text-muted)" style={{ marginLeft: '0.4rem' }} />
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                background: filterStatus === s ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: filterStatus === s ? '#ffffff' : 'var(--text-muted)',
                border: filterStatus === s ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {isManagerView && <th style={{ padding: '0.75rem 1rem' }}>Employee</th>}
              <th style={{ padding: '0.75rem 1rem' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Leave Dates</th>
              <th style={{ padding: '0.75rem 1rem' }}>Days</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reviewer & Comment</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isManagerView ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No leave requests found matching the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}>
                  {isManagerView && (
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.user_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.department}</div>
                    </td>
                  )}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      fontWeight: 600,
                      color: req.leave_type === 'ANNUAL' ? '#818cf8' : req.leave_type === 'SICK' ? '#34d399' : req.leave_type === 'CASUAL' ? '#fbbf24' : '#c084fc'
                    }}>
                      {req.leave_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                      <Calendar size={14} color="var(--accent-indigo)" />
                      <span>{req.start_date} <span style={{ color: 'var(--text-muted)' }}>to</span> {req.end_date}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {req.total_days}d
                  </td>
                  <td style={{ padding: '0.85rem 1rem', maxWidth: '240px', color: 'var(--text-secondary)' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>
                      {req.reason}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {getStatusBadge(req.status)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {req.reviewed_by_name ? (
                      <div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{req.reviewed_by_name}</span>
                        {req.manager_comment && (
                          <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            "{req.manager_comment}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>Awaiting review</span>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {req.status === 'PENDING' && !isManagerView && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        disabled={cancellingId === req.id}
                        title="Cancel this request & refund days"
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          color: '#fb7185',
                          borderRadius: '6px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
