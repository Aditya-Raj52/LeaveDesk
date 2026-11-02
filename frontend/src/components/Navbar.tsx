import React from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, Sparkles, Building2, UserCircle2, Cpu } from 'lucide-react';

export const Navbar: React.FC<{ onOpenAssistant: () => void }> = ({ onOpenAssistant }) => {
  const { user, activeRole, switchPersona } = useAuth();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 2rem',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glass)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-indigo)'
        }}>
          <Building2 size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LeaveDesk
            </span>
            <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 700 }}>
              ENTERPRISE
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            HR Leave Management & AI Policy Assistant
          </div>
        </div>
      </div>

      {/* Persona Switcher Center Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(9, 13, 22, 0.8)',
        padding: '0.3rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '0.25rem',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0 0.6rem' }}>
          Role Demo:
        </span>
        {(['EMPLOYEE', 'MANAGER', 'HR_ADMIN'] as UserRole[]).map((role) => {
          const persona = DEMO_PERSONAS[role];
          const isActive = activeRole === role;
          return (
            <button
              key={role}
              onClick={() => switchPersona(role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.8rem',
                transition: 'all 0.15s ease',
              }}
            >
              <img
                src={persona.avatar}
                alt={persona.name}
                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span>{persona.name.split(' ')[0]}</span>
              <span style={{
                fontSize: '0.65rem',
                opacity: 0.8,
                padding: '0.1rem 0.3rem',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.08)'
              }}>
                {role === 'HR_ADMIN' ? 'HR' : role === 'MANAGER' ? 'MGR' : 'EMP'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Tools & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* RAG Assistant Button */}
        <button
          onClick={onOpenAssistant}
          className="btn-primary"
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
        >
          <Sparkles size={16} />
          <span>Ask Policy AI</span>
        </button>

        {/* Current User Card */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
          }}>
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
              alt={user.full_name}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-indigo)' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user.department} • <strong style={{ color: '#818cf8' }}>{user.role}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
