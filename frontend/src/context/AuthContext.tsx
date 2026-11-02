import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface PersonaProfile {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
}

export const DEMO_PERSONAS: Record<UserRole, PersonaProfile> = {
  EMPLOYEE: {
    name: 'Sarah Chen',
    email: 'sarah.chen@leavedesk.internal',
    role: 'EMPLOYEE',
    title: 'Senior Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
  },
  MANAGER: {
    name: 'Marcus Brody',
    email: 'marcus.brody@leavedesk.internal',
    role: 'MANAGER',
    title: 'Engineering Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  HR_ADMIN: {
    name: 'Elena Rostova',
    email: 'elena.rostova@leavedesk.internal',
    role: 'HR_ADMIN',
    title: 'Head of People Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  },
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeRole: UserRole;
  switchPersona: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>('EMPLOYEE');

  const switchPersona = async (role: UserRole) => {
    setLoading(true);
    try {
      const persona = DEMO_PERSONAS[role];
      const res = await api.login(persona.email, 'Password123!');
      setUser(res.user);
      setActiveRole(role);
    } catch (err) {
      console.error('Persona switch failed, fallback default auth', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (api.getToken()) {
        const currentUser = await api.getMe();
        setUser(currentUser);
        setActiveRole(currentUser.role);
      } else {
        await switchPersona('EMPLOYEE');
      }
    } catch {
      await switchPersona('EMPLOYEE');
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, activeRole, switchPersona, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
