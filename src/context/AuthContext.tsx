import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  selectedEmpresaId: string | 'all';
  setSelectedEmpresaId: (id: string | 'all') => void;
  login: (username: string, role: UserRole) => boolean;
  logout: () => void;
  switchProfile: (role: UserRole) => void;
}

const DEFAULT_COBRADOR: User = {
  id: 'carlos-eduardo',
  name: 'Carlos Eduardo',
  username: 'carlos.eduardo',
  email: 'carlos.eduardo@regcobre.corp',
  role: 'cobrador',
  roleTitle: 'Cobrador Sênior - Matriz',
  unit: 'Matriz São Paulo',
  badgeCode: 'RC-4412',
  ativo: true,
  empresaPrincipalId: 'emp-matriz',
  empresasAcessoIds: ['emp-matriz', 'emp-sul'],
};

const SUPERVISOR_USER: User = {
  id: 'fernando-guimaraes',
  name: 'Dr. Fernando Guimarães',
  username: 'fernando.guimaraes',
  email: 'fernando.guimaraes@regcobre.corp',
  role: 'supervisor',
  roleTitle: 'Diretor de Operações / Supervisão',
  unit: 'Diretoria de Recuperação de Ativos',
  badgeCode: 'DIR-001',
  ativo: true,
  empresaPrincipalId: 'emp-matriz',
  empresasAcessoIds: ['emp-matriz', 'emp-sul', 'emp-norte'],
};

const AuthContext = createContext<AuthContextType>({
  currentUser: DEFAULT_COBRADOR,
  isAuthenticated: true,
  selectedEmpresaId: 'all',
  setSelectedEmpresaId: () => {},
  login: () => true,
  logout: () => {},
  switchProfile: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start logged in as Carlos Eduardo (Cobrador) as requested
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_COBRADOR);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | 'all'>('all');

  const login = (username: string, role: UserRole) => {
    if (role === 'supervisor') {
      setCurrentUser(SUPERVISOR_USER);
    } else {
      setCurrentUser({
        ...DEFAULT_COBRADOR,
        name: username.includes('.')
          ? username
              .split('.')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          : username || 'Carlos Eduardo',
      });
    }
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchProfile = (role: UserRole) => {
    if (role === 'supervisor') {
      setCurrentUser(SUPERVISOR_USER);
    } else {
      setCurrentUser(DEFAULT_COBRADOR);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        selectedEmpresaId,
        setSelectedEmpresaId,
        login,
        logout,
        switchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
