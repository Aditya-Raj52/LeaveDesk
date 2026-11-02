import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LeaveBalanceCards } from './components/LeaveBalanceCards';
import { ApplyLeaveModal } from './components/ApplyLeaveModal';
import { LeaveRequestsTable } from './components/LeaveRequestsTable';
import { ApprovalsQueue } from './components/ApprovalsQueue';
import { TeamCalendar } from './components/TeamCalendar';
import { HrAdminView } from './components/HrAdminView';
import { PolicyHandbookView } from './components/PolicyHandbookView';
import { PolicyAssistantChat } from './components/PolicyAssistantChat';
import { api } from './services/api';
import { LeaveBalance, LeaveRequest, LeaveType } from './types';
import { Sparkles, CalendarPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyInitialType, setApplyInitialType] = useState<LeaveType>('ANNUAL');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [bal, reqs, cal] = await Promise.all([
        api.getMyBalances(),
        api.getMyRequests(),
        api.getTeamCalendar(),
      ]);
      setBalances(bal);
      setMyRequests(reqs);
      setTeamLeaves(cal);

      if (user.role === 'MANAGER' || user.role === 'HR_ADMIN') {
        const pending = await api.getPendingApprovals();
        setPendingApprovals(pending);
      }
    } catch (err) {
      console.error('Failed loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, activeRole]);

  const handleOpenApply = (type: LeaveType = 'ANNUAL') => {
    setApplyInitialType(type);
    setIsApplyModalOpen(true);
  };

  const handleAskAI = (promptText?: string) => {
    setIsAssistantOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />

      {/* Main Layout Grid */}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingApprovals.length}
        />

        <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {/* Top Banner Notice */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.06))',
            borderRadius: '14px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="pulse-indicator" />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c7d2fe' }}>
                  LeaveDesk Full-Stack Engine Active
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  FastAPI REST + PostgreSQL Exclusion Constraints + RAG Assistant with Grounded Citations
                </span>
              </div>
            </div>

            <button
              onClick={() => handleOpenApply('ANNUAL')}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            >
              <CalendarPlus size={15} />
              <span>Quick Apply</span>
            </button>
          </div>

          {/* Tab 1: Overview & Balances */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Welcome back, {user?.full_name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Here is your real-time 2026 leave allocation and pending approvals summary.
                  </p>
                </div>
              </div>

              <LeaveBalanceCards
                balances={balances}
                onApplyForType={handleOpenApply}
              />

              {/* If Manager or HR and has pending approvals, show quick queue */}
              {(user?.role === 'MANAGER' || user?.role === 'HR_ADMIN') && pendingApprovals.length > 0 && (
                <ApprovalsQueue
                  pendingRequests={pendingApprovals}
                  onRefresh={loadData}
                />
              )}

              {/* My Recent Requests */}
              <LeaveRequestsTable
                requests={myRequests.slice(0, 5)}
                onRefresh={loadData}
                title="Recent Leave Applications"
              />
            </div>
          )}

          {/* Tab 2: Apply for Leave */}
          {activeTab === 'apply' && (
            <div className="animate-fade-in" style={{ maxWidth: '720px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Submit New Leave Request
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Exclusion constraints prevent overlapping requests; days are automatically reserved in pending balance.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <LeaveBalanceCards balances={balances} onApplyForType={handleOpenApply} />
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                >
                  <CalendarPlus size={18} />
                  <span>Open Application Form</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: My Requests */}
          {activeTab === 'my-requests' && (
            <div className="animate-fade-in">
              <LeaveRequestsTable
                requests={myRequests}
                onRefresh={loadData}
                title="All My Leave History"
              />
            </div>
          )}

          {/* Tab 4: Team Approvals (Managers & HR) */}
          {activeTab === 'approvals' && (
            <div className="animate-fade-in">
              <ApprovalsQueue
                pendingRequests={pendingApprovals}
                onRefresh={loadData}
              />
            </div>
          )}

          {/* Tab 5: Team Calendar */}
          {activeTab === 'calendar' && (
            <div className="animate-fade-in">
              <TeamCalendar approvedLeaves={teamLeaves} />
            </div>
          )}

          {/* Tab 6: HR Admin View */}
          {activeTab === 'hr-admin' && (
            <div className="animate-fade-in">
              <HrAdminView />
            </div>
          )}

          {/* Tab 7: Policy Handbook */}
          {activeTab === 'policy-docs' && (
            <div className="animate-fade-in">
              <PolicyHandbookView onAskQuestion={handleAskAI} />
            </div>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={loadData}
        balances={balances}
        existingRequests={myRequests}
        initialType={applyInitialType}
      />

      <PolicyAssistantChat
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
