import React from 'react';
import { LeaveBalance, LeaveType } from '../types';
import { Palmtree, Stethoscope, Compass, Baby, ArrowUpRight } from 'lucide-react';

interface Props {
  balances: LeaveBalance[];
  onApplyForType: (type: LeaveType) => void;
}

const LEAVE_CONFIG: Record<LeaveType, { title: string; icon: any; color: string; bgGradient: string }> = {
  ANNUAL: {
    title: 'Annual Vacation',
    icon: Palmtree,
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05))',
  },
  SICK: {
    title: 'Sick & Medical',
    icon: Stethoscope,
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
  },
  CASUAL: {
    title: 'Casual & Personal',
    icon: Compass,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
  },
  PARENTAL: {
    title: 'Parental & Care',
    icon: Baby,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.05))',
  },
  UNPAID: {
    title: 'Unpaid Leave',
    icon: Compass,
    color: '#94a3b8',
    bgGradient: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(100, 116, 139, 0.05))',
  },
};

export const LeaveBalanceCards: React.FC<Props> = ({ balances, onApplyForType }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.25rem',
      marginBottom: '2rem',
    }}>
      {balances.map((bal) => {
        const config = LEAVE_CONFIG[bal.leave_type] || LEAVE_CONFIG.ANNUAL;
        const Icon = config.icon;
        const usedPercent = Math.min(100, (bal.used_days / (bal.total_days || 1)) * 100);
        const pendingPercent = Math.min(100 - usedPercent, (bal.pending_days / (bal.total_days || 1)) * 100);

        return (
          <div
            key={bal.id}
            className="glass-panel glass-panel-hover"
            style={{
              padding: '1.25rem',
              position: 'relative',
              overflow: 'hidden',
              background: config.bgGradient,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.color,
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {config.title}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Year 2026 Cycle
                  </span>
                </div>
              </div>

              <button
                onClick={() => onApplyForType(bal.leave_type)}
                title="Apply for this leave"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowUpRight size={16} />
              </button>
            </div>

            {/* Remaining Days Metric */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {bal.remaining_days.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                days available
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              display: 'flex',
              marginBottom: '0.85rem',
            }}>
              <div style={{
                width: `${usedPercent}%`,
                background: config.color,
                transition: 'width 0.4s ease',
              }} title={`Used: ${bal.used_days} days`} />
              <div style={{
                width: `${pendingPercent}%`,
                background: 'var(--accent-amber)',
                transition: 'width 0.4s ease',
              }} title={`Pending: ${bal.pending_days} days`} />
            </div>

            {/* Sub-breakdown */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '0.25rem',
            }}>
              <span>Used: <strong style={{ color: 'var(--text-primary)' }}>{bal.used_days}d</strong></span>
              {bal.pending_days > 0 && (
                <span style={{ color: 'var(--accent-amber)' }}>
                  Pending: <strong>{bal.pending_days}d</strong>
                </span>
              )}
              <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{bal.total_days}d</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
