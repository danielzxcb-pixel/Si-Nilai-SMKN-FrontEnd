import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { SEED_USERS } from '../data/mockData';
import { realtime, REALTIME_EVENTS } from '../services/realtime';
import { apiClient } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  setAuthenticatedUser: (user: User, token: string) => void;
  updateCurrentUserPermissions: (
    assignedSubjects: string[],
    assignedClasses: string[],
    canPrintRapor?: boolean
  ) => void;
  logout: () => void;
  realtimeAlert: string | null;
  clearRealtimeAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('sinilai_current_user');
    const savedToken = sessionStorage.getItem('sinilai_jwt_token');
    if (savedUser && savedToken) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error(e);
      }
    }
    return null; // Force genuine login
  });

  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('sinilai_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('sinilai_current_user');
    }
  }, [currentUser]);

  // LISTEN TO REALTIME PERMISSION UPDATES
  useEffect(() => {
    const unsubscribe = realtime.subscribe(REALTIME_EVENTS.PERMISSIONS_UPDATED, (data: {
      teacherId: string;
      teacherName: string;
      assignedSubjects: string[];
      assignedClasses: string[];
      canPrintRapor?: boolean;
      updatedAt: string;
    }) => {
      if (currentUser && String(currentUser.id) === String(data.teacherId)) {
        setCurrentUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            assignedSubjects: data.assignedSubjects,
            assignedClasses: data.assignedClasses,
            canPrintRapor: data.canPrintRapor !== undefined ? data.canPrintRapor : prev.canPrintRapor,
          };
        });

        setRealtimeAlert(
          `⚡ Sinkronisasi Hak Akses Realtime: Mata pelajaran & rombel kelas Anda baru saja diperbarui oleh Admin pada ${data.updatedAt}. Akses langsung aktif!`
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const setAuthenticatedUser = (user: User, token: string) => {
    apiClient.setToken(token);
    setCurrentUser(user);
  };

  const updateCurrentUserPermissions = (
    assignedSubjects: string[],
    assignedClasses: string[],
    canPrintRapor?: boolean
  ) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        assignedSubjects,
        assignedClasses,
        canPrintRapor: canPrintRapor !== undefined ? canPrintRapor : prev.canPrintRapor,
      };
    });
  };

  const logout = () => {
    apiClient.removeToken();
    sessionStorage.removeItem('sinilai_current_user');
    setCurrentUser(null);
  };

  const clearRealtimeAlert = () => setRealtimeAlert(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        setAuthenticatedUser,
        updateCurrentUserPermissions,
        logout,
        realtimeAlert,
        clearRealtimeAlert,
      }}
    >
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
