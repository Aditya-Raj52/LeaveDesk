import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, PlusCircle, Clock, CheckSquare, 
  CalendarDays, ShieldAlert, BookOpen, Bot 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingCount }) => {
  const { user } = useAuth();
  const isManagerOrHr = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN';
  const isHr = user?.role === 'HR_ADMIN';

  const navItems = [
    { id: 'overview', label: 'My Balances', icon: LayoutDashboard },
    { id: 'apply', label: 'Apply for Leave', icon: PlusCircle },
    { id: 'my-requests', label: 'My Requests', icon: Clock },
    ...(isManagerOrHr ? [{
      id: 'approvals',
      label: 'Team Approvals',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : undefined
    }] : []),
    { id: 'calendar', label: 'Team Calendar', icon: CalendarDays },
    ...(isHr ? [{
      id: 'hr-admin',
      label: 'HR Hub & Audit',
      icon: ShieldAlert
    }] : []),
    { id: 'policy-docs', label: 'Leave Policy Handbook', icon: BookOpen },
  ];

  return (
    <aside style={{
      width: '240px',
      background: 'rgba(11, 17, 30, 0.7)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.75rem',
      gap: '0.35rem',
      minHeight: 'calc(100vh - 65px)',
    }}>
      <div style={{
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        padding: '0.5rem 0.85rem',
        fontWeight: 700
      }}>
        Navigation
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
              background: isActive 
                ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.18), rgba(99, 102, 241, 0.05))' 
                : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.85rem',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon size={18} color={isActive ? 'var(--accent-indigo)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span style={{
                background: 'var(--accent-amber)',
                color: '#000000',
                fontWeight: 700,
                fontSize: '0.7rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
              }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '1rem 0.5rem' }}>
        <div style={{
          padding: '0.85rem',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div className="pulse-indicator" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c7d2fe' }}>
              GiST Exclusion Rule
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
            Zero overlapping leave bookings guaranteed by PostgreSQL exclusion constraint.
          </p>
        </div>
      </div>
    </aside>
  );
};
