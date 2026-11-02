import React, { useState, useMemo } from 'react';
import { LeaveRequest } from '../types';
import { Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight, Palmtree, Stethoscope, Compass, Baby } from 'lucide-react';

interface Props {
  approvedLeaves: LeaveRequest[];
}

export const TeamCalendar: React.FC<Props> = ({ approvedLeaves }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)); // November 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false });
    }
    // Month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      
      const leavesOnThisDay = approvedLeaves.filter((l) => {
        const s = new Date(l.start_date);
        const e = new Date(l.end_date);
        // Normalize time
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        return dayDate >= s && dayDate <= e;
      });

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        leaves: leavesOnThisDay,
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
      });
    }
    return days;
  }, [year, month, approvedLeaves]);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Company & Team Leave Calendar
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Coordinated view of approved time-off across departments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handlePrevMonth} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, minWidth: '140px', textAlign: 'center', color: '#c7d2fe' }}>
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
      }}>
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.5rem',
      }}>
        {calendarDays.map((item, idx) => {
          if (!item.isCurrentMonth || !item.dayNumber) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  minHeight: '85px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.02)',
                }}
              />
            );
          }

          const hasLeaves = item.leaves && item.leaves.length > 0;

          return (
            <div
              key={item.dateStr}
              style={{
                minHeight: '85px',
                background: item.isWeekend ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                position: 'relative',
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: item.isWeekend ? 'var(--text-muted)' : 'var(--text-secondary)',
                alignSelf: 'flex-start',
              }}>
                {item.dayNumber}
              </div>

              {/* Leaves Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                {item.leaves?.map((leave) => (
                  <div
                    key={leave.id}
                    title={`${leave.user_name} (${leave.leave_type}): ${leave.reason}`}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px',
                      background: leave.leave_type === 'ANNUAL' ? 'rgba(99, 102, 241, 0.25)' : leave.leave_type === 'SICK' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                      color: leave.leave_type === 'ANNUAL' ? '#a5b4fc' : leave.leave_type === 'SICK' ? '#6ee7b7' : '#fcd34d',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {leave.user_name?.split(' ')[0]}: {leave.leave_type}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
