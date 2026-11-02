import React from 'react';
import { BookOpen, Sparkles, Shield, Clock, FileCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  onAskQuestion: (prompt: string) => void;
}

export const PolicyHandbookView: React.FC<Props> = ({ onAskQuestion }) => {
  const sections = [
    {
      title: "Section 2: Annual Paid Time Off (PTO / Vacation)",
      icon: FileCheck,
      color: "#818cf8",
      clauses: [
        {
          id: "Clause 2.1",
          name: "Annual Leave Entitlement",
          content: "Full-time regular employees are entitled to twenty-one (21) days of paid annual leave per calendar year, accruing at the rate of 1.75 days per completed calendar month.",
          sampleQuestion: "What is my annual leave entitlement and monthly accrual rate?"
        },
        {
          id: "Clause 2.2",
          name: "Advance Notice and Scheduling",
          content: "Requests for annual leave of three (3) or fewer consecutive business days require at least 48 hours advance notice. Requests exceeding three (3) consecutive business days require at least fourteen (14) calendar days advance written submission via LeaveDesk.",
          sampleQuestion: "How much advance notice do I need for a 1-week vacation?"
        },
        {
          id: "Clause 2.3",
          name: "Rollover and Carry-Forward Limits",
          content: "Employees may carry forward a maximum of five (5) unused annual leave days into the subsequent calendar year. All carried-over days must be fully utilized by March 31 of the new calendar year, after which they lapse.",
          sampleQuestion: "How many annual leaves can I carry forward to next year?"
        }
      ]
    },
    {
      title: "Section 3: Sick and Medical Leave",
      icon: Shield,
      color: "#34d399",
      clauses: [
        {
          id: "Clause 3.1",
          name: "Sick Leave Entitlement",
          content: "All full-time employees are entitled to ten (10) paid sick leave days per calendar year for illness, medical appointments, surgery, mental health recovery, or quarantine.",
          sampleQuestion: "How many sick days am I entitled to per year?"
        },
        {
          id: "Clause 3.2",
          name: "Medical Certification Requirements",
          content: "For sick leave absences exceeding two (2) consecutive business days, the employee is mandatory required to submit a valid medical certificate signed by a licensed medical practitioner. Any sick leave taken immediately adjacent to a weekend (Friday or Monday) or a public holiday requires a medical certificate regardless of duration.",
          sampleQuestion: "Do I need a doctor's note for 2 days of sick leave, or what if it's on a Friday?"
        }
      ]
    },
    {
      title: "Section 4: Casual & Discretionary Leave",
      icon: Clock,
      color: "#fbbf24",
      clauses: [
        {
          id: "Clause 4.1",
          name: "Casual Leave Entitlement",
          content: "Employees are granted seven (7) days of paid casual leave per calendar year to attend to unexpected personal matters or domestic emergencies.",
          sampleQuestion: "What is casual leave and how many days do I get?"
        },
        {
          id: "Clause 4.2",
          name: "Maximum Consecutive Duration",
          content: "Casual leave cannot be taken for more than three (3) consecutive business days in a single instance and cannot be combined with or suffixed to Annual Leave without manager authorization.",
          sampleQuestion: "Can I take casual leave for 4 days in a row?"
        }
      ]
    },
    {
      title: "Section 5: Parental & Family Care Leave",
      icon: BookOpen,
      color: "#c084fc",
      clauses: [
        {
          id: "Clause 5.1",
          name: "Maternity Leave",
          content: "Female employees welcoming a newborn child or adopting an infant under one year of age are entitled to twenty-six (26) consecutive weeks of fully paid maternity leave.",
          sampleQuestion: "How long is paid maternity leave?"
        },
        {
          id: "Clause 5.2",
          name: "Paternity Leave",
          content: "Eligible fathers and secondary caregivers are entitled to fifteen (15) working days of fully paid paternity leave, which can be taken continuously or in two separate blocks within 6 months.",
          sampleQuestion: "What is the paternity leave duration and can it be taken in separate blocks?"
        }
      ]
    },
    {
      title: "Section 7: Overlapping Bookings & Database Integrity Rules",
      icon: Shield,
      color: "#f87171",
      clauses: [
        {
          id: "Clause 7.1",
          name: "Strict Prohibition of Intersecting Dates",
          content: "The LeaveDesk system programmatically prohibits submitting or approving overlapping leave requests for the same employee. Database-level GiST exclusion constraints reject conflicting bookings with 409 Conflict.",
          sampleQuestion: "Can I submit two leaves that overlap with each other?"
        }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BookOpen size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Official Leave Policy Handbook (2026-2027)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Corporate Leave Regulations & Attendance Guidelines • Document POL-HR-2026-V4
            </p>
          </div>
        </div>
      </div>

      {sections.map((section, sIdx) => {
        const Icon = section.icon;
        return (
          <div key={sIdx} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Icon size={18} color={section.color} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {section.title}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {section.clauses.map((clause) => (
                <div
                  key={clause.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        {clause.id}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {clause.name}
                      </strong>
                    </div>

                    <button
                      onClick={() => onAskQuestion(clause.sampleQuestion)}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <Sparkles size={13} color="var(--accent-indigo)" />
                      <span>Ask AI About This</span>
                    </button>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
